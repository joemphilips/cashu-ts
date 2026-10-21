import { describe, expect, test } from 'vitest';

import { assertCanonicalKeysetId, deriveConditionalKeysetId } from '../../src';
import { DUMMY_TEST_KEYS, NUT02_V1_VECTOR1_KEYS } from '../consts';

describe('NUT-CTF conditional keyset id derivation', () => {
  test('matches CDK v2_from_data_conditional vectors', () => {
    const conditionId = '11'.repeat(32);
    expect(
      deriveConditionalKeysetId({
        keys: NUT02_V1_VECTOR1_KEYS.keys,
        input_fee_ppk: 250,
        final_expiry: 1754296607,
        unit: 'sat',
        conditionId,
        outcomeCollectionId: '22'.repeat(32),
      }),
    ).toBe('01ef86b29fae7779271737d657c127f51ecf2b5672251d4e9bacc590607927dfaa');

    expect(
      deriveConditionalKeysetId({
        keys: NUT02_V1_VECTOR1_KEYS.keys,
        unit: 'sat',
        conditionId,
        outcomeCollectionId: 'bb'.repeat(32),
      }),
    ).toBe('01109feab5f222e4f16a3b5805fa95fdf73c22224482feb4e6e0185cce5c28fdb6');

    expect(
      deriveConditionalKeysetId({
        keys: DUMMY_TEST_KEYS.keys,
        final_expiry: 1754296607,
        unit: 'sat',
        conditionId: 'aa'.repeat(32),
        outcomeCollectionId: 'cc'.repeat(32),
      }),
    ).toBe('0170110f06b9bb85565a6746ca5715f877b99db14d87219f6e9030cb529f61e6ea');
  });

  test('rejects malformed condition identifiers', () => {
    expect(() =>
      deriveConditionalKeysetId({
        keys: DUMMY_TEST_KEYS.keys,
        unit: 'sat',
        conditionId: 'not-hex',
        outcomeCollectionId: 'cc'.repeat(32),
      }),
    ).toThrow(/conditionId/);
  });
});

describe('CTF keyset version admission', () => {
  test.each(['00' + 'ab'.repeat(7), '01' + 'cd'.repeat(32)])(
    'accepts canonical secp keyset %s',
    (id) => {
      expect(assertCanonicalKeysetId(id)).toBe(id);
    },
  );

  test.each(['02' + 'ef'.repeat(32), '03' + 'ab'.repeat(32), '01' + 'AB'.repeat(32)])(
    'rejects unsupported or noncanonical keyset %s',
    (id) => {
      expect(() => assertCanonicalKeysetId(id)).toThrow(/canonical secp256k1 NUT-02/);
    },
  );
});

describe('conditional keyset input boundaries', () => {
  const input = {
    keys: NUT02_V1_VECTOR1_KEYS.keys,
    unit: 'sat',
    conditionId: '11'.repeat(32),
    outcomeCollectionId: '22'.repeat(32),
  };

  test.each(['sat|input_fee_ppk:1', 'sat|final_expiry:1', 'sat,1:key', 'sat:extra'])(
    'rejects unit metadata injection: %s',
    (unit) => {
      expect(() => deriveConditionalKeysetId({ ...input, unit })).toThrow(/Invalid keyset unit/);
    },
  );

  test('preserves case-folded conditional units and distinct fee binding', () => {
    const plain = deriveConditionalKeysetId(input);
    expect(deriveConditionalKeysetId({ ...input, unit: 'SAT' })).toBe(plain);
    expect(deriveConditionalKeysetId({ ...input, input_fee_ppk: 1 })).not.toBe(plain);
  });

  test('rejects a long denomination before parsing its amount', () => {
    const [first, second] = Object.values(input.keys);
    for (const amount of ['1'.repeat(21), 'x'.repeat(21)]) {
      expect(() =>
        deriveConditionalKeysetId({ ...input, keys: { 1: first, [amount]: second } }),
      ).toThrow(/exceeds 20 digits/);
    }
    expect(
      deriveConditionalKeysetId({ ...input, keys: { 1: first, ['1'.repeat(20)]: second } }),
    ).toMatch(/^01[0-9a-f]{64}$/);
  });

  test('rejects repeated public keys before computing a conditional id', () => {
    const key = Object.values(input.keys)[0];
    expect(() =>
      deriveConditionalKeysetId({ ...input, keys: { 1: key, 2: key.toUpperCase() } }),
    ).toThrow(/duplicate/i);
  });

  test('bounds conditional key count at the shared 256-denomination limit', () => {
    const keys = Object.fromEntries(
      Array.from({ length: 257 }, (_, i) => [
        String(i + 1),
        '02' + (i + 1).toString(16).padStart(64, '0'),
      ]),
    );
    expect(() => deriveConditionalKeysetId({ ...input, keys })).toThrow(/denominations/i);
    delete keys['257'];
    expect(deriveConditionalKeysetId({ ...input, keys })).toMatch(/^01[0-9a-f]{64}$/);
  });
});
