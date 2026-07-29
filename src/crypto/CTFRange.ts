import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';

import type { ConditionalKeysetInfo, CtfConditionInfo, CtfPoolEntry } from '../mint/types/ctf';
import { Amount, type AmountLike } from '../model/Amount';
import { CTSError } from '../model/Errors';
import { OutputData } from '../model/OutputData';
import type {
  HasKeysetKeys,
  Proof,
  SerializedBlindedMessage,
  SerializedBlindedSignature,
} from '../model/types';
import type { ProofState } from '../model/types/NUT07';
import { Bytes, numberToHexPadded64 } from '../utils';

import {
  computeCtfManifestCommitment,
  createCtfPayToUnlockSecret,
  createCtfSelectionBitmap,
  parseCtfSelectionBitmap,
} from './CTFSettlement';
import { assertCanonicalKeysetId } from './curves';
import { deriveSecretAndBlindingFactor } from './NUT13';

const DERIVATION_DOMAIN = 'Cashu/ctf/range/v1';
const MAX_U64 = 18_446_744_073_709_551_615n;

export interface CtfRangeKeyset extends HasKeysetKeys {
  active: boolean;
}

export interface CtfRangeManifestEntryMaterial {
  entry: CtfPoolEntry;
  outputData: OutputData;
}

export interface CtfRangeManifestMaterial {
  entries: CtfRangeManifestEntryMaterial[];
  serialized: CtfPoolEntry[];
  commitment: string;
}

export interface CreateCtfRangeManifestInput {
  seed: Uint8Array;
  operationId: string;
  receiveKeyset: CtfRangeKeyset;
  offerKeyset: CtfRangeKeyset;
  maxReceive: AmountLike;
  maxChange: AmountLike;
  maxEntries: number;
}

export interface CtfRangeRefundKey {
  privateKey: string;
  publicKey: string;
}

export interface CreateCtfAuthorizationOutputsInput {
  seed: Uint8Array;
  operationId: string;
  offerKeysetId: string;
  amounts: AmountLike[];
  commitment: string;
  expiry: string | bigint | number;
  expiryContext: {
    now: string | bigint | number;
    maxExpirySeconds: string | bigint | number;
    condition: Pick<CtfConditionInfo, 'condition_id' | 'keysets' | 'partitions'>;
    conditionalKeysets: Array<Pick<ConditionalKeysetInfo, 'id' | 'condition_id' | 'final_expiry'>>;
  };
  refund: string;
  poolPolicy?: {
    rateN: string | bigint | number;
    rateD: string | bigint | number;
    minReceive: string | bigint | number;
    maxDebit: string | bigint | number;
  };
}

export type CtfSettlementRecoveryClassification =
  | 'confirmed'
  | 'waiting'
  | 'refundable'
  | 'reconciling';

export type CtfRangeRecoveryQuery =
  | {
      mode: 'known';
      outputs: SerializedBlindedMessage[];
      expectedOutputBs: string[];
    }
  | {
      mode: 'unknown';
      outputs: SerializedBlindedMessage[];
      manifestBs: string[];
    };

/**
 * Create a deterministic powers-of-two range manifest and retain every entry's unblinding data.
 */
export function createCtfRangeManifest(
  input: CreateCtfRangeManifestInput,
): CtfRangeManifestMaterial {
  validateRangeKeyset(input.receiveKeyset, 'receive');
  validateRangeKeyset(input.offerKeyset, 'offer');
  if (input.receiveKeyset.id === input.offerKeyset.id) {
    throw new CTSError('CTF receive and offer keysets must differ');
  }
  if (!Number.isSafeInteger(input.maxEntries) || input.maxEntries < 2) {
    throw new CTSError('maxEntries must be a safe integer of at least two');
  }
  const specs = [
    ...rangeSpecs(input.receiveKeyset, input.maxReceive, 'receive'),
    ...rangeSpecs(input.offerKeyset, input.maxChange, 'change'),
  ];
  if (specs.length > input.maxEntries) throw new CTSError('CTF manifest exceeds maxEntries');
  const seed = deriveScopedSeed(input.seed, input.operationId, 'manifest');
  const entries = specs.map((spec, index) => createManifestEntry(seed, spec, index));
  const serialized = entries.map(({ entry }) => entry);
  return { entries, serialized, commitment: computeCtfManifestCommitment(serialized) };
}

/**
 * Deterministically derive a fresh operation-scoped refund keypair.
 */
