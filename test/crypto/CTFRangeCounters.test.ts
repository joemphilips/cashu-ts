import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { describe, expect, test, vi } from 'vitest';

import {
  Amount,
  CTSError,
  OutputData,
  createCtfRangeManifestFromCounters,
  deriveCtfRangeOutputFromCounter,
  createCtfAuthorizationOutputsFromCounters,
  recoverCtfRangeProofs,
  type CreateCtfRangeManifestFromCountersInput,
  type CreateCtfAuthorizationOutputsFromCountersInput,
} from '../../src';

import vectors from './fixtures/ctf-range-counters.json';

const seed = pbkdf2(sha512, vectors.provenance.mnemonic, 'mnemonic', { c: 2048, dkLen: 64 });
const point = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
function manifestInput(): CreateCtfRangeManifestFromCountersInput {
  return {
    seed: seed.slice(),
    receiveKeyset: {
      id: vectors.keysets.receive,
      active: true,
      keys: { 1: point, 2: point, 4: point },
    },
    offerKeyset: { id: vectors.keysets.offer, active: true, keys: { 1: point, 2: point } },
    maxReceive: vectors.manifestCase.maxReceive,
    maxChange: vectors.manifestCase.maxChange,
    maxEntries: 128,
    receiveCounters: { ...vectors.manifestCase.receiveCounterRange },
    changeCounters: { ...vectors.manifestCase.changeCounterRange },
  };
}
function authorizationInput(): CreateCtfAuthorizationOutputsFromCountersInput {
  return {
    seed: seed.slice(),
    offerKeysetId: vectors.keysets.offer,
    amounts: ['1', '2'],
    authorizationCounters: { ...vectors.authorizationCase.counterRange },
    commitment: vectors.manifestCase.commitment,
    expiry: '1900000000',
    expiryContext: {
      now: 1800000000,
      maxExpirySeconds: 200000000,
      condition: { condition_id: 'ab'.repeat(32), keysets: { YES: vectors.keysets.receive } },
      conditionalKeysets: [
        { id: vectors.keysets.receive, condition_id: 'ab'.repeat(32), final_expiry: 2100000000 },
      ],
    },
    refund: vectors.authorizationCase.context.refundXOnly,
    coordinatorPublicKey: point.slice(2),
    poolPolicy: { rateN: '5', rateD: '3', minReceive: '1', maxDebit: '7' },
  };
}
function outputValue(value: OutputData) {
  return {
    secret: new TextDecoder().decode(value.secret),
    r: value.blindingFactor.toString(16).padStart(64, '0'),
    B_: value.blindedMessage.B_,
    id: value.blindedMessage.id,
    amount: value.blindedMessage.amount.toString(),
  };
}

