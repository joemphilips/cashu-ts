import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js';
import { hexToBytes } from '@noble/curves/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';

import type {
  CtfPoolEntry,
  CtfSettlementParticipant,
  CtfSettlementRequest,
} from '../mint/types/ctf';
import { Amount } from '../model/Amount';
import { CTSError } from '../model/Errors';
import type { Proof, SerializedBlindedMessage } from '../model/types';
import type { SwapRequest } from '../model/types/NUT03';
import { Bytes } from '../utils';

import { schnorrSignDigest } from './core';
import { assertCanonicalKeysetId, pointFromHexAuto, pointToHex } from './curves';

const CTF_RECEIVE_DOMAIN = 'Cashu/ctf/convert/recv';
const CTF_MANIFEST_DOMAIN = 'Cashu/ctf/convert/manifest';
const CTF_REQUEST_DOMAIN = 'Cashu/ctf/convert/request';
const CTF_COORDINATOR_DOMAIN = 'Cashu/ctf/convert/coordinator';
const PAY_TO_UNLOCK_REFUND_DOMAIN = 'Cashu/PAY_TO_UNLOCK/refund';

const PAY_TO_UNLOCK_KIND = 'PAY_TO_UNLOCK';
const MAX_U64 = 18_446_744_073_709_551_615n;
const MAX_U128 = 340_282_366_920_938_463_463_374_607_431_768_211_455n;
const ZERO_HASH = '00'.repeat(32);
const CONDITION_TAGS = new Set([
  'offer_keyset',
  'expiry',
  'refund',
  'coordinator_pubkey',
  'rate_n',
  'rate_d',
  'min_receive',
  'max_debit',
]);

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | { [key: string]: CanonicalValue };

export interface CtfPoolPolicy {
  rateN: bigint;
  rateD: bigint;
  minReceive: bigint;
  maxDebit: bigint;
}

export type CtfPayToUnlockMode = { kind: 'standard' } | { kind: 'pool'; policy: CtfPoolPolicy };

export interface CtfPayToUnlockCondition {
  nonce: string;
  data: string;
  offerKeyset: string;
  expiry: bigint;
  refund: string;
  coordinatorPublicKey?: string;
  mode: CtfPayToUnlockMode;
}

export interface CreateCtfPayToUnlockSecretInput {
  nonce: string;
  data: string;
  offerKeyset: string;
  expiry: string | bigint | number;
  refund: string;
  coordinatorPublicKey?: string;
  poolPolicy?: {
    rateN: string | bigint | number;
    rateD: string | bigint | number;
    minReceive: string | bigint | number;
    maxDebit: string | bigint | number;
  };
}

function computeTaggedHash(tag: string, message: Uint8Array): string {
  const tagHash = sha256(Bytes.fromString(tag));
  return Bytes.toHex(sha256(Bytes.concat(tagHash, tagHash, message)));
}

/**
 * Compute the CTF endpoint-specific commitment for an exact ordered output bundle.
 */
export function computeCtfReceiveCommitment(outputs: SerializedBlindedMessage[]): string {
  if (outputs.length > 0xffffffff) {
    throw new CTSError('CTF output count exceeds uint32');
  }
  const count = new Uint8Array(4);
  new DataView(count.buffer).setUint32(0, outputs.length, true);
  const entries = outputs.map((entry) => Bytes.fromString(canonicalOutput(entry)));
  return computeTaggedHash(CTF_RECEIVE_DOMAIN, Bytes.concat(count, ...entries));
}

/**
 * Validate and compute a CTF pool-manifest commitment.
 */
export function computeCtfManifestCommitment(manifest: CtfPoolEntry[]): string {
  validateCtfPoolManifest(manifest);
  const entries = manifest.map((entry) => Bytes.fromString(canonicalPoolEntry(entry)));
  return computeTaggedHash(CTF_MANIFEST_DOMAIN, Bytes.concat(...entries));
}

/**
 * Encode selected manifest indices as the pinned LSB-first lowercase bitmap.
 */
export function createCtfSelectionBitmap(entryCount: number, selectedIndices: number[]): string {
  requireEntryCount(entryCount);
  const bytes = new Uint8Array(Math.ceil(entryCount / 8));
  const seen = new Set<number>();
  for (const index of selectedIndices) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= entryCount) {
      throw new CTSError('CTF selection index is out of range');
    }
    if (seen.has(index)) throw new CTSError('CTF selection contains a duplicate index');
    seen.add(index);
    bytes[index >> 3] |= 1 << (index & 7);
  }
  return Bytes.toHex(bytes);
}