export function deriveCtfRangeRefundKey(seed: Uint8Array, operationId: string): CtfRangeRefundKey {
  const material = deriveScopedSeed(seed, operationId, 'refund');
  const order = secp256k1.Point.CURVE().n;
  for (let attempt = 0; attempt < 1 << 16; attempt += 1) {
    const candidate = hmac(sha256, material, uint32Be(attempt));
    const scalar = Bytes.toBigInt(candidate);
    if (scalar === 0n || scalar >= order) continue;
    const privateKey = numberToHexPadded64(scalar);
    const publicKey = Bytes.toHex(secp256k1.getPublicKey(candidate, true).slice(1));
    return { privateKey, publicKey };
  }
  throw new CTSError('could not derive a valid CTF refund key');
}

/**
 * Build deterministic NUT-03 outputs that mint the exact `PAY_TO_UNLOCK` input proofs.
 */
export function createCtfAuthorizationOutputs(
  input: CreateCtfAuthorizationOutputsInput,
): OutputData[] {
  if (input.amounts.length === 0) throw new CTSError('CTF authorization requires an amount');
  validateAuthorizationExpiry(input.expiry, input.expiryContext);
  const seed = deriveScopedSeed(input.seed, input.operationId, 'authorization');
  return input.amounts.map((amount, index) => {
    const derived = deriveSecretAndBlindingFactor(seed, input.offerKeysetId, index);
    const secret = createCtfPayToUnlockSecret({
      nonce: Bytes.toHex(derived.secret),
      data: input.commitment,
      offerKeyset: input.offerKeysetId,
      expiry: input.expiry,
      refund: input.refund,
      poolPolicy: input.poolPolicy,
    });
    return OutputData.createSingleData(
      amount,
      input.offerKeysetId,
      secret,
      Bytes.toBigInt(derived.blindingFactor),
    );
  });
}

/**
 * Build the exact NUT-09 query set. Unknown selections query every retained manifest entry.
 */
export function buildCtfRangeRecoveryQuery(
  entries: CtfRangeManifestEntryMaterial[],
  selection?: string,
): CtfRangeRecoveryQuery {
  if (selection === undefined) {
    return {
      mode: 'unknown',
      outputs: entries.map(({ outputData }) => outputData.blindedMessage),
      manifestBs: entries.map(({ entry }) => entry.B_),
    };
  }
  const outputs = parseCtfSelectionBitmap(selection, entries.length).map(
    (index) => entries[index].outputData.blindedMessage,
  );
  return { mode: 'known', outputs, expectedOutputBs: outputs.map(({ B_ }) => B_) };
}

/**
 * Derive the exact selected bitmap after a complete all-manifest NUT-09 restore.
 */
export function deriveCtfRangeRecoverySelection(
  entries: CtfRangeManifestEntryMaterial[],
  restoredOutputs: SerializedBlindedMessage[],
): string {
  if (restoredOutputs.length === 0) throw new CTSError('NUT-09 restored no CTF outputs');
  const indices = new Map(entries.map(({ entry }, index) => [entry.B_, index]));
  const selected = restoredOutputs.map(({ B_ }) => {
    const index = indices.get(B_);
    if (index === undefined) throw new CTSError('NUT-09 returned an output outside the manifest');
    return index;
  });
  return createCtfSelectionBitmap(entries.length, selected);
}

/**
 * Classify an exact recovery observation without inventing a terminal state.
 */
export function classifyCtfSettlementRecovery(input: {
  inputStates: ProofState[];
  expectedInputYs: string[];
  outputRecovery: {
    query: CtfRangeRecoveryQuery;
    restoredOutputBs: string[];
    queryCompleted: boolean;
  };
  now: number;
  expiry: number;
}): CtfSettlementRecoveryClassification {
  if (
    !Number.isSafeInteger(input.now) ||
    !Number.isSafeInteger(input.expiry) ||
    input.now < 0 ||
    input.expiry < 0
  ) {
    throw new CTSError('recovery timestamps must be non-negative safe integers');
  }
  if (hasDefinitiveOutputRecovery(input.outputRecovery)) return 'confirmed';
  if (input.outputRecovery.restoredOutputBs.length > 0) return 'reconciling';
  if (!hasExactInputStates(input.inputStates, input.expectedInputYs)) return 'reconciling';
  if (!input.inputStates.every(({ state }) => state === 'UNSPENT')) return 'reconciling';
  return input.now >= input.expiry ? 'refundable' : 'waiting';
}

/**
 * Unblind every signature returned by one exact NUT-09 query.
 */
