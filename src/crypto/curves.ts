import { type WeierstrassPoint } from '@noble/curves/abstract/weierstrass.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';

import { CTSError } from '../model/Errors';
import { Bytes, encodeBase64toUint8, hexToNumber, isValidHex } from '../utils';

import { type G1Point, pointFromHexG1 } from './curve_bls';

/**
 * Tagged-union point covering both keyset curves on the wallet output / proof path.
 *
 * - `secp`: secp256k1 compressed point (33 bytes, 66 hex) — v0/v1/v2 keysets.
 * - `blsG1`: BLS12-381 G1 compressed point (48 bytes, 96 hex) — v3 keysets.
 */
export type CurvePoint =
  | { kind: 'secp'; pt: WeierstrassPoint<bigint> }
  | { kind: 'blsG1'; pt: G1Point };

/**
 * Curve family selected by a supported Cashu keyset identifier.
 */
export type KeysetCurve = 'secp256k1' | 'bls12-381';

export function asSecpPoint(pt: WeierstrassPoint<bigint>): CurvePoint {
  return { kind: 'secp', pt };
}

export function asBlsG1Point(pt: G1Point): CurvePoint {
  return { kind: 'blsG1', pt };
}

/**
 * Decode a compressed point hex string to a {@link CurvePoint}, picking the curve by length: 66 hex
 * chars → secp256k1, 96 hex chars → BLS12-381 G1.
 *
 * Lengths are disjoint across the supported curves (secp uncompressed is 130; G2 compressed is
 * 192), so there is no ambiguity.
 */
export function pointFromHexAuto(hex: string): CurvePoint {
  if (hex.length === 66) return { kind: 'secp', pt: secp256k1.Point.fromHex(hex) };
  if (hex.length === 96) return { kind: 'blsG1', pt: pointFromHexG1(hex) };
  throw new CTSError(`Cannot decode point: unexpected hex length ${hex.length}`);
}

export function pointToHex(p: CurvePoint): string {
  return p.pt.toHex(true);
}

/**
 * Decodes the curve selected by a canonical Cashu keyset identifier.
 */
export function decodeKeysetCurve(keysetId: string): KeysetCurve {
  if (/^[A-Za-z0-9+/]{12}$/.test(keysetId)) return 'secp256k1';
  if (!isValidHex(keysetId)) {
    throw new CTSError('Malformed Cashu keyset ID');
  }
  const version = keysetId.slice(0, 2).toLowerCase();
  if (version === '00' && keysetId.length === 16) return 'secp256k1';
  if (
    (version === '01' || version === '02') &&
    (keysetId.length === 16 || keysetId.length === 66)
  ) {
    return version === '02' ? 'bls12-381' : 'secp256k1';
  }
  if (version === '00' || version === '01' || version === '02') {
    throw new CTSError('Malformed Cashu keyset ID');
  }
  throw new CTSError(`Unrecognized Cashu keyset ID version: ${version}`);
}

/**
 * True if `keysetId` is a canonical v3 BLS12-381 keyset id.
 */
export function isBlsKeyset(keysetId: string): boolean {
  try {
    return decodeKeysetCurve(keysetId) === 'bls12-381';
  } catch {
    return false;
  }
}

export const getKeysetIdInt = (keysetId: string): bigint => {
  let keysetIdInt: bigint;
  if (/^[a-fA-F0-9]+$/.test(keysetId)) {
    keysetIdInt = hexToNumber(keysetId) % BigInt(2 ** 31 - 1);
  } else {
    //legacy keyset compatibility
    keysetIdInt = Bytes.toBigInt(encodeBase64toUint8(keysetId)) % BigInt(2 ** 31 - 1);
  }
  return keysetIdInt;
};
