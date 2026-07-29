import { secp256k1 } from '@noble/curves/secp256k1.js';
import { bytesToHex } from '@noble/curves/utils.js';
import { describe, expect, test } from 'vitest';

import {
  Amount,
  buildCtfRangeRecoveryQuery,
  classifyCtfSettlementRecovery,
  computeCtfManifestCommitment,
  computePayToUnlockRefundDigest,
  computeCtfReceiveCommitment,
  computeCtfSettlementRequestDigest,
  createCtfAuthorizationOutputs,
  createCtfPayToUnlockSecret,
  createCtfRangeManifest,
  createCtfSelectionBitmap,
  createBlindSignature,
  deriveCtfRangeRefundKey,
  deriveCtfRangeRecoverySelection,
  parseCtfPayToUnlockCondition,
  parseCtfSelectionBitmap,
  selectCtfManifestOutputs,
  selectCtfRangeAmounts,
  signPayToUnlockRefund,
  validateCtfPoolPolicyTotals,
  pointFromHex,
  recoverCtfRangeProofs,
  type CtfPoolEntry,
  type CtfSettlementRequest,
  type Proof,
  type SerializedBlindedMessage,
} from '../../src';

const KEYSET_A = '00deadbeef123456';
const KEYSET_B = '00bfa73302d12ffd';
const POINT_A = '02194603ffa36356f4a56b7df9371fc3192472351453ec7398b8da8117e7c3e104';
const POINT_B = '02c97ee3d1db41cf0a3ddb601724be8711a032950811bf326f8219c50c4808d3cd';
const POINT_C = '03a40f20667ed53513075dc51e715ff2046cad64eb68960632269ba7f0210e38bc';
const POINT_D = '03fd4ce5a16b65576145949e6f99f445f8249fee17c606b688b504a849cdc452de';
const POINT_E = '02648eccfa4c026960966276fa5a4cae46ce0fd432211a4f449bf84f13aa5f8303';
const REFUND_KEY = '194603ffa36356f4a56b7df9371fc3192472351453ec7398b8da8117e7c3e104';
const CONDITION_ID = 'ab'.repeat(32);
const EXPIRY_CONTEXT = {
  now: 10,
  maxExpirySeconds: 100,
  condition: { condition_id: CONDITION_ID, keysets: { YES: KEYSET_B } },
  conditionalKeysets: [{ id: KEYSET_B, condition_id: CONDITION_ID, final_expiry: 200 }],
};

function proofState(Y: string, state: 'UNSPENT' | 'PENDING' | 'SPENT') {
  return { Y, state, witness: null };
}

function knownOutputRecovery(
  expectedOutputBs: string[],
  restoredOutputBs: string[],
  queryCompleted = true,
) {
  const outputs = expectedOutputBs.map((B_) => output('1', KEYSET_A, B_));
  return {
    query: { mode: 'known' as const, outputs, expectedOutputBs },
    restoredOutputBs,
    queryCompleted,
  };
}

function unknownOutputRecovery(
  manifestBs: string[],
  restoredOutputBs: string[],
  queryCompleted = true,
) {
  const outputs = manifestBs.map((B_) => output('1', KEYSET_A, B_));
  return {
    query: { mode: 'unknown' as const, outputs, manifestBs },
    restoredOutputBs,
    queryCompleted,
  };
}

function output(amount: string, id: string, B_: string): SerializedBlindedMessage {
  return { amount: Amount.from(amount), id, B_ };
}

function poolEntry(
  index: number,
  role: 'receive' | 'change',
  amount: string,
  id: string,
  B_: string,
): CtfPoolEntry {
  return { index: String(index), role, amount, id, B_ };
}

function condition(
  nonceByte: string,
  data: string,
  offerKeyset: string,
  poolPolicy?: {
    rateN: string;
    rateD: string;
    minReceive: string;
    maxDebit: string;
  },
): string {
  return createCtfPayToUnlockSecret({
    nonce: nonceByte.repeat(32),
    data,
    offerKeyset,
    expiry: '100',
    refund: REFUND_KEY,
    poolPolicy,
  });
}

function proof(amount: string, id: string, secret: string, C: string): Proof {
  return { amount: Amount.from(amount), id, secret, C };
}

