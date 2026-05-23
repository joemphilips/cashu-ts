/**
 * Public keys are a dictionary of number and string. The number represents the amount that the key
 * signs for.
 */
export type Keys = { [amount: string]: string };

/**
 * Minimal key carrier shape for low level helpers.
 *
 * Any type with Keyset `id` can be used, including MintKeyset, MintKeys, HasKeysetKeys, Keyset,
 * KeysetCache.
 */
export type HasKeysetId = { id: string };

/**
 * Minimal key carrier shape for low level helpers.
 *
 * Any type with `id`, and `keys` can be used, including MintKeys, KeysetCache and Keyset.
 */
export type HasKeysetKeys = { id: string; keys: Keys };

export interface ConditionalKeysetMetadata {
  /**
   * 32-byte condition id as a 64-character hex string.
   */
  conditionId: string;
  /**
   * Outcome collection label, e.g. "YES" or "ALICE|BOB".
   */
  outcomeCollection: string;
  /**
   * 32-byte outcome collection id as a 64-character hex string.
   */
  outcomeCollectionId: string;
  /**
   * Unix timestamp from the mint's conditional-keyset registry, when known.
   */
  registeredAt?: number;
}

/**
 * NUT-01 Keys API response (/v1/keys)
 */
export type GetKeysResponse = {
  /**
   * Keysets.
   */
  keysets: MintKeys[];
};

/**
 * NUT-02 Keysets API response (/v1/keysets)
 */
export type GetKeysetsResponse = {
  /**
   * Keysets.
   */
  keysets: MintKeyset[];
};

/**
 * A mint keyset.
 */
export type MintKeys = {
  /**
   * Keyset ID.
   */
  id: string;
  /**
   * Unit of the keyset.
   */
  unit: string;
  /**
   * Whether the keyset is active or not.
   */
  active?: boolean;
  /**
   * Input fee for keyset (in ppk)
   */
  input_fee_ppk?: number;
  /**
   * Expiry of the keyset.
   */
  final_expiry?: number;
  /**
   * Public keys are a dictionary of number and string. The number represents the amount that the
   * key signs for.
   */
  keys: Keys;
  /**
   * NUT-CTF conditional keyset metadata. Present only for conditional keysets.
   */
  conditional?: ConditionalKeysetMetadata;
};

/**
 * A mint keyset entry.
 */
export type MintKeyset = {
  /**
   * Keyset ID.
   */
  id: string;
  /**
   * Unit of the keyset.
   */
  unit: string;
  /**
   * Whether the keyset is active or not.
   */
  active: boolean;
  /**
   * Input fee for keyset (in ppk)
   */
  input_fee_ppk?: number;
  /**
   * Expiry of the keyset.
   */
  final_expiry?: number;
  /**
   * NUT-CTF conditional keyset metadata. Present only for conditional keysets.
   */
  conditional?: ConditionalKeysetMetadata;
};

/**
 * Cached view of a keyset.
 *
 * @remarks
 * This is basically MintKeyset, with optional "keys" field for active, verified keysets.
 */
export type KeysetCache = MintKeyset & {
  /**
   * Optional. Keys for this keyset, if available.
   *
   * Present only when keyset is active and keys have been verified.
   */
  keys?: Keys;
};

/**
 * Cached view of a KeyChain.
 *
 * @remarks
 * This is the preferred format for persisting and restoring keychain state. The cache contains
 * keysets for **all** units at the mint. Use `KeyChain.fromCache` (which takes an explicit `unit`)
 * or `wallet.loadMintFromCache` to restore.
 */
export type KeyChainCache = {
  /**
   * Flattened keysets and, optionally, their keys. Contains all units.
   */
  keysets: KeysetCache[];
  /**
   * Mint URL that this cache belongs to.
   */
  mintUrl: string;
  /**
   * Unix timestamp (ms) when the data was fetched from the mint; restoring and re-saving a cache
   * carries the original value over, so it stays usable for TTL / staleness checks. Undefined when
   * the provenance is unknown.
   */
  savedAt?: number;
};
