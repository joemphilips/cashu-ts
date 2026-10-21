import { CTSError } from '../model/Errors';
import type { Keys } from '../model/types/keyset';

import { MAX_KEYSET_DENOMINATIONS } from './limits';

const KEYSET_UNIT_RE = /^[a-z0-9_-]+$/;

/**
 * Reject metadata delimiters in a NUT-02 V2 unit before building the preimage.
 *
 * @internal
 */
export function assertKeysetUnit(unit: string): void {
  if (!unit) {
    throw new CTSError('Cannot compute keyset ID version 01: unit is required.');
  }
  if (!KEYSET_UNIT_RE.test(unit.toLowerCase())) {
    throw new CTSError(`Invalid keyset unit: ${unit}`);
  }
}

/**
 * Bound denomination text before any amount is parsed. A u64 needs at most 20 digits.
 *
 * @internal
 */
export function assertKeysetDenominationLengths(keys: Keys): void {
  for (const amount of Object.keys(keys)) {
    if (amount.length > 20) {
      throw new CTSError('Invalid keyset denomination: exceeds 20 digits');
    }
  }
}

/**
 * Bound mint key-map work and require one distinct public key per denomination.
 *
 * @internal
 */
export function assertKeysetKeyMap(keys: Keys): void {
  const count = Object.keys(keys).length;
  if (count === 0 || count > MAX_KEYSET_DENOMINATIONS) {
    throw new CTSError(`Keyset must contain 1..${MAX_KEYSET_DENOMINATIONS} denominations`);
  }
  assertKeysetDenominationLengths(keys);
  const distinct = new Set(Object.values(keys).map((key) => key.toLowerCase()));
  if (distinct.size !== count) {
    throw new CTSError('Keyset contains duplicate denomination public keys');
  }
}