describe('NUT-CTF settlement canonical primitives', () => {
  test('matches the CDK receive commitment vector including u64 max', () => {
    expect(
      computeCtfReceiveCommitment([
        output('1', KEYSET_A, POINT_A),
        output('18446744073709551615', KEYSET_B, POINT_B),
      ]),
    ).toBe('3ba10a26e99d6efd25b08265ad699c5ce0e81e715ef273f98a68c24070862279');
  });

  test('strictly parses closed standard and reduced pool conditions', () => {
    const standard = parseCtfPayToUnlockCondition(condition('01', '11'.repeat(32), KEYSET_A));
    expect(standard.mode).toEqual({ kind: 'standard' });

    const pool = parseCtfPayToUnlockCondition(
      condition('02', '22'.repeat(32), KEYSET_A, {
        rateN: '5',
        rateD: '3',
        minReceive: '1',
        maxDebit: '100',
      }),
    );
    expect(pool.mode).toEqual({
      kind: 'pool',
      policy: { rateN: 5n, rateD: 3n, minReceive: 1n, maxDebit: 100n },
    });
  });

  test('rejects partial, nonminimal, unreduced, and unknown condition tags', () => {
    const base = JSON.parse(condition('03', '33'.repeat(32), KEYSET_A)) as [
      string,
      { tags: string[][] },
    ];
    base[1].tags.push(['rate_n', '5']);
    expect(() => parseCtfPayToUnlockCondition(JSON.stringify(base))).toThrow(/all four/);

    base[1].tags.push(['rate_d', '03'], ['min_receive', '1'], ['max_debit', '100']);
    expect(() => parseCtfPayToUnlockCondition(JSON.stringify(base))).toThrow(/minimal/);

    base[1].tags[4] = ['rate_d', '6'];
    base[1].tags[3] = ['rate_n', '10'];
    expect(() => parseCtfPayToUnlockCondition(JSON.stringify(base))).toThrow(/reduced/);

    const standard = JSON.parse(condition('04', '44'.repeat(32), KEYSET_A)) as [
      string,
      { tags: string[][] },
    ];
    standard[1].tags.push(['allow_change']);
    expect(() => parseCtfPayToUnlockCondition(JSON.stringify(standard))).toThrow(/unknown/);
    expect(() =>
      createCtfPayToUnlockSecret({
        nonce: '05'.repeat(32),
        data: '55'.repeat(32),
        offerKeyset: 'not-a-keyset',
        expiry: 100,
        refund: REFUND_KEY,
      }),
    ).toThrow(/NUT-02/);
  });

  test('matches the CDK manifest and bitmap vectors', () => {
    const manifest = [
      poolEntry(0, 'receive', '1', KEYSET_B, POINT_A),
      poolEntry(1, 'receive', '2', KEYSET_B, POINT_B),
      poolEntry(2, 'change', '4', KEYSET_A, POINT_C),
      poolEntry(3, 'change', '8', KEYSET_A, POINT_D),
      poolEntry(4, 'change', '16', KEYSET_A, POINT_E),
    ];

    expect(computeCtfManifestCommitment(manifest)).toBe(
      '991646fd99d2f3a0a6267e392a4338cad780b2e3566135247c992a76539e1aab',
    );
    expect(createCtfSelectionBitmap(manifest.length, [0, 2, 4])).toBe('15');
    expect(parseCtfSelectionBitmap('15', manifest.length)).toEqual([0, 2, 4]);
    expect(selectCtfManifestOutputs(manifest, '15')).toEqual([
      output('1', KEYSET_B, POINT_A),
      output('4', KEYSET_A, POINT_C),
      output('16', KEYSET_A, POINT_E),
    ]);
    expect(() => parseCtfSelectionBitmap('95', manifest.length)).toThrow(/trailing/);
    expect(() => parseCtfSelectionBitmap('0x15', manifest.length)).toThrow(/length/);
  });

  test('round-trips bounded bitmap properties without size-dependent fixtures', () => {
    for (let entryCount = 1; entryCount <= 256; entryCount += 1) {
      const selected = Array.from({ length: entryCount }, (_, index) => index).filter(
        (index) => (index * 17 + entryCount) % 3 === 0,
      );
      const encoded = createCtfSelectionBitmap(entryCount, selected);
      expect(parseCtfSelectionBitmap(encoded, entryCount)).toEqual(selected);
    }
  });

  test('matches the CDK binary-id request digest vector', () => {
    const outputA = output('9', KEYSET_B, POINT_B);
    const outputB = output('8', KEYSET_A, POINT_A);
    const participantA = {
      inputs: [
        proof(
          '10',
          KEYSET_A,
          condition('01', computeCtfReceiveCommitment([outputA]), KEYSET_A),
          POINT_A,
        ),
      ],
      outputs: [outputA],
    };
    const participantB = {
      inputs: [
        proof(
          '9',
          KEYSET_B,
          condition('02', computeCtfReceiveCommitment([outputB]), KEYSET_B),
          POINT_B,
        ),
      ],
      outputs: [outputB],
    };
    const request: CtfSettlementRequest = {
      condition_id: '11'.repeat(32),
      parent_collection_id: '00'.repeat(32),
      participants: [participantB, participantA],
    };

    expect(computeCtfSettlementRequestDigest(request)).toBe(
      '48f6e7b04945ed9fd11700f14740ca13714de6b7c68f45183e60df2565ef6c26',
    );
  });

  test('enforces the checked-u128 range covenant at its exact boundary', () => {
    const policy = { rateN: 5n, rateD: 3n, minReceive: 6n, maxDebit: 10n };
    expect(() => validateCtfPoolPolicyTotals(policy, 10n, 10n, 4n)).not.toThrow();
    expect(() => validateCtfPoolPolicyTotals(policy, 10n, 9n, 4n)).toThrow(/rate/);
    expect(() =>
      validateCtfPoolPolicyTotals(
        {
          rateN: 340_282_366_920_938_463_463_374_607_431_768_211_455n,
          rateD: 1n,
          minReceive: 1n,
          maxDebit: 2n,
        },
        2n,
        2n,
        0n,
      ),
    ).toThrow(/u128/);
  });
});