export function recoverCtfRangeProofs(
  entries: CtfRangeManifestEntryMaterial[],
  restoredOutputs: SerializedBlindedMessage[],
  signatures: SerializedBlindedSignature[],
  resolveKeyset: (id: string) => HasKeysetKeys | undefined,
): Proof[] {
  if (restoredOutputs.length !== signatures.length) {
    throw new CTSError('NUT-09 outputs and signatures have different lengths');
  }
  const material = new Map(entries.map((entry) => [entry.entry.B_, entry.outputData]));
  const restored = new Set<string>();
  return restoredOutputs.map((output, index) => {
    if (restored.has(output.B_)) throw new CTSError('NUT-09 returned a duplicate output');
    restored.add(output.B_);
    const outputData = material.get(output.B_);
    if (!outputData) throw new CTSError('NUT-09 returned an output outside the retained manifest');
    if (
      output.id !== outputData.blindedMessage.id ||
      !Amount.from(output.amount).equals(outputData.blindedMessage.amount)
    ) {
      throw new CTSError('NUT-09 returned mismatched output metadata');
    }
    const keyset = resolveKeyset(output.id);
    if (!keyset) throw new CTSError(`NUT-09 recovery keyset ${output.id} is not loaded`);
    return outputData.toProof(signatures[index], keyset);
  });
}

function createManifestEntry(
  seed: Uint8Array,
  spec: { amount: Amount; keysetId: string; role: 'receive' | 'change' },
  index: number,
): CtfRangeManifestEntryMaterial {
  const outputData = OutputData.createSingleDeterministicData(
    spec.amount,
    seed,
    index,
    spec.keysetId,
  );
  const entry: CtfPoolEntry = {
    index: String(index),
    role: spec.role,
    amount: spec.amount.toString(),
    id: spec.keysetId,
    B_: outputData.blindedMessage.B_,
  };
  return { entry, outputData };
}

function rangeSpecs(
  keyset: CtfRangeKeyset,
  maximum: AmountLike,
  role: 'receive' | 'change',
): Array<{ amount: Amount; keysetId: string; role: 'receive' | 'change' }> {
  return powersOfTwo(maximum).map((amount) => {
    if (keyset.keys[amount.toString()] === undefined) {
      throw new CTSError(`${role} keyset does not publish denomination ${amount.toString()}`);
    }
    return { amount, keysetId: keyset.id, role };
  });
}

function powersOfTwo(maximum: AmountLike): Amount[] {
  const max = Amount.from(maximum).toBigInt();
  if (max < 1n || max > MAX_U64) throw new CTSError('CTF range maximum must be in [1, u64::MAX]');
  const amounts: Amount[] = [];
  let capacity = 0n;
  for (let amount = 1n; capacity < max; amount <<= 1n) {
    amounts.push(Amount.from(amount));
    capacity += amount;
  }
  return amounts;
}

function validateRangeKeyset(keyset: CtfRangeKeyset, role: string): void {
  if (!keyset.active) throw new CTSError(`${role} keyset must be active`);
  assertCanonicalKeysetId(keyset.id, `${role} keyset id`);
}

function validateAuthorizationExpiry(
  expiryValue: string | bigint | number,
  context: CreateCtfAuthorizationOutputsInput['expiryContext'],
): void {
  const expiry = parseUnsigned(expiryValue, 'expiry');
  const now = parseUnsigned(context.now, 'now');
  const maxExpirySeconds = parseUnsigned(context.maxExpirySeconds, 'maxExpirySeconds');
  if (maxExpirySeconds === 0n) throw new CTSError('maxExpirySeconds must be positive');
  const keysets = validateConditionalKeysetMetadata(context);
  if (expiry <= now) throw new CTSError('CTF authorization expiry must be in the future');
  if (now + maxExpirySeconds > MAX_U64) {
    throw new CTSError('CTF authorization expiry ceiling exceeds u64');
  }
  const fallback = now + maxExpirySeconds;
  const explicit = keysets
    .flatMap(({ final_expiry }) =>
      final_expiry === undefined ? [] : [parseUnsigned(final_expiry, 'final_expiry')],
    )
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const ceiling = explicit[0] === undefined || fallback < explicit[0] ? fallback : explicit[0];
  if (expiry >= ceiling) {
    throw new CTSError('CTF authorization expiry must precede the effective keyset expiry ceiling');
  }
}