/**
 * Strictly decode an LSB-first pool-selection bitmap.
 */
export function parseCtfSelectionBitmap(value: string, entryCount: number): number[] {
  requireEntryCount(entryCount);
  const expectedLength = Math.ceil(entryCount / 8) * 2;
  if (value.length !== expectedLength) {
    throw new CTSError('CTF selection has an incorrect byte length');
  }
  if (!/^[0-9a-f]*$/.test(value)) {
    throw new CTSError('CTF selection must be lowercase hexadecimal');
  }
  const bytes = Bytes.fromHex(value);
  validateTrailingBits(bytes, entryCount);
  return selectedIndices(bytes, entryCount);
}

/**
 * Return exactly the blinded messages selected from a validated manifest.
 */
export function selectCtfManifestOutputs(
  manifest: CtfPoolEntry[],
  selection: string,
): SerializedBlindedMessage[] {
  validateCtfPoolManifest(manifest);
  return parseCtfSelectionBitmap(selection, manifest.length).map((index) =>
    manifestEntryOutput(manifest[index]),
  );
}

export interface CtfRangeSelection {
  selection: string;
  selectedIndices: number[];
  outputs: SerializedBlindedMessage[];
  receiveTotal: Amount;
  changeTotal: Amount;
}

/**
 * Select exact receive/change totals from a binary-denomination manifest built by this SDK.
 */
export function selectCtfRangeAmounts(
  manifest: CtfPoolEntry[],
  receiveAmount: Amount | string | bigint | number,
  changeAmount: Amount | string | bigint | number,
): CtfRangeSelection {
  validateCtfPoolManifest(manifest);
  const receive = selectBinaryRole(manifest, 'receive', Amount.from(receiveAmount));
  const change = selectBinaryRole(manifest, 'change', Amount.from(changeAmount));
  const selectedIndices = [...receive, ...change].sort((left, right) => left - right);
  const selection = createCtfSelectionBitmap(manifest.length, selectedIndices);
  return {
    selection,
    selectedIndices,
    outputs: selectCtfManifestOutputs(manifest, selection),
    receiveTotal: Amount.from(receiveAmount),
    changeTotal: Amount.from(changeAmount),
  };
}

/**
 * Compute the byte-exact CTF multi-party idempotency digest.
 */
export function computeCtfSettlementRequestDigest(request: CtfSettlementRequest): string {
  return computeTaggedHash(CTF_REQUEST_DOMAIN, canonicalRequestBytes(request));
}

/**
 * Compute the exact BIP-340 message digest authorized by a bound coordinator.
 */
export function computeCtfSettlementCoordinatorDigest(request: CtfSettlementRequest): string {
  return computeTaggedHash(CTF_COORDINATOR_DOMAIN, canonicalRequestBytes(request));
}

/**
 * Sign one coordinator-bound request without mutating the caller's request.
 */
export function signCtfSettlementRequest(
  request: CtfSettlementRequest,
  privateKey: string | Uint8Array,
): CtfSettlementRequest {
  const privateKeyBytes = parsePrivateKey(privateKey, 'coordinator');
  const coordinatorPublicKey = requireRequestCoordinatorPublicKey(request);
  const derivedPublicKey = Bytes.toHex(secp256k1.getPublicKey(privateKeyBytes, true).slice(1));
  if (derivedPublicKey !== coordinatorPublicKey) {
    throw new CTSError('coordinator private key does not match PAY_TO_UNLOCK condition');
  }
  return {
    ...request,
    coordinator_sig: schnorrSignDigest(
      computeCtfSettlementCoordinatorDigest(request),
      privateKeyBytes,
    ),
  };
}

/**
 * Verify the request-wide coordinator binding and BIP-340 signature.
 */
export function verifyCtfSettlementCoordinatorSignature(request: CtfSettlementRequest): boolean {
  try {
    const coordinatorPublicKey = requestCoordinatorPublicKey(request);
    if (coordinatorPublicKey === undefined) return request.coordinator_sig === undefined;
    if (!/^[0-9a-f]{128}$/.test(request.coordinator_sig ?? '')) return false;
    return schnorr.verify(
      hexToBytes(request.coordinator_sig!),
      hexToBytes(computeCtfSettlementCoordinatorDigest(request)),
      hexToBytes(coordinatorPublicKey),
    );
  } catch {
    return false;
  }
}