describe('NUT-CTF deterministic range material', () => {
  const seed = new Uint8Array(64).fill(7);
  const receiveKeyset = {
    id: KEYSET_B,
    active: true,
    keys: { 1: POINT_A, 2: POINT_B, 4: POINT_C, 8: POINT_D, 16: POINT_E },
  };
  const offerKeyset = {
    id: KEYSET_A,
    active: true,
    keys: { 1: POINT_A, 2: POINT_B, 4: POINT_C, 8: POINT_D, 16: POINT_E },
  };

  test('derives stable operation-scoped refund and manifest material', () => {
    const first = createCtfRangeManifest({
      seed,
      operationId: 'order-42',
      receiveKeyset,
      offerKeyset,
      maxReceive: '10',
      maxChange: '9',
      maxEntries: 16,
    });
    const second = createCtfRangeManifest({
      seed,
      operationId: 'order-42',
      receiveKeyset,
      offerKeyset,
      maxReceive: '10',
      maxChange: '9',
      maxEntries: 16,
    });
    const other = createCtfRangeManifest({
      seed,
      operationId: 'order-43',
      receiveKeyset,
      offerKeyset,
      maxReceive: '10',
      maxChange: '9',
      maxEntries: 16,
    });

    expect(second.serialized).toEqual(first.serialized);
    expect(second.entries.map((entry) => entry.outputData.blindingFactor)).toEqual(
      first.entries.map((entry) => entry.outputData.blindingFactor),
    );
    expect(other.serialized).not.toEqual(first.serialized);
    expect(first.serialized.map((entry) => entry.amount)).toEqual([
      '1',
      '2',
      '4',
      '8',
      '1',
      '2',
      '4',
      '8',
    ]);
    expect(deriveCtfRangeRefundKey(seed, 'order-42')).toEqual(
      deriveCtfRangeRefundKey(seed, 'order-42'),
    );
    expect(deriveCtfRangeRefundKey(seed, 'order-43')).not.toEqual(
      deriveCtfRangeRefundKey(seed, 'order-42'),
    );
  });

  test('rejects inactive, unsupported-denomination, and oversized manifests', () => {
    expect(() =>
      createCtfRangeManifest({
        seed,
        operationId: 'inactive',
        receiveKeyset: { ...receiveKeyset, active: false },
        offerKeyset,
        maxReceive: '1',
        maxChange: '1',
        maxEntries: 2,
      }),
    ).toThrow(/active/);

    expect(() =>
      createCtfRangeManifest({
        seed,
        operationId: 'missing-denomination',
        receiveKeyset: { ...receiveKeyset, keys: { 1: POINT_A } },
        offerKeyset,
        maxReceive: '3',
        maxChange: '1',
        maxEntries: 3,
      }),
    ).toThrow(/denomination 2/);

    expect(() =>
      createCtfRangeManifest({
        seed,
        operationId: 'too-large',
        receiveKeyset,
        offerKeyset,
        maxReceive: '10',
        maxChange: '9',
        maxEntries: 7,
      }),
    ).toThrow(/maxEntries/);

    expect(() =>
      createCtfRangeManifest({
        seed,
        operationId: 'malformed-keyset',
        receiveKeyset: { ...receiveKeyset, id: 'not-a-keyset' },
        offerKeyset,
        maxReceive: '1',
        maxChange: '1',
        maxEntries: 2,
      }),
    ).toThrow(/NUT-02/);
  });

  test('constructs only logarithmic material for u64-scale ranges', () => {
    const keys = Object.fromEntries(
      Array.from({ length: 64 }, (_, exponent) => [(1n << BigInt(exponent)).toString(), POINT_A]),
    );
    const manifest = createCtfRangeManifest({
      seed,
      operationId: 'u64-range',
      receiveKeyset: { id: KEYSET_B, active: true, keys },
      offerKeyset: { id: KEYSET_A, active: true, keys },
      maxReceive: '18446744073709551615',
      maxChange: '18446744073709551615',
      maxEntries: 128,
    });
    expect(manifest.entries).toHaveLength(128);
  });

  test('retains complete recovery material regardless of selection', () => {
    const manifest = createCtfRangeManifest({
      seed,
      operationId: 'recovery',
      receiveKeyset,
      offerKeyset,
      maxReceive: '3',
      maxChange: '3',
      maxEntries: 4,
    });
    const selected = createCtfSelectionBitmap(4, [0, 3]);

    const unknownQuery = buildCtfRangeRecoveryQuery(manifest.entries);
    const knownQuery = buildCtfRangeRecoveryQuery(manifest.entries, selected);
    expect(unknownQuery.outputs).toHaveLength(4);
    expect(knownQuery.outputs).toEqual([
      manifest.entries[0].outputData.blindedMessage,
      manifest.entries[3].outputData.blindedMessage,
    ]);
    expect(deriveCtfRangeRecoverySelection(manifest.entries, knownQuery.outputs)).toBe(selected);
    expect(manifest.entries).toHaveLength(4);
  });

  test('selects every exact amount in a bounded binary receive/change range', () => {
    const manifest = createCtfRangeManifest({
      seed,
      operationId: 'selection',
      receiveKeyset,
      offerKeyset,
      maxReceive: '7',
      maxChange: '7',
      maxEntries: 6,
    });

    for (let receive = 0; receive <= 7; receive += 1) {
      for (let change = 0; change <= 7; change += 1) {
        const selected = selectCtfRangeAmounts(manifest.serialized, receive, change);
        expect(selected.receiveTotal.equals(receive)).toBe(true);
        expect(selected.changeTotal.equals(change)).toBe(true);
        expect(selectCtfManifestOutputs(manifest.serialized, selected.selection)).toEqual(
          selected.outputs,
        );
      }
    }
    expect(() => selectCtfRangeAmounts(manifest.serialized, 8, 0)).toThrow(/range/);
  });

  test('derives unique deterministic conditioned inputs for exact restart reconstruction', () => {
    const refund = deriveCtfRangeRefundKey(seed, 'authorization');
    const options = {
      seed,
      operationId: 'authorization',
      offerKeysetId: KEYSET_A,
      amounts: ['4', '2'],
      commitment: '77'.repeat(32),
      expiry: '100',
      expiryContext: EXPIRY_CONTEXT,
      refund: refund.publicKey,
      poolPolicy: { rateN: '5', rateD: '3', minReceive: '1', maxDebit: '6' },
    };
    const first = createCtfAuthorizationOutputs(options);
    const second = createCtfAuthorizationOutputs(options);

    expect(second.map((entry) => entry.blindedMessage)).toEqual(
      first.map((entry) => entry.blindedMessage),
    );
    const conditions = first.map((entry) =>
      parseCtfPayToUnlockCondition(new TextDecoder().decode(entry.secret)),
    );
    expect(new Set(conditions.map(({ nonce }) => nonce))).toHaveLength(2);
    expect(conditions.every(({ refund: key }) => key === refund.publicKey)).toBe(true);
  });

  test('requires authorization expiry inside mint and conditional-keyset horizons', () => {
    const base = {
      seed,
      operationId: 'expiry-bounds',
      offerKeysetId: KEYSET_A,
      amounts: [Amount.one()],
      commitment: '11'.repeat(32),
      refund: deriveCtfRangeRefundKey(seed, 'expiry-bounds').publicKey,
    };
    expect(() =>
      createCtfAuthorizationOutputs({
        ...base,
        expiry: 109,
        expiryContext: {
          now: 10,
          maxExpirySeconds: 100,
          condition: { condition_id: CONDITION_ID, keysets: { YES: KEYSET_B } },
          conditionalKeysets: [{ id: KEYSET_B, condition_id: CONDITION_ID }],
        },
      }),
    ).not.toThrow();
    expect(() =>
      createCtfAuthorizationOutputs({
        ...base,
        expiry: 110,
        expiryContext: {
          now: 10,
          maxExpirySeconds: 100,
          condition: { condition_id: CONDITION_ID, keysets: { YES: KEYSET_B } },
          conditionalKeysets: [{ id: KEYSET_B, condition_id: CONDITION_ID }],
        },
      }),
    ).toThrow(/effective keyset expiry ceiling/);
    expect(() =>
      createCtfAuthorizationOutputs({
        ...base,
        expiry: 80,
        expiryContext: {
          now: 10,
          maxExpirySeconds: 100,
          condition: {
            condition_id: CONDITION_ID,
            keysets: { YES: KEYSET_B, NO: KEYSET_A },
          },
          conditionalKeysets: [
            {
              id: KEYSET_B,
              condition_id: CONDITION_ID,
              final_expiry: 80,
            },
            { id: KEYSET_A, condition_id: CONDITION_ID },
          ],
        },
      }),
    ).toThrow(/effective keyset expiry ceiling/);
    expect(() =>
      createCtfAuthorizationOutputs({
        ...base,
        expiry: 109,
        expiryContext: {
          now: 10,
          maxExpirySeconds: 100,
          condition: { condition_id: CONDITION_ID, keysets: { YES: KEYSET_B } },
          conditionalKeysets: [
            {
              id: KEYSET_B,
              condition_id: CONDITION_ID,
              final_expiry: 200,
            },
          ],
        },
      }),
    ).not.toThrow();
    expect(() =>
      createCtfAuthorizationOutputs({
        ...base,
        expiry: 110,
        expiryContext: {
          now: 10,
          maxExpirySeconds: 100,
          condition: { condition_id: CONDITION_ID, keysets: { YES: KEYSET_B } },
          conditionalKeysets: [
            {
              id: KEYSET_B,
              condition_id: CONDITION_ID,
              final_expiry: 200,
            },
          ],
        },
      }),
    ).toThrow(/effective keyset expiry ceiling/);
    expect(() =>
      createCtfAuthorizationOutputs({
        ...base,
        expiry: 100,
        expiryContext: {
          now: 10,
          maxExpirySeconds: 100,
          condition: { condition_id: CONDITION_ID, keysets: { YES: KEYSET_B } },
          conditionalKeysets: [
            {
              id: KEYSET_B,
              condition_id: CONDITION_ID,
              final_expiry: 100,
            },
          ],
        },
      }),
    ).toThrow(/effective keyset expiry ceiling/);
    expect(() =>
      createCtfAuthorizationOutputs({
        ...base,
        expiry: 50,
        expiryContext: {
          now: 10,
          maxExpirySeconds: 100,
          condition: {
            condition_id: CONDITION_ID,
            keysets: { YES: KEYSET_B, NO: KEYSET_A },
          },
          conditionalKeysets: [],
        },
      }),
    ).toThrow(/complete conditional keyset lifecycle metadata/);
  });

  test('maps an exact NUT-09 response back to retained unblinding material', () => {
    const mintPrivateKey = new Uint8Array(32);
    mintPrivateKey[31] = 1;
    const mintPublicKey = secp256k1.getPublicKey(mintPrivateKey, true);
    const keys = { 1: bytesToHex(mintPublicKey) };
    const manifest = createCtfRangeManifest({
      seed,
      operationId: 'nut09',
      receiveKeyset: { id: KEYSET_B, active: true, keys },
      offerKeyset: { id: KEYSET_A, active: true, keys },
      maxReceive: '1',
      maxChange: '1',
      maxEntries: 2,
    });
    const restoredOutputs = buildCtfRangeRecoveryQuery(manifest.entries).outputs;
    const signatures = manifest.entries.map(({ outputData }) => {
      const signature = createBlindSignature(
        pointFromHex(outputData.blindedMessage.B_),
        mintPrivateKey,
        outputData.blindedMessage.id,
      );
      return {
        id: signature.id,
        amount: outputData.blindedMessage.amount,
        C_: signature.C_.toHex(true),
      };
    });
    const proofs = recoverCtfRangeProofs(manifest.entries, restoredOutputs, signatures, (id) => ({
      id,
      keys,
    }));

    expect(proofs).toHaveLength(2);
    expect(proofs.map(({ secret }) => secret)).toEqual(
      manifest.entries.map(({ outputData }) => new TextDecoder().decode(outputData.secret)),
    );
  });
});