function validateConditionalKeysetMetadata(
  context: CreateCtfAuthorizationOutputsInput['expiryContext'],
): CreateCtfAuthorizationOutputsInput['expiryContext']['conditionalKeysets'] {
  const conditionId = requireCanonicalHash(context.condition.condition_id, 'condition_id');
  const expectedIds = new Set([
    ...Object.values(context.condition.keysets),
    ...(context.condition.partitions ?? []).flatMap((partition) =>
      Object.values(partition.keysets ?? {}),
    ),
  ]);
  if (expectedIds.size === 0 || context.conditionalKeysets.length !== expectedIds.size) {
    throw new CTSError('complete conditional keyset lifecycle metadata is required');
  }
  const actualIds = new Set<string>();
  for (const keyset of context.conditionalKeysets) {
    assertCanonicalKeysetId(keyset.id, 'conditional keyset id');
    if (keyset.condition_id !== conditionId || !expectedIds.has(keyset.id)) {
      throw new CTSError('conditional keyset metadata does not match the condition');
    }
    if (actualIds.has(keyset.id)) {
      throw new CTSError('conditional keyset metadata contains a duplicate keyset');
    }
    actualIds.add(keyset.id);
  }
  if ([...expectedIds].some((id) => !actualIds.has(id))) {
    throw new CTSError('complete conditional keyset lifecycle metadata is required');
  }
  return context.conditionalKeysets;
}

function hasDefinitiveOutputRecovery(
  recovery: Parameters<typeof classifyCtfSettlementRecovery>[0]['outputRecovery'],
): boolean {
  if (!recovery.queryCompleted || recovery.restoredOutputBs.length === 0) return false;
  const restored = new Set(recovery.restoredOutputBs);
  if (restored.size !== recovery.restoredOutputBs.length) return false;
  if (recovery.query.mode === 'known') {
    const expected = new Set(recovery.query.expectedOutputBs);
    return (
      expected.size > 0 &&
      expected.size === recovery.query.expectedOutputBs.length &&
      hasExactOutputIdentities(recovery.query.outputs, expected) &&
      expected.size === restored.size &&
      [...restored].every((B_) => expected.has(B_))
    );
  }
  const manifest = new Set(recovery.query.manifestBs);
  return (
    manifest.size > 0 &&
    manifest.size === recovery.query.manifestBs.length &&
    hasExactOutputIdentities(recovery.query.outputs, manifest) &&
    [...restored].every((B_) => manifest.has(B_))
  );
}

function hasExactOutputIdentities(
  outputs: SerializedBlindedMessage[],
  expected: Set<string>,
): boolean {
  const actual = new Set(outputs.map(({ B_ }) => B_));
  return (
    outputs.length === expected.size &&
    actual.size === expected.size &&
    [...actual].every((B_) => expected.has(B_))
  );
}

function hasExactInputStates(states: ProofState[], expectedYs: string[]): boolean {
  if (expectedYs.length === 0 || states.length !== expectedYs.length) return false;
  const expected = new Set(expectedYs);
  if (expected.size !== expectedYs.length) return false;
  const observed = new Set(states.map(({ Y }) => Y));
  return (
    observed.size === states.length &&
    observed.size === expected.size &&
    [...observed].every((Y) => expected.has(Y))
  );
}

function requireCanonicalHash(value: string, field: string): string {
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw new CTSError(`${field} must be canonical lowercase 32-byte hex`);
  }
  return value;
}

function parseUnsigned(value: string | bigint | number, field: string): bigint {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) {
    throw new CTSError(`${field} must be a non-negative safe integer`);
  }
  const encoded = typeof value === 'string' ? value : String(value);
  if (!/^(0|[1-9]\d*)$/.test(encoded)) {
    throw new CTSError(`${field} must be a minimal unsigned integer`);
  }
  const parsed = BigInt(encoded);
  if (parsed > MAX_U64) throw new CTSError(`${field} exceeds u64`);
  return parsed;
}

function deriveScopedSeed(seed: Uint8Array, operationId: string, label: string): Uint8Array {
  if (seed.length === 0) throw new CTSError('wallet seed must not be empty');
  const operation = Bytes.fromString(operationId);
  if (operation.length === 0 || operation.length > 1024) {
    throw new CTSError('operationId must encode to 1..1024 bytes');
  }
  const message = Bytes.concat(
    Bytes.fromString(DERIVATION_DOMAIN),
    uint32Be(operation.length),
    operation,
    Bytes.fromString(label),
  );
  return hmac(sha256, seed, message);
}

function uint32Be(value: number): Uint8Array {
  const encoded = new Uint8Array(4);
  new DataView(encoded.buffer).setUint32(0, value, false);
  return encoded;
}