function canonicalRequestBytes(request: CtfSettlementRequest): Uint8Array {
  const conditionId = requireCanonicalHash(request.condition_id, 'condition_id');
  const parent = requireCanonicalHash(
    request.parent_collection_id ?? ZERO_HASH,
    'parent_collection_id',
  );
  requireCanonicalParticipantOrder(request.participants);
  return Bytes.concat(
    hexToBytes(conditionId),
    hexToBytes(parent),
    ...request.participants.map(canonicalParticipantBytes),
  );
}

/**
 * Create one strict standard or pool-mode `PAY_TO_UNLOCK` proof secret.
 */
export function createCtfPayToUnlockSecret(input: CreateCtfPayToUnlockSecretInput): string {
  const nonce = requireCanonicalHash(input.nonce, 'nonce');
  const data = requireCanonicalHash(input.data, 'data');
  const offerKeyset = requireCanonicalKeysetId(input.offerKeyset, 'offer_keyset');
  const expiry = parseMinimalUnsigned(input.expiry, 'expiry', MAX_U64).toString();
  const refund = requireXOnlyPublicKey(input.refund, 'refund');
  const tags = [
    ['offer_keyset', offerKeyset],
    ['expiry', expiry],
    ['refund', refund],
  ];
  if (input.coordinatorPublicKey !== undefined) {
    tags.push([
      'coordinator_pubkey',
      requireXOnlyPublicKey(input.coordinatorPublicKey, 'coordinator public key'),
    ]);
  }
  if (input.poolPolicy) tags.push(...poolPolicyTags(parsePoolPolicy(input.poolPolicy)));
  return JSON.stringify([PAY_TO_UNLOCK_KIND, { data, nonce, tags }]);
}

/**
 * Strictly parse the closed CTF `PAY_TO_UNLOCK` dialect.
 */
export function parseCtfPayToUnlockCondition(secret: string): CtfPayToUnlockCondition {
  const data = parseConditionWire(secret);
  const tags = parseConditionTags(data.tags);
  return {
    nonce: requireCanonicalHash(data.nonce, 'nonce'),
    data: requireCanonicalHash(data.data, 'data'),
    offerKeyset: requireCanonicalKeysetId(requiredTag(tags, 'offer_keyset'), 'offer_keyset'),
    expiry: parseMinimalUnsigned(requiredTag(tags, 'expiry'), 'expiry', MAX_U64),
    refund: requireXOnlyPublicKey(requiredTag(tags, 'refund'), 'refund'),
    ...(tags.has('coordinator_pubkey')
      ? {
          coordinatorPublicKey: requireXOnlyPublicKey(
            requiredTag(tags, 'coordinator_pubkey'),
            'coordinator public key',
          ),
        }
      : {}),
    mode: parseConditionMode(tags),
  };
}

/**
 * Validate the pool rate covenant and owner bounds using checked bigint arithmetic.
 */
export function validateCtfPoolPolicyTotals(
  policy: CtfPoolPolicy,
  inputTotal: bigint,
  receiveTotal: bigint,
  changeTotal: bigint,
): void {
  validatePoolPolicy(policy);
  for (const [name, value] of [
    ['inputTotal', inputTotal],
    ['receiveTotal', receiveTotal],
    ['changeTotal', changeTotal],
  ] as const) {
    if (value < 0n || value > MAX_U128) throw new CTSError(`${name} must fit u128`);
  }
  if (policy.maxDebit > inputTotal) throw new CTSError('maxDebit exceeds input total');
  if (changeTotal > inputTotal) throw new CTSError('change exceeds input total');
  const debitTotal = inputTotal - changeTotal;
  const receiveSide = checkedMultiplyU128(receiveTotal, policy.rateD);
  const debitSide = checkedMultiplyU128(debitTotal, policy.rateN);
  if (receiveSide < debitSide) {
    throw new CTSError('selected rate is below the limit');
  }
  if (receiveTotal < policy.minReceive) throw new CTSError('receive is below minReceive');
  if (debitTotal > policy.maxDebit) throw new CTSError('debit exceeds maxDebit');
}