describe('counter-based CTF public API', () => {
  test('matches independent full manifest vectors and reconstructs each fixed output', () => {
    const input = manifestInput();
    const before = structuredClone(input);
    const result = createCtfRangeManifestFromCounters(input);
    expect(result.serialized).toEqual(vectors.manifestCase.serializedManifest);
    expect(result.commitment).toBe(vectors.manifestCase.commitment);
    result.entries.forEach((entry, index) => {
      const expected = vectors.manifestCase.entries[index];
      expect(outputValue(entry.outputData)).toEqual({
        secret: expected.secret,
        r: expected.r,
        B_: expected.B_,
        id: expected.id,
        amount: expected.amount,
      });
      expect(
        outputValue(
          deriveCtfRangeOutputFromCounter({
            seed,
            keysetId: expected.id,
            counter: expected.counter,
            amount: expected.amount,
          }),
        ),
      ).toEqual(outputValue(entry.outputData));
    });
    expect(input).toEqual(before);
    expect(createCtfRangeManifestFromCounters(input).serialized).toEqual(result.serialized);
  });
  test.each(vectors.boundaryCases)('matches independent $label output', (expected) => {
    expect(
      outputValue(
        deriveCtfRangeOutputFromCounter({
          seed,
          keysetId: expected.id,
          counter: expected.counter,
          amount: expected.amount,
        }),
      ),
    ).toEqual({
      secret: expected.secret,
      r: expected.r,
      B_: expected.B_,
      id: expected.id,
      amount: expected.amount,
    });
  });
  test('rejects counter, seed, keyset and manifest errors before output construction', () => {
    const invalid: Array<(input: CreateCtfRangeManifestFromCountersInput) => void> = [
      (i) => {
        i.seed = new Uint8Array(15);
      },
      (i) => {
        i.seed = new Uint8Array(65);
      },
      (i) => {
        i.offerKeyset.id = i.receiveKeyset.id;
      },
      (i) => {
        i.offerKeyset.id = '00deadbeef123456';
      },
      (i) => {
        i.receiveKeyset.id = i.receiveKeyset.id.toUpperCase();
      },
      (i) => {
        i.receiveKeyset.active = false;
      },
      (i) => {
        i.receiveKeyset.keys = { 1: point };
      },
      (i) => {
        i.maxEntries = 4;
      },
      (i) => {
        i.maxChange = 0;
      },
      (i) => {
        i.maxReceive = '18446744073709551616';
      },
      (i) => {
        i.receiveCounters.count = 2;
      },
      ...[-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER].map(
        (start) => (i: CreateCtfRangeManifestFromCountersInput) => {
          i.receiveCounters.start = start;
        },
      ),
    ];
    const spy = vi.spyOn(OutputData, 'createSingleDeterministicData');
    try {
      for (const mutate of invalid) {
        const input = manifestInput();
        mutate(input);
        expect(() => createCtfRangeManifestFromCounters(input)).toThrow(CTSError);
      }
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
  test('refuses invalid fixed amounts and reconstruction counters', () => {
    for (const amount of [0, -1, 3, '18446744073709551616', Number.NaN])
      expect(() =>
        deriveCtfRangeOutputFromCounter({
          seed,
          keysetId: vectors.keysets.offer,
          counter: 0,
          amount,
        }),
      ).toThrow(CTSError);
    for (const counter of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
      expect(() =>
        deriveCtfRangeOutputFromCounter({
          seed,
          keysetId: vectors.keysets.offer,
          counter,
          amount: 1,
        }),
      ).toThrow(CTSError);
  });
  test('validates all authorization amounts and context before constructing outputs', () => {
    const spy = vi.spyOn(OutputData, 'createSingleData');
    try {
      const invalid: Array<(input: CreateCtfAuthorizationOutputsFromCountersInput) => void> = [
        (i) => {
          i.amounts = [1, 0];
        },
        (i) => {
          i.amounts = [1, '18446744073709551616'];
        },
        (i) => {
          i.amounts = [];
        },
        (i) => {
          i.authorizationCounters.count = 3;
        },
        (i) => {
          i.authorizationCounters.start = Number.MAX_SAFE_INTEGER - 2;
        },
        (i) => {
          i.commitment = 'SECRET_SENTINEL';
        },
        (i) => {
          i.expiry = 1;
        },
        (i) => {
          i.refund = 'SECRET_SENTINEL';
        },
      ];
      for (const mutate of invalid) {
        const input = authorizationInput();
        mutate(input);
        expect(() => createCtfAuthorizationOutputsFromCounters(input)).toThrow(
          'Invalid CTF counter input',
        );
      }
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
  test('matches independent contextual authorization JSON, nonce and blinding counters', () => {
    const outputs = createCtfAuthorizationOutputsFromCounters(authorizationInput());
    expect(outputs).toHaveLength(vectors.authorizationCase.outputs.length);
    outputs.forEach((output, index) => {
      const expected = vectors.authorizationCase.outputs[index];
      expect(outputValue(output)).toEqual({
        secret: expected.secretJson,
        r: expected.blindingFactorHex,
        B_: expected.B_,
        id: expected.id,
        amount: expected.amount,
      });
      const condition = JSON.parse(new TextDecoder().decode(output.secret));
      expect(condition[1].nonce).toBe(expected.nonceSecretHex);
      expect(expected.blindingCounter).toBe(expected.nonceCounter + 1);
      const plain = deriveCtfRangeOutputFromCounter({
        seed,
        keysetId: expected.id,
        counter: expected.blindingCounter,
        amount: expected.amount,
      });
      expect(plain.blindedMessage.B_).not.toBe(output.blindedMessage.B_);
    });
  });
  test('authorization retries preserve inputs and always supply an explicit blinding scalar', () => {
    const input = authorizationInput();
    const before = structuredClone(input);
    // Noble may randomize projective coordinates internally. That randomness
    // must not be confused with choosing a random Cashu output secret or scalar.
    const construct = vi.spyOn(OutputData, 'createSingleData');
    try {
      const first = createCtfAuthorizationOutputsFromCounters(input).map(outputValue);
      expect(createCtfAuthorizationOutputsFromCounters(input).map(outputValue)).toEqual(first);
      expect(input).toEqual(before);
      expect(construct).toHaveBeenCalledTimes(4);
      for (const call of construct.mock.calls) {
        expect(typeof call[3]).toBe('bigint');
        expect(call[3]).toBeGreaterThan(0n);
      }
    } finally {
      construct.mockRestore();
    }
  });
  test('rejects sparse authorization amounts instead of returning missing outputs', () => {
    const input = authorizationInput();
    input.amounts = new Array(2);
    expect(() => createCtfAuthorizationOutputsFromCounters(input)).toThrow(CTSError);
  });
  test('recovery rejects changed amount or keyset even when B_ is unchanged', () => {
    const result = createCtfRangeManifestFromCounters(manifestInput());
    const original = result.entries[0].outputData.blindedMessage;
    for (const changed of [
      { ...original, amount: Amount.from(2) },
      { ...original, id: vectors.keysets.offer },
    ]) {
      expect(() =>
        recoverCtfRangeProofs(
          result.entries,
          [changed],
          [{ id: original.id, amount: original.amount, C_: point }],
          () => undefined,
        ),
      ).toThrow('mismatched output metadata');
    }
  });
});