describe('NUT-07/NUT-09 settlement recovery classification', () => {
  test('uses restored output first, otherwise classifies only definitive input states', () => {
    expect(
      classifyCtfSettlementRecovery({
        inputStates: [proofState('a', 'SPENT')],
        expectedInputYs: ['a'],
        outputRecovery: knownOutputRecovery(['o1'], ['o1']),
        now: 50,
        expiry: 100,
      }),
    ).toBe('confirmed');
    expect(
      classifyCtfSettlementRecovery({
        inputStates: [proofState('a', 'UNSPENT'), proofState('b', 'UNSPENT')],
        expectedInputYs: ['a', 'b'],
        outputRecovery: knownOutputRecovery(['o1', 'o2'], []),
        now: 50,
        expiry: 100,
      }),
    ).toBe('waiting');
    expect(
      classifyCtfSettlementRecovery({
        inputStates: [proofState('a', 'UNSPENT')],
        expectedInputYs: ['a'],
        outputRecovery: knownOutputRecovery(['o1'], []),
        now: 100,
        expiry: 100,
      }),
    ).toBe('refundable');

    for (const inputStates of [
      [proofState('a', 'SPENT')],
      [proofState('a', 'PENDING')],
      [proofState('a', 'UNSPENT'), proofState('b', 'SPENT')],
    ]) {
      expect(
        classifyCtfSettlementRecovery({
          inputStates,
          expectedInputYs: inputStates.map(({ Y }) => Y),
          outputRecovery: knownOutputRecovery(['o1'], []),
          now: 100,
          expiry: 100,
        }),
      ).toBe('reconciling');
    }
  });

  test('keeps partial exact-output restoration nonterminal', () => {
    expect(
      classifyCtfSettlementRecovery({
        inputStates: [proofState('a', 'SPENT')],
        expectedInputYs: ['a'],
        outputRecovery: knownOutputRecovery(['o1', 'o2'], ['o1']),
        now: 100,
        expiry: 100,
      }),
    ).toBe('reconciling');
    const mismatchedQuery = knownOutputRecovery(['o1', 'o2'], ['o1', 'o2']);
    mismatchedQuery.query.outputs = mismatchedQuery.query.outputs.slice(0, 1);
    expect(
      classifyCtfSettlementRecovery({
        inputStates: [proofState('a', 'SPENT')],
        expectedInputYs: ['a'],
        outputRecovery: mismatchedQuery,
        now: 100,
        expiry: 100,
      }),
    ).toBe('reconciling');
  });

  test('keeps missing, duplicate, and unexpected input observations nonterminal', () => {
    for (const inputStates of [
      [proofState('a', 'UNSPENT')],
      [proofState('a', 'UNSPENT'), proofState('a', 'UNSPENT')],
      [proofState('a', 'UNSPENT'), proofState('c', 'UNSPENT')],
    ]) {
      expect(
        classifyCtfSettlementRecovery({
          inputStates,
          expectedInputYs: ['a', 'b'],
          outputRecovery: knownOutputRecovery(['o1'], []),
          now: 100,
          expiry: 100,
        }),
      ).toBe('reconciling');
    }
  });

  test('confirms only a complete all-manifest query when selection was unknown', () => {
    expect(
      classifyCtfSettlementRecovery({
        inputStates: [proofState('a', 'SPENT')],
        expectedInputYs: ['a'],
        outputRecovery: unknownOutputRecovery(['o1', 'o2', 'o3'], ['o1', 'o3']),
        now: 100,
        expiry: 100,
      }),
    ).toBe('confirmed');
    const truncatedQuery = unknownOutputRecovery(['o1', 'o2', 'o3'], ['o1', 'o3']);
    truncatedQuery.query.outputs = [];
    for (const outputRecovery of [
      unknownOutputRecovery(['o1', 'o2', 'o3'], ['o1', 'o3'], false),
      unknownOutputRecovery(['o1', 'o2', 'o3'], ['o1', 'o1']),
      unknownOutputRecovery(['o1', 'o2', 'o3'], ['outside']),
      truncatedQuery,
    ]) {
      expect(
        classifyCtfSettlementRecovery({
          inputStates: [proofState('a', 'SPENT')],
          expectedInputYs: ['a'],
          outputRecovery,
          now: 100,
          expiry: 100,
        }),
      ).toBe('reconciling');
    }
  });
});