/**
 * Compute the witness-free digest for a post-expiry NUT-03 refund.
 */
export function computePayToUnlockRefundDigest(request: SwapRequest): string {
  const inputs = request.inputs.map((proof) => canonicalProofValue(proof, false));
  const outputs = request.outputs.map(canonicalOutputValue);
  const canonical = canonicalJson({ inputs, outputs });
  return computeTaggedHash(PAY_TO_UNLOCK_REFUND_DOMAIN, Bytes.fromString(canonical));
}

/**
 * Attach exactly one refund signature to every `PAY_TO_UNLOCK` input.
 */
export function signPayToUnlockRefund(request: SwapRequest, privateKey: string): SwapRequest {
  const privateKeyBytes = parsePrivateKey(privateKey, 'refund');
  const refund = Bytes.toHex(secp256k1.getPublicKey(privateKeyBytes, true).slice(1));
  const digest = computePayToUnlockRefundDigest(request);
  const inputs = request.inputs.map((proof) => {
    const condition = parseCtfPayToUnlockCondition(proof.secret);
    if (condition.refund !== refund) {
      throw new CTSError('refund private key does not match PAY_TO_UNLOCK condition');
    }
    return {
      ...proof,
      witness: { signatures: [schnorrSignDigest(digest, privateKeyBytes)] },
    };
  });
  return { inputs, outputs: request.outputs };
}

function canonicalOutput(output: SerializedBlindedMessage): string {
  return canonicalJson(canonicalOutputValue(output));
}

function canonicalOutputValue(output: SerializedBlindedMessage): CanonicalValue {
  validateBlindedMessage(output);
  return { B_: output.B_, amount: requireU64Amount(output.amount), id: output.id };
}

function canonicalPoolEntry(entry: CtfPoolEntry): string {
  return canonicalJson({
    B_: entry.B_,
    amount: entry.amount,
    id: entry.id,
    index: entry.index,
    role: entry.role,
  });
}

function canonicalParticipantBytes(participant: CtfSettlementParticipant): Uint8Array {
  requireCanonicalInputOrder(participant.inputs);
  const value: Record<string, CanonicalValue> = {
    inputs: participant.inputs.map((proof) => canonicalProofValue(proof, true)),
    outputs: participant.outputs.map(canonicalOutputValue),
  };
  const hasManifest = participant.pool_manifest !== undefined;
  const hasSelection = participant.pool_selection !== undefined;
  if (hasManifest !== hasSelection) {
    throw new CTSError('pool_manifest and pool_selection must appear together');
  }
  if (participant.pool_manifest && participant.pool_selection !== undefined) {
    validateCtfPoolManifest(participant.pool_manifest);
    const selected = selectCtfManifestOutputs(
      participant.pool_manifest,
      participant.pool_selection,
    );
    if (!sameOutputs(selected, participant.outputs)) {
      throw new CTSError('pool selection does not exactly match participant outputs');
    }
    value.pool_manifest = participant.pool_manifest.map((entry) => ({
      B_: entry.B_,
      amount: entry.amount,
      id: entry.id,
      index: entry.index,
      role: entry.role,
    }));
    return Bytes.concat(
      Bytes.fromString(canonicalJson(value)),
      Bytes.fromHex(participant.pool_selection),
    );
  }
  return Bytes.fromString(canonicalJson(value));
}

function canonicalProofValue(proof: Proof, includeWitness: boolean): CanonicalValue {
  const value: Record<string, CanonicalValue> = {
    C: proof.C,
    amount: requireU64Amount(proof.amount),
    id: proof.id,
    secret: proof.secret,
  };
  if (proof.dleq) value.dleq = canonicalObject(proof.dleq);
  if (proof.p2pk_e !== undefined) value.p2pk_e = proof.p2pk_e;
  if (includeWitness && proof.witness !== undefined) {
    value.witness =
      typeof proof.witness === 'string' ? proof.witness : canonicalObject(proof.witness);
  }
  return value;
}

function canonicalObject(value: object): { [key: string]: CanonicalValue } {
  const output: Record<string, CanonicalValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    if (typeof item === 'string' || typeof item === 'boolean' || typeof item === 'number') {
      output[key] = item;
      continue;
    }
    if (Array.isArray(item)) {
      output[key] = item.map((entry) => String(entry));
      continue;
    }
    throw new CTSError(`Unsupported canonical object field ${key}`);
  }
  return output;
}

