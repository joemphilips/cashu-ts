import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import { Amount } from '../model/Amount';
import { CTSError } from '../model/Errors';
import type { Keys } from '../model/types/keyset';
import { assertKeysetKeyMap, assertKeysetUnit } from '../utils/keysetValidation';

export interface DeriveConditionalKeysetIdInput {
  keys: Keys;
  input_fee_ppk?: number;
  final_expiry?: number;
  unit: string;
  conditionId: string;
  outcomeCollectionId: string;
}

/**
 * Derives a NUT-CTF conditional keyset id.
 *
 * Mirrors CDK's `Id::v2_from_data_conditional`: build the NUT-02 V2 preimage, append
 * `|condition_id:<hex>|outcome_collection_id:<hex>`, SHA-256 it, and prefix the 32-byte digest with
 * the NUT-02 V2 version byte `01`.
 */
export function deriveConditionalKeysetId(input: DeriveConditionalKeysetIdInput): string {
  validateHex32(input.conditionId, 'conditionId');
  validateHex32(input.outcomeCollectionId, 'outcomeCollectionId');
  assertKeysetUnit(input.unit);
  assertKeysetKeyMap(input.keys);

  let preimage = Object.entries(input.keys)
    .sort(([amountA], [amountB]) => Amount.from(amountA).compareTo(amountB))
    .map(([amount, pubkey]) => `${amount}:${pubkey.toLowerCase()}`)
    .join(',');
  preimage += `|unit:${input.unit.toLowerCase()}`;
  if (input.input_fee_ppk) {
    preimage += `|input_fee_ppk:${input.input_fee_ppk}`;
  }
  if (input.final_expiry) {
    preimage += `|final_expiry:${input.final_expiry}`;
  }
  preimage += `|condition_id:${input.conditionId.toLowerCase()}`;
  preimage += `|outcome_collection_id:${input.outcomeCollectionId.toLowerCase()}`;

  return '01' + bytesToHex(sha256(utf8ToBytes(preimage)));
}

function validateHex32(value: string, name: string): void {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new CTSError(`${name} must be a 64-character hex string`);
  }
}

/**
 * Require a canonical secp256k1 NUT-02 keyset ID.
 *
 * V1 IDs use version `00` and 8 bytes. V2 IDs use version `01` and 33 bytes. Experimental v3 BLS
 * keysets are not supported by the CTF protocol.
 */
export function assertCanonicalKeysetId(keysetId: string, field = 'keyset id'): string {
  if (!/^(00[0-9a-f]{14}|01[0-9a-f]{64})$/.test(keysetId)) {
    throw new CTSError(`${field} must be a canonical secp256k1 NUT-02 keyset id`);
  }
  return keysetId;
}