describe('PAY_TO_UNLOCK refund', () => {
  test('matches the CDK witness-free digest beyond the safe-integer boundary', () => {
    const keysetId = '009a1f293253e41e';
    const amount = '9007199254740993';
    const secret =
      '["PAY_TO_UNLOCK",{"nonce":"' +
      '00'.repeat(32) +
      '","data":"' +
      '11'.repeat(32) +
      '","tags":[["offer_keyset","009a1f293253e41e"],["expiry","42"],' +
      '["refund","1b84c5567b126440995d3ed5aaba0565d71e1834604819ff9c17f5e9d5dd078f"]]}]';
    const request = {
      inputs: [
        proof(
          amount,
          keysetId,
          secret,
          '024d4b6cd1361032ca9bd2aeb9d900aa4d45d9ead80ac9423374c451a7254d0766',
        ),
      ],
      outputs: [
        output(
          amount,
          keysetId,
          '02531fe6068134503d2723133227c867ac8fa6c83c537e9a44c3c5bdbdcb1fe337',
        ),
      ],
    };

    expect(computePayToUnlockRefundDigest(request)).toBe(
      '0c74ca791ed0e63e18efdf9f73deb35c093ed4b512204faf584188666609f674',
    );
  });

  test('signs the witness-free request digest and preserves that digest', () => {
    const refund = deriveCtfRangeRefundKey(new Uint8Array(64).fill(9), 'refund');
    const request = {
      inputs: [
        proof(
          '2',
          KEYSET_A,
          createCtfPayToUnlockSecret({
            nonce: '88'.repeat(32),
            data: '99'.repeat(32),
            offerKeyset: KEYSET_A,
            expiry: '100',
            refund: refund.publicKey,
          }),
          POINT_A,
        ),
      ],
      outputs: [output('2', KEYSET_A, POINT_B)],
    };
    const digest = computePayToUnlockRefundDigest(request);
    const signed = signPayToUnlockRefund(request, refund.privateKey);

    expect(computePayToUnlockRefundDigest(signed)).toBe(digest);
    expect(signed.inputs[0].witness).toEqual({
      signatures: [expect.stringMatching(/^[0-9a-f]{128}$/)],
    });
    expect(request.inputs[0].witness).toBeUndefined();
  });

  test('rejects a refund key belonging to another authorization', () => {
    const seed = new Uint8Array(64).fill(9);
    const expected = deriveCtfRangeRefundKey(seed, 'expected');
    const other = deriveCtfRangeRefundKey(seed, 'other');
    const request = {
      inputs: [
        proof(
          '1',
          KEYSET_A,
          createCtfPayToUnlockSecret({
            nonce: 'aa'.repeat(32),
            data: 'bb'.repeat(32),
            offerKeyset: KEYSET_A,
            expiry: '100',
            refund: expected.publicKey,
          }),
          POINT_A,
        ),
      ],
      outputs: [output('1', KEYSET_A, POINT_B)],
    };
    expect(() => signPayToUnlockRefund(request, other.privateKey)).toThrow(/does not match/);
  });
});