function canonicalJson(value: CanonicalValue): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(',')}}`;
}

function validateCtfPoolManifest(manifest: CtfPoolEntry[]): void {
  if (manifest.length < 2) throw new CTSError('CTF manifest requires receive and change entries');
  let sawReceive = false;
  let sawChange = false;
  const points = new Set<string>();
  manifest.forEach((entry, index) => {
    if (entry.index !== String(index))
      throw new CTSError('CTF manifest indices must be contiguous');
    if (entry.role === 'receive' && sawChange) {
      throw new CTSError('CTF manifest receive entries must precede change entries');
    }
    if (entry.role === 'receive') sawReceive = true;
    if (entry.role === 'change') sawChange = true;
    if (entry.role !== 'receive' && entry.role !== 'change') {
      throw new CTSError('CTF manifest has an unknown role');
    }
    parseMinimalUnsigned(entry.amount, 'pool_manifest.amount', MAX_U64);
    validateBlindedMessage(manifestEntryOutput(entry));
    if (points.has(entry.B_)) throw new CTSError('CTF manifest has a duplicate blinded message');
    points.add(entry.B_);
  });
  if (!sawReceive || !sawChange) {
    throw new CTSError('CTF manifest requires receive and change entries');
  }
}

function validateBlindedMessage(output: SerializedBlindedMessage): void {
  requireU64Amount(output.amount);
  requireCanonicalKeysetId(output.id, 'output id');
  if (output.B_ !== output.B_.toLowerCase()) {
    throw new CTSError('blinded message must use canonical lowercase hex');
  }
  try {
    const point = pointFromHexAuto(output.B_);
    if (pointToHex(point) !== output.B_) {
      throw new Error('unsupported or noncanonical point');
    }
  } catch (e) {
    throw new CTSError('blinded message contains an invalid point', { cause: e });
  }
}

function parseConditionWire(secret: string): {
  nonce: string;
  data: string;
  tags: unknown[];
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(secret);
  } catch (e) {
    throw new CTSError('PAY_TO_UNLOCK condition is malformed', { cause: e });
  }
  if (!Array.isArray(parsed) || parsed.length !== 2 || parsed[0] !== PAY_TO_UNLOCK_KIND) {
    throw new CTSError('condition kind must be PAY_TO_UNLOCK');
  }
  if (!isRecord(parsed[1]) || !hasExactKeys(parsed[1], ['nonce', 'data', 'tags'])) {
    throw new CTSError('PAY_TO_UNLOCK condition fields are malformed');
  }
  if (
    typeof parsed[1].nonce !== 'string' ||
    typeof parsed[1].data !== 'string' ||
    !Array.isArray(parsed[1].tags)
  ) {
    throw new CTSError('PAY_TO_UNLOCK condition values are malformed');
  }
  return { nonce: parsed[1].nonce, data: parsed[1].data, tags: parsed[1].tags };
}

function parseConditionTags(tags: unknown[]): Map<string, string> {
  const parsed = new Map<string, string>();
  for (const tag of tags) {
    if (!Array.isArray(tag) || typeof tag[0] !== 'string') {
      throw new CTSError('each PAY_TO_UNLOCK tag must contain exactly one string value');
    }
    if (!CONDITION_TAGS.has(tag[0])) throw new CTSError(`unknown PAY_TO_UNLOCK tag ${tag[0]}`);
    if (tag.length !== 2 || typeof tag[1] !== 'string') {
      throw new CTSError('each PAY_TO_UNLOCK tag must contain exactly one string value');
    }
    if (parsed.has(tag[0])) throw new CTSError(`duplicate PAY_TO_UNLOCK tag ${tag[0]}`);
    parsed.set(tag[0], tag[1]);
  }
  return parsed;
}

function parseConditionMode(tags: Map<string, string>): CtfPayToUnlockMode {
  const values = ['rate_n', 'rate_d', 'min_receive', 'max_debit'].map((name) => tags.get(name));
  if (values.every((value) => value === undefined)) return { kind: 'standard' };
  if (values.some((value) => value === undefined)) {
    throw new CTSError('pool mode requires all four pool tags');
  }
  return {
    kind: 'pool',
    policy: parsePoolPolicy({
      rateN: values[0]!,
      rateD: values[1]!,
      minReceive: values[2]!,
      maxDebit: values[3]!,
    }),
  };
}

function parsePoolPolicy(input: {
  rateN: string | bigint | number;
  rateD: string | bigint | number;
  minReceive: string | bigint | number;
  maxDebit: string | bigint | number;
}): CtfPoolPolicy {
  const policy = {
    rateN: parseMinimalUnsigned(input.rateN, 'rate_n', MAX_U128),
    rateD: parseMinimalUnsigned(input.rateD, 'rate_d', MAX_U128),
    minReceive: parseMinimalUnsigned(input.minReceive, 'min_receive', MAX_U128),
    maxDebit: parseMinimalUnsigned(input.maxDebit, 'max_debit', MAX_U128),
  };
  validatePoolPolicy(policy);
  return policy;
}

function validatePoolPolicy(policy: CtfPoolPolicy): void {
  for (const value of Object.values(policy)) {
    if (value < 0n || value > MAX_U128) throw new CTSError('pool policy value must fit u128');
  }
  if (policy.rateD === 0n) throw new CTSError('rate_d must be positive');
  if (policy.minReceive === 0n) throw new CTSError('min_receive must be positive');
  if (greatestCommonDivisor(policy.rateN, policy.rateD) !== 1n) {
    throw new CTSError('rate_n/rate_d must be a reduced fraction');
  }
}

function poolPolicyTags(policy: CtfPoolPolicy): string[][] {
  return [
    ['rate_n', policy.rateN.toString()],
    ['rate_d', policy.rateD.toString()],
    ['min_receive', policy.minReceive.toString()],
    ['max_debit', policy.maxDebit.toString()],
  ];
}

function requiredTag(tags: Map<string, string>, name: string): string {
  const value = tags.get(name);
  if (value === undefined) throw new CTSError(`missing PAY_TO_UNLOCK tag ${name}`);
  return value;
}

function requireCanonicalParticipantOrder(participants: CtfSettlementParticipant[]): void {
  if (participants.length < 2)
    throw new CTSError('CTF settlement requires at least two participants');
  let previous: string | undefined;
  for (const participant of participants) {
    requireCanonicalInputOrder(participant.inputs);
    const first = participant.inputs[0];
    if (!first) throw new CTSError('CTF settlement participant requires an input');
    const key = `${first.id}\u0000${first.secret}`;
    if (previous !== undefined && key <= previous) {
      throw new CTSError('CTF settlement participants are not in canonical order');
    }
    previous = key;
  }
}

function requireCanonicalInputOrder(inputs: Proof[]): void {
  if (inputs.length === 0) throw new CTSError('CTF settlement participant requires an input');
  let previous: string | undefined;
  for (const input of inputs) {
    const key = `${input.id}\u0000${input.secret}`;
    if (previous !== undefined && key <= previous) {
      throw new CTSError('CTF settlement inputs are not in canonical order');
    }
    previous = key;
  }
}

function requireCanonicalHash(value: string, field: string): string {
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw new CTSError(`${field} must be canonical lowercase 32-byte hex`);
  }
  return value;
}

function requireCanonicalKeysetId(value: string, field: string): string {
  return assertCanonicalKeysetId(value, field);
}

function requireXOnlyPublicKey(value: string, field: string): string {
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw new CTSError(`${field} must be canonical lowercase x-only public key hex`);
  }
  try {
    secp256k1.Point.fromHex(`02${value}`);
  } catch (e) {
    throw new CTSError(`${field} is not a valid x-only public key`, { cause: e });
  }
  return value;
}

function parsePrivateKey(value: string | Uint8Array, field: string): Uint8Array {
  if (value instanceof Uint8Array) {
    if (value.length !== 32) {
      throw new CTSError(`${field} private key must contain exactly 32 bytes`);
    }
    try {
      secp256k1.getPublicKey(value, true);
    } catch (e) {
      throw new CTSError(`${field} private key is invalid`, { cause: e });
    }
    return value;
  }
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw new CTSError(`${field} private key must be canonical lowercase 32-byte hex`);
  }
  const bytes = hexToBytes(value);
  try {
    secp256k1.getPublicKey(bytes, true);
  } catch (e) {
    throw new CTSError(`${field} private key is invalid`, { cause: e });
  }
  return bytes;
}

function requireRequestCoordinatorPublicKey(request: CtfSettlementRequest): string {
  const coordinatorPublicKey = requestCoordinatorPublicKey(request);
  if (coordinatorPublicKey === undefined) {
    throw new CTSError('settlement request is not bound to a coordinator');
  }
  return coordinatorPublicKey;
}

function requestCoordinatorPublicKey(request: CtfSettlementRequest): string | undefined {
  let coordinatorPublicKey: string | undefined;
  for (const participant of request.participants) {
    for (const proof of participant.inputs) {
      const candidate = parseCtfPayToUnlockCondition(proof.secret).coordinatorPublicKey;
      if (candidate === undefined) continue;
      if (coordinatorPublicKey !== undefined && coordinatorPublicKey !== candidate) {
        throw new CTSError('settlement request contains conflicting coordinator keys');
      }
      coordinatorPublicKey = candidate;
    }
  }
  return coordinatorPublicKey;
}

function requireU64Amount(value: Amount): string {
  const amount = Amount.from(value).toBigInt();
  if (amount > MAX_U64) throw new CTSError('amount exceeds u64');
  return amount.toString();
}

function parseMinimalUnsigned(
  value: string | bigint | number,
  field: string,
  maximum?: bigint,
): bigint {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) {
    throw new CTSError(`${field} number must be a non-negative safe integer`);
  }
  const encoded = typeof value === 'string' ? value : String(value);
  if (!/^(0|[1-9]\d*)$/.test(encoded)) {
    throw new CTSError(`${field} must be a minimal unsigned decimal`);
  }
  const parsed = BigInt(encoded);
  if (maximum !== undefined && parsed > maximum) throw new CTSError(`${field} exceeds its limit`);
  return parsed;
}

function requireEntryCount(entryCount: number): void {
  if (!Number.isSafeInteger(entryCount) || entryCount < 1) {
    throw new CTSError('CTF selection entry count must be a positive safe integer');
  }
}

function validateTrailingBits(bytes: Uint8Array, entryCount: number): void {
  const usedBits = entryCount & 7;
  if (usedBits === 0) return;
  const last = bytes[bytes.length - 1];
  if (last !== undefined && last >> usedBits !== 0) {
    throw new CTSError('CTF selection unused trailing bits must be zero');
  }
}

function selectedIndices(bytes: Uint8Array, entryCount: number): number[] {
  const selected: number[] = [];
  for (let index = 0; index < entryCount; index += 1) {
    if ((bytes[index >> 3] & (1 << (index & 7))) !== 0) selected.push(index);
  }
  return selected;
}

function manifestEntryOutput(entry: CtfPoolEntry): SerializedBlindedMessage {
  return { amount: Amount.from(entry.amount), id: entry.id, B_: entry.B_ };
}

function selectBinaryRole(
  manifest: CtfPoolEntry[],
  role: 'receive' | 'change',
  target: Amount,
): number[] {
  const entries = manifest
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.role === role);
  validateBinaryDenominations(
    entries.map(({ entry }) => entry.amount),
    role,
  );
  let remaining = target.toBigInt();
  const selected: number[] = [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const amount = BigInt(entries[index].entry.amount);
    if (amount > remaining) continue;
    remaining -= amount;
    selected.push(entries[index].index);
  }
  if (remaining !== 0n) throw new CTSError(`${role} amount exceeds the manifest range`);
  return selected;
}

function validateBinaryDenominations(amounts: string[], role: string): void {
  let expected = 1n;
  for (const amount of amounts) {
    if (BigInt(amount) !== expected) {
      throw new CTSError(`${role} manifest is not a canonical binary range`);
    }
    expected <<= 1n;
  }
}

function sameOutputs(left: SerializedBlindedMessage[], right: SerializedBlindedMessage[]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (output, index) =>
        output.B_ === right[index].B_ &&
        output.id === right[index].id &&
        Amount.from(output.amount).equals(right[index].amount),
    )
  );
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  while (right !== 0n) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return left;
}

function checkedMultiplyU128(left: bigint, right: bigint): bigint {
  const product = left * right;
  if (product > MAX_U128) throw new CTSError('pool policy arithmetic exceeds u128');
  return product;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const keys = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    keys.length === sortedExpected.length &&
    keys.every((key, index) => key === sortedExpected[index])
  );
}
