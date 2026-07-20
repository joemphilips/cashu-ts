import { Fp2 } from '@noble/curves/abstract/tower.js';
import { WeierstrassPoint } from '@noble/curves/abstract/weierstrass.js';

/**
 * Immutable, non-negative integer amount value object.
 *
 * Internal representation is bigint. Use factory methods to instantiate.
 *
 * @example
 *
 *     Amount.from('21'); // string
 *     Amount.from(21); // number
 *     Amount.from(21n); // bigint
 *     Amount.zero();
 *     Amount.one();
 */
export declare class Amount {
    private readonly value;
    private constructor();
    /**
     * Parse/normalize supported inputs into an Amount.
     *
     * @throws If input is negative, or if a `number` input exceeds the safe integer limit, or if
     *   input is not a finite integer.
     */
    static from(input: AmountLike): Amount;
    static zero(): Amount;
    static one(): Amount;
    /**
     * Internal canonical value.
     */
    toBigInt(): bigint;
    /**
     * Safe conversion to number.
     *
     * @throws If value exceeds Number.MAX_SAFE_INTEGER.
     */
    toNumber(): number;
    /**
     * Unsafe conversion to number. Precision can be lost above MAX_SAFE_INTEGER.
     */
    toNumberUnsafe(): number;
    /**
     * Canonical decimal representation for logs/JSON string mode.
     */
    toString(): string;
    /**
     * Used by JSON.stringify() to convert Amount to string.
     */
    toJSON(): string;
    add(other: AmountLike): Amount;
    subtract(other: AmountLike): Amount;
    multiplyBy(factor: AmountLike): Amount;
    divideBy(divisor: AmountLike): Amount;
    modulo(divisor: AmountLike): Amount;
    /**
     * Returns `ceil(this × numerator / denominator)` using integer arithmetic only.
     *
     * The default denominator of 100 makes common percentage calculations natural. Use a larger
     * denominator to express fractional percentages without floats.
     *
     * @example
     *
     *     amount.ceilPercent(2); // ceil(2% of amount)
     *     amount.ceilPercent(1, 200); // ceil(0.5% of amount)
     *     amount.ceilPercent(15, 10); // ceil(1.5% of amount)
     *
     * @throws If numerator or denominator are not positive integers.
     */
    ceilPercent(numerator: number, denominator?: number): Amount;
    /**
     * Returns `floor(this × numerator / denominator)` using integer arithmetic only.
     *
     * The natural complement to {@link Amount.ceilPercent} — use when you need the conservative lower
     * bound, e.g. "maximum spendable after reserving fees".
     *
     * @example
     *
     *     amount.floorPercent(98); // floor(98% of amount)
     *     amount.floorPercent(1, 200); // floor(0.5% of amount)
     *
     * @throws If numerator or denominator are not positive integers.
     */
    floorPercent(numerator: number, denominator?: number): Amount;
    /**
     * Returns true if this amount is within the inclusive range [min, max].
     *
     * @example
     *
     *     msats.inRange(data.minSendable, data.maxSendable);
     *
     * @throws If min > max.
     */
    inRange(min: AmountLike, max: AmountLike): boolean;
    /**
     * Clamps this amount to the inclusive range [min, max].
     *
     * @example
     *
     *     fee.clamp(MIN_FEE, tokenAmount);
     *     invoiceAmount.clamp(Amount.from(minSendable), Amount.from(maxSendable));
     *
     * @throws If min > max.
     */
    clamp(min: AmountLike, max: AmountLike): Amount;
    /**
     * Returns `round(this × numerator / denominator)` using integer arithmetic only.
     *
     * Useful for proportional rescaling — currency conversion, capacity checks, partial fills —
     * without floating-point imprecision or overflow risk.
     *
     * Uses the identity: `round(a × b / c) = floor((2 × a × b + c) / (2 × c))`
     *
     * @example
     *
     *     // Scale a 1000-sat amount down by a 3/4 ratio → 750
     *     Amount.from(1000).scaledBy(3, 4);
     *
     *     // Proportional rescale: if neededAmount is too high, shrink estInvAmount to fit
     *     estInvAmount.scaledBy(tokenAmount, neededAmount).subtract(1);
     *
     * @throws If numerator or denominator are zero or negative.
     */
    scaledBy(numerator: AmountLike, denominator: AmountLike): Amount;
    /**
     * Whether this Amount can be safely converted to a number.
     */
    isSafeNumber(): boolean;
    isZero(): boolean;
    equals(other: AmountLike): boolean;
    /**
     * Compares this Amount with another Amount.
     *
     * Defines the natural ordering of Amount values. Useful for sorting and ordering logic.
     *
     * @returns -1 if this < other, 0 if equal, 1 if this > other.
     */
    compareTo(other: AmountLike): -1 | 0 | 1;
    lessThan(other: AmountLike): boolean;
    lessThanOrEqual(other: AmountLike): boolean;
    greaterThan(other: AmountLike): boolean;
    greaterThanOrEqual(other: AmountLike): boolean;
    static min(a: AmountLike, b: AmountLike): Amount;
    static max(a: AmountLike, b: AmountLike): Amount;
    static sum(values: Iterable<AmountLike>): Amount;
    /**
     * Tag this {@link Amount} with a currency unit, returning an {@link AmountWithUnit}.
     */
    withUnit(unit: string): AmountWithUnit;
}

export declare class AmountError extends CTSError {
    constructor(message: string);
}

/**
 * All types that can be converted to an {@link Amount} value object.
 */
export declare type AmountLike = number | bigint | string | Amount;

/**
 * Immutable {@link Amount} paired with a currency unit.
 *
 * Binary ops require matching units (throw {@link AmountWithUnitError} otherwise); scalar ops
 * preserve the unit.
 *
 * Lift via {@link Amount.withUnit} / {@link AmountWithUnit.from}, drop via
 * {@link AmountWithUnit.toAmount}.
 *
 * @example
 *
 *     AmountWithUnit.from(100, 'sat');
 *     Amount.from(21).withUnit('sat');
 */
export declare class AmountWithUnit {
    private readonly _amount;
    readonly unit: string;
    constructor(amount: Amount, unit: string);
    static from(value: AmountLike, unit: string): AmountWithUnit;
    static zero(unit: string): AmountWithUnit;
    static one(unit: string): AmountWithUnit;
    /**
     * Return the underlying unitless {@link Amount}, dropping the unit guard.
     */
    toAmount(): Amount;
    toBigInt(): bigint;
    toNumber(): number;
    /**
     * Unit-bearing canonical form, e.g. `"[sat]: 100"`. Used by `String(x)`, template literals,
     * `console.log`, and any other string-coercion context.
     *
     * Leads with `[` (never a digit, sign, or decimal point) so that `parseInt(String(x))` /
     * `parseFloat(String(x))` return `NaN` even if the unit itself starts with digits — otherwise a
     * unit like `"9999sat"` would let `parseInt` silently extract `9999` from the unit and drop the
     * real amount.
     */
    toString(): string;
    toJSON(): {
        amount: string;
        unit: string;
    };
    /* Excluded from this release type: [Symbol.toPrimitive] */
    isZero(): boolean;
    isSafeNumber(): boolean;
    private requireSameUnit;
    add(other: AmountWithUnit): AmountWithUnit;
    subtract(other: AmountWithUnit): AmountWithUnit;
    equals(other: AmountWithUnit): boolean;
    compareTo(other: AmountWithUnit): -1 | 0 | 1;
    lessThan(other: AmountWithUnit): boolean;
    lessThanOrEqual(other: AmountWithUnit): boolean;
    greaterThan(other: AmountWithUnit): boolean;
    greaterThanOrEqual(other: AmountWithUnit): boolean;
    inRange(min: AmountWithUnit, max: AmountWithUnit): boolean;
    clamp(min: AmountWithUnit, max: AmountWithUnit): AmountWithUnit;
    multiplyBy(factor: AmountLike): AmountWithUnit;
    divideBy(divisor: AmountLike): AmountWithUnit;
    modulo(divisor: AmountLike): AmountWithUnit;
    ceilPercent(numerator: number, denominator?: number): AmountWithUnit;
    floorPercent(numerator: number, denominator?: number): AmountWithUnit;
    scaledBy(numerator: AmountLike, denominator: AmountLike): AmountWithUnit;
    static min(a: AmountWithUnit, b: AmountWithUnit): AmountWithUnit;
    static max(a: AmountWithUnit, b: AmountWithUnit): AmountWithUnit;
    /**
     * Sum a unit-tagged iterable.
     *
     * - If `unit` is provided, every element must match it; the result has that unit. An empty iterable
     *   returns `AmountWithUnit.zero(unit)`.
     * - If `unit` is omitted, the iterable must be non-empty; the unit is inferred from the first
     *   element and every subsequent element must match. An empty iterable throws.
     *
     * @throws {AmountWithUnitError} On unit mismatch, or on empty iterable when `unit` is omitted.
     */
    static sum(values: Iterable<AmountWithUnit>, unit?: string): AmountWithUnit;
}

export declare class AmountWithUnitError extends CTSError {
    constructor(message: string);
}

export declare function asBlsG1Point(pt: G1Point): CurvePoint;

export declare function asSecpPoint(pt: WeierstrassPoint<bigint>): CurvePoint;

/**
 * Assert that a Secret is of the expected kind.
 *
 * @param allowed - NUT-10 Kind(s) allowed.
 * @param secret - The Proof secret.
 * @returns Parsed Secret if the kind matches.
 * @throws If secret kind is not as expected.
 */
export declare function assertSecretKind(allowed: SecretKind | SecretKind[], secret: Secret | string): Secret;

/* Excluded from this release type: assertSigAllInputs */

/**
 * AuthManager.
 *
 * - Owns CAT lifecycle (stores, optional refresh via attached OIDCAuth)
 * - Mints and serves BATs (NUT-22)
 * - Verifies minted BATs (NUT-12 DLEQ on v0/v1/v2; BLS pairing on v3 keysets)
 * - Supplies serialized BATs for 'Blind-auth' and CAT for 'Clear-auth'
 */
export declare class AuthManager implements AuthProvider {
    private readonly mintUrl;
    private readonly req;
    private readonly logger;
    private info?;
    private lockChain?;
    private inflightRefresh?;
    private static readonly MIN_VALID_SECS;
    private oidc?;
    private tokens;
    private pool;
    private desiredPoolSize;
    private maxPerMint;
    private keychain?;
    constructor(mintUrl: string, opts?: AuthManagerOptions);
    /**
     * Attach an OIDCAuth instance so this manager can refresh CATs. Registers a listener to update
     * internal CAT/refresh state on new tokens.
     */
    attachOIDC(oidc: OIDCAuth): this;
    get poolSize(): number;
    get poolTarget(): number;
    get activeAuthKeysetId(): string | undefined;
    get hasCAT(): boolean;
    getCAT(): string | undefined;
    setCAT(cat: string | undefined): void;
    /**
     * Ensure a valid CAT is available (refresh if expiring soon). Returns a token safe to send right
     * now, or undefined if unobtainable.
     */
    ensureCAT(minValidSecs?: number): Promise<string | undefined>;
    private validForAtLeast;
    private updateFromOIDC;
    /**
     * Ensure there are enough BAT tokens (topping up if needed)
     *
     * @param minTokens Minimum tokens needed.
     */
    ensure(minTokens: number): Promise<void>;
    /**
     * Gets a Blind Authentication Token (BAT)
     *
     * @param {method, path} to Call (not used in our implementation)
         * @returns The serialized BAT ready to insert into request header.
         */
     getBlindAuthToken({ method, path, }: {
         method: 'GET' | 'POST';
         path: string;
     }): Promise<string>;
     /**
      * Replace or merge the current BAT pool with previously persisted BATs.
      */
     importPool(proofs: Proof[], mode?: 'replace' | 'merge'): void;
     /**
      * Return a deep-copied snapshot of the current BAT pool (full Proofs, including dleq).
      */
     exportPool(): Proof[];
     /**
      * Extract exp, seconds since epoch, from a JWT access token.
      */
     private parseJwtExpSec;
     /**
      * Simple mutex lock - chains promises in order.
      */
     private withLock;
     /**
      * Initialise mint info and auth keysets/keys as needed.
      */
     private init;
     /**
      * Gets the BAT minting limit: lower of manager limit and Mint’s NUT-22 limit.
      */
     private getBatMaxMint;
     private getActiveKeys;
     /**
      * Mint a batch of BATs using the current CAT if the endpoint is protected by NUT-21.
      */
     private topUp;
    }

    export declare type AuthManagerOptions = {
        /**
         * Hard limit to target when minting BATs in one request. If omitted, we'll read
         * `nuts['22'].bat_max_mint` from the mint "/v1/info" endpoint. Values above the
         * `ABSOLUTE_MAX_PER_MINT` internal hard cap are clamped.
         */
        maxPerMint?: number;
        /**
         * Desired BAT pool size. We’ll top-up to min(desiredPoolSize, maxPerMint) on demand.
         */
        desiredPoolSize?: number;
        /**
         * Custom request fn (e.g. for tests or host env).
         */
        request?: RequestFn;
        /**
         * Logger.
         */
        logger?: Logger;
    };

    export declare interface AuthProvider {
        getBlindAuthToken(input: {
            method: 'GET' | 'POST';
            path: string;
        }): Promise<string>;
        ensure?(minTokens: number): Promise<void>;
        getCAT(): string | undefined;
        setCAT(cat: string | undefined): void;
        /**
         * Ensure a valid CAT is available, refreshing if expiring soon. Return a token that is safe to
         * send right now, or undefined if not obtainable.
         */
        ensureCAT?(minValiditySec?: number): Promise<string | undefined>;
    }

    /**
     * Preview of a batched mint transaction created by prepareBatchMint.
     *
     * @remarks
     * Contains JSON-unsafe values (`bigint`, `Uint8Array`). Not intended for direct serialization.
     */
    export declare interface BatchMintPreview<TQuote extends Pick<MintQuoteBaseResponse, 'quote' | 'pubkey'> = MintQuoteBaseResponse> {
        method: string;
        /**
         * Batch mint payload to be sent to the mint.
         */
        payload: BatchMintRequest;
        /**
         * Blinding data required to construct proofs (consolidated across all quotes).
         */
        outputData: OutputDataLike[];
        /**
         * Keyset ID used to prepare the outputs.
         */
        keysetId: string;
        /**
         * Mint Quote objects included in this batch.
         */
        quotes: TQuote[];
    }

    /**
     * Payload that needs to be sent to the mint when requesting a NUT-29 batched mint.
     */
    export declare type BatchMintRequest = {
        /**
         * Array of Quote IDs received from the mint.
         */
        quotes: string[];
        /**
         * Array of amounts that shall be minted per quote id.
         */
        quote_amounts: Amount[];
        /**
         * Outputs (blinded messages) to be signed by the mint.
         */
        outputs: SerializedBlindedMessage[];
        /**
         * Optional. Signatures for the Public key the quote is locked to (NUT-20) (same order as quote
         * ids). If some quotes are unlocked null is expected. Can be omitted if all quotes are unlocked.
         */
        signatures?: Array<string | null>;
    };

    /**
     * Batch verify many proofs via a single multi-pairing.
     *
     * Equation: `e(Σ rᵢ·Cᵢ, G2) == Π_{k2} e(Σ_{i:K2ᵢ=k2} rᵢ·Yᵢ, k2)`.
     *
     * @remarks
     * The per-proof weights `rᵢ` are what makes this safe: without them, an attacker holding one signed
     * `C' = a·(Y₁+Y₂)` can pick any C₁ and present `(C₁, secret₁), (C' − C₁, secret₂)` as two valid
     * proofs from a single signature. Independent weights reduce that attack to needing `C₁ = a·Y₁`
     * (i.e. a real signature) unless `r₁ = r₂` (≈ 2⁻²⁵⁵).
     *
     * The weights are public and deterministically derived (security does not rely on secrecy). The
     * Fiat-Shamir transcript binds each `rᵢ` to `(Cᵢ, K2ᵢ, secretᵢ)` for the whole batch, so an
     * attacker cannot choose proofs in adversarial relation to the weights without first fixing the
     * proofs (which in turn fixes the weights). Knowing the derivation does not help.
     *
     * Returns true iff every individual `e(Cᵢ, G2) == e(Yᵢ, K2ᵢ)` holds.
     */
    export declare function batchVerifyUnblindedSignatureBls(items: Array<{
        K2: G2Point;
        C: G1Point;
        secret: Uint8Array;
    }>): boolean;

    /* Excluded from this release type: bigIntStringify */

    /**
     * Blind a secret message.
     *
     * @param secret A UTF-8 byte encoded string.
     * @param r Optional. Deterministic blinding scalar to use (eg: for testing / seeded)
     * @returns A RawBlindedMessage: {B_, r, secret}
     */
    export declare function blindMessage(secret: Uint8Array, r?: bigint): RawBlindedMessage;

    /**
     * Multiplicative blinding for BLS12-381 v3 keysets. Y = hashToCurveG1(secret) B_ = Y * r.
     *
     * @param secret UTF-8 byte encoded secret (matches Nutshell `msg`).
     * @param r Optional deterministic blinding scalar.
     */
    export declare function blindMessageBls(secret: Uint8Array, r?: bigint): RawBlindedMessage;

    export declare type BlindSignature = {
        C_: WeierstrassPoint<bigint>;
        id: string;
    };

    /**
     * BLS12-381 scalar field order (Fr). Distinct from secp256k1's `n`.
     *
     * Used for the NUT-13 HMAC reduction on v3 keysets and for the modular inverse of `r` during
     * wallet-side unblinding. Sourced from `@noble/curves/bls12-381` so it tracks the library; verified
     * equal to the locked constant in Nutshell PR #999 / RFC 9380:
     * `52435875175126190479447740508185965837690552500527637822603658699938581184513`.
     */
    export declare const BLS_FR_ORDER: bigint;

    /**
     * G2 generator used for the pairing equality `e(C, G2_gen) == e(Y, K2)`.
     *
     * Sourced from `@noble/curves/bls12-381` (`bls12_381.G2.Point.BASE`); verified byte-for-byte equal
     * to Nutshell PR #999's hardcoded `_G2_HEX` (compressed, 96 bytes / 192 hex chars).
     */
    export declare const BLS_G2_GENERATOR: WeierstrassPoint<Fp2>;

    /**
     * Domain-separation tag for `hashToCurveG1` on v3 keysets.
     *
     * RFC 9380 random-oracle suite for BLS12-381 G1 (`BLS12381G1_XMD:SHA-256_SSWU_RO_`) with a
     * Cashu-specific prefix so a v3 wallet's `Y = hashToCurveG1(secret)` matches the mint's exactly.
     *
     * Source: Nutshell PR #999 (`cashu/core/crypto/bls.py`).
     */
    export declare const BLS_HASH_TO_CURVE_DST = "CASHU_BLS12_381_G1_XMD:SHA-256_SSWU_RO_";

    /* Excluded from this release type: buildLegacyP2PKSigAllMessage */

    /* Excluded from this release type: buildP2PKSigAllMessage */

    export declare type CancellerLike = SubscriptionCanceller | Promise<SubscriptionCanceller>;

    /**
     * Enum for the state of a proof.
     */
    export declare const CheckStateEnum: {
        readonly UNSPENT: "UNSPENT";
        readonly PENDING: "PENDING";
        readonly SPENT: "SPENT";
    };

    export declare type CheckStateEnum = (typeof CheckStateEnum)[keyof typeof CheckStateEnum];

    /**
     * Payload that needs to be sent to the mint when checking for spendable proofs.
     */
    export declare type CheckStatePayload = {
        /**
         * The Y = hash_to_curve(secret) of the proofs to be checked.
         */
        Ys: string[];
    };

    /**
     * Response when checking proofs if they are spendable. Should not rely on this for receiving, since
     * it can be easily cheated.
     */
    export declare type CheckStateResponse = {
        states: ProofState[];
    };

    export declare type CompleteMeltOptions = {
        preferAsync?: boolean;
        extraPayload?: Record<string, unknown>;
    };

    /**
     * Computes the SHA-256 hash of a UTF-8 message string.
     *
     * @param message To hash (UTF-8 encoded before hashing).
     * @param asHex Optional: True returns a hex-encoded hash string; otherwise returns raw bytes.
     * @returns SHA-256 hash as raw bytes or hex string, depending on `asHex`.
     */
    export declare function computeMessageDigest(message: string): Uint8Array;

    export declare function computeMessageDigest(message: string, asHex: false): Uint8Array;

    export declare function computeMessageDigest(message: string, asHex: true): string;

    export declare interface ConditionalKeysetInfo {
        id: string;
        unit: string;
        active: boolean;
        input_fee_ppk?: number;
        final_expiry?: number;
        condition_id: string;
        outcome_collection: string;
        outcome_collection_id: string;
        registered_at?: number;
    }

    export declare interface ConditionalKeysetMetadata {
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

    export declare interface ConditionalKeysetsResponse {
        keysets: ConditionalKeysetInfo[];
        next_cursor?: string;
        complete?: boolean;
    }

    export declare interface ConditionalSwapOptions {
        /**
         * Conditional keyset to preserve. If omitted, every input proof must share one keyset id and that
         * id is used.
         */
        keysetId?: string;
        inputs: ProofLike[];
        outputs: ConditionalSwapOutputGroup[];
    }

    export declare interface ConditionalSwapOutputGroup {
        label: string;
        kind: 'random' | 'p2pk';
        amount: AmountLike;
        p2pk?: P2PKOptions;
        customSplit?: AmountLike[];
    }

    export declare interface ConditionalSwapPreview {
        keysetId: string;
        inputs: Proof[];
        outputDataByLabel: Record<string, OutputData[]>;
    }

    /**
     * Outputs messages to the console based on the specified log level.
     *
     * Supports placeholder substitution in messages (e.g., `{key}`) using values from the optional
     * `context` object. Context keys not used in substitution are appended to the output as additional
     * data. Each log message is prefixed with the log level in square brackets (e.g., `[INFO]`).
     *
     * @example Const logger = new ConsoleLogger(LogLevel.DEBUG); logger.info('User {username} logged
     * in', { username: 'alice', ip: '127.0.0.1' }); // Output: [INFO] User alice logged in { ip:
     * "127.0.0.1" }
     */
    export declare class ConsoleLogger implements Logger {
        private minLevel;
        constructor(minLevel?: LogLevel);
        private should;
        private method;
        private header;
        private flattenContext;
        private emit;
        error(msg: string, ctx?: Record<string, unknown>): void;
        warn(msg: string, ctx?: Record<string, unknown>): void;
        info(msg: string, ctx?: Record<string, unknown>): void;
        debug(msg: string, ctx?: Record<string, unknown>): void;
        trace(msg: string, ctx?: Record<string, unknown>): void;
        log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
    }

    export declare function constructUnblindedSignature(blindSig: BlindSignature, r: bigint, secret: Uint8Array, key: WeierstrassPoint<bigint>): UnblindedSignature;

    export declare function constructUnblindedSignatureBls(blindSig: BlindSignature, r: bigint, secret: Uint8Array): UnblindedSignature;

    /**
     * Usable counters in range is [start, start+count-1]
     *
     * @example // Start: 5, count: 3 => 5,6,7.
     */
    export declare interface CounterRange {
        start: number;
        count: number;
    }

    export declare interface CounterSource {
        /**
         * Reserve n counters for a keyset.
         *
         * N may be 0. In that case the call MUST NOT mutate state and MUST return { start: currentNext,
         * count: 0 }, effectively a read only peek of the cursor.
         */
        reserve(keysetId: string, n: number): Promise<CounterRange>;
        /**
         * Monotonic bump, ensure the next counter is at least minNext.
         */
        advanceToAtLeast(keysetId: string, minNext: number): Promise<void>;
        /**
         * Optional introspection.
         */
        snapshot?(): Promise<Record<string, number>>;
        /**
         * Optional hard set, useful for tests or migrations.
         */
        setNext?(keysetId: string, next: number): Promise<void>;
    }

    /**
     * High-level helper to create a fully authenticated wallet session.
     *
     * @remarks
     * Like a dependency injector, it wires AuthManager->Mint->OIDCAuth->Wallet in the correct order.
     * Wallet is returned ready to use.
     * @param mintUrl URL of the mint to connect to.
     * @param options.authPool Optional. Desired BAT pool size and per-request mint cap. Both
     *   desiredPoolSize and maxPerMint on the AuthManager will be set to this value. Defaults to 10.
     * @param options.oidc Optional. Options for OIDCAuth (scope, clientId, logger, etc.)
     * @returns {mint, auth, oidc, wallet} — hydrated, ready to use.
         * @throws If mint does not require authentication.
         */
     export declare function createAuthWallet(mintUrl: string, options?: {
         authPool?: number;
         oidc?: OIDCAuthOptions;
         logger?: Logger;
     }): Promise<{
         mint: Mint;
         auth: AuthManager;
         oidc: OIDCAuth;
         wallet: Wallet;
     }>;

     export declare function createBlindSignature(B_: WeierstrassPoint<bigint>, privateKey: Uint8Array, id: string): BlindSignature;

     /**
      * Mint-side blind signing: C_ = B_ * a where `a` is the mint's per-amount secret.
      *
      * @param privateKey 32-byte mint secret (big-endian); reduced mod Fr.
      */
     export declare function createBlindSignatureBls(B_: G1Point, privateKey: Uint8Array, id: string): BlindSignature;

     /**
      * !!! WARNING !!! Not recommended for production use, due to non-constant time operations See:
      * https://github.com/cashubtc/cashu-crypto-ts/pull/2 for more details See:
      * https://en.wikipedia.org/wiki/Timing_attack for information about timing attacks.
      */
     export declare const createDLEQProof: (B_: WeierstrassPoint<bigint>, a: Uint8Array) => DLEQ;

     /**
      * Create a shared in-memory {@link CounterSource}.
      *
      * Use this when multiple {@link Wallet} instances share the same seed and must allocate
      * deterministic outputs without overlapping counter ranges. Pass the returned source to each wallet
      * via the `counterSource` option.
      *
      * The source is memory-only — counters do not survive page reloads. Subscribe to
      * {@link WalletEvents.countersReserved | wallet.on.countersReserved} to persist counter state to
      * your own storage.
      *
      * @param initial - Optional seed values (`{ [keysetId]: nextCounter }`).
      */
     export declare function createEphemeralCounterSource(initial?: Record<string, number>): CounterSource;

     /**
      * Create an HTLC hash/preimage pair.
      *
      * @param preimage - Optional. Preimage to use (Default: random preimage)
      * @returns Hash and preimage pair.
      * @throws If the preimage supplied is not a 64-char hex string.
      */
     export declare function createHTLCHash(preimage?: string): {
         hash: string;
         preimage: string;
     };

     /**
      * Create an HTLC secret.
      *
      * @remarks
      * Use `createHTLCHash()` for hash creation.
      * @param hash - The HTLC hash to add to Secret.data.
      * @param tags - Optional. Additional P2PK tags.
      */
     export declare function createHTLCsecret(hash: string, tags?: string[][]): string;

     /**
      * Creates new mint keys.
      *
      * @param pow2height Number of powers of 2 to create (Max 65).
      * @param seed (Optional). Seed for key derivation.
      * @param options.expiry (optional) expiry of the keyset.
      * @param options.input_fee_ppk (optional) Input fee for keyset (in ppk)
      * @param options.unit (optional) the unit of the keyset. Default: sat.
      * @param options.versionByte (optional) version of the keyset ID. Default: 1.
      * @returns KeysetPair object.
      * @throws If keyset versionByte is not valid.
      */
     export declare function createNewMintKeys(pow2height: IntRange<0, 65>, seed?: Uint8Array, options?: {
         expiry?: number;
         input_fee_ppk?: number;
         unit?: string;
         versionByte?: number;
     }): KeysetPair;

     /**
      * Create a P2PK secret.
      *
      * @param pubkey - The pubkey to add to Secret.data.
      * @param tags - Optional. Additional P2PK tags.
      * @throws If the sigflag is unrecognised.
      */
     export declare function createP2PKsecret(pubkey: string, tags?: string[][]): string;

     /**
      * Creates a random blinded message.
      *
      * @remarks
      * The secret is a UTF-8 encoded 64-character lowercase hex string, generated from 32 random bytes
      * as recommended by NUT-00.
      * @returns A RawBlindedMessage: {B_, r, secret}
      */
     export declare function createRandomRawBlindedMessage(): RawBlindedMessage;

     export declare function createRandomSecretKey(): Uint8Array<ArrayBufferLike>;

     /**
      * Create a NUT-10 well known secret.
      *
      * @param kind - The secret kind (P2PK, HTLC, etc)
      * @param pubkey - The pubkey to add to Secret.data.
      * @param tags - Optional. Additional P2PK tags.
      */
     export declare function createSecret(kind: SecretKind, data: string, tags?: string[][]): string;

     /* Excluded from this release type: createSecretAndBlindingFactorDeriver */

     export declare interface CtfConditionInfo {
         condition_id: string;
         threshold?: number;
         tags?: string[][];
         announcements?: string[];
         keysets: Record<string, string>;
         partitions?: Array<{
             partition?: string[];
             collateral?: string;
             parent_collection_id?: string;
             keysets?: Record<string, string>;
             registered_at?: number;
         }>;
         registered_at?: number;
         condition_type?: string;
         lo_bound?: number;
         hi_bound?: number;
         precision?: number;
         attestation?: {
             status: string;
             winning_outcome?: string | null;
             attested_at?: number | null;
         };
     }

     export declare interface CtfConvertRequest {
         condition_id: string;
         parent_collection_id?: string;
         inputs: Record<string, Proof[]>;
         outputs: Record<string, SerializedBlindedMessage[]>;
     }

     export declare interface CtfConvertResponse {
         signatures: Record<string, SerializedBlindedSignature[]>;
     }

     /**
      * Base error for errors raised by cashu-ts itself.
      */
     export declare class CTSError extends Error {
         readonly cause?: unknown;
         constructor(message: string, options?: {
             cause?: unknown;
         });
     }

     /**
      * Tagged-union point covering both keyset curves on the wallet output / proof path.
      *
      * - `secp`: secp256k1 compressed point (33 bytes, 66 hex) — v0/v1/v2 keysets.
      * - `blsG1`: BLS12-381 G1 compressed point (48 bytes, 96 hex) — v3 keysets.
      */
     export declare type CurvePoint = {
         kind: 'secp';
         pt: WeierstrassPoint<bigint>;
     } | {
         kind: 'blsG1';
         pt: G1Point;
     };

     /**
      * Decodes an encoded cashu payment request string into a {@link PaymentRequest}.
      */
     export declare function decodePaymentRequest(paymentRequest: string): PaymentRequest_2;

     /* Excluded from this release type: dedupeP2PKPubkeys */

     /* Excluded from this release type: deriveBatchWeights */

     /**
      * @deprecated Use {@link deriveSecretAndBlindingFactor} to derive both values together.
      */
     export declare const deriveBlindingFactor: (seed: Uint8Array, keysetId: string, counter: number) => Uint8Array;

     /**
      * Derives a NUT-CTF conditional keyset id.
      *
      * Mirrors CDK's `Id::v2_from_data_conditional`: build the NUT-02 V2 preimage, append
      * `|condition_id:<hex>|outcome_collection_id:<hex>`, SHA-256 it, and prefix the 32-byte digest with
      * the NUT-02 V2 version byte `01`.
      */
     export declare function deriveConditionalKeysetId(input: DeriveConditionalKeysetIdInput): string;

     export declare interface DeriveConditionalKeysetIdInput {
         keys: Keys;
         input_fee_ppk?: number;
         final_expiry?: number;
         unit: string;
         conditionId: string;
         outcomeCollectionId: string;
     }

     declare type DerivedSecretAndBlindingFactor = {
         blindingFactor: Uint8Array;
         secret: Uint8Array;
     };

     /**
      * Returns the keyset id of a set of keys.
      *
      * @param keys Keys object to derive keyset id from.
      * @param options.expiry (optional) expiry of the keyset.
      * @param options.input_fee_ppk (optional) Input fee for keyset (in ppk)
      * @param options.unit (optional) the unit of the keyset. Default: sat.
      * @param options.versionByte (optional) version of the keyset ID. Default: 1.
      * @param options.isDeprecatedBase64 (optional) version of the keyset ID. Default: false.
      * @returns Keyset id of the keys.
      * @throws If keyset versionByte is not valid.
      */
     export declare function deriveKeysetId(keys: Keys, options?: DeriveKeysetIdOptions): string;

     export declare type DeriveKeysetIdOptions = {
         expiry?: number;
         input_fee_ppk?: number;
         unit?: string;
         versionByte?: number;
         isDeprecatedBase64?: boolean;
     };

     /**
      * Blind a sequence of public keys using ECDH derived tweaks, one tweak per slot.
      *
      * @remarks
      * Security note: "Ehex" must never be reused. Doing so would create linkability and leak privacy.
      * The only exception is for SIG_ALL proofs, as all secret tags must match.
      *
      * This is the Sender side API.
      * @param pubkeys Ordered SEC1 compressed pubkeys, [data, ...pubkeys, ...refund]
      * @param eBytes Optional. Fixed ephemeral secret key to use (eg for SIG_ALL / testing)
      * @returns Blinded pubkeys in the same order, and Ehex as SEC1 compressed hex, 33 bytes.
      * @throws If a blinded key is at infinity.
      */
     export declare function deriveP2BKBlindedPubkeys(pubkeys: string[], eBytes?: Uint8Array): {
         blinded: string[];
         Ehex: string;
     };

     /**
      * Derive a blinded secret key per NUT-28.
      *
      * Unblinds the pubkey (P = P_ - r·G), verifies x-coord against the naturalPub x(P) == x(p·G), then
      * choose skStd = (p + rᵢ) mod n if parity(P) == parity(p·G), otherwise skNeg = (-p + rᵢ) mod n.
      * Returns skStd if no blindPubkey is provided.
      *
      * @remarks
      * Security note, this operates on long lived secrets. JavaScript BigInt arithmetic in a JIT is not
      * guaranteed constant time. Do not expose this function on a server that holds private keys.
      * @param privkey Unblinded private key (p), hex or bigint.
      * @param rBlind Blinding scalar (r), hex or bigint.
      * @param blindPubkey Optional. Blinded pubkey (P_) to match, 33 byte hex.
      * @param naturalPub Optional. Pubkey calculated from private key (P = p·G), 33 byte hex.
      * @returns Derived blinded secret key as 64 char hex.
      * @throws If inputs are out of range, or the derived key would be zero.
      */
     export declare function deriveP2BKSecretKey(privkey: string | bigint, rBlind: string | bigint, blindPubkey?: Uint8Array, naturalPub?: Uint8Array): string | null;

     /**
      * Derive blinded secret keys that correspond to given P2BK blinded pubkeys.
      *
      * Pubkeys are processed in order, for a proof that is [data, ...pubkeys, ...refund]. Private key
      * order does not matter.
      *
      * @remarks
      * Security note, this operates on long lived secrets. JavaScript BigInt arithmetic in a JIT is not
      * guaranteed constant time. Do not expose this function on a server that holds private keys.
      *
      * This is the Receiver side API.
      * @param Ehex Ephemeral public key (E) as SEC1 hex.
      * @param privateKey Secret key or array of secret keys, hex.
      * @param blindPubKey Blinded public key or array of blinded public keys, hex.
      * @returns Array of derived secret keys as 64 char hex.
      */
     export declare function deriveP2BKSecretKeys(Ehex: string, privateKey: string | string[], blindPubKey: string | string[]): string[];

     /**
      * @deprecated Use {@link deriveSecretAndBlindingFactor} to derive both values together.
      */
     export declare const deriveSecret: (seed: Uint8Array, keysetId: string, counter: number) => Uint8Array;

     /**
      * Derives the deterministic secret and blinding factor for one counter.
      *
      * @remarks
      * This is the preferred NUT-13 derivation API because deterministic output construction needs both
      * values for the same seed, keyset, and counter. For deprecated BIP-32 keysets, deriving both
      * values together is faster because it avoids repeating the shared path derivation common to the
      * secret and blinding factor.
      *
      * The function supports legacy base64 keyset IDs, deprecated hex keyset IDs with the `00` prefix,
      * and modern hex keyset IDs with the `01` prefix.
      * @param seed - Wallet seed used for deterministic derivation.
      * @param keysetId - Mint keyset ID that selects the derivation method.
      * @param counter - Deterministic counter for the output.
      * @returns The derived secret bytes and blinding factor bytes.
      * @throws {@link CTSError} If the keyset ID version is unsupported or if derivation produces an
          *   invalid private key.
          */
      export declare function deriveSecretAndBlindingFactor(seed: Uint8Array, keysetId: string, counter: number): {
          blindingFactor: Uint8Array;
          secret: Uint8Array;
      };

      export declare function deserializeMintKeys(serializedMintKeys: SerializedMintKeys): RawMintKeys;

      /**
       * Deserializes proofs from JSON back into typed {@link Proof} objects, restoring `amount` as
       * `bigint` without silent precision loss.
       *
       * - Pass a `string[]` (individual proof JSON strings) when reading from NutZap proof tags or a
       *   database.
       * - Pass a `string` (a JSON array) when reading from a single stored blob e.g. localStorage.
       * - Pass a `ProofLike[]` of already-parsed proof objects for legacy data or database rows.
       *
       * @example
       *
       *     // NutZap proof tags
       *     const proofs = deserializeProofs(
       *       event.tags.filter((t) => t[0] === 'proof').map((t) => t[1]),
       *     );
       *
       *     // localStorage — pass the raw string, no JSON.parse needed
       *     const proofs = deserializeProofs(localStorage.getItem('proofs') ?? '[]');
       */
      export declare function deserializeProofs(json: string | string[] | ProofLike[]): Proof[];

      export declare type DeviceStartResponse = {
          device_code: string;
          user_code: string;
          verification_uri: string;
          verification_uri_complete?: string;
          interval?: number;
          expires_in?: number;
      };

      export declare type DigestInput = Uint8Array | string;

      export declare type DLEQ = {
          s: Uint8Array;
          e: Uint8Array;
          r?: bigint;
      };

      export declare type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc['length']]>;

      /**
       * Find the private key that can sign for a given compressed public key.
       *
       * @param pubkey Compressed SEC1 public key (33 bytes, hex-encoded) to match against.
       * @param privkeys One or more candidate private keys (hex-encoded).
       * @returns The matching private key hex string.
       * @throws If no candidate key derives to the expected pubkey.
       */
      export declare function findSigningKey(pubkey: string, privkeys: string | string[]): string;

      export declare type G1Point = WeierstrassPoint<bigint>;

      export declare type G2Point = WeierstrassPoint<Fp2>;

      export declare interface GetConditionalKeysetsQuery {
          catalogue?: number;
          since?: number;
          limit?: number;
          active?: boolean;
          cursor?: string;
      }

      export declare interface GetConditionsQuery {
          since?: number;
          limit?: number;
          status?: string[];
      }

      export declare interface GetConditionsResponse {
          conditions: CtfConditionInfo[];
      }

      /**
       * Get data field value from a secret.
       *
       * @param secret - The Proof secret.
       * @returns - SecretData.data.
       */
      export declare function getDataField(secret: Secret | string): string;

      /**
       * Helper function to decode cashu tokens into an object.
       *
       * @param token An encoded cashu token (cashuB...)
       * @param keysets Array of full keyset ID strings, eg: from `KeyChain.getAllKeysetIds()`
       * @returns Cashu token object.
       */
      export declare function getDecodedToken(tokenString: string, keysetIds: readonly string[]): Token;

      /**
       * Decodes a raw binary token (`craw` + `B` + CBOR) into a {@link Token}.
       */
      export declare function getDecodedTokenBinary(bytes: Uint8Array): Token;

      /**
       * Encodes a {@link Token} as a cashu token string.
       */
      declare function getEncodedToken(token: Token, opts?: {
          removeDleq?: boolean;
      }): string;
      export { getEncodedToken }
      export { getEncodedToken as getEncodedTokenV4 }

      /**
       * Encodes a {@link Token} as a raw binary token (`craw` + `B` + CBOR).
       */
      export declare function getEncodedTokenBinary(token: Token): Uint8Array;

      /**
       * V3 (BLS) mint pubkey: K2 = a · G2_gen, compressed to 96 bytes.
       *
       * The 32-byte private key is interpreted as a big-endian scalar and reduced mod the BLS Fr order
       * (same convention as the mint-side blind signer for v3).
       */
      export declare function getG2PubKeyFromPrivKey(privKey: Uint8Array): Uint8Array<ArrayBufferLike>;

      /**
       * Get preimage from a witness if present.
       *
       * @param witness From a Proof.
       * @returns Preimage if present.
       */
      export declare function getHTLCWitnessPreimage(witness: Proof['witness']): string | undefined;

      /**
       * Response from mint at /info endpoint.
       */
      export declare type GetInfoResponse = {
          name: string;
          pubkey: string;
          version: string;
          description?: string;
          description_long?: string;
          icon_url?: string;
          contact: MintContactInfo[];
          nuts: {
              '4': {
                  methods: SwapMethod[];
                  disabled: boolean;
              };
              '5': {
                  methods: SwapMethod[];
                  disabled: boolean;
              };
              '7'?: {
                  supported: boolean;
              };
              '8'?: {
                  supported: boolean;
              };
              '9'?: {
                  supported: boolean;
              };
              '10'?: {
                  supported: boolean;
              };
              '11'?: {
                  supported: boolean;
              };
              '12'?: {
                  supported: boolean;
              };
              '14'?: {
                  supported: boolean;
              };
              '15'?: {
                  methods: MPPMethod[];
              };
              '17'?: {
                  supported: WebSocketSupport[];
              };
              '19'?: {
                  ttl: number | null;
                  cached_endpoints: Array<{
                      method: 'GET' | 'POST';
                      path: string;
                  }>;
              };
              '20'?: {
                  supported: boolean;
              };
              '21'?: {
                  openid_discovery: string;
                  client_id: string;
                  protected_endpoints?: Array<{
                      method: 'GET' | 'POST';
                      path: string;
                  }>;
              };
              '22'?: {
                  bat_max_mint: number;
                  protected_endpoints: Array<{
                      method: 'GET' | 'POST';
                      path: string;
                  }>;
              };
              '29'?: Nut29Info;
              CTF?: {
                  supported: boolean;
                  dlc_version?: string;
                  vesting_period?: number;
                  default_keyset_creation?: string;
                  registration_fees?: Array<{
                      unit: string;
                      registration_fee_base: number;
                      registration_fee_per_keyset: number;
                  }>;
                  conditional_keyset_catalogue?: {
                      version: number;
                      max_page_size: number;
                  };
              };
          };
          motd?: string;
      };

      /**
       * Returns the amounts in the keyset sorted by the order specified.
       *
       * @param keyset To search in.
       * @param order Order to sort the amounts in.
       * @returns The amounts in the keyset sorted by the order specified.
       */
      export declare function getKeysetAmounts(keyset: Keys, order?: 'asc' | 'desc'): Amount[];

      export declare const getKeysetIdInt: (keysetId: string) => bigint;

      /**
       * NUT-02 Keysets API response (/v1/keysets)
       */
      export declare type GetKeysetsResponse = {
          /**
           * Keysets.
           */
          keysets: MintKeyset[];
      };

      /**
       * NUT-01 Keys API response (/v1/keys)
       */
      export declare type GetKeysResponse = {
          /**
           * Keysets.
           */
          keysets: MintKeys[];
      };

      /**
       * Returns the expected witness public keys from a NUT-11 P2PK secret.
       *
       * @remarks
       * Does not tell you the pathway (Locktime or Refund MultiSig), only the keys that CAN currently
       * sign. If no keys are returned, the proof is unlocked or expired with no refund path.
       * @param secretStr - The NUT-11 P2PK secret.
       * @returns Array of public keys or empty array.
       * @throws If the secret is malformed or not P2PK.
       */
      export declare function getP2PKExpectedWitnessPubkeys(secretStr: string | Secret): string[];

      /**
       * Returns the sigflag from a NUT-11 P2PK secret.
       *
       * @param secretStr - The NUT-11 P2PK secret.
       * @returns The sigflag (`'SIG_INPUTS'` or `'SIG_ALL'`).
       * @throws If secret is not P2PK, or if the sigflag tag contains an unrecognised value.
       */
      export declare function getP2PKSigFlag(secretStr: string | Secret): SigFlag;

      /**
       * Gets witness signatures as an array.
       *
       * @param witness From Proof.
       * @returns Array of witness signatures.
       */
      export declare function getP2PKWitnessSignatures(witness: Proof['witness']): string[];

      export declare function getPubKeyFromPrivKey(privKey: Uint8Array): Uint8Array<ArrayBufferLike>;

      /**
       * Get the SecretData payload (second element) of a Secret.
       *
       * @param secret - The Proof secret.
       */
      export declare function getSecretData(secret: Secret | string): SecretData;

      /**
       * Get the kind (first element) of a Secret.
       *
       * @param secret - The Proof secret.
       */
      export declare function getSecretKind(secret: Secret | string): SecretKind;

      /**
       * Get the values of a tag by key, excluding the key itself.
       *
       * @param secret - The Proof secret.
       * @param key - Tag key to lookup.
       * @returns - Array of Tag values or undefined if not present.
       */
      export declare function getTag(secret: Secret | string, key: string): string[] | undefined;

      /**
       * Get the first scalar value of a tag parsed as base-10 integer, or undefined.
       *
       * @param secret - The Proof secret.
       * @param key - Tag key to lookup.
       * @returns - Tag value as an integer, undefined if not present or invalid.
       */
      export declare function getTagInt(secret: Secret | string, key: string): number | undefined;

      /**
       * Get all tags from a secret.
       *
       * @param secret - The Proof secret.
       * @returns - Array of tag arrays.
       */
      export declare function getTags(secret: Secret | string): string[][];

      /**
       * Get the first scalar value of a tag as a string, or undefined if missing.
       *
       * @param secret - The Proof secret.
       * @param key - Tag key to lookup.
       * @returns - Tag value or undefined if not present.
       */
      export declare function getTagScalar(secret: Secret | string, key: string): string | undefined;

      /**
       * Returns the metadata of a cashu token.
       *
       * @param token An encoded cashu token (cashuB...)
       * @returns Token metadata.
       */
      export declare function getTokenMetadata(token: string): TokenMetadata;

      /**
       * Returns the set of unique public keys that have produced a valid Schnorr signature for a given
       * message.
       *
       * @param signatures - The Schnorr signature(s) (hex-encoded).
       * @param message - The message to verify.
       * @param pubkeys - The Cashu P2PK public key(s) (hex-encoded, X-only or with 02/03 prefix) to
       *   check.
       * @returns Array of public keys who validly signed, duplicates removed.
       */
      export declare function getValidSigners(signatures: string[], message: string, pubkeys: string[]): string[];

      /**
       * Checks if the provided amount is in the keyset.
       *
       * @param amount Amount to check.
       * @param keyset To search in.
       * @returns True if the amount is in the keyset, false otherwise.
       */
      export declare function hasCorrespondingKey(amount: AmountLike, keyset: Keys): boolean;

      export declare function hash_e(pubkeys: Array<WeierstrassPoint<bigint>>): Uint8Array;

      export declare function hashToCurve(secret: Uint8Array): WeierstrassPoint<bigint>;

      export declare function hashToCurveBls(secret: Uint8Array): G1Point;

      /**
       * Minimal key carrier shape for low level helpers.
       *
       * Any type with Keyset `id` can be used, including MintKeyset, MintKeys, HasKeysetKeys, Keyset,
       * KeysetCache.
       */
      export declare type HasKeysetId = {
          id: string;
      };

      /**
       * Minimal key carrier shape for low level helpers.
       *
       * Any type with `id`, and `keys` can be used, including MintKeys, KeysetCache and Keyset.
       */
      export declare type HasKeysetKeys = {
          id: string;
          keys: Keys;
      };

      /**
       * Verifies a pubkey has signed a P2PK Proof.
       *
       * @param pubkey - The Cashu P2PK public key (hex-encoded, X-only or with 02/03 prefix).
       * @param proof - A Cashu proof.
       * @param message - Optional. The message that was signed (for SIG_ALL)
       * @returns True if one of the signatures is theirs, false otherwise.
       */
      export declare function hasP2PKSignedProof(pubkey: string, proof: Proof, message?: string): boolean;

      /**
       * Check if a secret has a tag with the given key.
       *
       * @param secret - The Proof secret.
       * @param key - Tag key to lookup.
       * @returns - True if tag exists, False otherwise.
       */
      export declare function hasTag(secret: Secret | string, key: string): boolean;

      /**
       * NUT-12: verifies the DLEQ on a Proof. v3 (BLS) proofs have no DLEQ payload — pairing equality
       * stands in and runs regardless of `require`.
       *
       * @param proof The proof subject to verification.
       * @param keyset Object containing keyset keys (eg: Keyset, MintKeys, KeysetCache).
       * @param opts.require Default `false` (NUT-12 "MUST verify-if-present" — missing DLEQ on v0/v1/v2
       *   returns `true`). `true` opts into above-spec strictness: missing DLEQ → `false`.
       * @returns True if verification succeeded, false otherwise.
       * @throws CTSError if the proof amount is not a denomination in the keyset.
       */
      export declare function hasValidDleq(proof: Proof, keyset: HasKeysetKeys, opts?: {
          require?: boolean;
      }): boolean;

      /* Excluded from this release type: hexToNumber */

      /**
       * HTLC witness.
       */
      export declare type HTLCWitness = {
          /**
           * Preimage.
           */
          preimage: string;
          /**
           * An array of signatures in hex format.
           */
          signatures?: string[];
      };

      /**
       * This error is thrown when a HTTP response is not 2XX nor a protocol error.
       */
      export declare class HttpResponseError extends CTSError {
          status: number;
          constructor(message: string, status: number, options?: {
              cause?: unknown;
          });
      }

      export declare function injectWebSocketImpl(ws: typeof WebSocket): void;

      export declare type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;

      /* Excluded from this release type: invoiceHasAmountInHRP */

      /**
       * True if `keysetId` is a v3 BLS12-381 keyset id (modern hex, version byte 0x02).
       *
       * @remarks
       * Strict version gate: does not assume future keyset versions are BLS.
       */
      export declare function isBlsKeyset(keysetId: string): boolean;

      /**
       * Verify HTLC spending conditions for a single input.
       *
       * @param proof - The Proof to check.
       * @param logger - Optional logger (default: NULL_LOGGER)
       * @param message - Optional. The message to sign (for SIG_ALL)
       * @returns True if spending conditions are satisfied, false otherwise.
       * @throws If verification is impossible.
       */
      export declare function isHTLCSpendAuthorised(proof: Proof, logger?: Logger, message?: string): boolean;

      /* Excluded from this release type: isObj */

      /* Excluded from this release type: isP2PKSigAll */

      /**
       * Verify P2PK spending conditions for a single input.
       *
       * @param proof - The Proof to check.
       * @param logger - Optional logger (default: NULL_LOGGER)
       * @param message - Optional. The message to sign (for SIG_ALL)
       * @returns True if the witness threshold was reached, false otherwise.
       * @throws If verification is impossible.
       */
      export declare function isP2PKSpendAuthorised(proof: Proof, logger?: Logger, message?: string): boolean;

      /* Excluded from this release type: isValidHex */

      /* Excluded from this release type: joinUrls */

      /**
       * BigInt-safe JSON parser/stringifier.
       *
       * @remarks
       * - Based on Crockford's JSON reference parser approach (recursive descent), adapted for BigInt.
       * - Does not touch the global `JSON` object.
       * - Stringifies BigInt as pure JSON numbers (no quotes, no `n`).
       *
       * Gotchas.
       *
       * - `s === JSONInt.stringify(JSONInt.parse(s))` is generally true for canonical JSON inputs.
       * - `o !== JSONInt.parse(JSONInt.stringify(o))` can happen because:
       *
       *   - BigInt is stringified as an unquoted JSON number token (loss of JS type on parse).
       *   - `undefined` values are dropped or become `null` in arrays, per JSON rules.
       *   - Custom `toJSON`/replacer behavior can change output.
       *
       * There is no consistent way to preserve BigInt type through JSON today, so handling that case is
       * up to users. In Cashu-TS, we use the `Amount` VO to normalize numbers.
       */
      export declare const JSONInt: JSONIntApi;

      export declare interface JSONIntApi {
          /**
           * Bigint aware JSON parser.
           *
           * @remarks
           * Returns `unknown`, so validate or cast the result to an application-specific type.
           *
           * Unquoted JSON number tokens are parsed to BigInt when outside the safe integer range, otherwise
           * to number.
           */
          parse(source: string, reviver?: (this: unknown, key: string, value: unknown) => unknown, options?: {
              strict?: boolean;
              fallbackTo?: 'number' | 'string' | 'error';
          }): unknown;
          /**
           * BigInt aware JSON stringify.
           *
           * @remarks
           * - BigInt is stringified as an unquoted JSON number token.
           * - Parsing the result may yield `number` or `bigint` depending on the value and parse options.
           * - Returns `undefined` for top-level values that JSON cannot represent, matching `JSON.stringify`
           *   behavior.
           */
          stringify(value: unknown, replacer?: ((this: unknown, key: string, value: unknown) => unknown) | ReadonlyArray<string | number>, space?: string | number): string | undefined;
      }

      export declare type JsonRpcReqParams = {
          kind: RpcSubKinds;
          filters: string[];
          subId: string;
      };

      /**
       * Manages all keysets for a Mint. Queries filter by the wallet's unit.
       *
       * @remarks
       * Stores keysets for every unit the mint exposes. Methods like `getKeysets()` and
       * `getCheapestKeyset()` filter by `this.unit`; `getKeyset(id)` is a direct lookup and is
       * intentionally cross-unit.
       */
      export declare class KeyChain {
          private mint;
          private unit;
          private keysets;
          private pendingKeyFetches;
          private assertInitialized;
          constructor(mint: string | Mint, unit: string);
          /**
           * Construct a KeyChain from previously cached data.
           *
           * @remarks
           * Does not hit the network. The cache should have been produced by `keyChain.cache`.
           * @param mint Mint URL or Mint instance.
           * @param unit The unit this KeyChain should filter queries by (e.g. 'sat').
           * @param cache Cache produced by `keyChain.cache` or `KeyChain.mintToCacheDTO`.
           */
          static fromCache(mint: string | Mint, unit: string, cache: KeyChainCache): KeyChain;
          /**
           * Convert Mint API DTOs into a consolidated KeyChainCache.
           *
           * @remarks
           * This is symmetrical to {@link KeyChain.cacheToMintDTO}. It is used by the `cache` getter and any
           * code that wants to move from raw Mint DTOs to the new cache shape.
           * @param mintUrl Mint URL.
           * @param allKeysets All keysets from mint.getKeySets() — any unit.
           * @param allKeys All keys from mint.getKeys() — any unit.
           */
          static mintToCacheDTO(mintUrl: string, allKeysets: MintKeyset[], allKeys: MintKeys[]): KeyChainCache;
          /**
           * Convert a KeyChainCache back into Mint API DTOs.
           *
           * @remarks
           * This is the inverse of {@link KeyChain.mintToCacheDTO}.
           */
          static cacheToMintDTO(cache: KeyChainCache): {
              keysets: MintKeyset[];
              keys: MintKeys[];
          };
          /**
           * Asynchronously load keysets and keys from the mint.
           *
           * @remarks
           * Intended for callers that want the freshest data from the mint and can use an asynchronous
           * path.
           * @param forceRefresh If true, re-fetches data even if already loaded.
           * @param customRequest Optional override for every mint-loading request.
           */
          init(forceRefresh?: boolean, customRequest?: RequestFn): Promise<void>;
          /**
           * Synchronously load keysets and keys from cached data.
           *
           * @remarks
           * Does not hit the network. Intended for callers that already have a KeyChainCache and want a
           * synchronous path. Loads all keysets from the cache regardless of unit; query methods filter by
           * `this.unit`.
           */
          loadFromCache(cache: KeyChainCache): void;
          /**
           * Builds keychain from Mint Keyset and Keys data. Stores all units.
           *
           * @param allKeysets Keyset data from mint.getKeySets() API.
           * @param allKeys Keys data from mint.getKeys() API.
           */
          private buildKeychain;
          /**
           * Get a keyset by ID or the cheapest keyset if no ID is provided.
           *
           * @param id Optional keyset ID.
           * @returns Keyset with keys.
           * @throws If keyset not found or uninitialized.
           */
          getKeyset(id?: string): Keyset;
          /**
           * Get the cheapest active keyset.
           *
           * @remarks
           * Selects active keyset with lowest fee and hex ID.
           * @returns Active Keyset.
           * @throws If none found or uninitialized.
           */
          getCheapestKeyset(): Keyset;
          /**
           * Ensure we have usable keys for a specific keyset id.
           *
           * @param id Keyset ID.
           * @returns Keyset with keys.
           * @throws If keyset keys not found or verification fails.
           */
          ensureKeysetKeys(id: string): Promise<Keyset>;
          /**
           * Registers a conditional keyset that was discovered through NUT-CTF metadata.
           *
           * Conditional keysets are addressable by id but excluded from regular wallet keyset selection
           * (`getCheapestKeyset` / `getKeysets`).
           */
          registerConditionalKeyset(meta: MintKeyset & {
              conditional: ConditionalKeysetMetadata;
          }, keys?: MintKeys): Keyset;
          loadConditionalKeyset(id: string): Promise<Keyset>;
          getConditionalKeyset(id: string): Keyset;
          hasConditionalKeyset(id: string): boolean;
          /**
           * Get list of all keysets for the wallet's unit.
           *
           * @returns Array of Keysets for `this.unit`.
           * @throws If uninitialized or no keysets exist for the unit.
           */
          getKeysets(): Keyset[];
          /**
           * Returns all the keys in this KeyChain across all units.
           *
           * @returns Array of MintKeys objects.
           * @throws If uninitialized.
           */
          getAllKeys(): MintKeys[];
          /**
           * Returns all the keyset IDs in this KeyChain across all units.
           *
           * @returns Array of keyset IDs.
           * @throws If uninitialized.
           */
          getAllKeysetIds(): string[];
          /**
           * Preferred consolidated cache representation.
           *
           * @remarks
           * Built from the live Keyset instances via their Mint DTO exporters.
           */
          get cache(): KeyChainCache;
      }

      /**
       * Cached view of a KeyChain.
       *
       * @remarks
       * This is the preferred format for persisting and restoring keychain state. The cache contains
       * keysets for **all** units at the mint. Use `KeyChain.fromCache` (which takes an explicit `unit`)
       * or `wallet.loadMintFromCache` to restore.
       */
      export declare type KeyChainCache = {
          /**
           * Flattened keysets and, optionally, their keys. Contains all units.
           */
          keysets: KeysetCache[];
          /**
           * Mint URL that this cache belongs to.
           */
          mintUrl: string;
          /**
           * Unix timestamp (ms) when this cache was created. Use for TTL / staleness checks.
           */
          savedAt?: number;
      };

      /**
       * Public keys are a dictionary of number and string. The number represents the amount that the key
       * signs for.
       *
       * Pubkey hex length depends on the keyset version (id prefix):
       *
       * - V1/v2 (`00…` / `01…`): 66 hex chars (secp256k1 compressed, 33 bytes).
       * - V3 (`02…`): 192 hex chars (BLS12-381 G2 compressed, 96 bytes).
       */
      export declare type Keys = {
          [amount: string]: string;
      };

      export declare class Keyset {
          private _id;
          private _unit;
          private _active;
          private _keys;
          private _input_fee_ppk?;
          private _final_expiry?;
          private _conditional?;
          constructor(id: string, unit: string, active: boolean, input_fee_ppk?: number, final_expiry?: number, conditional?: ConditionalKeysetMetadata);
          get id(): string;
          get unit(): string;
          get isActive(): boolean;
          get fee(): number;
          get expiry(): number | undefined;
          get hasKeys(): boolean;
          get conditional(): ConditionalKeysetMetadata | undefined;
          get isConditional(): boolean;
          get hasHexId(): boolean;
          get keys(): Record<number, string>;
          set keys(keys: Record<number, string>);
          /**
           * To Mint API MintKeyset format.
           *
           * @returns MintKeyset object.
           */
          toMintKeyset(): MintKeyset;
          /**
           * To Mint API MintKeys format.
           *
           * @returns MintKeys object.
           */
          toMintKeys(): MintKeys | null;
          /**
           * Verifies that the keyset's ID matches the derived ID from its keys, unit, and expiry.
           *
           * @returns True if verification succeeds, false otherwise (e.g: no keys or mismatch).
           */
          verify(): boolean;
          /**
           * Verifies that a MintKeys DTO has a correct id for its keys/unit/expiry.
           *
           * @returns True if verification succeeds, false otherwise (e.g: no keys or mismatch).
           */
          static verifyKeysetId(keys: MintKeys): boolean;
          /**
           * Verifies a NUT-CTF conditional keyset id against its keys and condition metadata.
           */
          static verifyConditionalKeysetId(keys: MintKeys, conditional: ConditionalKeysetMetadata): boolean;
          /**
           * Create a Keyset from Mint API DTOs.
           *
           * @param meta The MintKeyset metadata from GetKeysetsResponse.
           * @param keys The MintKeys from GetKeysResponse.
           * @returns Keyset instance.
           */
          static fromMintApi(meta: MintKeyset, keys?: MintKeys): Keyset;
      }

      /**
       * Cached view of a keyset.
       *
       * @remarks
       * This is basically MintKeyset, with optional "keys" field for active, verified keysets.
       */
      export declare type KeysetCache = MintKeyset & {
          /**
           * Optional. Keys for this keyset, if available.
           *
           * Present only when keyset is active and keys have been verified.
           */
          keys?: Keys;
      };

      export declare type KeysetPair = {
          keysetId: string;
          pubKeys: RawMintKeys;
          privKeys: RawMintKeys;
      };

      export declare type LockState = 'PERMANENT' | 'ACTIVE' | 'EXPIRED';

      export declare interface Logger {
          error(message: string, context?: Record<string, unknown>): void;
          warn(message: string, context?: Record<string, unknown>): void;
          info(message: string, context?: Record<string, unknown>): void;
          debug(message: string, context?: Record<string, unknown>): void;
          trace(message: string, context?: Record<string, unknown>): void;
          log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
      }

      /**
       * Defines the available log levels for the logger. Log levels are ordered from most severe (FATAL)
       * to least severe (TRACE).
       */
      export declare type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

      /**
       * Derives blinded secret keys for a P2BK proof.
       *
       * @remarks
       * Calculates the deterministic blinding factor for each P2PK pubkey (data, pubkeys, refund) and
       * calling our parity-aware derivation.
       * @param privateKey Secret key (or array of secret keys)
       * @param proof The proof.
       * @returns Deduplicated list of derived secret keys (hex, 64 chars)
       */
      export declare function maybeDeriveP2BKPrivateKeys(privateKey: string | string[], proof: Proof): string[];

      /**
       * Checks enough unique pubkeys have signed a message.
       *
       * @param signatures - The Schnorr signature(s) (hex-encoded).
       * @param message - The message to verify.
       * @param pubkeys - The Cashu P2PK public key(s) (hex-encoded, X-only or with 02/03 prefix) to
       *   check.
       * @param threshold - The minimum number of unique witnesses required.
       * @returns True if the witness threshold was reached, false otherwise.
       */
      export declare const meetsSignerThreshold: (signatures: string[], message: string, pubkeys: string[], threshold?: number) => boolean;

      /**
       * Builder for melting proofs to pay a Lightning invoice or BOLT12 offer.
       *
       * @remarks
       * Uses the generic prepareMelt / completeMelt flow under the hood, so it works for any NUT-05 style
       * melt quote, not just BOLT11 / BOLT12.
       * @example
       *
       * ```typescript
       * // Basic BOLT11 melt
       * await wallet.ops.meltBolt11(quote, proofs).run();
       *
       * // BOLT12 melt with deterministic change and NUT-08 blanks callback
       * await wallet.ops
       *   .meltBolt12(quote12, proofs)
       *   .asDeterministic() // counter 0 auto reserves
       *   .onCountersReserved((info) => console.log('Reserved', info))
       *   .run();
       * ```
       */
      export declare class MeltBuilder<TQuote extends Pick<MeltQuoteBaseResponse, 'amount' | 'quote'> = MeltQuoteBolt11Response> {
          private wallet;
          private method;
          private quote;
          private proofs;
          private outputType?;
          private config;
          constructor(wallet: Wallet, method: string, quote: TQuote, proofs: ProofLike[]);
          /**
           * Use random blinding for change outputs.
           *
           * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
           */
          asRandom(denoms?: AmountLike[]): this;
          /**
           * Use deterministic outputs for change.
           *
           * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
           * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
           */
          asDeterministic(counter?: number, denoms?: AmountLike[]): this;
          /**
           * Use P2PK-locked change (NUT-11).
           *
           * @param options NUT-11 locking options (e.g., pubkey, locktime).
           * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
           */
          asP2PK(options: P2PKOptions, denoms?: AmountLike[]): this;
          /**
           * Use a factory to generate OutputData for change.
           *
           * @param factory Factory used to produce blinded messages.
           * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
           */
          asFactory(factory: OutputDataFactory, denoms?: AmountLike[]): this;
          /**
           * Provide pre-created OutputData for change.
           *
           * @param data Fully formed OutputData for the change amount.
           */
          asCustom(data: OutputDataLike[]): this;
          /**
           * Use a specific keyset for the melt operation.
           *
           * @param id Keyset id to use for mint keys and fee lookup.
           */
          keyset(id: string): this;
          /**
           * Private key(s) used to sign P2PK locked proofs.
           *
           * @param k Single key or array of multisig keys.
           */
          privkey(k: string | string[]): this;
          /**
           * Receive a callback once counters are atomically reserved for deterministic outputs.
           *
           * @param cb Called with OperationCounters when counters are reserved.
           */
          onCountersReserved(cb: OnCountersReserved): this;
          /**
           * Prepare the melt.
           *
           * @remarks
           * Call `wallet.completeMelt(MeltPreview)` to complete the melt.
           * @returns A MeltPreview containing inputs, outputs, amount, and fee.
           */
          prepare(): Promise<MeltPreview<TQuote>>;
          /**
           * Execute the melt against the quote.
           *
           * @returns The melt result: `{ quote, change, outputData }`.
           */
          run(): Promise<MeltProofsResponse<TQuote>>;
      }

      /**
       * Builder for melting proofs via an onchain Bitcoin transaction.
       *
       * @remarks
       * Any overage above the selected quote amount and fee option is offered as NUT-08 change.
       * @example
       *
       * ```typescript
       * // Basic onchain melt (1 fee option)
       * const result = await wallet.ops.meltOnchain(quote, proofs).privkey('sk').run();
       *
       * // with custom keyset ID and selected fee option
       * await wallet.ops
       *   .meltOnchain(quote, proofs)
       *   .keyset('01abc...')
       *   .privkey('sk')
       *   .feeIndex(0)
       *   .run();
       * ```
       *
       * @experimental Onchain support follows NUT-30 semantics and may change.
       */
      export declare class MeltOnchainBuilder {
          private wallet;
          private quote;
          private proofs;
          private config;
          private selectedFeeIndex?;
          constructor(wallet: Wallet, quote: MeltQuoteOnchainResponse, proofs: ProofLike[]);
          /**
           * Use a specific keyset for the melt operation.
           *
           * @param id Keyset id to use for mint keys and fee lookup.
           */
          keyset(id: string): this;
          /**
           * Private key(s) used to sign P2PK locked proofs.
           *
           * @param k Single key or array of multisig keys.
           */
          privkey(k: string | string[]): this;
          /**
           * Select a fee option by its `fee_index`.
           *
           * @param index `fee_index` value from the quote's fee_options.
           */
          feeIndex(index: number): this;
          /**
           * Execute the onchain melt against the quote.
           *
           * @returns The melt result: `{ quote, change, outputData }`. Use `outputData` with the polled
           *   quote's `change` to unblind deferred change after broadcast.
           */
          run(): Promise<MeltProofsResponse<MeltQuoteOnchainResponse>>;
      }

      /**
       * Preview of a Melt transaction created by prepareMelt.
       *
       * @remarks
       * Contains JSON-unsafe values (`bigint`, `Uint8Array`). Not intended for direct serialization.
       */
      export declare interface MeltPreview<TQuote extends Pick<MeltQuoteBaseResponse, 'quote'> = MeltQuoteBaseResponse> {
          method: string;
          /**
           * Inputs (Proofs) to be melted.
           */
          inputs: Proof[];
          /**
           * Outputs (blinded messages) that can be filled by the mint to return overpaid fees.
           */
          outputData: OutputDataLike[];
          /**
           * Keyset ID used to prepare the outputs.
           */
          keysetId: string;
          /**
           * Melt Quote object.
           */
          quote: TQuote;
      }

      /**
       * Configuration for melting operations.
       */
      export declare type MeltProofsConfig = {
          keysetId?: string;
          privkey?: string | string[];
          onCountersReserved?: OnCountersReserved;
      };

      /**
       * Response after melting proofs.
       */
      export declare type MeltProofsResponse<TQuote extends Pick<MeltQuoteBaseResponse, 'quote'> = MeltQuoteBaseResponse> = {
          /**
           * If false, the proofs have not been invalidated and the payment can be tried later again with
           * the same proofs.
           */
          quote: TQuote;
          /**
           * Return/change from overpaid fees. Empty when the mint defers change (async/onchain melts).
           */
          change: Proof[];
          /**
           * NUT-08 outputs retained for deferred-change recovery (onchain, NUT-23 `prefer_async`). Empty
           * when `change` is populated — no recovery needed. Otherwise pair with the polled quote's
           * `change` via `wallet.createMeltChangeProofs()`.
           */
          outputData: OutputDataLike[];
      };

      /**
       * Base melt quote request - all melt quote requests have these fields (NUT-05)
       */
      export declare type MeltQuoteBaseRequest = {
          /**
           * Unit to be melted.
           */
          unit: string;
          /**
           * Request to be melted to.
           */
          request: string;
      };

      /**
       * Base melt quote response - all melt quotes have these fields (NUT-05)
       */
      export declare type MeltQuoteBaseResponse = {
          /**
           * Quote ID.
           */
          quote: string;
          /**
           * Amount to be melted.
           */
          amount: Amount;
          /**
           * Unit of the melt quote.
           */
          unit: string;
          /**
           * State of the melt quote.
           */
          state: MeltQuoteState;
          /**
           * Timestamp of when the quote expires.
           */
          expiry: number;
          /**
           * Optional change from overpaid fees. If blanks were provided in `outputs`, the mint may return
           * signatures here.
           */
          change?: SerializedBlindedSignature[];
      };

      /**
       * Melt quote payload.
       *
       * Includes options:
       *
       * - Amountless: amountless invoices.
       * - Mpp: multi-path payments (NUT-15)
       */
      export declare type MeltQuoteBolt11Request = MeltQuoteBaseRequest & {
          options?: {
              amountless?: {
                  amount_msat: AmountLike;
              };
              mpp?: {
                  amount: AmountLike;
              };
          };
      };

      /**
       * Response from the mint after requesting a BOLT11 melt quote. Contains payment details and state
       * for paying Lightning Network offers.
       */
      declare type MeltQuoteBolt11Response = MeltQuoteBaseResponse & {
          /**
           * Payment request for the melt quote.
           */
          request: string;
          /**
           * Fee reserve to be added to the amount.
           */
          fee_reserve: Amount;
          /**
           * Preimage of the paid invoice. is null if it the invoice has not been paid yet. can be null,
           * depending on which LN-backend the mint uses.
           */
          payment_preimage: string | null;
      };
      export { MeltQuoteBolt11Response }
      export { MeltQuoteBolt11Response as MeltQuoteResponse }

      /**
       * Melt quote payload.
       *
       * Includes options:
       *
       * - Amountless: amountless invoices.
       */
      export declare type MeltQuoteBolt12Request = MeltQuoteBaseRequest & {
          options?: {
              amountless?: {
                  amount_msat: AmountLike;
              };
          };
      };

      /**
       * Response from the mint after requesting a BOLT12 melt quote.
       *
       * @remarks
       * - Same as Bolt11.
       */
      export declare type MeltQuoteBolt12Response = MeltQuoteBolt11Response;

      /**
       * One fee/confirmation option offered for an onchain melt quote.
       */
      export declare type MeltQuoteOnchainFeeOption = {
          /**
           * Index used to select this option in the melt request.
           */
          fee_index: number;
          /**
           * Fee reserve for the onchain transaction.
           */
          fee_reserve: Amount;
          /**
           * Estimated number of blocks for confirmation.
           */
          estimated_blocks: number;
      };

      /**
       * Payload for requesting an onchain melt quote.
       */
      export declare type MeltQuoteOnchainRequest = MeltQuoteBaseRequest & {
          /**
           * Amount to melt.
           */
          amount: AmountLike;
      };

      /**
       * Response from the mint after requesting an onchain melt quote.
       *
       * @remarks
       * Extends MeltQuoteBaseResponse for compatibility with existing generics. The inherited `change?`
       * contains NUT-08 change signatures when the mint returns onchain melt change.
       */
      export declare type MeltQuoteOnchainResponse = MeltQuoteBaseResponse & {
          /**
           * Bitcoin address or destination.
           */
          request: string;
          /**
           * Available fee and confirmation estimates for this quote.
           */
          fee_options: MeltQuoteOnchainFeeOption[];
          /**
           * `fee_index` of the chosen fee option once the quote has been executed.
           */
          selected_fee_index: number | null;
          /**
           * Outpoint (txid:vout) once the transaction has been broadcast.
           */
          outpoint: string | null;
      };

      export declare const MeltQuoteState: {
          readonly UNPAID: "UNPAID";
          readonly PENDING: "PENDING";
          readonly PAID: "PAID";
      };

      export declare type MeltQuoteState = (typeof MeltQuoteState)[keyof typeof MeltQuoteState];

      /**
       * Generic Melt request payload.
       *
       * NUT-05 core fields plus optional blanks for overpayment change.
       */
      export declare type MeltRequest = {
          /**
           * Quote ID.
           */
          quote: string;
          /**
           * Proofs to melt.
           */
          inputs: Proof[];
          /**
           * Optional blanks for fee change. If present, the mint may return signatures in `change`.
           */
          outputs?: SerializedBlindedMessage[];
          /**
           * When true, request async processing from the mint. Note: This is a request, not a guarantee.
           */
          prefer_async?: boolean;
      } & Record<string, unknown>;

      /**
       * Class represents Cashu Mint API.
       *
       * @remarks
       * This class contains lower-level functions that are implemented by Wallet.
       */
      declare class Mint {
          private ws?;
          private _mintUrl;
          private _request;
          private _logger;
          private _mintInfo?;
          private _authProvider?;
          private _lastResponseMetadata;
          private readonly _captureResponseMetadata;
          /**
           * @param mintUrl Requires mint URL to create this object.
           * @param customRequest Optional, for custom network communication with the mint.
           * @param authTokenGetter Optional. Function to obtain a NUT-22 BlindedAuthToken (e.g. from a
           *   database or localstorage)
           */
          constructor(mintUrl: string, options?: {
              customRequest?: RequestFn;
              authProvider?: AuthProvider;
              logger?: Logger;
          });
          get mintUrl(): string;
          /**
           * Decorates the configured transport without replacing a native/custom adapter.
           */
          createRequestWithOptions(options: Pick<RequestOptions, 'requestTimeout' | 'responseBodyBytesLimit' | 'signal'>): RequestFn;
          /**
           * Metadata from the most recent HTTP response, including rate-limit headers.
           *
           * `undefined` before any request has been made.
           *
           * @remarks
           * A convenience for coarse backoff planning. This getter is not request-scoped and may be
           * overwritten by concurrent requests. For more precise tracking, use the global `onResponseMeta`
           * callback. Rate limit policy is not widely supported, so ensure you handle `429` responses.
           */
          get lastResponseMetadata(): ResponseMeta | undefined;
          /**
           * Create an OIDC client using this mint’s NUT-21 metadata.
           *
           * @example
           *
           * ```ts
           * const oidc = await mint.oidcAuth({ onTokens: (t) => authMgr.setCAT(t.access_token!) });
           * const start = await oidc.deviceStart();
           * // show start.user_code / start.verification_uri to the user
           * const token = await oidc.devicePoll(start.device_code, start.interval ?? 5);
           * // token.access_token is your CAT
           * ```
           */
          oidcAuth(opts?: OIDCAuthOptions): Promise<OIDCAuth>;
          /**
           * Fetches mint's info at the /info endpoint.
           *
           * @param customRequest Optional override for the request function.
           * @returns The mint's information response.
           */
          getInfo(customRequest?: RequestFn): Promise<GetInfoResponse>;
          /**
           * Lazily fetches and caches the mint's info if not already loaded.
           *
           * @returns The parsed MintInfo object.
           */
          getLazyMintInfo(customRequest?: RequestFn): Promise<MintInfo>;
          /**
           * Seeds the mint-info cache from already-fetched data.
           */
          setMintInfo(mintInfo: MintInfo | GetInfoResponse): void;
          /**
           * Performs a swap operation with ecash inputs and outputs.
           *
           * @param swapPayload Payload containing inputs and outputs.
           * @param customRequest Optional override for the request function.
           * @returns Signed outputs.
           */
          swap(swapPayload: SwapRequest, customRequest?: RequestFn): Promise<SwapResponse>;
          /**
           * Creates a mint quote for any payment method.
           *
           * @remarks
           * Uses `/v1/mint/quote/{method}` and validates method format. Base normalization is applied
           * automatically. For first-class methods (bolt11/bolt12), method-specific normalization is
           * stacked on top. Custom methods can supply an optional `normalize` callback for their own
           * fields.
           * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
           * @param payload The request body to POST (method-specific fields).
           * @param options.customRequest Optional override for the request function.
           * @param options.normalize Optional callback to normalize method-specific response fields.
           * @returns The mint quote response.
           */
          createMintQuote<TRes extends MintQuoteBaseResponse = MintQuoteBaseResponse>(method: string, payload: Record<string, unknown>, options?: {
              customRequest?: RequestFn;
              normalize?: (raw: Record<string, unknown>) => TRes;
          }): Promise<TRes>;
          /**
           * Requests a new mint quote from the mint.
           *
           * @remarks
           * Thin wrapper around createMintQuote('bolt11', ...).
           * @param mintQuotePayload Payload for creating a new mint quote.
           * @param customRequest Optional override for the request function.
           * @returns A new mint quote containing a payment request for the specified amount and unit.
           */
          createMintQuoteBolt11(mintQuotePayload: MintQuoteBolt11Request, customRequest?: RequestFn): Promise<MintQuoteBolt11Response>;
          /**
           * Requests a new BOLT12 mint quote from the mint using Lightning Network offers.
           *
           * @remarks
           * Thin wrapper around createMintQuote('bolt12', ...).
           * @param mintQuotePayload Payload containing amount, unit, optional description, and required
           *   pubkey.
           * @param customRequest Optional override for the request function.
           * @returns A mint quote containing a BOLT12 offer.
           */
          createMintQuoteBolt12(mintQuotePayload: MintQuoteBolt12Request, customRequest?: RequestFn): Promise<MintQuoteBolt12Response>;
          /**
           * Requests a new onchain mint quote from the mint.
           *
           * @remarks
           * Thin wrapper around createMintQuote('onchain', ...).
           * @param mintQuotePayload Payload containing unit and required pubkey.
           * @param customRequest Optional override for the request function.
           * @returns A mint quote containing a Bitcoin address for minting tokens.
           * @experimental Onchain support follows NUT-30 semantics and may change.
           */
          createMintQuoteOnchain(mintQuotePayload: MintQuoteOnchainRequest, customRequest?: RequestFn): Promise<MintQuoteOnchainResponse>;
          /**
           * Checks an existing mint quote for any payment method.
           *
           * @remarks
           * Uses `/v1/mint/quote/{method}/{quote}` and validates method format. Normalization follows the
           * same stacking pattern as {@link Mint.createMintQuote}.
           * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
           * @param quote Quote ID.
           * @param options.customRequest Optional override for the request function.
           * @param options.normalize Optional callback to normalize method-specific response fields.
           * @returns The mint quote response.
           */
          checkMintQuote<TRes extends MintQuoteBaseResponse = MintQuoteBaseResponse>(method: string, quote: string, options?: {
              customRequest?: RequestFn;
              normalize?: (raw: Record<string, unknown>) => TRes;
          }): Promise<TRes>;
          /**
           * Gets an existing mint quote from the mint.
           *
           * @remarks
           * Thin wrapper around checkMintQuote('bolt11', ...).
           * @param quote Quote ID.
           * @param customRequest Optional override for the request function.
           * @returns The status of the mint quote, including payment details and state.
           */
          checkMintQuoteBolt11(quote: string, customRequest?: RequestFn): Promise<MintQuoteBolt11Response>;
          /**
           * Gets an existing BOLT12 mint quote from the mint.
           *
           * @remarks
           * Thin wrapper around checkMintQuote('bolt12', ...).
           * @param quote Quote ID to check.
           * @param customRequest Optional override for the request function.
           * @returns Updated quote with current payment and issuance amounts.
           */
          checkMintQuoteBolt12(quote: string, customRequest?: RequestFn): Promise<MintQuoteBolt12Response>;
          /**
           * Gets an existing onchain mint quote from the mint.
           *
           * @remarks
           * Thin wrapper around checkMintQuote('onchain', ...).
           * @param quote Quote ID.
           * @param customRequest Optional override for the request function.
           * @returns Updated quote with current payment and issuance amounts.
           * @experimental Onchain support follows NUT-30 semantics and may change.
           */
          checkMintQuoteOnchain(quote: string, customRequest?: RequestFn): Promise<MintQuoteOnchainResponse>;
          /**
           * Mints new tokens by requesting blind signatures on the provided outputs.
           *
           * @remarks
           * Thin wrapper around mint('bolt11', ...).
           * @param mintPayload Payload containing the outputs to get blind signatures on.
           * @param customRequest Optional override for the request function.
           * @returns Serialized blinded signatures.
           */
          mintBolt11(mintPayload: MintRequest, customRequest?: RequestFn): Promise<MintResponse>;
          /**
           * Mints new tokens using a BOLT12 quote by requesting blind signatures on the provided outputs.
           *
           * @remarks
           * Thin wrapper around mint('bolt12', ...).
           * @param mintPayload Payload containing the quote ID and outputs to get blind signatures on.
           * @param customRequest Optional override for the request function.
           * @returns Serialized blinded signatures for the requested outputs.
           */
          mintBolt12(mintPayload: MintRequest, customRequest?: RequestFn): Promise<MintResponse>;
          /**
           * Mints new tokens using an onchain quote.
           *
           * @remarks
           * Thin wrapper around mint('onchain', ...).
           * @param mintPayload Payload containing the quote ID and outputs.
           * @param customRequest Optional override for the request function.
           * @returns Serialized blinded signatures.
           * @experimental Onchain support follows NUT-30 semantics and may change.
           */
          mintOnchain(mintPayload: MintRequest, customRequest?: RequestFn): Promise<MintResponse>;
          /**
           * Mints new tokens for a given payment method.
           *
           * @remarks
           * Uses `/v1/mint/{method}` and validates method format. Signature amounts are always normalized.
           * Custom methods can supply an optional `normalize` callback for any additional response fields.
           * @param method The minting method (e.g., 'bolt11', 'bolt12', or custom method name).
           * @param mintPayload Payload containing the quote ID and outputs to get blind signatures on.
           * @param options.customRequest Optional override for the request function.
           * @param options.normalize Optional callback to normalize method-specific response fields.
           * @returns Serialized blinded signatures for the requested outputs.
           */
          mint<TRes extends Record<string, unknown> = Record<string, unknown>>(method: string, mintPayload: MintRequest, options?: {
              customRequest?: RequestFn;
              normalize?: (raw: Record<string, unknown>) => MintResponse & TRes;
          }): Promise<MintResponse & TRes>;
          /**
           * Mints new tokens by requesting blind signatures on the provided outputs. Mints multiple quotes
           * at once.
           *
           * @param mintPayload Payload containing the outputs to get blind signatures on.
           * @param customRequest Optional override for the request function.
           * @returns Serialized blinded signatures.
           */
          mintBatchBolt11(mintPayload: BatchMintRequest, customRequest?: RequestFn): Promise<MintResponse>;
          /**
           * Mints new tokens using multiple BOLT12 quotes by requesting blind signatures on the provided
           * outputs.
           *
           * @param mintPayload Payload containing the outputs to get blind signatures on.
           * @param customRequest Optional override for the request function.
           * @returns Serialized blinded signatures.
           */
          mintBatchBolt12(mintPayload: BatchMintRequest, customRequest?: RequestFn): Promise<MintResponse>;
          /**
           * Mints a batch of new tokens for a given payment method.
           *
           * @remarks
           * Uses `/v1/mint/{method}/batch` and validates method format. Signature amounts are always
           * normalized. Custom methods can supply an optional `normalize` callback for any additional
           * response fields.
           * @param method The minting method (e.g., 'bolt11', 'bolt12', or custom method name).
           * @param mintPayload Payload containing the quote ID and outputs to get blind signatures on.
           * @param options.customRequest Optional override for the request function.
           * @param options.normalize Optional callback to normalize method-specific response fields.
           * @returns Serialized blinded signatures for the requested outputs.
           */
          mintBatch<TRes extends Record<string, unknown> = Record<string, unknown>>(method: string, mintPayload: BatchMintRequest, options?: {
              customRequest?: RequestFn;
              normalize?: (raw: Record<string, unknown>) => MintResponse & TRes;
          }): Promise<MintResponse & TRes>;
          /**
           * Creates a melt quote for any payment method.
           *
           * @remarks
           * Uses `/v1/melt/quote/{method}` and validates method format. Base normalization (amount, expiry,
           * change) is always applied. For first-class methods (bolt11/bolt12), bolt-specific normalization
           * (fee_reserve, request) is stacked on top. Custom methods can supply an optional `normalize`
           * callback for their own fields.
           * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
           * @param payload The request body to POST (method-specific fields).
           * @param options.customRequest Optional override for the request function.
           * @param options.normalize Optional callback to normalize method-specific response fields.
           * @returns The melt quote response.
           */
          createMeltQuote<TRes extends MeltQuoteBaseResponse = MeltQuoteBaseResponse>(method: string, payload: Record<string, unknown>, options?: {
              customRequest?: RequestFn;
              normalize?: (raw: Record<string, unknown>) => TRes;
          }): Promise<TRes>;
          /**
           * Requests a new melt quote from the mint.
           *
           * @remarks
           * Thin wrapper around createMeltQuote('bolt11', ...).
           * @param meltQuotePayload Payload for creating a new melt quote.
           * @param customRequest Optional override for the request function.
           * @returns The melt quote response.
           */
          createMeltQuoteBolt11(meltQuotePayload: MeltQuoteBolt11Request, customRequest?: RequestFn): Promise<MeltQuoteBolt11Response>;
          /**
           * Requests a new BOLT12 melt quote from the mint for paying a Lightning Network offer. For
           * amount-less offers, specify the amount in options.amountless.amount_msat.
           *
           * @remarks
           * Thin wrapper around createMeltQuote('bolt12', ...).
           * @param meltQuotePayload Payload containing the BOLT12 offer to pay and unit.
           * @param customRequest Optional override for the request function.
           * @returns Melt quote with amount, fee reserve, and payment state.
           */
          createMeltQuoteBolt12(meltQuotePayload: MeltQuoteBolt12Request, customRequest?: RequestFn): Promise<MeltQuoteBolt12Response>;
          /**
           * Requests an onchain melt quote from the mint.
           *
           * @remarks
           * Thin wrapper around createMeltQuote('onchain', ...).
           * @param meltQuotePayload Payload containing the Bitcoin address, amount, and unit.
           * @param customRequest Optional override for the request function.
           * @returns Melt quote with fee options.
           * @experimental Onchain support follows NUT-30 semantics and may change.
           */
          createMeltQuoteOnchain(meltQuotePayload: MeltQuoteOnchainRequest, customRequest?: RequestFn): Promise<MeltQuoteOnchainResponse>;
          /**
           * Checks an existing melt quote for any payment method.
           *
           * @remarks
           * Uses `/v1/melt/quote/{method}/{quote}` and validates method format. Normalization follows the
           * same stacking pattern as {@link Mint.createMeltQuote}.
           * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
           * @param quote Quote ID.
           * @param options.customRequest Optional override for the request function.
           * @param options.normalize Optional callback to normalize method-specific response fields.
           * @returns The melt quote response.
           */
          checkMeltQuote<TRes extends MeltQuoteBaseResponse = MeltQuoteBaseResponse>(method: string, quote: string, options?: {
              customRequest?: RequestFn;
              normalize?: (raw: Record<string, unknown>) => TRes;
          }): Promise<TRes>;
          /**
           * Gets an existing melt quote.
           *
           * @remarks
           * Thin wrapper around checkMeltQuote('bolt11', ...).
           * @param quote Quote ID.
           * @param customRequest Optional override for the request function.
           * @returns The melt quote response.
           */
          checkMeltQuoteBolt11(quote: string, customRequest?: RequestFn): Promise<MeltQuoteBolt11Response>;
          /**
           * Gets an existing BOLT12 melt quote from the mint. Returns current payment state (UNPAID,
           * PENDING, or PAID) and payment preimage if paid.
           *
           * @remarks
           * Thin wrapper around checkMeltQuote('bolt12', ...).
           * @param quote Quote ID to check.
           * @param customRequest Optional override for the request function.
           * @returns Updated quote with current payment state and preimage if available.
           */
          checkMeltQuoteBolt12(quote: string, customRequest?: RequestFn): Promise<MeltQuoteBolt12Response>;
          /**
           * Gets an existing onchain melt quote from the mint.
           *
           * @remarks
           * Thin wrapper around checkMeltQuote('onchain', ...).
           * @param quote Quote ID.
           * @param customRequest Optional override for the request function.
           * @returns Updated melt quote with current state.
           * @experimental Onchain support follows NUT-30 semantics and may change.
           */
          checkMeltQuoteOnchain(quote: string, customRequest?: RequestFn): Promise<MeltQuoteOnchainResponse>;
          /**
           * Generic method to melt tokens using any payment method endpoint.
           *
           * @remarks
           * This method enables support for custom payment methods without modifying the Mint class. It
           * constructs the endpoint as `/v1/melt/{method}` and POSTs the payload. The response must contain
           * the common fields: quote, amount, state, expiry. Method-specific fields (e.g. `fee_reserve` for
           * bolt11/bolt12) are normalized when present. Custom methods can supply an optional `normalize`
           * callback for their own fields.
           * @example
           *
           * ```ts
           * const response = await mint.melt('bolt11', { quote: 'q1', inputs: [...], outputs: [...] });
           * const response = await mint.melt('custom-payment', { quote: 'c1', inputs: [...], outputs: [...] });
           * ```
           *
           * @param method The payment method (e.g., 'bolt11', 'bolt12', or custom method name).
           * @param meltPayload The melt payload containing inputs and optional outputs.
           * @param options.customRequest Optional override for the request function.
           * @param options.normalize Optional callback to normalize method-specific response fields.
           * @returns A response object with at least the required melt quote fields.
           */
          melt<TRes extends Record<string, unknown> = Record<string, unknown>>(method: string, meltPayload: MeltRequest, options?: {
              customRequest?: RequestFn;
              normalize?: (raw: Record<string, unknown>) => MeltQuoteBaseResponse & TRes;
          }): Promise<MeltQuoteBaseResponse & TRes>;
          /**
           * Requests the mint to pay for a Bolt11 payment request by providing ecash as inputs to be spent.
           * The inputs contain the amount and the fee_reserves for a Lightning payment. The payload can
           * also contain blank outputs in order to receive back overpaid Lightning fees.
           *
           * @remarks
           * Thin wrapper around melt('bolt11', ...).
           * @param meltPayload The melt payload containing inputs and optional outputs.
           * @param options.customRequest Optional override for the request function.
           * @returns The melt response.
           */
          meltBolt11(meltPayload: MeltRequest, options?: {
              customRequest?: RequestFn;
          }): Promise<MeltQuoteBolt11Response>;
          /**
           * Requests the mint to pay a BOLT12 offer by providing ecash inputs to be spent. The inputs must
           * cover the amount plus fee reserves. Optional outputs can be included to receive change for
           * overpaid Lightning fees.
           *
           * @remarks
           * Thin wrapper around melt('bolt12', ...).
           * @param meltPayload Payload containing quote ID, inputs, and optional outputs for change.
           * @param options.customRequest Optional override for the request function.
           * @returns Payment result with state and optional change signatures.
           */
          meltBolt12(meltPayload: MeltRequest, options?: {
              customRequest?: RequestFn;
          }): Promise<MeltQuoteBolt12Response>;
          /**
           * Requests the mint to execute an onchain melt by providing ecash inputs.
           *
           * @remarks
           * Thin wrapper around melt('onchain', ...). No outputs should be included in the payload as
           * NUT-08 fee change does not apply to onchain melts.
           * @param meltPayload The melt payload containing inputs (no outputs).
           * @param options.customRequest Optional override for the request function.
           * @returns The melt response.
           * @experimental Onchain support follows NUT-30 semantics and may change.
           */
          meltOnchain(meltPayload: MeltRequest, options?: {
              customRequest?: RequestFn;
          }): Promise<MeltQuoteOnchainResponse>;
          /**
           * Checks if specific proofs have already been redeemed.
           *
           * @param checkPayload The payload containing proofs to check.
           * @param customRequest Optional override for the request function.
           * @returns Redeemed and unredeemed ordered list of booleans.
           */
          check(checkPayload: CheckStatePayload, customRequest?: RequestFn): Promise<CheckStateResponse>;
          /**
           * Get the mint's public keys.
           *
           * @param keysetId Optional param to get the keys for a specific keyset. If not specified, the
           *   keys from all active keysets are fetched.
           * @param mintUrl Optional alternative mint URL to use for this request.
           * @param customRequest Optional override for the request function.
           * @returns The mint's public keys.
           */
          getKeys(keysetId?: string, mintUrl?: string, customRequest?: RequestFn): Promise<GetKeysResponse>;
          /**
           * Get the mint's keysets in no specific order.
           *
           * @param customRequest Optional override for the request function.
           * @returns All the mint's past and current keysets.
           */
          getKeySets(customRequest?: RequestFn): Promise<GetKeysetsResponse>;
          /**
           * Restores proofs from the provided blinded messages.
           *
           * @param restorePayload The payload containing outputs to restore.
           * @param customRequest Optional override for the request function.
           * @returns The restore response with outputs and signatures.
           */
          restore(restorePayload: PostRestorePayload, customRequest?: RequestFn): Promise<PostRestoreResponse>;
          /**
           * Lists conditional keysets exposed by a NUT-CTF-aware mint.
           *
           * Conditional keysets are intentionally excluded from regular NUT-02 `/v1/keysets` discovery.
           * Wallets use this endpoint to bind condition metadata before verifying condition-derived keyset
           * ids.
           */
          getConditionalKeysets(query?: GetConditionalKeysetsQuery, customRequest?: RequestFn): Promise<ConditionalKeysetsResponse>;
          getConditions(query?: GetConditionsQuery, customRequest?: RequestFn): Promise<GetConditionsResponse>;
          registerCondition(payload: RegisterConditionRequest, customRequest?: RequestFn): Promise<RegisterConditionResponse>;
          /**
           * Fetches one conditional-token condition from a CTF-aware mint.
           *
           * The CTF extension keeps condition keyset metadata outside NUT-02 keyset discovery; callers use
           * this to resolve root outcome collection keysets before building complete-set split outputs.
           */
          getCtfCondition(conditionId: string, customRequest?: RequestFn): Promise<CtfConditionInfo>;
          private normalizeCtfCondition;
          private getCtfConditionResponse;
          private isConditionNotFound;
          /**
           * Performs a CTF payoff-preserving convert.
           */
          ctfConvert(convertPayload: CtfConvertRequest, customRequest?: RequestFn): Promise<CtfConvertResponse>;
          /**
           * Redeems witnessed conditional outcome proofs into regular mint proofs.
           *
           * Callers must attach the oracle witness to each conditional input proof before invoking this
           * method. Output blinded messages are normalized to the mint's numeric wire shape so CTF redeem
           * follows the same request encoding as regular swaps.
           */
          redeemOutcome(redeemPayload: RedeemOutcomeRequest, customRequest?: RequestFn): Promise<RedeemOutcomeResponse>;
          /**
           * Tries to establish a websocket connection with the websocket mint url according to NUT-17.
           */
          connectWebSocket(): Promise<void>;
          /**
           * Closes a websocket connection.
           */
          disconnectWebSocket(): void;
          get webSocketConnection(): WSConnection | undefined;
          /**
           * Returns the Clear Authentication Token (CAT) to use in the 'Clear-auth' header, or undefined if
           * not required for the given path and method.
           *
           * @param method The method to call on the path.
           * @param path The API path to check for blind auth requirement.
           * @returns The blind auth token if required, otherwise undefined.
           */
          private handleClearAuth;
          /**
           * Returns a serialized Blind Authentication Token (BAT) to use in the 'Blind-auth' header, or
           * undefined if not required for the given path and method.
           *
           * @param method The method to call on the path.
           * @param path The API path to check for blind auth requirement.
           * @returns The blind auth token if required, otherwise undefined.
           */
          private handleBlindAuth;
          private requestWithAuth;
          /**
           * Normalizes AmountLike fields inside melt quote request options so they are serialized as JSON
           * number tokens (not strings) when forwarded to the mint.
           */
          private normalizeMeltQuoteRequestOptions;
          private isValidMethodString;
          /**
           * Wraps raw `amount` values from JSON into `Amount` objects.
           *
           * `SerializedBlindedSignature.amount` is typed as `Amount`, but JSONInt.parse produces `number |
           * bigint` at the wire boundary. Any code path that receives signatures directly from HTTP (i.e.
           * without going through this class) must apply the same normalization — see AuthManager.topUp for
           * an example.
           */
          private normalizeSignatureAmounts;
          private normalizeMessageAmounts;
          private toWireBlindedMessages;
          /**
           * Stacks normalizers for mint quote responses: first-class (bolt11/bolt12) normalization is
           * applied for known methods, then any custom normalize callback. Works on untyped wire data
           * internally — the caller casts the result to the desired TRes.
           */
          private normalizeMintQuoteResponse;
          /**
           * Mutates `data` in place, normalizing bolt11 mint-quote fields.
           */
          private normalizeMintQuoteBolt11Fields;
          /**
           * Mutates `data` in place, normalizing bolt12 mint-quote fields.
           */
          private normalizeMintQuoteBolt12Fields;
          /**
           * Mutates `data` in place, normalizing onchain mint-quote fields.
           */
          private normalizeMintQuoteOnchainFields;
          /**
           * Stacks normalizers for melt quote responses: base normalization (amount, expiry, change) is
           * always applied, then first-class bolt normalization for known methods, then any custom
           * normalize callback.
           */
          private normalizeMeltQuoteResponse;
          /**
           * Mutates `data` in place, normalizing protocol-mandatory melt base fields.
           */
          private normalizeMeltBaseFields;
          /**
           * Mutates `data` in place, normalizing bolt11/bolt12-specific melt fields.
           */
          private normalizeMeltBoltFields;
          /**
           * Mutates `data` in place, normalizing onchain-specific melt fields.
           */
          private normalizeMeltOnchainFields;
      }
      export { Mint as CashuMint }
      export { Mint }

      /**
       * Builder for minting proofs from a quote.
       *
       * @remarks
       * Bolt12 requires privkey by default, bolt11 only for locked quotes. The compiler will throw an
       * error if bolt12 and privkey() is omitted: MintBuilder<"bolt12", false>' is not assignable...
       *
       * Use this builder for the typed, first-class mint methods. For arbitrary or future mint methods,
       * use the generic `wallet.prepareMint(method, …)` / `wallet.completeMint()` flow.
       * @example
       *
       *     const proofs = await wallet.ops
       *       .mintBolt11(100, quote)
       *       .asDeterministic() // counter 0 auto reserves
       *       .onCountersReserved((info) => console.log(info))
       *       .privkey('sk')
       *       .run();
       */
      export declare class MintBuilder<M extends MintMethod, HasPrivKey extends boolean = M extends 'bolt12' | 'onchain' ? false : true> {
          private wallet;
          private method;
          private quote;
          private outputType?;
          private config;
          private amount;
          private readonly _hasPrivkey;
          constructor(wallet: Wallet, method: M, amount: AmountLike, quote: MintQuoteFor<M>);
          /**
           * Use random blinding for the minted proofs.
           *
           * @remarks
           * If denoms specified, proofsWeHave() will have no effect.
           * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
           */
          asRandom(denoms?: AmountLike[]): this;
          /**
           * Use deterministic outputs for the minted proofs.
           *
           * @remarks
           * If denoms specified, proofsWeHave() will have no effect.
           * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
           * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
           */
          asDeterministic(counter?: number, denoms?: AmountLike[]): this;
          /**
           * Use P2PK locked outputs for the minted proofs.
           *
           * @remarks
           * If denoms specified, proofsWeHave() will have no effect.
           * @param options NUT 11 options like pubkey and locktime.
           * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
           */
          asP2PK(options: P2PKOptions, denoms?: AmountLike[]): this;
          /**
           * Use a factory to generate OutputData for minted proofs.
           *
           * @remarks
           * If denoms specified, proofsWeHave() will have no effect.
           * @param factory OutputDataFactory used to produce blinded messages.
           * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
           */
          asFactory(factory: OutputDataFactory, denoms?: AmountLike[]): this;
          /**
           * Provide pre created OutputData for minted proofs.
           *
           * @param data Fully formed OutputData for the final amount.
           */
          asCustom(data: OutputDataLike[]): this;
          /**
           * Use a specific keyset for the operation.
           *
           * @param id Keyset id to use for mint keys and fee lookup.
           */
          keyset(id: string): this;
          /**
           * Private key to sign locked mint quotes.
           *
           * @param k Private key for locked quotes.
           */
          privkey(k: string): MintBuilder<M, true>;
          /**
           * Provide existing proofs to help optimise denomination selection.
           *
           * @remarks
           * Has no effect if denominations (custom split) was specified.
           * @param p Proofs currently held by the wallet, used to hit denomination targets.
           */
          proofsWeHave(p: Array<Pick<ProofLike, 'amount'>>): this;
          /**
           * Receive a callback once counters are atomically reserved for deterministic outputs.
           *
           * @param cb Called with OperationCounters when counters are reserved.
           */
          onCountersReserved(cb: OnCountersReserved): this;
          /**
           * Prepare the mint.
           *
           * @remarks
           * Call `wallet.completeMint(MintPreview)` to complete the mint. This method can only be called
           * for bolt12 quotes when `.privkey()` is set.
           * @returns A MintPreview containing the payload and output data needed to complete the mint.
           */
          prepare(this: MintBuilder<M, true>): Promise<M extends 'bolt11' ? MintPreview<MintQuoteBolt11Response> : M extends 'bolt12' ? MintPreview<MintQuoteBolt12Response> : MintPreview<MintQuoteOnchainResponse>>;
          /**
           * Execute minting against the quote.
           *
           * @remarks
           * This is equivalent to `const preview = await prepare(); await wallet.completeMint(preview)`.
           * This method can only be called for bolt12 quotes when `.privkey()` is set.
           * @returns The newly minted proofs.
           */
          run(this: MintBuilder<M, true>): Promise<Proof[]>;
      }

      export declare type MintContactInfo = {
          method: string;
          info: string;
      };

      export declare class MintInfo {
          private readonly _mintInfo;
          private readonly _protected22?;
          private readonly _protected21?;
          constructor(info: GetInfoResponse, logger?: Logger);
          static normalizeInfo(info: GetInfoResponse, logger?: Logger): GetInfoResponse;
          private static normalizeSwapMethods;
          private static normalizeNut19;
          private static normalizeNut22;
          private static normalizeNut29;
          isSupported(num: 4 | 5): {
              disabled: boolean;
              params: SwapMethod[];
          };
          isSupported(num: 7 | 8 | 9 | 10 | 11 | 12 | 14 | 20): {
              supported: boolean;
          };
          isSupported(num: 17): {
              supported: boolean;
              params?: WebSocketSupport[];
          };
          isSupported(num: 15): {
              supported: boolean;
              params?: MPPMethod[];
          };
          isSupported(num: 19): {
              supported: boolean;
              params?: Nut19Policy;
          };
          isSupported(num: 29): {
              supported: boolean;
              params?: Nut29Info;
          };
          requiresBlindAuthToken(method: 'GET' | 'POST', path: string): boolean;
          requiresClearAuthToken(method: 'GET' | 'POST', path: string): boolean;
          private matchesProtected;
          private checkGenericNut;
          private checkMintMelt;
          private checkNut17;
          private checkNut15;
          private checkNut19;
          private checkNut29;
          private toEndpoints;
          private buildIndex;
          get cache(): GetInfoResponse;
          get contact(): MintContactInfo[];
          get description(): string | undefined;
          get description_long(): string | undefined;
          get name(): string;
          get pubkey(): string;
          get nuts(): {
              '4': {
                  methods: SwapMethod[];
                  disabled: boolean;
              };
              '5': {
                  methods: SwapMethod[];
                  disabled: boolean;
              };
              '7'?: {
                  supported: boolean;
              };
              '8'?: {
                  supported: boolean;
              };
              '9'?: {
                  supported: boolean;
              };
              '10'?: {
                  supported: boolean;
              };
              '11'?: {
                  supported: boolean;
              };
              '12'?: {
                  supported: boolean;
              };
              '14'?: {
                  supported: boolean;
              };
              '15'?: {
                  methods: MPPMethod[];
              };
              '17'?: {
                  supported: WebSocketSupport[];
              };
              '19'?: {
                  ttl: number | null;
                  cached_endpoints: Array<{
                      method: "GET" | "POST";
                      path: string;
                  }>;
              };
              '20'?: {
                  supported: boolean;
              };
              '21'?: {
                  openid_discovery: string;
                  client_id: string;
                  protected_endpoints?: Array<{
                      method: "GET" | "POST";
                      path: string;
                  }>;
              };
              '22'?: {
                  bat_max_mint: number;
                  protected_endpoints: Array<{
                      method: "GET" | "POST";
                      path: string;
                  }>;
              };
              '29'?: Nut29Info;
              CTF?: {
                  supported: boolean;
                  dlc_version?: string;
                  vesting_period?: number;
                  default_keyset_creation?: string;
                  registration_fees?: Array<{
                      unit: string;
                      registration_fee_base: number;
                      registration_fee_per_keyset: number;
                  }>;
                  conditional_keyset_catalogue?: {
                      version: number;
                      max_page_size: number;
                  };
              };
          };
          get version(): string;
          get motd(): string | undefined;
          /**
           * Checks if the mint supports creating invoices/offers with a description for the specified
           * payment method.
           *
           * @param method - The payment method to check ('bolt11' or 'bolt12')
           * @returns True if the mint supports description for the method, false otherwise.
           */
          supportsNut04Description(method: 'bolt11' | 'bolt12', unit?: string): boolean;
          /**
           * Lists the method-unit settings the mint advertises for an operation (`'mint'` → NUT-4, `'melt'`
           * → NUT-5), or `[]` when that operation is disabled. Use this to discover what a consumer can
           * mint or melt with; to test a single pair use `supportsMintMeltMethod`.
           */
          supportedMethods(op: 'mint' | 'melt'): SwapMethod[];
          /**
           * Checks if the mint advertises the given (method, unit) pair for the given operation (`'mint'` →
           * NUT-4, `'melt'` → NUT-5).
           */
          supportsMintMeltMethod(op: 'mint' | 'melt', method: string, unit: string): boolean;
          supportsAmountless(method?: string, unit?: string): boolean;
      }

      /**
       * A mint keyset.
       */
      export declare type MintKeys = {
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
      export declare type MintKeyset = {
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

      export declare type MintMethod = 'bolt11' | 'bolt12' | 'onchain';

      /**
       * This error is thrown when a [protocol
       * error](https://github.com/cashubtc/nuts/blob/main/00.md#errors) occurs. See error codes
       * [here](https://github.com/cashubtc/nuts/blob/main/error_codes.md).
       */
      export declare class MintOperationError extends HttpResponseError {
          code: number;
          constructor(code: number, detail: string);
      }

      /**
       * Preview of a mint transaction created by prepareMint.
       *
       * @remarks
       * Contains JSON-unsafe values (`bigint`, `Uint8Array`). Not intended for direct serialization.
       */
      export declare interface MintPreview<TQuote extends Pick<MintQuoteBaseResponse, 'quote'> = MintQuoteBaseResponse> {
          method: string;
          /**
           * Mint payload to be sent to the mint.
           */
          payload: MintRequest;
          /**
           * Blinding data required to construct proofs.
           */
          outputData: OutputDataLike[];
          /**
           * Keyset ID used to prepare the outputs.
           */
          keysetId: string;
          /**
           * Mint Quote object.
           */
          quote: TQuote;
      }

      /**
       * Configuration for minting operations.
       */
      export declare type MintProofsConfig = {
          keysetId?: string;
          privkey?: string | string[];
          proofsWeHave?: Array<Pick<ProofLike, 'amount'>>;
          onCountersReserved?: OnCountersReserved;
      };

      /**
       * Base mint quote request - all mint quote requests have these fields (NUT-04) and may have
       * optional fields (NUT-20)
       */
      export declare type MintQuoteBaseRequest = {
          /**
           * Unit to be minted.
           */
          unit: string;
          /**
           * Optional. Public key to lock the quote to (NUT-20).
           */
          pubkey?: string;
      };

      /**
       * Base mint quote response - all mint quotes have these fields (NUT-04) and may have optional
       * fields (NUT-20)
       */
      export declare type MintQuoteBaseResponse = {
          /**
           * Quote ID.
           */
          quote: string;
          /**
           * Payment request.
           */
          request: string;
          /**
           * Unit of the melt quote.
           */
          unit: string;
          /**
           * Optional. Public key the quote is locked to (NUT-20)
           */
          pubkey?: string;
      };

      /**
       * Payload that needs to be sent to the mint when requesting a mint.
       */
      export declare type MintQuoteBolt11Request = MintQuoteBaseRequest & {
          /**
           * Amount to be minted.
           */
          amount: AmountLike;
          /**
           * Description for the invoice.
           */
          description?: string;
      };

      /**
       * Response from the mint after requesting a BOLT11 mint quote.
       */
      declare type MintQuoteBolt11Response = MintQuoteBaseResponse & {
          /**
           * Amount requested for mint quote.
           */
          amount: Amount;
          /**
           * State of the mint quote.
           */
          state: MintQuoteState;
          /**
           * Timestamp of when the quote expires. `null` when the mint does not set an expiry.
           */
          expiry: number | null;
      };
      export { MintQuoteBolt11Response }
      export { MintQuoteBolt11Response as MintQuoteResponse }
      export { MintQuoteBolt11Response as PartialMintQuoteResponse }

      /**
       * Payload that needs to be sent to the mint when requesting a mint.
       */
      export declare type MintQuoteBolt12Request = MintQuoteBaseRequest & {
          /**
           * Optional. Amount to be minted.
           */
          amount?: AmountLike;
          /**
           * Optional. Description for the invoice.
           */
          description?: string;
      };

      /**
       * Response from the mint after requesting a BOLT12 mint quote.
       */
      export declare type MintQuoteBolt12Response = MintQuoteBaseResponse & {
          /**
           * Amount requested for mint quote. `null` for amountless offers (per NUT-25).
           */
          amount: Amount | null;
          /**
           * Timestamp of when the quote expires. `null` when the mint does not set an expiry.
           */
          expiry: number | null;
          /**
           * Public key the quote is locked to.
           *
           * @remarks
           * Required for bolt12.
           */
          pubkey: string;
          /**
           * The amount that has been paid to the mint via the bolt12 offer. The difference between this and
           * `amount_issued` can be minted.
           */
          amount_paid: Amount;
          /**
           * The amount of ecash that has been issued for the given mint quote.
           */
          amount_issued: Amount;
      };

      export declare type MintQuoteFor<M extends MintMethod> = M extends 'bolt11' ? string | MintQuoteBolt11Response : M extends 'bolt12' ? MintQuoteBolt12Response : MintQuoteOnchainResponse;

      /**
       * Payload for requesting an onchain mint quote.
       */
      export declare type MintQuoteOnchainRequest = MintQuoteBaseRequest & {
          /**
           * Public key to lock the quote to. Required for onchain minting.
           */
          pubkey: string;
      };

      /**
       * Response from the mint after requesting an onchain mint quote.
       */
      export declare type MintQuoteOnchainResponse = MintQuoteBaseResponse & {
          /**
           * Timestamp of when the quote expires. `null` when the mint does not set an expiry.
           */
          expiry: number | null;
          /**
           * Public key the quote is locked to.
           */
          pubkey: string;
          /**
           * The amount that has been paid to the mint via the onchain transaction.
           */
          amount_paid: Amount;
          /**
           * The amount of ecash that has been issued for the given mint quote.
           */
          amount_issued: Amount;
      };

      export declare const MintQuoteState: {
          readonly UNPAID: "UNPAID";
          readonly PAID: "PAID";
          readonly ISSUED: "ISSUED";
      };

      export declare type MintQuoteState = (typeof MintQuoteState)[keyof typeof MintQuoteState];

      /**
       * Payload that needs to be sent to the mint when requesting a mint.
       */
      export declare type MintRequest = {
          /**
           * Quote ID received from the mint.
           */
          quote: string;
          /**
           * Outputs (blinded messages) to be signed by the mint.
           */
          outputs: SerializedBlindedMessage[];
          /**
           * Optional. Signature for the Public key the quote is locked to (NUT-20)
           */
          signature?: string;
      };

      /**
       * Response from the mint after requesting a mint.
       */
      export declare type MintResponse = {
          signatures: SerializedBlindedSignature[];
      };

      /**
       * MPP supported methods.
       */
      export declare type MPPMethod = {
          method: string;
          unit: string;
      };

      /**
       * This error is thrown when a network request fails.
       */
      export declare class NetworkError extends CTSError {
          constructor(message: string, options?: {
              cause?: unknown;
          });
      }

      /* Excluded from this release type: normalizeP2PKOptions */

      /**
       * Normalizes raw proof objects (e.g. from a database query) into typed {@link Proof} objects by
       * converting `amount` to `bigint`. Use {@link deserializeProofs} if your proofs are stored as JSON.
       *
       * @example
       *
       *     const proofs = normalizeProofAmounts(db.query('SELECT * FROM proofs'));
       */
      export declare function normalizeProofAmounts(raw: ProofLike[]): Proof[];

      /* Excluded from this release type: normalizeUrl */

      /* Excluded from this release type: nullIfUndefined */

      /* Excluded from this release type: numberToHexPadded64 */

      /**
       * Used to express a spending condition that proofs should be encumbered with.
       */
      export declare type NUT10Option = {
          /**
           * The kind of spending condition.
           */
          kind: string;
          /**
           * Expresses the spending condition relative to the kind.
           */
          data: string;
          /**
           * Tags associated with the spending condition for additional data.
           */
          tags: string[][];
      };

      /**
       * Exact NUT-13 derivation location for one deterministic output.
       */
      export declare type Nut13OutputLocator = Readonly<{
          keysetId: string;
          counter: number;
      }>;

      export declare type Nut19Policy = {
          ttl: number;
          cached_endpoints: Array<{
              method: 'GET' | 'POST';
              path: string;
          }>;
      };

      /**
       * NUT-29 batch minting info advertised by the mint in the NUT-06 info response.
       */
      export declare type Nut29Info = {
          methods?: string[];
          max_batch_size?: number;
      };

      export declare class OIDCAuth {
          private readonly discoveryUrl;
          private readonly logger;
          private clientId;
          private scope;
          private config?;
          private onTokens?;
          private tokenListeners;
          static fromMintInfo(info: {
              nuts: GetInfoResponse['nuts'];
          }, opts?: OIDCAuthOptions): OIDCAuth;
          constructor(discoveryUrl: string, opts?: OIDCAuthOptions);
          setClient(id: string): void;
          setScope(scope?: string): void;
          /**
           * Subscribe to token updates. Listeners are called after the primary onTokens callback.
           */
          addTokenListener(fn: (t: TokenResponse) => void | Promise<void>): void;
          loadConfig(): Promise<OIDCConfig>;
          /**
           * Generate a PKCE verifier and S256 challenge.
           *
           * - Verifier: base64url of random bytes, length >= 43, RFC 7636 compliant.
           * - Challenge: base64url(sha256(verifier))
           */
          generatePKCE(): {
              verifier: string;
              challenge: string;
          };
          /**
           * Build an Authorization Code + PKCE URL.
           */
          buildAuthCodeUrl(input: {
              redirectUri: string;
              codeChallenge: string;
              codeChallengeMethod?: 'S256' | 'plain';
              state?: string;
              scope?: string;
          }): Promise<string>;
          /**
           * Exchange an auth code for tokens, using the PKCE verifier.
           */
          exchangeAuthCode(input: {
              code: string;
              redirectUri: string;
              codeVerifier: string;
          }): Promise<TokenResponse>;
          deviceStart(): Promise<DeviceStartResponse>;
          devicePoll(device_code: string, intervalSec?: number): Promise<TokenResponse>;
          /**
           * One call convenience for Device Code flow.
           *
           * @remarks
           * Polling interval will be the MAX of intervalSec and Mint interval.
           * @param intervalSec Desired polling interval in seconds.
           * @returns The start fields and helpers to poll or cancel.
           */
          startDeviceAuth(intervalSec?: number): Promise<DeviceStartResponse & {
              poll: () => Promise<TokenResponse>;
              cancel: () => void;
          }>;
          refresh(refresh_token: string): Promise<TokenResponse>;
          passwordGrant(username: string, password: string): Promise<TokenResponse>;
          /**
           * Fire and forget token fan out. Any listener errors are logged inside safeCallback. Nothing
           * thrown here will come from listeners.
           */
          private handleTokens;
          private toForm;
          private postFormStrict;
          private postFormLoose;
          private sleep;
      }

      export declare type OIDCAuthOptions = {
          clientId?: string;
          scope?: string;
          logger?: Logger;
          onTokens?: (t: TokenResponse) => void | Promise<void>;
      };

      export declare type OIDCConfig = {
          issuer: string;
          authorization_endpoint?: string;
          token_endpoint: string;
          device_authorization_endpoint?: string;
      };

      export declare type OnCountersReserved = (info: OperationCounters) => void;

      /**
       * Counter summary for an operation.
       *
       * - `keysetId` - of the transaction.
       * - `start` - beginning of reservation.
       * - `count` - number of reservations.
       * - `next` - counter available after reservation.
       *
       * @example // Start: 5, Count: 3 => 5,6,7. Next: 8.
       */
      export declare type OperationCounters = {
          keysetId: string;
          start: number;
          count: number;
          next: number;
      };

      /**
       * Output config for send/swap operations.
       *
       * @remarks
       * Defines types for sent and kept proofs.
       *
       * - `send`: Required for recipient proofs.
       * - `keep`: Optional; defaults to wallet defaultOutputType policy.
       *
       * @example
       *
       *     const config: OutputConfig = {
       *       send: { type: 'random', denominations: [1, 2] },
       *       keep: { type: 'deterministic', counter: 0 },
       *     };
       *     await wallet.send(3, proofs, config, { includeFees: true });
       */
      export declare interface OutputConfig {
          send: OutputType;
          keep?: OutputType;
      }

      export declare class OutputData implements OutputDataLike {
          blindedMessage: SerializedBlindedMessage;
          blindingFactor: bigint;
          secret: Uint8Array;
          ephemeralE?: string;
          readonly nut13?: Nut13OutputLocator;
          constructor(blindedMessage: SerializedBlindedMessage, blindingFactor: bigint, secret: Uint8Array, ephemeralE?: string);
          toProof(sig: SerializedBlindedSignature, keyset: HasKeysetKeys): Proof;
          static createP2PKData(p2pk: P2PKOptions, amount: AmountLike, keyset: HasKeysetKeys, customSplit?: AmountLike[]): OutputData[];
          static createSingleP2PKData(p2pk: P2PKOptions, amount: AmountLike, keysetId: string): OutputData;
          static createRandomData(amount: AmountLike, keyset: HasKeysetKeys, customSplit?: AmountLike[]): OutputData[];
          static createSingleRandomData(amount: AmountLike, keysetId: string): OutputData;
          static createDeterministicData(amount: AmountLike, seed: Uint8Array, counter: number, keyset: HasKeysetKeys, customSplit?: AmountLike[]): OutputData[];
          /**
           * @throws May throw if blinding factor is out of range. Caller should catch, increment counter,
           *   and retry per BIP32-style derivation.
           */
          static createSingleDeterministicData(amount: AmountLike, seed: Uint8Array, counter: number, keysetId: string): OutputData;
          /**
           * Calculates the sum of amounts in an array of OutputDataLike objects.
           *
           * @param outputs Array of OutputDataLike objects.
           * @returns The total sum of amounts.
           */
          static sumOutputAmounts(outputs: OutputDataLike[]): Amount;
          /**
           * Converts output data to a JSON-safe representation.
           *
           * @remarks
           * Pair with {@link OutputData.deserialize} to persist prepared melt change outputs (e.g. across a
           * NUT-06 async melt's pending window) and reconstruct spendable change proofs via
           * `wallet.createMeltChangeProofs` once the quote is paid.
           * @example
           *
           * ```ts
           * // Save while async melt is pending:
           * const preview = await wallet.prepareMelt('bolt11', meltQuote, proofs);
           * const stored = JSON.stringify(preview.outputData.map((o) => OutputData.serialize(o)));
           * await wallet.completeMelt(preview, undefined, { preferAsync: true });
           *
           * // ... time passes, quote pays ...
           * const restored = (JSON.parse(stored) as SerializedOutputData[]).map((s) =>
           *   OutputData.deserialize(s),
           * );
           * const change = wallet.createMeltChangeProofs(restored, paidQuote.change ?? []);
           * ```
           */
          static serialize(output: OutputDataLike): SerializedOutputData;
          /**
           * Reconstructs concrete {@link OutputData} from its JSON-safe representation.
           *
           * @throws {@link CTSError} If any field fails validation (non-canonical blindingFactor, malformed
               *   hex secret/ephemeralE, or an Amount that cannot be parsed).
               * @see {@link OutputData.serialize} for the persist/restore lifecycle example.
               */
           static deserialize(serialized: SerializedOutputData): OutputData;
          }

          /**
           * Injectable output-construction strategy used by {@link Wallet}.
           *
           * @remarks
           * The canonical and maintained implementation is the Noble Curves based default exposed through
           * `OutputData.create*()` and adapted by DefaultOutputDataCreator. This interface provides an escape
           * hatch for runtime-specific needs, but compatibility and maintenance outside the default
           * implementation are the integrator's responsibility.
           */
          export declare interface OutputDataCreator {
              createP2PKData(p2pk: P2PKOptions, amount: AmountLike, keyset: HasKeysetKeys, customSplit?: AmountLike[]): OutputDataLike[];
              createSingleP2PKData(p2pk: P2PKOptions, amount: AmountLike, keysetId: string): OutputDataLike;
              createRandomData(amount: AmountLike, keyset: HasKeysetKeys, customSplit?: AmountLike[]): OutputDataLike[];
              createSingleRandomData(amount: AmountLike, keysetId: string): OutputDataLike;
              createDeterministicData(amount: AmountLike, seed: Uint8Array, counter: number, keyset: HasKeysetKeys, customSplit?: AmountLike[]): OutputDataLike[];
              createSingleDeterministicData(amount: AmountLike, seed: Uint8Array, counter: number, keysetId: string): OutputDataLike;
          }

          /**
           * Factory function that produces an {@link OutputDataLike} for a given amount and keyset. Implement
           * this to customise blinded-message construction (e.g. deterministic secrets, P2PK).
           */
          export declare type OutputDataFactory = (amount: AmountLike, keys: HasKeysetKeys) => OutputDataLike;

          /**
           * Minimum interface for an output data object. OutputData helpers only require keyset `id` and
           * `keys`. Custom implementations must satisfy this interface to be used with wallet operations.
           */
          export declare interface OutputDataLike {
              blindedMessage: SerializedBlindedMessage;
              blindingFactor: bigint;
              secret: Uint8Array;
              ephemeralE?: string;
              /**
               * Present only when the producer knows the exact NUT-13 derivation location.
               */
              readonly nut13?: Nut13OutputLocator;
              toProof: (signature: SerializedBlindedSignature, keyset: HasKeysetKeys) => Proof;
          }

          /**
           * Configuration for generating blinded message outputs.
           *
           * @remarks
           * A discriminated union based on the `type` field.
           * @example
           *
           *     // Random with custom splits
           *     const random: OutputType = { type: 'random', denominations: [1, 2, 4] };
           *     // Deterministic
           *     const deterministic: OutputType = { type: 'deterministic', counter: 0 };
           */
          export declare type OutputType = ({
              /**
               * Random blinding factors (default behavior).
               */
              type: 'random';
          } & SharedOutputTypeProps) | ({
              /**
               * Deterministic outputs based on a counter.
               *
               * @remarks
               * Counter: 0 means “auto-assign from wallet’s CounterSource”. Any positive value is used as
               * the exact starting counter without reservation. Negative values are invalid.
               */
              type: 'deterministic';
              counter: number;
          } & SharedOutputTypeProps) | ({
              /**
               * Pay-to-public-key (P2PK) outputs.
               *
               * @see P2PKOptions
               */
              type: 'p2pk';
              options: P2PKOptions;
          } & SharedOutputTypeProps) | ({
              /**
               * Factory-generated OutputData.
               *
               * @remarks
               * Outputs count from denominations or basic split.
               * @see OutputDataFactory
               */
              type: 'factory';
              factory: OutputDataFactory;
          } & SharedOutputTypeProps) | {
              /**
               * Pre-created OutputData, bypassing splitting.
               */
              type: 'custom';
              data: OutputDataLike[];
          };

          /**
           * BIP340-style domain separation tag (DST) for P2BK.
           */
          export declare const P2BK_DST: Uint8Array<ArrayBufferLike>;

          export declare class P2PKBuilder {
              private lockKeys;
              private refundKeys;
              private locktime?;
              private nSigs?;
              private nSigsRefund?;
              private extraTags;
              private _blindKeys?;
              private sigFlag?;
              private hashlock?;
              addLockPubkey(pk: string | string[]): this;
              addRefundPubkey(pk: string | string[]): this;
              lockUntil(when: Date | number): this;
              requireLockSignatures(n: number): this;
              requireRefundSignatures(n: number): this;
              addTag(key: string, values?: string[] | string): this;
              addTags(tags: P2PKTag[]): this;
              blindKeys(): this;
              sigAll(): this;
              /**
               * Converts a `P2PK` output into a NUT-14 `HTLC` kind output.
               */
              addHashlock(hashlock: string): this;
              toOptions(): P2PKOptions;
              static fromOptions(opts: P2PKOptions): P2PKBuilder;
          }

          /**
           * Options for configuring P2PK (Pay-to-Public-Key) locked proofs according to NUT-11.
           */
          export declare type P2PKOptions = {
              pubkey: string | string[];
              locktime?: number;
              refundKeys?: string[];
              requiredSignatures?: number;
              requiredRefundSignatures?: number;
              additionalTags?: P2PKTag[];
              blindKeys?: boolean;
              sigFlag?: SigFlag;
              hashlock?: string;
          };

          /**
           * Signature info for a single spending path (main or refund).
           */
          export declare interface P2PKPathInfo {
              /**
               * Canonical hex pubkeys eligible to sign for this path.
               */
              pubkeys: string[];
              /**
               * Number of signatures required (threshold).
               */
              requiredSigners: number;
              /**
               * Canonical hex pubkeys whose signatures were accepted.
               */
              receivedSigners: string[];
          }

          export declare type P2PKSpendingPath = 'MAIN' | 'REFUND' | 'UNLOCKED' | 'FAILED';

          /**
           * Tag entry for additional NUT-11 P2PK secret tags.
           */
          export declare type P2PKTag = [key: string, ...values: string[]];

          export declare interface P2PKVerificationResult {
              /**
               * True when the proof is currently spendable via the returned path.
               */
              success: boolean;
              /**
               * Which spending path was evaluated.
               *
               * - `MAIN`: main P2PK pubkeys satisfied the threshold.
               * - `REFUND`: refund pubkeys satisfied the threshold after locktime expiry.
               * - `UNLOCKED`: no active signer requirement remains, so anyone can spend.
               * - `FAILED`: the proof is well-formed but the required threshold was not met.
               */
              path: P2PKSpendingPath;
              /**
               * Current lock state derived from the proof secret.
               *
               * - `PERMANENT`: no finite locktime is set.
               * - `ACTIVE`: a finite locktime exists and has not expired yet.
               * - `EXPIRED`: the finite locktime has already expired.
               */
              lockState: LockState;
              /**
               * Locktime from the proof secret as a unix timestamp, or `Infinity` for a permanent lock.
               */
              locktime: number;
              /**
               * Main spending path info — always populated.
               */
              main: P2PKPathInfo;
              /**
               * Refund spending path info — empty pubkeys/signers if no refund keys configured.
               */
              refund: P2PKPathInfo;
          }

          /**
           * P2PK witness.
           */
          export declare type P2PKWitness = {
              /**
               * An array of signatures in hex format.
               */
              signatures?: string[];
          };

          /**
           * Parse an HTLC Secret and validate NUT-10 shape.
           *
           * @param secret - The Proof secret.
           * @returns Secret object.
           * @throws If the JSON is invalid or NUT-10 secret is malformed.
           */
          export declare function parseHTLCSecret(secret: string | Secret): Secret;

          /**
           * Parse a P2PK Secret and validate NUT-10 shape and NUT-11 tag-level constraints.
           *
           * @remarks
           * Layer 1 validation: Checks NUT-10 structure, rejects duplicate P2PK tag keys, and validates
           * sigflag value. Does NOT validate cross-tag semantics (e.g. n_sigs <= pubkeys) — use
           * {@link verifyP2PKSpendingConditions} for full semantic validation.
           * @param secret - The Proof secret.
           * @returns Secret object.
           * @throws If the NUT-10 secret is malformed, tags are duplicated, or sigflag is unrecognised.
           */
          export declare function parseP2PKSecret(secret: string | Secret): Secret;

          /**
           * Parse a secret string and validate NUT-10 shape.
           *
           * @param secret - The Proof secret.
           * @returns Secret object.
           * @throws If the JSON is invalid or NUT-10 secret is malformed.
           */
          export declare function parseSecret(secret: string | Secret): Secret;

          /* Excluded from this release type: parseWitnessData */

          declare class PaymentRequest_2 {
              transport?: PaymentRequestTransport[] | undefined;
              id?: string | undefined;
              unit?: string | undefined;
              mints?: string[] | undefined;
              description?: string | undefined;
              singleUse: boolean;
              nut10?: NUT10Option | undefined;
              amount?: Amount;
              constructor(transport?: PaymentRequestTransport[] | undefined, id?: string | undefined, amount?: AmountLike, unit?: string | undefined, mints?: string[] | undefined, description?: string | undefined, singleUse?: boolean, nut10?: NUT10Option | undefined);
              toRawRequest(): RawPaymentRequest;
              toEncodedRequest(): string;
              /**
               * Encodes the payment request to creqA format (CBOR).
               *
               * @returns A base64 encoded payment request string with 'creqA' prefix.
               */
              toEncodedCreqA(): string;
              /**
               * Encodes the payment request to creqB format (TLV + bech32m).
               *
               * @returns A bech32m encoded payment request string with 'CREQB' prefix.
               * @experimental
               */
              toEncodedCreqB(): string;
              getTransport(type: PaymentRequestTransportType): PaymentRequestTransport | undefined;
              /**
               * Creates a PaymentRequest from a raw payment request. Supports both creqA and creqB versions.
               *
               * @param rawPaymentRequest - The raw payment request string to create a PaymentRequest from.
               * @returns A PaymentRequest object.
               * @throws An error if the raw payment request is not supported.
               */
              static fromRawRequest(rawPaymentRequest: RawPaymentRequest): PaymentRequest_2;
              static fromEncodedRequest(encodedRequest: string): PaymentRequest_2;
          }
          export { PaymentRequest_2 as PaymentRequest }

          export declare type PaymentRequestPayload = {
              id?: string;
              memo?: string;
              unit: string;
              mint: string;
              proofs: Proof[];
          };

          export declare type PaymentRequestTransport = {
              type: PaymentRequestTransportType;
              target: string;
              tags?: string[][];
          };

          export declare enum PaymentRequestTransportType {
              POST = "post",
              NOSTR = "nostr"
          }

          export declare function pointFromBytes(bytes: Uint8Array): WeierstrassPoint<bigint>;

          export declare function pointFromHex(hex: string): WeierstrassPoint<bigint>;

          /**
           * Decode a compressed point hex string to a {@link CurvePoint}, picking the curve by length: 66 hex
           * chars → secp256k1, 96 hex chars → BLS12-381 G1.
           *
           * Lengths are disjoint across the supported curves (secp uncompressed is 130; G2 compressed is
           * 192), so there is no ambiguity.
           */
          export declare function pointFromHexAuto(hex: string): CurvePoint;

          export declare function pointFromHexG1(hex: string): G1Point;

          export declare function pointFromHexG2(hex: string): G2Point;

          export declare function pointToHex(p: CurvePoint): string;

          /**
           * Request to mint at /v1/restore endpoint.
           */
          export declare type PostRestorePayload = {
              outputs: SerializedBlindedMessage[];
          };

          /**
           * Response from mint at /v1/restore endpoint.
           */
          export declare type PostRestoreResponse = {
              outputs: SerializedBlindedMessage[];
              signatures: SerializedBlindedSignature[];
          };

          export declare type PrepareMeltConfig = MeltProofsConfig & {
              nut08Change?: boolean;
          };

          /**
           * Private key type - can be hex string or Uint8Array.
           */
          export declare type PrivKey = Uint8Array | string;

          /**
           * Represents a single Cashu proof.
           */
          export declare type Proof = {
              /**
               * Keyset id, used to link proofs to a mint and its MintKeys.
               */
              id: string;
              /**
               * Amount denominated in unit of the mints keyset id.
               */
              amount: Amount;
              /**
               * The initial secret that was (randomly) chosen for the creation of this proof.
               */
              secret: string;
              /**
               * The unblinded signature for this secret, signed by the mints private key.
               *
               * Hex length depends on the keyset version (id prefix):
               *
               * - V1/v2 (`00…` / `01…`): 66 hex chars (secp256k1 compressed).
               * - V3 (`02…`): 96 hex chars (BLS12-381 G1 compressed).
               */
              C: string;
              /**
               * DLEQ proof.
               */
              dleq?: SerializedDLEQ;
              /**
               * The P2BK ephemeral pubkey "E" (SEC1-compressed 33-byte hex).
               */
              p2pk_e?: string;
              /**
               * The witness for this proof.
               */
              witness?: string | P2PKWitness | HTLCWitness;
          };

          /**
           * A proof-shaped object whose `amount` field has not yet been normalized to `Amount`.
           *
           * Use this type to model proofs coming from external storage (localStorage, databases, JSON blobs)
           * where `amount` may be a `number`, `string`, or any other {@link AmountLike} value.
           *
           * @see {@link Proof} for the fully normalized type with `amount: Amount`.
           */
          export declare type ProofLike = Omit<Proof, 'amount'> & {
              amount: AmountLike;
          };

          /**
           * Entries of CheckStateResponse with state of the proof.
           */
          export declare type ProofState = {
              Y: string;
              state: CheckStateEnum;
              witness: string | null;
          };

          /**
           * This error is thrown when the server responds with 429 Too Many Requests. `retryAfterMs` is the
           * parsed `Retry-After` header in milliseconds, or `undefined` when the header is absent or
           * unparseable.
           */
          export declare class RateLimitError extends HttpResponseError {
              readonly retryAfterMs?: number | undefined;
              constructor(message: string, retryAfterMs?: number | undefined);
          }

          export declare type RawBlindedMessage = {
              B_: WeierstrassPoint<bigint>;
              r: bigint;
              secret: Uint8Array;
          };

          export declare type RawMintKeys = {
              [k: string]: Uint8Array;
          };

          export declare type RawNUT10Option = {
              k: string;
              d: string;
              t: string[][];
          };

          export declare type RawPaymentRequest = {
              i?: string;
              a?: number | bigint;
              u?: string;
              s?: boolean;
              m?: string[];
              d?: string;
              t?: RawTransport[];
              nut10?: RawNUT10Option;
          };

          export declare type RawTransport = {
              t: PaymentRequestTransportType;
              a: string;
              g?: string[][];
          };

          /**
           * Builder for receiving a token.
           *
           * @remarks
           * If you do not call a type method, the wallet’s policy default is used.
           * @example
           *
           *     const proofs = await wallet.ops
           *       .receive(token) // or array of proofs
           *       .asDeterministic() // counter 0 auto reserves
           *       .requireDleq(true)
           *       .run();
           */
          export declare class ReceiveBuilder {
              private wallet;
              private token;
              private outputType?;
              private config;
              constructor(wallet: Wallet, token: Token | string | ProofLike[]);
              /**
               * Use random blinding for the received outputs.
               *
               * @remarks
               * If denoms specified, proofsWeHave() will have no effect.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              asRandom(denoms?: AmountLike[]): this;
              /**
               * Use deterministic outputs for the received proofs.
               *
               * @remarks
               * If denoms specified, proofsWeHave() will have no effect.
               * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              asDeterministic(counter?: number, denoms?: AmountLike[]): this;
              /**
               * Use P2PK locked outputs for the received proofs.
               *
               * @remarks
               * If denoms specified, proofsWeHave() will have no effect.
               * @param options NUT 11 options like pubkey and locktime.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              asP2PK(options: P2PKOptions, denoms?: AmountLike[]): this;
              /**
               * Use a factory to generate OutputData for received proofs.
               *
               * @remarks
               * If denoms specified, proofsWeHave() will have no effect.
               * @param factory OutputDataFactory used to produce blinded messages.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              asFactory(factory: OutputDataFactory, denoms?: AmountLike[]): this;
              /**
               * Provide pre created OutputData for received proofs.
               *
               * @param data Fully formed OutputData for the final amount.
               */
              asCustom(data: OutputDataLike[]): this;
              /**
               * Use a specific keyset for the operation.
               *
               * @param id Keyset id to use for mint keys and fee lookup.
               */
              keyset(id: string): this;
              /**
               * Require all incoming proofs to have a valid DLEQ for the selected keyset.
               *
               * @param on When true, proofs without DLEQ are rejected.
               */
              requireDleq(on?: boolean): this;
              /**
               * Private key(s) used to sign P2PK locked incoming proofs.
               *
               * @param k Single key or array of multisig keys.
               */
              privkey(k: string | string[]): this;
              /**
               * Provide existing proofs to help optimise denomination selection.
               *
               * @remarks
               * Has no effect if denominations (custom split) was specified.
               * @param p Proofs currently held by the wallet, used to hit denomination targets.
               */
              proofsWeHave(p: Array<Pick<ProofLike, 'amount'>>): this;
              /**
               * Receive a callback once counters are atomically reserved for deterministic outputs.
               *
               * @param cb Called with OperationCounters when counters are reserved.
               */
              onCountersReserved(cb: OnCountersReserved): this;
              /**
               * Prepare the swap to receive.
               *
               * @remarks
               * Call `wallet.completeSwap(SwapPreview)` to complete the receive.
               * @returns A SwapPreview containing inputs, outputs, amount, and fee.
               */
              prepare(): Promise<SwapPreview>;
              /**
               * Execute the receive.
               *
               * @returns The new proofs.
               */
              run(): Promise<Proof[]>;
          }

          /**
           * Configuration for receive operations.
           */
          export declare type ReceiveConfig = {
              keysetId?: string;
              privkey?: string | string[];
              requireDleq?: boolean;
              proofsWeHave?: Array<Pick<ProofLike, 'amount'>>;
              onCountersReserved?: OnCountersReserved;
          };

          export declare interface RedeemOutcomeProofsOptions {
              /**
               * Conditional proofs carrying the oracle witness required by the mint.
               */
              inputs: ProofLike[];
              /**
               * Regular-output blinded messages that will receive the redeemed sats. Persist these before
               * calling the mint when the caller needs crash recovery.
               */
              outputs: OutputDataLike[];
          }

          export declare interface RedeemOutcomeRequest {
              inputs: Proof[];
              outputs: SerializedBlindedMessage[];
          }

          export declare interface RedeemOutcomeResponse {
              signatures: SerializedBlindedSignature[];
          }

          export declare interface RegisterConditionRequest {
              threshold?: number;
              tags?: string[][];
              announcements: string[];
              collateral?: string;
              outcome_collections?: string[];
              fee?: Proof[];
              outputs?: SerializedBlindedMessage[];
              condition_type?: string;
              lo_bound?: number;
              hi_bound?: number;
              precision?: number;
          }

          export declare interface RegisterConditionResponse {
              condition_id: string;
              keysets: Record<string, string>;
              change?: SerializedBlindedSignature[];
          }

          export declare type RequestArgs = {
              endpoint: string;
              requestBody?: Record<string, unknown>;
              headers?: Record<string, string>;
              logger?: Logger;
          };

          export declare type RequestFn = <T = unknown>(args: RequestOptions) => Promise<T>;

          export declare type RequestOptions = RequestArgs & Omit<RequestInit, 'body' | 'headers'> & Partial<Nut19Policy> & {
              /**
               * Per-request timeout in milliseconds. If a single fetch hangs longer than this, it is aborted
               * and treated as a NetworkError (triggering retry on cached endpoints). Without this, a hung
               * connection can consume the entire TTL retry window.
               */
              requestTimeout?: number;
              /**
               * Maximum decoded HTTP response-body bytes. The response stream is cancelled before JSON
               * parsing when this limit is exceeded.
               */
              responseBodyBytesLimit?: number;
              /**
               * Optional callback invoked on every HTTP response with structured rate-limit metadata. Fires
               * before the promise resolves (on success) or rejects (on error), so consumers always receive
               * metadata even when the request fails.
               */
              onResponseMeta?: (meta: ResponseMeta) => void;
          };

          /**
           * Metadata extracted from every HTTP response. When `onResponseMeta` is provided in
           * `RequestOptions`, the callback receives one of these on every response (both successes and
           * errors) before the promise resolves or rejects.
           */
          export declare type ResponseMeta = {
              /**
               * The request endpoint URL. Useful for global callbacks to identify which mint the response came
               * from.
               */
              endpoint: string;
              /**
               * HTTP status code of the response.
               */
              status: number;
              /**
               * Parsed `Retry-After` in ms (via `parseRetryAfter`). Present only when the header exists and is
               * parseable.
               */
              retryAfterMs?: number;
              /**
               * Raw value of the `RateLimit` (or Cloudflare `Ratelimit`) header, if present.
               */
              rateLimit?: string;
              /**
               * Raw value of the `RateLimit-Policy` (or Cloudflare `Ratelimit-Policy`) header, if present.
               */
              rateLimitPolicy?: string;
              /**
               * Full raw response headers.
               */
              headers: Headers;
          };

          export declare type RestoreConfig = {
              keysetId?: string;
          };

          export declare type RpcSubKinds = 'bolt11_mint_quote' | 'bolt11_melt_quote' | 'proof_state';

          /**
           * Signs a message digest using Schnorr.
           *
           * @remarks
           * Signatures are non-deterministic because schnorr.sign() generates a new random auxiliary value
           * (auxRand) each time it is called.
           * @param msghash The SHA-256 digest to sign (hex string or Uint8Array).
           * @param privateKey The private key to sign with (hex string or Uint8Array).
           * @returns The signature in hex format.
           */
          export declare const schnorrSignDigest: (digest: DigestInput, privateKey: PrivKey) => string;

          /**
           * Signs a message string using Schnorr.
           *
           * @remarks
           * Signatures are non-deterministic because schnorr.sign() generates a new random auxiliary value
           * (auxRand) each time it is called.
           * @param message - The message to sign.
           * @param privateKey - The private key to sign with (hex string or Uint8Array).
           * @returns The signature in hex format.
           */
          export declare const schnorrSignMessage: (message: string, privateKey: PrivKey) => string;

          /**
           * Verifies a Schnorr signature on a message.
           *
           * @remarks
           * This function swallows Schnorr verification errors (eg invalid signature / pubkey format) and
           * treats them as false. If you want to throw such errors, use the throws param.
           * @param signature - The Schnorr signature (hex-encoded).
           * @param message - The message to verify.
           * @param pubkey - The Cashu P2PK public key (hex-encoded, X-only or with 02/03 prefix).
           * @param throws - True: throws on error, False: swallows errors and returns false.
           * @returns True if the signature is valid, false otherwise.
           * @throws If throws param is true and error is encountered.
           */
          export declare const schnorrVerifyMessage: (signature: string, message: string, pubkey: string, throws?: boolean) => boolean;

          export declare type Secret = [SecretKind, SecretData];

          declare type SecretAndBlindingFactorDeriver = (counter: number) => DerivedSecretAndBlindingFactor;

          export declare interface SecretData {
              nonce: string;
              data: string;
              tags?: string[][];
          }

          export declare type SecretKind = 'P2PK' | 'HTLC' | (string & {});

          export declare type SecretsPolicy = 'auto' | 'deterministic' | 'random';

          export declare type SelectProofs = (proofs: ProofLike[], amountToSelect: AmountLike, keyChain: KeyChain, includeFees?: boolean, exactMatch?: boolean, logger?: Logger) => SendResponse;

          export declare function selectProofsRGLI(proofs: ProofLike[], amountToSelect: AmountLike, keyChain: KeyChain, includeFees?: boolean, exactMatch?: boolean, _logger?: Logger): SendResponse;

          /**
           * Builder for composing a send or swap.
           *
           * @remarks
           * If you only customise the send side, keep is omitted so the wallet may still attempt an offline
           * exact match selection where possible.
           * @example
           *
           *     const { keep, send } = await wallet.ops
           *       .send(5, proofs)
           *       .asDeterministic() // counter 0 means auto reserve via CounterSource
           *       .keepAsRandom()
           *       .includeFees(true) // sender pays receiver’s future spend fee
           *       .run();
           */
          export declare class SendBuilder {
              private wallet;
              private proofs;
              private sendOT?;
              private keepOT?;
              private config;
              private offlineExact?;
              private offlineClose?;
              private amount;
              constructor(wallet: Wallet, amount: AmountLike, proofs: ProofLike[]);
              /**
               * Use random blinding for the sent outputs.
               *
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              asRandom(denoms?: AmountLike[]): this;
              /**
               * Use deterministic outputs for the sent proofs.
               *
               * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              asDeterministic(counter?: number, denoms?: AmountLike[]): this;
              /**
               * Use P2PK locked outputs for the sent proofs.
               *
               * @param options NUT 11 options like pubkey and locktime.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              asP2PK(options: P2PKOptions, denoms?: AmountLike[]): this;
              /**
               * Use a factory to generate OutputData for the sent proofs.
               *
               * @param factory OutputDataFactory used to produce blinded messages.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              asFactory(factory: OutputDataFactory, denoms?: AmountLike[]): this;
              /**
               * Provide pre created OutputData for the sent proofs.
               *
               * @param data Fully formed OutputData. Their amounts must sum to the send amount, otherwise the
               *   wallet will throw.
               */
              asCustom(data: OutputDataLike[]): this;
              /**
               * Use random blinding for change outputs.
               *
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              keepAsRandom(denoms?: AmountLike[]): this;
              /**
               * Use deterministic outputs for change.
               *
               * @param counter Starting counter. Zero means auto reserve using the wallet’s CounterSource.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              keepAsDeterministic(counter?: number, denoms?: AmountLike[]): this;
              /**
               * Use P2PK locked change (NUT 11).
               *
               * @param options Locking options applied to the kept proofs.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              keepAsP2PK(options: P2PKOptions, denoms?: AmountLike[]): this;
              /**
               * Use a factory to generate OutputData for change.
               *
               * @param factory OutputDataFactory used to produce blinded messages.
               * @param denoms Optional custom split. Can be partial if you only need SOME specific amounts.
               */
              keepAsFactory(factory: OutputDataFactory, denoms?: AmountLike[]): this;
              /**
               * Provide pre created OutputData for change.
               *
               * @param data Fully formed OutputData for the keep (change) amount.
               */
              keepAsCustom(data: OutputDataLike[]): this;
              /**
               * Make the sender cover the receiver’s future spend fee.
               *
               * @param on When true, include fees in the sent amount. Default true if called.
               */
              includeFees(on?: boolean): this;
              /**
               * Use a specific keyset for the operation.
               *
               * @param id Keyset id to use for mint keys and fee lookup.
               */
              keyset(id: string): this;
              /**
               * Private key(s) used to sign P2PK locked proofs.
               *
               * @param k Single key or array of multisig keys.
               */
              privkey(k: string | string[]): this;
              /**
               * Provide existing proofs to help optimise denomination selection.
               *
               * @remarks
               * Has no effect if denominations (custom split) was specified.
               * @param p Proofs currently held by the wallet, used to hit denomination targets.
               */
              proofsWeHave(p: Array<Pick<ProofLike, 'amount'>>): this;
              /**
               * Receive a callback once counters are atomically reserved for deterministic outputs.
               *
               * @param cb Called with OperationCounters when counters are reserved.
               */
              onCountersReserved(cb: OnCountersReserved): this;
              /**
               * Force a pure offline, exact match selection. No mint calls are made. If an exact match cannot
               * be found, this throws.
               *
               * @param requireDleq Only consider proofs with a DLEQ when true.
               */
              offlineExactOnly(requireDleq?: boolean): this;
              /**
               * Force a pure offline selection that allows a close match, overspend permitted per wallet RGLI.
               * No mint calls are made. Returns the best offline subset found, or throws if funds are
               * insufficient.
               *
               * @param requireDleq Only consider proofs with a DLEQ when true.
               */
              offlineCloseMatch(requireDleq?: boolean): this;
              /**
               * Prepare the swap to send.
               *
               * @remarks
               * Call `wallet.completeSwap(SwapPreview)` to complete the send.
               * @returns A SwapPreview containing inputs, outputs, amount, fee and unselectedProofs.
               */
              prepare(): Promise<SwapPreview>;
              /**
               * Execute the send.
               *
               * @returns The split result with kept and sent proofs.
               */
              run(): Promise<SendResponse>;
          }

          /**
           * Configuration for send operations.
           */
          export declare type SendConfig = {
              keysetId?: string;
              privkey?: string | string[];
              includeFees?: boolean;
              proofsWeHave?: Array<Pick<ProofLike, 'amount'>>;
              onCountersReserved?: OnCountersReserved;
          };

          /**
           * Configuration for offline send operations.
           */
          export declare type SendOfflineConfig = {
              requireDleq?: boolean;
              includeFees?: boolean;
              exactMatch?: boolean;
          };

          /**
           * Response after sending.
           */
          export declare type SendResponse = {
              /**
               * Proofs that exceeded the needed amount.
               */
              keep: Proof[];
              /**
               * Proofs to be sent, matching the chosen amount.
               */
              send: Proof[];
              serialized?: Array<{
                  proof: Proof;
                  keep: boolean;
              }>;
          };

          /**
           * Blinded message for sending to the mint.
           */
          export declare type SerializedBlindedMessage = {
              /**
               * Amount denominated in keyset unit.
               */
              amount: Amount;
              /**
               * Blinded message. Hex length depends on the keyset version:
               *
               * - V1/v2 (`00…` / `01…` id): 66 hex chars (secp256k1 compressed, 33 bytes).
               * - V3 (`02…` id): 96 hex chars (BLS12-381 G1 compressed, 48 bytes).
               */
              B_: string;
              /**
               * Keyset id.
               */
              id: string;
          };

          /**
           * Blinded signature as it is received from the mint.
           */
          export declare type SerializedBlindedSignature = {
              /**
               * Keyset id for indicating which public key was used to sign the blinded message.
               */
              id: string;
              /**
               * Amount denominated in keyset unit.
               */
              amount: Amount;
              /**
               * Blinded signature. Hex length matches `B_` for the same keyset:
               *
               * - V1/v2: 66 hex chars (secp256k1 compressed).
               * - V3: 96 hex chars (BLS12-381 G1 compressed).
               */
              C_: string;
              /**
               * DLEQ Proof.
               */
              dleq?: SerializedDLEQ;
          };

          export declare type SerializedDLEQ = {
              s: string;
              e: string;
              r?: string;
          };

          export declare type SerializedMintKeys = {
              [k: string]: string;
          };

          /**
           * JSON-safe representation of an {@link OutputData} entry.
           */
          export declare type SerializedOutputData = {
              /**
               * Storage shape: `amount` is a decimal string, not an {@link Amount} instance like the wire-shape
               * {@link SerializedBlindedMessage}.
               */
              blindedMessage: {
                  amount: string;
                  B_: string;
                  id: string;
              };
              /**
               * Decimal-encoded bigint.
               */
              blindingFactor: string;
              secret: string;
              ephemeralE?: string;
              /**
               * Exact NUT-13 derivation location when this output was created deterministically.
               */
              nut13?: Nut13OutputLocator;
          };

          export declare function serializeMintKeys(mintKeys: RawMintKeys): SerializedMintKeys;

          /**
           * Serializes one or more {@link Proof} objects to an array of individual JSON strings, one per
           * proof. BigInt `amount` fields are emitted as plain JSON numbers without precision loss.
           *
           * @example
           *
           *     // NutZap proof tags
           *     const proofTags = serializeProofs(proofs).map((s) => ['proof', s]);
           *
           *     // localStorage
           *     localStorage.setItem('proofs', JSON.stringify(serializeProofs(proofs)));
           */
          export declare function serializeProofs(proofs: Proof | Proof[]): string[];

          /**
           * An object containing any custom settings that you want to apply to the global fetch method.
           *
           * @param options See possible options here:
           *   https://developer.mozilla.org/en-US/docs/Web/API/fetch#options.
           */
          export declare function setGlobalRequestOptions(options: Partial<RequestOptions>): void;

          /**
           * Shared properties for most `OutputType` variants (except 'custom').
           */
          export declare interface SharedOutputTypeProps {
              /**
               * Optional custom amounts for splitting outputs.
               *
               * @default Uses basic splitAmount if omitted.
               */
              denominations?: AmountLike[];
          }

          /**
           * @experimental
           */
          export declare const SigAll: SigAllApi;

          /**
           * Helpers for SigAll multi-party signing coordination.
           *
           * @experimental
           */
          export declare type SigAllApi = {
              /**
               * Computes legacy and current SIG_ALL formats.
               *
               * @remarks
               * Returns hex-encoded SHA256 digests for each format to support multi-format signing.
               * @param inputs Proof array.
               * @param outputs Array of SerializedBlindMessage (NUT-00 `BlindMessages`).
               * @param quoteId Optional quote ID for melt transactions.
               * @returns Object with legacy, and current digests (all hex strings)
               * @experimental
               */
              computeDigests: (inputs: Array<Pick<Proof, 'secret' | 'C'>>, outputs: SerializedBlindedMessage[], quoteId?: string) => SigAllDigests;
              /**
               * Extracts a signing package from a SwapPreview for multi-party SIG_ALL coordination.
               *
               * @remarks
               * This creates a minimal, serializable package that can be passed to other signers. Secrets and
               * blinding factors are NOT included - only what's needed to reconstruct the exact SIG_ALL message
               * and produce signatures.
               * @param preview SwapPreview from prepareSwapToSend or prepareSwapToReceive.
               * @returns SigAllSigningPackage for distribution to signers.
               * @experimental
               */
              extractSwapPackage: (preview: SwapPreview) => SigAllSigningPackage;
              /**
               * Extracts a signing package from a MeltPreview for multi-party SIG_ALL coordination.
               *
               * @param preview MeltPreview from prepareMelt.
               * @returns SigAllSigningPackage for distribution to signers.
               * @experimental
               */
              extractMeltPackage: <TQuote extends Pick<MeltQuoteBaseResponse, 'quote'>>(preview: MeltPreview<TQuote>) => SigAllSigningPackage;
              /**
               * @remarks
               * Produces a deterministic JSON representation, base64url-encodes it and prefixes with sigallA
               * for transport.
               *
               * - Field order is fixed and version field is always included for compatibility.
               * - This enables consistent hashing and verification of package integrity.
               *
               * @param pkg The signing package to serialize.
               * @returns JSON string with sorted keys.
               * @experimental
               */
              serializePackage: (pkg: SigAllSigningPackage) => string;
              /**
               * @remarks
               * Accepts a sigallA-prefixed base64url string and rehydrates it into a SigAllSigningPackage.
               * @experimental
               */
              deserializePackage: (input: string, options?: {
                  validateDigest?: boolean;
              }) => SigAllSigningPackage;
              /**
               * Signs a SigAllSigningPackage and returns it with signatures attached.
               *
               * @remarks
               * Collects signatures by signing legacy and current SIG_ALL formats for backward compatibility.
               * Multiple parties can call this sequentially to aggregate signatures for multi-party signing.
               * @param pkg The signing package (from extract*SigningPackage or another signer)
               * @param privkey Private key to sign with.
               * @returns Package with signatures appended to witness field.
               * @experimental
               */
              signPackage: (pkg: SigAllSigningPackage, privkey: string) => SigAllSigningPackage;
              /**
               * Signs a hex-encoded digest with a Schnorr key.
               */
              signDigest: (hexDigest: string, privkey: string) => string;
              /**
               * Merges signatures from a signing package back into a SwapPreview.
               *
               * @remarks
               * Injects collected signatures into the first proof's witness for mint submission. Call this
               * after all parties have signed.
               * @param pkg Signing package with collected signatures.
               * @param preview Original SwapPreview.
               * @returns SwapPreview ready for completeSwap.
               * @experimental
               */
              mergeSwapPackage: (pkg: SigAllSigningPackage, preview: SwapPreview) => SwapPreview;
              /**
               * Merges signatures from a signing package back into a MeltPreview.
               *
               * @param pkg Signing package with collected signatures.
               * @param preview Original MeltPreview.
               * @returns MeltPreview ready for completeMelt.
               * @experimental
               */
              mergeMeltPackage: <TQuote extends Pick<MeltQuoteBaseResponse, 'quote'>>(pkg: SigAllSigningPackage, preview: MeltPreview<TQuote>) => MeltPreview<TQuote>;
          };

          /**
           * @experimental
           */
          export declare type SigAllDigests = {
              legacy: string;
              current: string;
          };

          /**
           * Represents a signing package for SigAll multi-party signing.
           *
           * This is a wallet-led transport format, it contains only the minimum data required to reconstruct
           * the SIG_ALL message.
           *
           * @experimental
           */
          export declare type SigAllSigningPackage = {
              /**
               * Signing package version.
               */
              version: 'sigallA';
              /**
               * Type of signing package.
               */
              type: 'swap' | 'melt';
              /**
               * For melt packages only.
               */
              quote?: string;
              /**
               * Minimal input data required for signing verification.
               */
              inputs: Array<Pick<Proof, 'secret' | 'C'>>;
              /**
               * NUT-00 `BlindedMessages` for signing verification.
               */
              outputs: SerializedBlindedMessage[];
              /**
               * Per-format digests to support multiple SIG_ALL formats.
               */
              digests: {
                  /**
                   * For Nutshell (all releases), CDK < 0.14.0.
                   */
                  legacy?: string;
                  /**
                   * From CDK >= 0.14.0.
                   */
                  current: string;
              };
              /**
               * Signatures collected (to be injected into the first proof witness).
               */
              witness?: {
                  signatures: string[];
              };
          };

          export declare type SigFlag = (typeof SigFlags)[keyof typeof SigFlags];

          export declare const SigFlags: {
              readonly SIG_INPUTS: "SIG_INPUTS";
              readonly SIG_ALL: "SIG_ALL";
          };

          export declare function signMintQuote(privkey: string, quote: string, blindedMessages: SerializedBlindedMessage[]): string;

          /**
           * Signs a single proof with the provided private key if required.
           *
           * @remarks
           * Will only sign if the proof requires a signature from the key.
           * @param proof - A proof to sign.
           * @param privateKey - A single private key (hex string or Uint8Array).
           * @param message - Optional. The message to sign (for SIG_ALL)
           * @returns Signed proofs.
           * @throws Error if signature is not required or proof is already signed.
           */
          export declare function signP2PKProof(proof: Proof, privateKey: PrivKey, message?: string): Proof;

          /**
           * Signs proofs with provided private key(s) if required.
           *
           * @remarks
           * NB: Will only sign if the proof requires a signature from the key.
           * @param proofs - An array of proofs to sign.
           * @param privateKey - A single private key or array of private keys (hex string or Uint8Array).
           * @param logger - Optional logger (default: NULL_LOGGER)
           * @param message - Optional. The message to sign (for SIG_ALL)
           * @returns Signed proofs.
           * @throws On general errors.
           */
          export declare function signP2PKProofs(proofs: Proof[], privateKey: PrivKey | PrivKey[], logger?: Logger, message?: string): Proof[];

          /**
           * Returns a copy of `proofs` sorted by keyset id (lexicographic).
           */
          export declare function sortProofsById(proofs: Proof[]): Proof[];

          /**
           * Splits the amount into denominations of the provided keyset.
           *
           * @remarks
           * Partial splits will be filled up to value using minimum splits required. Sorting is only applied
           * if a fill was made - exact custom splits are always returned in the same order.
           * @param value Amount to split.
           * @param keyset Keys to look up split amounts.
           * @param split? Optional custom split amounts.
           * @param order? Optional order for split amounts (if fill was required)
           * @returns Array of split amounts.
           * @throws Error if split sum is greater than value or mint does not have keys for requested split.
           */
          export declare function splitAmount(value: AmountLike, keyset: Keys, split?: AmountLike[], order?: 'desc' | 'asc'): Amount[];

          /**
           * Removes all traces of DLEQs from a list of proofs.
           *
           * @param proofs The list of proofs that dleq should be stripped from.
           */
          export declare function stripDleq(proofs: Proof[]): Array<Omit<Proof, 'dleq'>>;

          export declare type SubscribeOpts = {
              signal?: AbortSignal;
          };

          export declare type SubscriptionCanceller = () => void;

          /**
           * Sums the `amount` field of the given proofs.
           */
          export declare function sumProofs(proofs: Array<Pick<ProofLike, 'amount'>>): Amount;

          /**
           * Ecash to other MoE swap method, displayed in @type {GetInfoResponse}.
           *
           * @remarks
           * `min_amount` and `max_amount` are `<int|null>` per NUT-04/05/25/XX — null when the mint
           * advertises no lower/upper bound. Consumers should use null-safe checks (`?? 0`, `!= null`,
           * truthy) before passing to `Amount.from(...)`.
           */
          export declare type SwapMethod = {
              method: string;
              unit: string;
              min_amount: AmountLike | null;
              max_amount: AmountLike | null;
              description?: boolean;
              options?: {
                  description?: boolean;
                  amountless?: boolean;
                  confirmations?: number;
              };
          };

          /**
           * Preview of a swap transaction created by prepareSend / prepareReceive.
           *
           * @remarks
           * Contains JSON-unsafe values (`bigint`, `Uint8Array`). Not intended for direct serialization.
           */
          export declare type SwapPreview = {
              /**
               * Amount being sent or received (excluding fees).
               */
              amount: Amount;
              /**
               * Total fees for the swap (inc receiver's fees if applicable)
               */
              fees: Amount;
              /**
               * Keyset ID used to prepare the outputs.
               */
              keysetId: string;
              /**
               * Input Proofs for this transaction.
               */
              inputs: Proof[];
              /**
               * Blinding data to construct proofs to send.
               */
              sendOutputs?: OutputDataLike[];
              /**
               * Blinding data to construct proofs to keep.
               */
              keepOutputs?: OutputDataLike[];
              /**
               * Proofs not selected for this transaction (can be returned to storage).
               */
              unselectedProofs?: Proof[];
          };

          /**
           * Payload that needs to be sent to the mint when performing a split action.
           */
          export declare type SwapRequest = {
              /**
               * Inputs to the split operation.
               */
              inputs: Proof[];
              /**
               * Outputs (blinded messages) to be signed by the mint.
               */
              outputs: SerializedBlindedMessage[];
          };

          /**
           * Response from the mint after performing a split action.
           */
          export declare type SwapResponse = {
              /**
               * Represents the outputs after the split.
               */
              signatures: SerializedBlindedSignature[];
          };

          /**
           * Includes all data required to swap inputs for outputs and construct proofs from them.
           *
           * @remarks
           * Contains JSON-unsafe values (`bigint`, `Uint8Array`). Not intended for direct serialization.
           */
          export declare type SwapTransaction = {
              /**
               * Payload that will be sent to the mint for a swap.
               */
              payload: SwapRequest;
              /**
               * Blinding data required to construct proofs.
               */
              outputData: OutputDataLike[];
              /**
               * List of booleans to determine which proofs to keep.
               */
              keepVector: boolean[];
              /**
               * Indices that can be used to restore original output data.
               */
              sortedIndices: number[];
          };

          /**
           * A normalized Cashu token.
           *
           * @remarks
           * Used for decoded v3 and v4 token payloads in the public API.
           */
          export declare type Token = {
              /**
               * The mints URL.
               */
              mint: string;
              /**
               * A list of proofs.
               */
              proofs: Proof[];
              /**
               * A message to send along with the token.
               */
              memo?: string;
              /**
               * The unit of the token.
               */
              unit?: string;
          };

          /**
           * Metadata for a Cashu token.
           */
          export declare type TokenMetadata = {
              /**
               * The unit of the token.
               */
              unit: string;
              /**
               * The memo of the token.
               */
              memo?: string;
              /**
               * The mint of the token.
               */
              mint: string;
              /**
               * The amount of the token.
               */
              amount: Amount;
              /**
               * The incomplete proofs of the token.
               */
              incompleteProofs: Array<Omit<Proof, 'id'>>;
          };

          export declare type TokenResponse = {
              access_token?: string;
              token_type?: string;
              expires_in?: number;
              refresh_token?: string;
              id_token?: string;
              scope?: string;
              error?: string;
              error_description?: string;
          };

          export declare type UnblindedSignature = {
              C: WeierstrassPoint<bigint>;
              secret: Uint8Array;
              id: string;
          };

          export declare function unblindSignature(C_: WeierstrassPoint<bigint>, r: bigint, A: WeierstrassPoint<bigint>): WeierstrassPoint<bigint>;

          /**
           * Wallet-side multiplicative unblinding: C = C_ * r⁻¹. Note: unlike secp additive blinding, the
           * mint pubkey is not needed here.
           */
          export declare function unblindSignatureBls(C_: G1Point, r: bigint): G1Point;

          export declare const verifyDLEQProof: (dleq: DLEQ, B_: WeierstrassPoint<bigint>, C_: WeierstrassPoint<bigint>, A: WeierstrassPoint<bigint>) => boolean;

          export declare const verifyDLEQProof_reblind: (secret: Uint8Array, // secret
          dleq: DLEQ, C: WeierstrassPoint<bigint>, // unblinded e-cash signature point
          A: WeierstrassPoint<bigint>) => boolean;

          /**
           * Verify an HTLC hash/preimage pair.
           *
           * @param preimage - As a 64-character lowercase hexadecimal string.
           * @param hash - As a 64-character lowercase hexadecimal string.
           * @returns True if preimage calculates the same hash, False otherwise.
           */
          export declare function verifyHTLCHash(preimage: string, hash: string): boolean;

          /**
           * Verify HTLC spending conditions for a single input.
           *
           * Two spending paths are available:
           *
           * 1. Hashlock path: Preimage + signatures from the main pubkeys (always valid)
           * 2. Refund path: signatures from refund pubkeys (only valid after locktime)
           *
           * In addition, if the lock has expired and no refund keys are present, the proof is considered
           * unlocked and spendable without witness signatures.
           *
           * @remarks
           * Returns a detailed P2PKVerificationResult showing the conditions. If you just want a boolean
           * result, use isP2PKSpendAuthorised().
           * @param proof - The Proof to check.
           * @param logger - Optional logger (default: NULL_LOGGER)
           * @param message - Optional. The message to sign (for SIG_ALL)
           * @returns A P2PKVerificationResult describing the spending outcome.
           * @throws If verification is impossible.
           */
          export declare function verifyHTLCSpendingConditions(proof: Proof, logger?: Logger, message?: string): P2PKVerificationResult;

          export declare function verifyMintQuoteSignature(pubkey: string, quote: string, blindedMessages: SerializedBlindedMessage[], signature: string): boolean;

          /**
           * Verify P2PK spending conditions for a single input.
           *
           * Two spending paths are available:
           *
           * 1. Normal path: signatures from the main pubkeys (always valid)
           * 2. Refund path: signatures from refund pubkeys (only valid after locktime)
           *
           * In addition, if the lock has expired and no refund keys are present, the proof is considered
           * unlocked and spendable without witness signatures.
           *
           * @remarks
           * First validates the spending conditions are well-formed, then checks whether the proof's witness
           * signatures meet the threshold.
           *
           * Wallets can call this with unsigned proofs on receive to validate conditions. Returns a detailed
           * P2PKVerificationResult showing the conditions. If you just want a boolean result, use
           * isP2PKSpendAuthorised().
           * @param proof - The Proof to check.
           * @param logger - Optional logger (default: NULL_LOGGER)
           * @param message - Optional. The message to sign (for SIG_ALL)
           * @returns A P2PKVerificationResult describing the spending outcome.
           * @throws If spending conditions are malformed, or verification is impossible.
           */
          export declare function verifyP2PKSpendingConditions(proof: Proof, logger?: Logger, message?: string): P2PKVerificationResult;

          /**
           * Verifies a batch of received proofs in one pass, batching the v3 (BLS) subset into a single
           * multi-pairing while keeping per-proof DLEQ verification for v0/v1/v2.
           *
           * Batch path: builds the {K2, C, secret} triples once, runs `batchVerifyUnblindedSignatureBls`, and
           * on failure re-runs per-proof to identify the offending proof — cost is one extra batch's worth of
           * work on the unhappy path, acceptable.
           *
           * @param proofs The proofs to verify (mixed curves allowed; `amount` may be any {@link AmountLike}
           *   shape — normalized internally).
           * @param getKeyset Lookup callback (e.g. `(id) => keyChain.getKeyset(id)`).
           * @param opts.requireDleq Forwarded to {@link hasValidDleq} as `require` for v0/v1/v2 proofs;
           *   ignored for v3.
           * @throws CTSError if any proof's amount is not in its keyset, or DLEQ/pairing verification fails.
           */
          export declare function verifyProofsForReceive(proofs: ProofLike[], getKeyset: (id: string) => HasKeysetKeys, opts?: {
              requireDleq?: boolean;
          }): void;

          /**
           * Mint-side keyed verification: holds iff the proof's `C` equals `a · hashToCurve(secret)`.
           *
           * @remarks
           * Dispatches by keyset version. v0/v1/v2 keysets use secp256k1; v3 keysets use BLS12-381 G1. The
           * wallet-side pairing equivalent for v3 is {@link verifyUnblindedSignatureBls} in `./curve_bls`.
           */
          export declare function verifyUnblindedSignature(proof: UnblindedSignature, privKey: Uint8Array): boolean;

          /**
           * Wallet-side verification via pairing equality: e(C, G2_gen) == e(Y, K2).
           *
           * @remarks
           * Implemented as `e(-C, G2_gen) · e(Y, K2) == 1` and evaluated through `pairingBatch`, which
           * accumulates both Miller loops and applies a single final exponentiation. That saves one final
           * exponentiation versus two separate `pairing(...)` calls — material on low-power devices since
           * final exp is ~60% of the cost of a BLS12-381 pairing.
           * @param K2 Mint pubkey in G2 for this amount.
           * @param C Unblinded signature (G1).
           * @param secret UTF-8 byte encoded secret.
           */
          export declare function verifyUnblindedSignatureBls(K2: G2Point, C: G1Point, secret: Uint8Array): boolean;

          /**
           * Class that represents a Cashu wallet.
           *
           * @remarks
           * This class should act as the entry point for this library. Can be instantiated with a mint
           * instance or mint url.
           * @example
           *
           * ```typescript
           * import { Wallet } from '@cashu/cashu-ts';
           * const wallet = new Wallet('http://localhost:3338', { unit: 'sat' });
           * await wallet.loadMint(); // Initialize mint info, keysets, and keys
           * // Wallet is now ready to use, eg:
           * const proofs = [...]; // your array of unspent proofs
           * const { keep, send } = await wallet.send(32, proofs);
           * ```
           */
          declare class Wallet {
              /**
               * Mint instance - allows direct calls to the mint.
               */
              readonly mint: Mint;
              /**
               * Entry point for the builder.
               *
               * @example
               *
               *     const { keep, send } = await wallet.ops
               *       .send(5, proofs)
               *       .asDeterministic() // counter: 0 = auto
               *       .keepAsRandom()
               *       .includeFees(true)
               *       .run();
               *
               *     const proofs = await wallet.ops
               *       .receive(token)
               *       .asDeterministic()
               *       .keyset(wallet.keysetId)
               *       .run();
               */
              readonly ops: WalletOps;
              /**
               * Convenience wrapper for events.
               */
              readonly on: WalletEvents;
              /**
               * Developer-friendly counters API.
               */
              readonly counters: WalletCounters;
              /**
               * Optional NUT-CTF wallet facade. Enabled with `new Wallet(mint, { enableCtf: true })`.
               */
              readonly ctf: WalletCtf | undefined;
              private _keyChain;
              private _seed;
              private _unit;
              private _mintInfo;
              private _denominationTarget;
              private _secretsPolicy;
              private _counterSource;
              private _boundKeysetId;
              private _selectProofs;
              private _outputDataCreator;
              private _requireSigDleq;
              private _logger;
              /**
               * Create a wallet for a given mint and unit. Call `loadMint` before use.
               *
               * Binding, if `options.keysetId` is omitted, the wallet binds to the cheapest active keyset for
               * this unit during `loadMint`.
               *
               * Caching, preload mint info and keychain data by calling `loadMintFromCache` after construction.
               *
               * The keychain stores all loaded keysets and filters query results by the wallet unit.
               *
               * Deterministic secrets, pass `bip39seed` and optionally `secretsPolicy`. Deterministic outputs
               * reserve counters from `counterSource`, or an ephemeral in memory source if not supplied.
               * `initialCounter` applies only with a supplied `keysetId` and the ephemeral source.
               *
               * Splitting, `denominationTarget` guides proof splits, default is 3. Override coin selection with
               * `selectProofs` if needed. Logging defaults to a null logger.
               *
               * @param mint Mint instance or URL.
               * @param options Optional settings.
               * @param options.unit Wallet unit, default 'sat'.
               * @param options.keysetId Bind to this keyset id, else bind on `loadMint`.
               * @param options.bip39seed BIP39 seed for deterministic secrets.
               * @param options.secretsPolicy Secrets policy, default 'auto'.
               * @param options.counterSource Counter source for deterministic outputs. If provided, this takes
               *   precedence over counterInit. Use when you need persistence across processes or devices.
               * @param options.counterInit Seed values for the built-in EphemeralCounterSource. Ignored if
               *   counterSource is also provided.
               * @param options.denominationTarget Target proofs per denomination, default 3.
               * @param options.selectProofs Custom proof selection function.
               * @param options.outputDataCreator Custom OutputDataCreator implementation. The canonical and
               *   maintained implementation is the default Noble Curves based behavior exposed by
               *   `OutputData.create*()`. Custom creators are an escape hatch for runtime-specific needs, and
               *   compatibility and maintenance are the integrator's responsibility.
               * @param options.requireSigDleq Fail mint/swap/melt responses when the mint advertises NUT-12
               *   support but omits DLEQ proofs on returned blinded signatures. This is a fail-fast consistency
               *   check, not protection against a malicious mint already consuming inputs or payments.
               * @param options.enableCtf Enables the optional NUT-CTF facade at `wallet.ctf`.
               * @param options.logger Logger instance, default null logger.
               */
              constructor(mint: Mint | string, options?: {
                  unit?: string;
                  authProvider?: AuthProvider;
                  keysetId?: string;
                  bip39seed?: Uint8Array;
                  secretsPolicy?: SecretsPolicy;
                  counterSource?: CounterSource;
                  counterInit?: Record<string, number>;
                  denominationTarget?: number;
                  selectProofs?: SelectProofs;
                  outputDataCreator?: OutputDataCreator;
                  requireSigDleq?: boolean;
                  enableCtf?: boolean;
                  logger?: Logger;
              });
              private createCtfFacade;
              private fail;
              private failIf;
              private failIfNullish;
              private requireSupport;
              private safeCallback;
              /**
               * Parses AmountLike to Amount.
               */
              private parseAmount;
              /**
               * Load mint information, keysets, and keys.
               *
               * @remarks
               * Must be called before using other methods, unless loading mint from cache. See:
               * `loadMintFromCache`.
               * @param forceRefresh If true, re-fetches data even if cached.
               * @param requestOptions Optional transport bounds applied to every mint-loading request.
               * @throws If fetching mint info, keysets, or keys fails.
               */
              loadMint(forceRefresh?: boolean, requestOptions?: Pick<RequestOptions, 'requestTimeout' | 'responseBodyBytesLimit' | 'signal'>): Promise<void>;
              /**
               * Load mint information, keysets, and keys from cached data.
               *
               * @remarks
               * Use this when you already have cached mint info and keychain cache and want to avoid network
               * calls.
               *
               * The `cache` argument should usually come from `wallet.keyChain.cache`.
               */
              loadMintFromCache(mintInfo: GetInfoResponse, cache: KeyChainCache): void;
              /**
               * Finishes wiring up the wallet instance and checks we are "Go for launch".
               */
              private finishInit;
              /**
               * Get the wallet's KeyChain.
               *
               * @returns The Keychain.
               */
              get keyChain(): KeyChain;
              /**
               * Get the wallet's unit.
               *
               * @returns The unit (e.g., 'sat').
               */
              get unit(): string;
              /**
               * Get information about the mint.
               *
               * @remarks
               * Returns cached mint info. Call `loadMint` first to initialize the wallet.
               * @returns Mint info.
               * @throws If mint info is not initialized.
               */
              getMintInfo(): MintInfo;
              /**
               * The keyset ID bound to this wallet instance.
               */
              get keysetId(): string;
              /**
               * Gets the requested keyset or the keyset bound to the wallet.
               *
               * @remarks
               * This method enforces wallet policies. If `id` is omitted, it returns the keyset bound to this
               * wallet, including validation that:
               *
               * - The keyset exists in the keychain,
               * - The unit matches the wallet's unit,
               * - Keys are loaded for that keyset.
               *
               * Contrast with `keyChain.getKeyset(id?)`, which, when called without an id, returns the cheapest
               * active keyset for the unit, ignoring the wallet binding.
               * @param id Optional keyset id to resolve. If omitted, the wallet's bound keyset is used.
               * @returns The resolved `Keyset`.
               * @throws If the keyset is not found, has no keys, or its unit differs from the wallet.
               */
              getKeyset(id?: string): Keyset;
              get logger(): Logger;
              private reserveFor;
              private countersNeeded;
              private addCountersToOutputTypes;
              /**
               * Bind this wallet to a specific keyset id.
               *
               * @remarks
               * This changes the default keyset used by all operations that do not explicitly pass a keysetId.
               * The method validates that the keyset exists in the keychain, matches the wallet unit, and has
               * keys loaded.
               *
               * Typical uses:
               *
               * 1. After loadMint, to pin the wallet to a particular active keyset.
               * 2. After a refresh, to rebind deliberately rather than falling back to cheapest.
               *
               * @param id The keyset identifier to bind to.
               * @throws If keyset not found, if it has no keys loaded, or if its unit is not the wallet unit.
               */
              bindKeyset(id: string): void;
              /**
               * Creates a new Wallet bound to a different keyset, sharing the same CounterSource.
               *
               * Use this to operate on multiple keysets concurrently without mutating your original wallet.
               * Counters remain monotonic across instances because the same CounterSource is reused.
               *
               * Do NOT pass a fresh CounterSource for the same seed unless you know exactly why. Reusing
               * counters can recreate secrets that a mint will reject.
               *
               * @param id The keyset identifier to bind to.
               * @throws If keyset not found, if it has no keys loaded, or if its unit is not the wallet unit.
               */
              withKeyset(id: string, opts?: {
                  counterSource?: CounterSource;
              }): Wallet;
              /**
               * Returns the default OutputType for this wallet, based on its configured secrets policy
               * (options?.secretsPolicy) and seed state.
               *
               * - If the secrets policy is 'random', returns { type: 'random' }.
               * - If the policy is 'deterministic', requires a seed and returns { type: 'deterministic', counter:
               *   0 }. Counter 0 is a flag meaning "auto-increment from current state".
               * - If no explicit policy is set, falls back to:
               *
               *   - Deterministic if a seed is present.
               *   - Random if no seed is present.
               *
               * @returns An OutputType object describing the default output strategy.
               * @throws Error if the policy is 'deterministic' but no seed has been set.
               */
              defaultOutputType(): OutputType;
              /**
               * Configures output denominations with fee adjustments and optimization.
               *
               * @remarks
               * If 'custom' outputType, data outputs MUST sum to the amount. Other outputTypes may supply
               * denominations. If no denominations are passed in, they will be calculated based on proofsWeHave
               * or the default split. If partial denominations are passed in, the balance will be added using
               * default split. Additional denominations to cover fees will then be added if required.
               * @param amount The total amount for outputs.
               * @param keyset The mint keyset.
               * @param outputType The output configuration.
               * @param includeFees Whether to include swap fees in the output amount.
               * @param proofsWeHave Optional proofs for optimizing denomination splitting.
               * @returns OutputType with required denominations.
               */
              private configureOutputs;
              /**
               * Sum total implied by a prepared OutputType.
               *
               * Note: Empty denomination is valid (e.g: zero change).
               */
              private preparedTotal;
              /**
               * Generates blinded messages based on the specified output type.
               *
               * @param amount The total amount for outputs.
               * @param keyset The mint keys.
               * @param outputType The output configuration.
               * @returns Prepared output data.
               */
              private createOutputData;
              /**
               * Creates a swap transaction with sorted outputs for privacy. This prevents a mint working out
               * which proofs will be sent or kept.
               *
               * @param inputs Prepared input proofs.
               * @param keepOutputs Outputs to keep (change or receiver's proofs).
               * @param sendOutputs Outputs to send (optional, default empty for receive/mint).
               * @returns Swap transaction with payload and metadata for processing signatures.
               */
              private createSwapTransaction;
              /**
               * Receive a token (swaps with mint for new proofs)
               *
               * @example
               *
               * ```typescript
               * const result = await wallet.receive(
               *   token,
               *   { requireDleq: true },
               *   { type: 'deterministic', counter: 0 },
               * );
               * ```
               *
               * @param token Token string, decoded token, or raw proof array.
               * @param config Optional receive config.
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns Newly minted proofs.
               */
              receive(token: Token | string | ProofLike[], config?: ReceiveConfig, outputType?: OutputType): Promise<Proof[]>;
              /**
               * Prepare A Receive Transaction.
               *
               * @remarks
               * Allows you to preview fees for a receive, get concrete outputs for P2PK SIG_ALL transactions,
               * and do any pre-swap tasks (such as marking proofs in-flight etc)
               * @example
               *
               * ```typescript
               * // Prepare transaction
               * const txn = await wallet.prepareSwapToReceive(token, { requireDleq: true });
               * const fees = txn.fees;
               *
               * // Complete transaction
               * const { keep } = await wallet.completeSwap(txn);
               * ```
               *
               * @param token Token string, decoded token, or raw proof array.
               * @param config Optional receive config.
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns SwapPreview with metadata for swap transaction.
               */
              prepareSwapToReceive(token: Token | string | ProofLike[], config?: ReceiveConfig, outputType?: OutputType): Promise<SwapPreview>;
              /**
               * Sends proofs of a given amount from provided proofs.
               *
               * @remarks
               * If proofs are P2PK-locked to your public key, call signP2PKProofs first to sign them. The
               * default config uses exact match selection, and does not includeFees or requireDleq. Because the
               * send is offline, the user will unlock the signed proofs when they receive them online.
               * @param amount Amount to send.
               * @param proofs Array of proofs (must sum >= amount; pre-sign if P2PK-locked).
               * @param config Optional parameters for the send.
               * @returns SendResponse with keep/send proofs.
               * @throws Throws if the send cannot be completed offline.
               */
              sendOffline(amount: AmountLike, proofs: ProofLike[], config?: SendOfflineConfig): SendResponse;
              /**
               * Send proofs with online swap if necessary.
               *
               * @example
               *
               * ```typescript
               * // Simple send
               * const result = await wallet.send(5, proofs);
               *
               * // With a SendConfig
               * const result = await wallet.send(5, proofs, { includeFees: true });
               *
               * // With Custom output configuration
               * const customConfig: OutputConfig = {
               *   send: { type: 'p2pk', options: { pubkey: '...' } },
               *   keep: { type: 'deterministic', counter: 0 },
               * };
               * const customResult = await wallet.send(5, proofs, { includeFees: true }, customConfig);
               * ```
               *
               * @param amount Amount to send (receiver gets this net amount).
               * @param proofs Array of proofs to split.
               * @param config Optional parameters for the swap.
               * @returns SendResponse with keep/send proofs.
               * @throws Throws if the send cannot be completed offline or if funds are insufficient.
               */
              send(amount: AmountLike, proofs: ProofLike[], config?: SendConfig, outputConfig?: OutputConfig): Promise<SendResponse>;
              /**
               * Prepare A Send Transaction.
               *
               * @remarks
               * Allows you to preview fees for a send, get concrete outputs for P2PK SIG_ALL transactions, and
               * do any pre-swap tasks (such as marking proofs in-flight etc)
               * @example
               *
               * ```typescript
               * // Prepare transaction
               * const txn = await wallet.prepareSwapToSend(5, proofs, { includeFees: true });
               * const fees = txn.fees;
               *
               * // Complete transaction
               * const { keep, send } = await wallet.completeSwap(txn);
               * ```
               *
               * @param amount Amount to send (receiver gets this net amount).
               * @param proofs Array of proofs to split.
               * @param config Optional parameters for the swap.
               * @returns SwapPreview with metadata for swap transaction.
               * @throws Throws if the send cannot be completed offline or if funds are insufficient.
               */
              prepareSwapToSend(amount: AmountLike, proofs: ProofLike[], config?: SendConfig, outputConfig?: OutputConfig): Promise<SwapPreview>;
              /**
               * Complete a prepared swap transaction.
               *
               * @example
               *
               * ```typescript
               * // Prepare transaction
               * const txn = await wallet.prepareSwapToSend(5, proofs, { includeFees: true });
               *
               * // Complete transaction
               * const result = await wallet.completeSwap(txn);
               * ```
               *
               * @param swapPreview With metadata for swap transaction.
               * @param privkey The private key(s) for signing.
               * @returns SendResponse with keep/send proofs.
               */
              completeSwap(swapPreview: SwapPreview, privkey?: string | string[]): Promise<SendResponse>;
              /**
               * Swap proofs within one conditional keyset.
               *
               * CTF conditional keysets are condition-derived and are not listed as regular NUT-02 keysets.
               * This method loads the conditional keyset through the KeyChain's conditional registry so the
               * condition-derived keyset id is verified before any blinded output is built.
               */
              prepareConditionalSwap(options: ConditionalSwapOptions): Promise<ConditionalSwapPreview>;
              completeConditionalSwap(preview: ConditionalSwapPreview): Promise<Record<string, Proof[]>>;
              swapConditional(options: ConditionalSwapOptions): Promise<Record<string, Proof[]>>;
              redeemOutcomeProofs(options: RedeemOutcomeProofsOptions): Promise<Proof[]>;
              /**
               * Selects proofs to send based on amount and fee inclusion.
               *
               * @remarks
               * Uses an adapted Randomized Greedy with Local Improvement (RGLI) algorithm, which has a time
               * complexity O(n log n) and space complexity O(n).
               * @param proofs Array of proofs available to select from. Accepts {@link ProofLike} so proofs
               *   loaded from storage (with `amount: number`) work without manual conversion.
               * @param amountToSend The target amount to send.
               * @param includeFees Optional boolean to include fees; Default: false.
               * @param exactMatch Optional boolean to require exact match; Default: false.
               * @returns SendResponse containing proofs to keep and proofs to send.
               * @throws Throws an error if an exact match cannot be found within MAX_TIMEMS.
               * @see https://crypto.ethz.ch/publications/files/Przyda02.pdf
               */
              selectProofsToSend(proofs: ProofLike[], amountToSend: AmountLike, includeFees?: boolean, exactMatch?: boolean): SendResponse;
              /**
               * Prepares proofs for sending by signing P2PK-locked proofs.
               *
               * @remarks
               * Call this method before operations like send if the proofs are P2PK-locked and need unlocking.
               * This is a public wrapper for signing.
               * @param proofs The proofs to sign.
               * @param privkey The private key(s) for signing.
               * @param outputData Optional. For signing of SIG_ALL transactions.
               * @param quoteId Optional. For signing SIG_ALL melt transactions.
               * @returns Signed proofs.
               */
              signP2PKProofs(proofs: ProofLike[], privkey: string | string[], outputData?: OutputDataLike[], quoteId?: string): Proof[];
              /**
               * Calculates the fees based on inputs (proofs)
               *
               * @param proofs Input proofs to calculate fees for.
               * @returns Fee amount.
               * @throws Throws an error if the proofs keyset is unknown.
               */
              getFeesForProofs(proofs: Array<Pick<Proof, 'id'>>): Amount;
              /**
               * Returns the current fee PPK for a proof according to the cached keyset.
               *
               * @param proof {Proof} A single proof.
               * @returns FeePPK {number} The feePPK for the selected proof.
               * @throws Throws an error if the proofs keyset is unknown.
               */
              private getProofFeePPK;
              /**
               * Calculates the fees based on inputs for a given keyset.
               *
               * @param nInputs Number of inputs.
               * @param keysetId KeysetId used to lookup `input_fee_ppk`
               * @returns Fee amount.
               */
              getFeesForKeyset(nInputs: number, keysetId: string): Amount;
              /**
               * Largest spendable amount from a proof set after subtracting the per-proof input fees the mint
               * charges and optionally a melt quote's `fee_reserve`.
               *
               * @remarks
               * Single step of a "melt all" iteration: fetch a melt quote, call this with the quote's
               * `fee_reserve` to get the largest amount that fits, then re-quote for that amount (since
               * `fee_reserve` may shrink with the smaller amount). Repeat until the result stabilises.
               * @param proofs Proofs the caller intends to spend.
               * @param feeReserve Optional. `fee_reserve` from a related melt quote (default: 0)
               * @returns The largest spendable amount, or zero if fees exceed the available total.
               */
              maxSpendableAfterFees(proofs: ProofLike[], feeReserve?: AmountLike): Amount;
              /**
               * Prepares inputs for a mint operation.
               *
               * @remarks
               * Internal method; strips DLEQ (NUT-12) and p2pk_e (NUT-28) for privacy and serializes witnesses.
               * Returns an array of new proof objects - does not mutate the originals.
               * @param proofs The proofs to prepare.
               * @param keepDleq Optional boolean to keep DLEQ (default: false, strips for privacy).
               * @param keepP2pkE Optional boolean to keep NUT-28 "E" (default: false, strips for privacy).
               * @returns Prepared proofs for mint payload.
               */
              private _prepareInputsForMint;
              /**
               * Normalizes a proof's witness for the mint payload.
               *
               * Serializes object witnesses to JSON and strips witnesses from non-NUT-10 secrets (plain secrets
               * with a witness field are rejected by mints).
               */
              private _normalizeWitness;
              /**
               * Decodes a string token.
               *
               * @remarks
               * Rehydrates a token from the space-saving CBOR format, including mapping short keyset ids to
               * their full representation.
               * @param token The token in string format (cashuB...)
               * @returns Token object.
               */
              decodeToken(token: string): Token;
              /**
               * Restores batches of deterministic proofs until no more signatures are returned from the mint.
               *
               * @param [gapLimit=300] The amount of empty counters that should be returned before restoring
               *   ends (defaults to 300). Default is `300`
               * @param [batchSize=300] The amount of proofs that should be restored at a time (defaults to
               *   300). Default is `300`
               * @param [counter=0] The counter that should be used as a starting point (defaults to 0). Default
               *   is `0`
               * @param [keysetId] Which keysetId to use for the restoration. If none is passed the instance's
               *   default one will be used.
               */
              batchRestore(gapLimit?: number, batchSize?: number, counter?: number, keysetId?: string): Promise<{
                  proofs: Proof[];
                  lastCounterWithSignature?: number;
              }>;
              /**
               * Regenerates.
               *
               * @param start Set starting point for count (first cycle for each keyset should usually be 0)
               * @param count Set number of blinded messages that should be generated.
               * @param options.keysetId Set a custom keysetId to restore from. @see `keyChain)`
               */
              restore(start: number, count: number, config?: RestoreConfig): Promise<{
                  proofs: Proof[];
                  lastCounterWithSignature?: number;
              }>;
              /**
               * Creates a mint quote for any payment method.
               *
               * @remarks
               * Generic method for requesting a mint quote. The payload is method-specific but must at minimum
               * include the fields required by the mint for the given method. An optional `normalize` callback
               * can be used to coerce method-specific response fields.
               *
               * For first-class methods, prefer the typed helpers: `createMintQuoteBolt11()`,
               * `createMintQuoteBolt12()`.
               * @param method The payment method (e.g., 'bolt11', 'bolt12', 'bacs', 'swift').
               * @param payload The request body to POST. `unit` is always set to the wallet's unit.
               * @param options.normalize Optional callback to normalize method-specific response fields.
               * @returns The mint quote response.
               */
              createMintQuote(amount: AmountLike, description?: string): Promise<MintQuoteBolt11Response>;
              createMintQuote<TRes extends MintQuoteBaseResponse = MintQuoteBaseResponse>(method: string, payload: Record<string, unknown>, options?: {
                  normalize?: (raw: Record<string, unknown>) => TRes;
              }): Promise<TRes>;
              /**
               * Requests a mint quote from the mint. Response returns a Lightning payment request for the
               * requested given amount and unit.
               *
               * @param amount Amount requesting for mint.
               * @param description Optional description for the mint quote.
               * @param pubkey Optional public key to lock the quote to.
               * @returns The mint will return a mint quote with a Lightning invoice for minting tokens of the
               *   specified amount and unit.
               */
              createMintQuoteBolt11(amount: AmountLike, description?: string): Promise<MintQuoteBolt11Response>;
              /**
               * Requests a mint quote from the mint that is locked to a public key.
               *
               * @param amount Amount requesting for mint.
               * @param pubkey Public key to lock the quote to.
               * @param description Optional description for the mint quote.
               * @returns The mint will return a mint quote with a Lightning invoice for minting tokens of the
               *   specified amount and unit. The quote will be locked to the specified `pubkey`.
               */
              createLockedMintQuote(amount: AmountLike, pubkey: string, description?: string): Promise<MintQuoteBolt11Response>;
              /**
               * Requests a mint quote from the mint. Response returns a Lightning BOLT12 offer for the
               * requested given amount and unit.
               *
               * @param pubkey Public key to lock the quote to.
               * @param options.amount BOLT12 offer amount requesting for mint. If not specified, the offer will
               *   be amountless.
               * @param options.description Description for the mint quote.
               * @returns The mint will return a mint quote with a BOLT12 offer for minting tokens of the
               *   specified amount and unit.
               */
              createMintQuoteBolt12(pubkey: string, options?: {
                  amount?: AmountLike;
                  description?: string;
              }): Promise<MintQuoteBolt12Response>;
              /**
               * Requests an onchain mint quote from the mint. Response returns a Bitcoin address for the
               * requested unit.
               *
               * @param pubkey Public key to lock the quote to. Required for onchain minting.
               * @returns The mint will return a mint quote with a Bitcoin address for minting tokens.
               * @experimental Onchain support follows NUT-30 semantics and may change.
               */
              createMintQuoteOnchain(pubkey: string): Promise<MintQuoteOnchainResponse>;
              /**
               * Checks an existing mint quote for any payment method.
               *
               * @remarks
               * Generic method for checking a mint quote status. An optional `normalize` callback can be used
               * to coerce method-specific response fields.
               *
               * For first-class methods, prefer the typed helpers: `checkMintQuoteBolt11()`,
               * `checkMintQuoteBolt12()`.
               * @param method The payment method (e.g., 'bolt11', 'bolt12', 'bacs', 'swift').
               * @param quote Quote ID or quote object (must have a `quote` field).
               * @param options.normalize Optional callback to normalize method-specific response fields.
               * @returns The mint quote response.
               */
              checkMintQuote(quote: string | MintQuoteBolt11Response): Promise<MintQuoteBolt11Response>;
              checkMintQuote<TRes extends MintQuoteBaseResponse = MintQuoteBaseResponse>(method: string, quote: string | Pick<TRes, 'quote'>, options?: {
                  normalize?: (raw: Record<string, unknown>) => TRes;
              }): Promise<TRes>;
              /**
               * Gets an existing mint quote from the mint.
               *
               * @param quote Quote ID.
               * @returns The mint will create and return a Lightning invoice for the specified amount.
               */
              checkMintQuoteBolt11(quote: string | MintQuoteBolt11Response): Promise<MintQuoteBolt11Response>;
              /**
               * Gets an existing BOLT12 mint quote from the mint.
               *
               * @param quote Quote ID.
               * @returns The latest mint quote for the given quote ID.
               */
              checkMintQuoteBolt12(quote: string): Promise<MintQuoteBolt12Response>;
              /**
               * Gets an existing onchain mint quote from the mint.
               *
               * @param quote Quote ID.
               * @returns The latest mint quote for the given quote ID.
               * @experimental Onchain support follows NUT-30 semantics and may change.
               */
              checkMintQuoteOnchain(quote: string): Promise<MintQuoteOnchainResponse>;
              private validateReturnedSignatures;
              private validateMintQuoteAvailableAmount;
              /* Excluded from this release type: validateMintQuote */
              /* Excluded from this release type: validateMeltQuote */
              /**
               * Mints proofs for any payment method.
               *
               * @remarks
               * Generic convenience method that calls `prepareMint(method, …)` followed by `completeMint()`.
               *
               * Intended primarily for custom payment methods. For first-class methods, prefer
               * `mintProofsBolt11()` or `mintProofsBolt12()`, which keep the method-specific wallet ergonomics
               * and validation.
               * @param method The payment method (e.g., 'bolt11', 'bolt12', 'bacs', 'swift').
               * @param amount Amount to mint.
               * @param quote The mint quote object (must have at least a `quote` field).
               * @param config Optional parameters (e.g. privkey for locked quotes).
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns Minted proofs.
               */
              mintProofs(amount: AmountLike, quote: string | MintQuoteBolt11Response, config?: MintProofsConfig, outputType?: OutputType): Promise<Proof[]>;
              mintProofs<TQuote extends Pick<MintQuoteBaseResponse, 'quote'>>(method: string, amount: AmountLike, quote: TQuote, config?: MintProofsConfig, outputType?: OutputType): Promise<Proof[]>;
              /**
               * Mint proofs for a bolt11 quote.
               *
               * @remarks
               * Convenience helper for the common BOLT11 flow. Internally this uses `prepareMint('bolt11',…)`
               * followed by `completeMint()`. Use `prepareMint()` directly when you need the generic method
               * based API or want to persist a replay-safe preview before completion.
               * @param amount Amount to mint.
               * @param quote Mint quote ID or object (bolt11).
               * @param config Optional parameters (e.g. privkey for locked quotes).
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns Minted proofs.
               */
              mintProofsBolt11(amount: AmountLike, quote: string | MintQuoteBolt11Response, config?: MintProofsConfig, outputType?: OutputType): Promise<Proof[]>;
              /**
               * Mints proofs for a bolt12 quote.
               *
               * @remarks
               * Convenience helper for the common BOLT12 flow. Internally this uses `prepareMint('bolt12',…)`
               * followed by `completeMint()`. Use `prepareMint()` directly when you need the generic method
               * based API or want to persist a replay-safe preview before completion.
               * @param amount Amount to mint.
               * @param quote Bolt12 mint quote.
               * @param privkey Private key to unlock the quote.
               * @param config Optional parameters (e.g. keysetId).
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns Minted proofs.
               */
              mintProofsBolt12(amount: AmountLike, quote: MintQuoteBolt12Response, privkey: string, config?: {
                  keysetId?: string;
              }, outputType?: OutputType): Promise<Proof[]>;
              /**
               * Mints proofs using an onchain quote.
               *
               * @remarks
               * Convenience helper for the onchain flow. Pubkey is always required for onchain mint quotes, so
               * `privkey` is always needed. Use `prepareMint()` directly when you need the generic method based
               * API or want to persist a replay-safe preview before completion.
               * @param amount Amount to mint.
               * @param quote Onchain mint quote.
               * @param privkey Private key matching the pubkey the quote is locked to.
               * @param config Optional parameters (e.g. keysetId).
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns Minted proofs.
               * @experimental Onchain support follows NUT-30 semantics and may change.
               */
              mintProofsOnchain(amount: AmountLike, quote: MintQuoteOnchainResponse, privkey: string, config?: {
                  keysetId?: string;
              }, outputType?: OutputType): Promise<Proof[]>;
              /**
               * Prepare a mint transaction for replay and later completion.
               *
               * @remarks
               * Generic method-oriented mint API. This supports current methods such as `bolt11` and `bolt12`
               * as well as future custom methods exposed by the mint. For first-class typed ergonomics with the
               * built-in methods, prefer `mintProofsBolt11()`, `mintProofsBolt12()`, or
               * `wallet.ops.mintBolt11()/mintBolt12()`.
               *
               * Returns a `MintPreview` that contains the exact mint payload and output data needed to
               * construct proofs. Persist this preview to support NUT-19 replay safety.
               * @param quote The mint quote. Only `quote` (ID) is required — a full `MintQuoteBolt11Response`
               *   works, but `{ quote: string }` is sufficient. Pass `config.privkey` to produce a NUT-20
               *   signature regardless of whether the quote carries a `pubkey` field.
               */
              prepareMint<TQuote extends Pick<MintQuoteBaseResponse, 'quote'>>(method: string, amount: AmountLike, quote: TQuote, config?: MintProofsConfig, outputType?: OutputType): Promise<MintPreview<TQuote>>;
              /**
               * Complete a prepared mint transaction.
               *
               * @remarks
               * Use with a `MintPreview` returned by `prepareMint()`. This is the second step of the generic
               * mint flow and is also what the named convenience helpers use internally.
               * @param mintPreview Preview returned by prepareMint.
               * @returns Minted proofs.
               */
              completeMint(mintPreview: MintPreview<Pick<MintQuoteBaseResponse, 'quote'>>): Promise<Proof[]>;
              /**
               * Prepare a batched mint transaction (NUT-29).
               *
               * @remarks
               * Creates a single consolidated set of outputs for all quotes.
               *
               * NOTE:
               *
               * - Any quote without a pubkey is considered unlocked. Pass `pubkey` for locked quotes.
               * - Check all quotes are in the PAID state. If any quote is unpaid, the entire batch with fail.
               *
               * @param method Payment method identifier (e.g., 'bolt11', 'bolt12').
               * @param entries Array of per-quote parameters: `{ amount, quote }`.
               * @param config Optional config applied to the entire batch (keysetId, privkey, counters, etc.).
               * @param outputType Optional output type override applied to the consolidated outputs.
               * @returns A `BatchMintPreview` ready to pass to `completeBatchMint`.
               * @experimental only supported by CDK mint >= 0.16.0
               */
              prepareBatchMint<TQuote extends Pick<MintQuoteBaseResponse, 'quote' | 'pubkey'>>(method: string, entries: Array<{
                  amount: AmountLike;
                  quote: TQuote;
              }>, config?: MintProofsConfig, outputType?: OutputType): Promise<BatchMintPreview<TQuote>>;
              /**
               * Complete a prepared batch mint transaction.
               *
               * @remarks
               * Use with a `BatchMintPreview` returned by `prepareBatchMint()`.
               * @param batchPreview Preview returned by prepareBatchMint.
               * @returns Minted proofs.
               * @experimental only supported by CDK mint >= 0.16.0
               */
              completeBatchMint(batchPreview: BatchMintPreview<Pick<MintQuoteBaseResponse, 'quote'>>): Promise<Proof[]>;
              /**
               * Creates a melt quote for any payment method.
               *
               * @remarks
               * Generic method for requesting a melt quote. The payload is method-specific but must at minimum
               * include the fields required by the mint for the given method. An optional `normalize` callback
               * can be used to coerce method-specific response fields.
               *
               * For first-class methods, prefer the typed helpers: `createMeltQuoteBolt11()`,
               * `createMeltQuoteBolt12()`.
               * @param method The payment method (e.g., 'bolt11', 'bolt12', 'bacs', 'swift').
               * @param payload The request body to POST. `unit` is always set to the wallet's unit.
               * @param options.normalize Optional callback to normalize method-specific response fields.
               * @returns The melt quote response.
               */
              createMeltQuote(invoice: string, amountMsat?: AmountLike): Promise<MeltQuoteBolt11Response>;
              createMeltQuote<TRes extends MeltQuoteBaseResponse = MeltQuoteBaseResponse>(method: string, payload: Record<string, unknown>, options?: {
                  normalize?: (raw: Record<string, unknown>) => TRes;
              }): Promise<TRes>;
              /**
               * Requests a melt quote from the mint. Response returns amount and fees for a given unit in order
               * to pay a Lightning invoice.
               *
               * @param invoice LN invoice that needs to get a fee estimate.
               * @param amountMsat Optional amount in millisatoshis to attach for amountless invoices, must not
               *   be provided for invoices that already encode an amount.
               * @returns The mint will create and return a melt quote for the invoice with an amount and fee
               *   reserve.
               */
              createMeltQuoteBolt11(invoice: string, amountMsat?: AmountLike): Promise<MeltQuoteBolt11Response>;
              /**
               * Requests a melt quote from the mint. Response returns amount and fees for a given unit in order
               * to pay a BOLT12 offer.
               *
               * @param offer BOLT12 offer that needs to get a fee estimate.
               * @param amountMsat Amount in millisatoshis for amount-less offers. If this is defined and the
               *   offer has an amount, they **MUST** be equal.
               * @returns The mint will create and return a melt quote for the offer with an amount and fee
               *   reserve.
               */
              createMeltQuoteBolt12(offer: string, amountMsat?: AmountLike): Promise<MeltQuoteBolt12Response>;
              /**
               * Requests an onchain melt quote from the mint.
               *
               * @param address Bitcoin address to send to.
               * @param amount Amount to melt.
               * @returns Melt quote with fee options.
               * @experimental Onchain support follows NUT-30 semantics and may change.
               */
              createMeltQuoteOnchain(address: string, amount: AmountLike): Promise<MeltQuoteOnchainResponse>;
              /**
               * Requests a multi path melt quote from the mint.
               *
               * @remarks
               * Uses NUT-15 Partial multi-path payments for BOLT11.
               * @param invoice LN invoice that needs to get a fee estimate.
               * @param partialAmount The partial amount of the invoice's total to be paid by this instance.
               * @returns The mint will create and return a melt quote for the invoice with an amount and fee
               *   reserve.
               * @see https://github.com/cashubtc/nuts/blob/main/15.md
               */
              createMultiPathMeltQuote(invoice: string, millisatPartialAmount: AmountLike): Promise<MeltQuoteBolt11Response>;
              /**
               * Checks an existing melt quote for any payment method.
               *
               * @remarks
               * Generic method for checking a melt quote status. An optional `normalize` callback can be used
               * to coerce method-specific response fields.
               *
               * For first-class methods, prefer the typed helpers: `checkMeltQuoteBolt11()`,
               * `checkMeltQuoteBolt12()`.
               * @param method The payment method (e.g., 'bolt11', 'bolt12', 'bacs', 'swift').
               * @param quote Quote ID or quote object (must have a `quote` field).
               * @param options.normalize Optional callback to normalize method-specific response fields.
               * @returns The melt quote response.
               */
              checkMeltQuote<TRes extends MeltQuoteBaseResponse = MeltQuoteBaseResponse>(method: string, quote: string | Pick<TRes, 'quote'>, options?: {
                  normalize?: (raw: Record<string, unknown>) => TRes;
              }): Promise<TRes>;
              /**
               * Returns an existing bolt11 melt quote from the mint.
               *
               * @param quote ID of the melt quote.
               * @returns The mint will return an existing melt quote.
               */
              checkMeltQuoteBolt11(quote: string | MeltQuoteBolt11Response): Promise<MeltQuoteBolt11Response>;
              /**
               * Returns an existing bolt12 melt quote from the mint.
               *
               * @param quote ID of the melt quote.
               * @returns The mint will return an existing melt quote.
               */
              checkMeltQuoteBolt12(quote: string): Promise<MeltQuoteBolt12Response>;
              /**
               * Returns an existing onchain melt quote from the mint.
               *
               * @param quote ID of the melt quote.
               * @returns The mint will return an existing melt quote.
               * @experimental Onchain support follows NUT-30 semantics and may change.
               */
              checkMeltQuoteOnchain(quote: string): Promise<MeltQuoteOnchainResponse>;
              /**
               * Melts proofs for any payment method.
               *
               * @remarks
               * Generic convenience method that calls `prepareMelt(method, …)` followed by `completeMelt()`.
               *
               * Intended primarily for custom payment methods. For first-class methods, prefer
               * `meltProofsBolt11()` or `meltProofsBolt12()`, which keep the method-specific wallet
               * ergonomics.
               * @param method The payment method (e.g., 'bolt11', 'bolt12', 'bacs', 'swift').
               * @param meltQuote The melt quote object (must have at least `quote` and `amount` fields).
               * @param proofsToSend Proofs to melt.
               * @param config Optional parameters.
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns MeltProofsResponse with quote and change proofs.
               */
              meltProofs(meltQuote: MeltQuoteBolt11Response, proofsToSend: ProofLike[], config?: MeltProofsConfig, outputType?: OutputType): Promise<MeltProofsResponse<MeltQuoteBolt11Response>>;
              meltProofs<TQuote extends Pick<MeltQuoteBaseResponse, 'amount' | 'quote'>>(method: string, meltQuote: TQuote, proofsToSend: ProofLike[], config?: MeltProofsConfig, outputType?: OutputType): Promise<MeltProofsResponse<TQuote>>;
              /**
               * Melt proofs for a bolt11 melt quote.
               *
               * @remarks
               * ProofsToSend must be at least amount+fee_reserve from the melt quote. This function does not
               * perform coin selection!.
               * @param meltQuote ID of the melt quote.
               * @param proofsToSend Proofs to melt.
               * @param config Optional parameters.
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns MeltProofsResponse with quote and change proofs.
               */
              meltProofsBolt11(meltQuote: MeltQuoteBolt11Response, proofsToSend: ProofLike[], config?: MeltProofsConfig, outputType?: OutputType): Promise<MeltProofsResponse<MeltQuoteBolt11Response>>;
              /**
               * Melt proofs for a bolt12 melt quote, returns change proofs using specified outputType.
               *
               * @remarks
               * ProofsToSend must be at least amount+fee_reserve from the melt quote. This function does not
               * perform coin selection!.
               * @param meltQuote ID of the melt quote.
               * @param proofsToSend Proofs to melt.
               * @param config Optional parameters.
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns MeltProofsResponse with quote and change proofs.
               */
              meltProofsBolt12(meltQuote: MeltQuoteBolt12Response, proofsToSend: ProofLike[], config?: MeltProofsConfig, outputType?: OutputType): Promise<MeltProofsResponse<MeltQuoteBolt12Response>>;
              /**
               * Melt proofs via an onchain Bitcoin transaction.
               *
               * @remarks
               * ProofsToSend must cover `quote.amount + selected fee + input fee`. Any additional amount is
               * offered as NUT-08 change. This function does not perform coin selection!
               *
               * Any `change` is only returned once the quote is `PAID` (mined and confirmed). Poll the quote
               * until broadcast, then unblind change with the returned `outputData` via
               * `wallet.createMeltChangeProofs()`.
               * @param meltQuote The onchain melt quote.
               * @param proofsToSend Proofs to melt.
               * @param feeIndex Selected `fee_index` value from `meltQuote.fee_options`.
               * @param config Optional parameters (e.g. privkey for P2PK proofs, keysetId).
               * @returns MeltProofsResponse with quote, any immediate change, and `outputData` for
               *   deferred-change reconstruction.
               * @experimental Onchain support follows NUT-30 semantics and may change.
               */
              meltProofsOnchain(meltQuote: MeltQuoteOnchainResponse, proofsToSend: ProofLike[], feeIndex: number, config?: MeltProofsConfig): Promise<MeltProofsResponse<MeltQuoteOnchainResponse>>;
              /**
               * Prepare A Melt Transaction.
               *
               * @remarks
               * Allows you to preview fees for a melt, get concrete outputs for P2PK SIG_ALL melts, and do any
               * pre-melt tasks (such as marking proofs in-flight etc). Creates NUT-08 blanks (1-sat) for melt
               * change and returns a MeltPreview, which you can melt using completeMelt.
               * @param method Payment method of the quote.
               * @param meltQuote The melt quote. Only `quote` (ID) and `amount` are required — a full
               *   `MeltQuoteBolt11Response` works, but `{ quote: string, amount: Amount }` is sufficient.
               * @param proofsToSend Proofs to melt.
               * @param config Optional configuration (keysetId, privkey, etc.).
               * @param outputType Configuration for proof generation. Defaults to wallet.defaultOutputType().
               * @returns MeltPreview.
               * @throws If params are invalid.
               * @see https://github.com/cashubtc/nuts/blob/main/08.md.
               */
              prepareMelt<TQuote extends Pick<MeltQuoteBaseResponse, 'amount' | 'quote'>>(method: string, meltQuote: TQuote, proofsToSend: ProofLike[], config?: PrepareMeltConfig, outputType?: OutputType): Promise<MeltPreview<TQuote>>;
              /**
               * Completes a pending melt by calling the melt endpoint and constructing change proofs.
               *
               * @remarks
               * Use with a `MeltPreview` returned from `prepareMelt()`. This method lets you sign P2PK locked
               * proofs before melting. If the payment is pending or unpaid, the change array will be empty.
               * @param meltPreview The preview from prepareMelt().
               * @param privkey The private key(s) for signing.
               * @param options Optional override to request NUT-06 asynchronous melt or method-specific fields.
               * @returns Updated MeltProofsResponse.
               * @throws If melt fails or signatures don't match output count.
               */
              completeMelt<TQuote extends Pick<MeltQuoteBaseResponse, 'quote'> = MeltQuoteBaseResponse>(meltPreview: MeltPreview<TQuote>, privkey?: string | string[], options?: CompleteMeltOptions): Promise<MeltProofsResponse<TQuote>>;
              /**
               * @deprecated Pass `{ preferAsync: true }` as the third param, instead of `true`.
               */
              completeMelt<TQuote extends Pick<MeltQuoteBaseResponse, 'quote'> = MeltQuoteBaseResponse>(meltPreview: MeltPreview<TQuote>, privkey?: string | string[], preferAsync?: boolean): Promise<MeltProofsResponse<TQuote>>;
              /**
               * Constructs melt change proofs from prepared OutputData and mint returned Change Signatures.
               *
               * @remarks
               * Called internally by `completeMelt`; also useful for NUT-06 async melts and any other path that
               * defers change construction (crash recovery, process hand-off). Keyset lookup is per-signature
               * so multi-keyset responses (e.g. a permissive CDK mint) work transparently.
               * @param outputData Outputs from `prepareMelt()`, or deserialised persisted OutputData.
               * @param changeSigs The optional `change` signatures from the melt response or paid quote.
               * @returns Spendable change proofs (possibly empty).
               * @throws {@link CTSError} If signature count exceeds output count, any signature's keyset id
                   *   does not match its paired output, or signatures cannot be verified.
                   * @see {@link OutputData.serialize} for the persist/restore lifecycle example.
                   */
               createMeltChangeProofs(outputData: OutputDataLike[], changeSigs: SerializedBlindedSignature[]): Proof[];
               /**
                * Get an array of the states of proofs from the mint (as an array of CheckStateEnum's)
                *
                * @param proofs Each proof must carry `id` and `secret`. The keyset id selects the hash-to-curve
                *   variant: v0/v1/v2 use secp256k1; v3 (`02…`) uses BLS12-381 G1.
                * @returns NUT-07 state for each proof, in same order.
                */
               checkProofsStates(proofs: Array<Pick<ProofLike, 'secret' | 'id'>>, requestOptions?: Pick<RequestOptions, 'requestTimeout' | 'responseBodyBytesLimit' | 'signal'>): Promise<ProofState[]>;
               /**
                * Groups proofs by their corresponding state, preserving order within each group.
                *
                * @remarks
                * Returns the same type you supply, eg: pass `MyProof[]` in, get `MyProof[]` back.
                * @param proofs Accepts {@link ProofLike} so proofs from storage work without conversion. Only the
                *   `secret` field is used for the state check; amounts are passed through as-is.
                * @returns An object with arrays of proofs grouped by CheckStateEnum state.
                */
               groupProofsByState<T extends ProofLike = Proof>(proofs: T[]): Promise<{
                   unspent: T[];
                   pending: T[];
                   spent: T[];
               }>;
              }
              export { Wallet as CashuWallet }
              export { Wallet }

              /**
               * Developer friendly view of the wallet's deterministic output counters.
               */
              export declare class WalletCounters {
                  private readonly src;
                  constructor(src: CounterSource);
                  /**
                   * Returns the "next" counter for a specified keyset.
                   */
                  peekNext(keysetId: string): Promise<number>;
                  /**
                   * Bumps the counter if it is behind `minNext` (no-op if ahead).
                   */
                  advanceToAtLeast(keysetId: string, minNext: number): Promise<void>;
                  /**
                   * Hard-sets the cursor (useful for tests or migrations).
                   *
                   * @throws If the CounterSource does not support setNext()
                   */
                  setNext(keysetId: string, next: number): Promise<void>;
                  /**
                   * Returns the current "next" per keyset (what will be reserved next).
                   *
                   * @throws If the CounterSource does not support snapshot()
                   */
                  snapshot(): Promise<Record<string, number>>;
              }

              export declare interface WalletCtf {
                  prepareConditionalSwap(options: ConditionalSwapOptions): Promise<ConditionalSwapPreview>;
                  completeConditionalSwap(preview: ConditionalSwapPreview): Promise<Record<string, Proof[]>>;
                  swapConditional(options: ConditionalSwapOptions): Promise<Record<string, Proof[]>>;
                  redeemOutcomeProofs(options: RedeemOutcomeProofsOptions): Promise<Proof[]>;
              }

              export declare class WalletEvents {
                  private wallet;
                  constructor(wallet: Wallet);
                  private countersReservedHandlers;
                  private withAbort;
                  private waitUntilPaid;
                  /**
                   * Register a callback that fires whenever deterministic counters are reserved.
                   *
                   * Timing: the callback is invoked synchronously _after_ a successful reservation and _before_ the
                   * enclosing wallet method returns. The wallet does **not** await your callback, it is
                   * fire-and-forget.
                   *
                   * Responsibility for async work is on the consumer. If your handler calls an async function (e.g.
                   * persisting `start + count` to storage), make sure to handle errors inside it to avoid unhandled
                   * rejections.
                   *
                   * Typical use: persist `start + count` for the `keysetId` so counters survive restarts.
                   *
                   * @example
                   *
                   * ```ts
                   * wallet.on.countersReserved(({ keysetId, start, count, next }) => {
                   *   saveNextToDb(keysetId, start + count); // handle async errors inside saveNextToDb
                   * });
                   * ```
                   *
                   * @param cb Handler called with { keysetId, start, count }.
                   * @returns A function that unsubscribes the handler.
                   */
                  countersReserved(cb: (payload: OperationCounters) => void, opts?: SubscribeOpts): SubscriptionCanceller;
                  /* Excluded from this release type: _emitCountersReserved */
                  /**
                   * Register a callback to be called whenever a mint quote's state changes.
                   *
                   * @param quoteIds List of mint quote IDs that should be subscribed to.
                   * @param callback Callback function that will be called whenever a mint quote state changes.
                   * @param errorCallback
                   * @returns
                   */
                  mintQuoteUpdates(ids: string[], cb: (p: MintQuoteBolt11Response) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
                  /**
                   * Register a callback to be called when a single mint quote gets paid.
                   *
                   * @param quoteId Mint quote id that should be subscribed to.
                   * @param callback Callback function that will be called when this mint quote gets paid.
                   * @param errorCallback
                   * @returns
                   */
                  mintQuotePaid(id: string, cb: (p: MintQuoteBolt11Response) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
                  /**
                   * Register a callback to be called whenever a melt quote’s state changes.
                   *
                   * @param quoteId Melt quote id that should be subscribed to.
                   * @param callback Callback function that will be called when this melt quote gets paid.
                   * @param errorCallback
                   * @returns
                   */
                  meltQuoteUpdates(ids: string[], cb: (p: MeltQuoteBolt11Response) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
                  /**
                   * Register a callback to be called when a single melt quote gets paid.
                   *
                   * @param quoteIds List of melt quote IDs that should be subscribed to.
                   * @param callback Callback function that will be called whenever a melt quote state changes.
                   * @param errorCallback
                   * @returns
                   */
                  meltQuotePaid(id: string, cb: (p: MeltQuoteBolt11Response) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
                  /**
                   * Register a callback to be called whenever a subscribed proof state changes.
                   *
                   * Only `secret` is read from each proof to derive the subscription filter; any `ProofLike`-shaped
                   * object (e.g. proofs loaded from storage where `amount` has not yet been normalized to `Amount`)
                   * may be passed without conversion. The original proof object is echoed back on the callback
                   * payload as the inferred input type.
                   *
                   * @param proofs List of proofs that should be subscribed to.
                   * @param callback Callback function that will be called whenever a proof's state changes.
                   * @param errorCallback
                   * @returns
                   */
                  proofStateUpdates<T extends ProofLike = Proof>(proofs: T[], cb: (payload: ProofState & {
                      proof: T;
                  }) => void, err: (e: Error) => void, opts?: SubscribeOpts): Promise<SubscriptionCanceller>;
                  /**
                   * Resolve once a mint quote transitions to PAID, with automatic unsubscription, optional abort
                   * signal, and optional timeout.
                   *
                   * The underlying subscription is always cancelled after resolution or rejection, including on
                   * timeout or abort.
                   *
                   * @example
                   *
                   * ```ts
                   * const ac = new AbortController();
                   * // Cancel if the user navigates away
                   * window.addEventListener('beforeunload', () => ac.abort(), { once: true });
                   *
                   * try {
                   *   const paid = await wallet.on.onceMintPaid(quoteId, {
                   *     signal: ac.signal,
                   *     timeoutMs: 60_000,
                   *   });
                   *   console.log('Mint paid, amount', paid.amount);
                   * } catch (e) {
                   *   if ((e as Error).name === 'AbortError') {
                   *     console.log('User aborted');
                   *   } else {
                   *     console.error('Mint not paid', e);
                   *   }
                   * }
                   * ```
                   *
                   * @param id Mint quote id to watch.
                   * @param opts Optional controls.
                   * @param opts.signal AbortSignal to cancel the wait early.
                   * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
                   * @returns A promise that resolves with the latest `MintQuoteBolt11Response` once PAID.
                   */
                  onceMintPaid(id: string, opts?: {
                      signal?: AbortSignal;
                      timeoutMs?: number;
                  }): Promise<MintQuoteBolt11Response>;
                  /**
                   * Resolve when ANY of several mint quotes is PAID, cancelling the rest.
                   *
                   * Subscribes to all distinct ids, resolves with `{ id, quote }` for the first PAID, and cancels
                   * all remaining subscriptions.
                   *
                   * Errors from individual subscriptions are ignored by default so a single noisy stream does not
                   * abort the whole race. Set `failOnError: true` to reject on the first error instead. If all
                   * subscriptions error and none paid, the promise rejects with the last seen error.
                   *
                   * @example
                   *
                   * ```ts
                   * // Race multiple quotes obtained from splitting a large top up
                   * const { id, quote } = await wallet.on.onceAnyMintPaid(batchQuoteIds, {
                   *   timeoutMs: 120_000,
                   * });
                   * console.log('First top up paid', id, quote.preimage?.length);
                   * ```
                   *
                   * @param ids Array of mint quote ids (duplicates are ignored).
                   * @param opts Optional controls.
                   * @param opts.signal AbortSignal to cancel the wait early.
                   * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
                   * @param opts.failOnError When true, reject on first error. Default false.
                   * @returns A promise resolving to the id that won and its `MintQuoteBolt11Response`.
                   */
                  onceAnyMintPaid(ids: string[], opts?: {
                      signal?: AbortSignal;
                      timeoutMs?: number;
                      failOnError?: boolean;
                  }): Promise<{
                      id: string;
                      quote: MintQuoteBolt11Response;
                  }>;
                  /**
                   * Resolve once a melt quote transitions to PAID, with automatic unsubscription, optional abort
                   * signal, and optional timeout.
                   *
                   * Mirrors onceMintPaid, but for melts.
                   *
                   * @example
                   *
                   * ```ts
                   * try {
                   *   const paid = await wallet.on.onceMeltPaid(meltId, { timeoutMs: 45_000 });
                   *   console.log('Invoice paid by mint, paid msat', paid.paid ?? 0);
                   * } catch (e) {
                   *   console.error('Payment did not complete in time', e);
                   * }
                   * ```
                   *
                   * @param id Melt quote id to watch.
                   * @param opts Optional controls.
                   * @param opts.signal AbortSignal to cancel the wait early.
                   * @param opts.timeoutMs Milliseconds to wait before rejecting with a timeout error.
                   * @returns A promise that resolves with the `MeltQuoteBolt11Response` once PAID.
                   */
                  onceMeltPaid(id: string, opts?: {
                      signal?: AbortSignal;
                      timeoutMs?: number;
                  }): Promise<MeltQuoteBolt11Response>;
                  /**
                   * Async iterable that yields proof state updates for the provided proofs.
                   *
                   * @remarks
                   * Adds a bounded buffer option:
                   *
                   * - If `maxBuffer` is set and the queue is full when a new payload arrives, either drop the oldest
                   *   queued payload (`drop: 'oldest'`, default) or the incoming payload (`drop: 'newest'`). In
                   *   both cases `onDrop` is invoked with the dropped payload.
                   *
                   * The stream ends and cleans up on abort. Errors from the wallet (e.g. a WebSocket failure or an
                   * RPC error from the mint) are thrown from the iterator — wrap the `for await` in `try/catch` to
                   * recover. Normal completion happens only when the consumer breaks out of the loop or the abort
                   * signal fires.
                   *
                   * The subscription is sent to the mint on the first iteration, not when this method is called.
                   * Per NUT-17 the mint replays the current state on subscribe, so the latest state is never lost;
                   * only intermediate transitions before the first iteration are collapsed into that snapshot.
                   * @example
                   *
                   * ```ts
                   * const ac = new AbortController();
                   * try {
                   *   for await (const update of wallet.on.proofStatesStream(myProofs)) {
                   *     if (update.state === CheckStateEnum.SPENT) {
                   *       console.warn('Spent proof', update.proof.id);
                   *     }
                   *   }
                   * } catch (e) {
                   *   if ((e as Error).name !== 'AbortError') {
                   *     console.error('Stream error', e);
                   *   }
                   * }
                   * ```
                   *
                   * @param proofs The proofs to subscribe to. Only `secret` is required, so any `ProofLike`-shaped
                   *   object may be passed without first normalizing `amount` to `Amount`.
                   * @param opts Optional controls.
                   * @param opts.signal AbortSignal that stops the stream when aborted.
                   * @param opts.maxBuffer Maximum number of queued items before applying the drop strategy.
                   * @param opts.drop Overflow strategy when `maxBuffer` is reached, 'oldest' | 'newest'. Default
                   *   'oldest'.
                   * @param opts.onDrop Callback invoked with the payload that was dropped.
                   * @returns An async iterable of update payloads. The `proof` field on each payload preserves the
                   *   input proof type.
                   */
                  proofStatesStream<P extends ProofLike = Proof>(proofs: P[], opts?: {
                      signal?: AbortSignal;
                      maxBuffer?: number;
                      drop?: 'oldest' | 'newest';
                      onDrop?: (payload: ProofState & {
                          proof: P;
                      }) => void;
                  }): AsyncIterable<ProofState & {
                      proof: P;
                  }>;
                  /**
                   * Create a composite canceller that can collect many subscriptions and dispose them all in one
                   * call.
                   *
                   * Accepts both a `SubscriptionCanceller` and a `Promise<SubscriptionCanceller>`. When the
                   * composite canceller is called, all collected cancellations are invoked. Errors from individual
                   * cancellers are caught and ignored.
                   *
                   * The returned function also has an `.add()` method to register more cancellers, and a
                   * `.cancelled` boolean property for debugging.
                   *
                   * @example
                   *
                   * ```ts
                   * const cancelAll = wallet.on.group();
                   * cancelAll.add(wallet.on.mintQuotes(ids, onUpdate, onErr));
                   * cancelAll.add(asyncSubscribeElsewhere());
                   *
                   * // later
                   * cancelAll(); // disposes everything
                   * ```
                   *
                   * @returns Composite canceller function with `.add()` and `.cancelled` members.
                   */
                  group(): SubscriptionCanceller & {
                      add: (c: CancellerLike) => CancellerLike;
                      cancelled: boolean;
                  };
              }

              /**
               * Fluent operations builder for a Wallet instance.
               *
               * @remarks
               * Provides chainable builders for sending, receiving, and minting. Each builder is single use. If
               * you do not customise an output side, the wallet’s policy defaults apply.
               */
              export declare class WalletOps {
                  private wallet;
                  constructor(wallet: Wallet);
                  send(amount: AmountLike, proofs: ProofLike[]): SendBuilder;
                  receive(token: Token | string | ProofLike[]): ReceiveBuilder;
                  /**
                   * @param quote Full `MintQuoteBolt11Response` or a bare quote ID string. Passing a string fetches
                   *   the latest quote state from the mint (unit/expiry validation included). Pass the full object
                   *   if you already have it to avoid the extra round-trip.
                   */
                  mintBolt11(amount: AmountLike, quote: MintQuoteFor<'bolt11'>): MintBuilder<"bolt11", true>;
                  mintBolt12(amount: AmountLike, quote: MintQuoteFor<'bolt12'>): MintBuilder<"bolt12", false>;
                  /**
                   * @experimental Onchain support follows NUT-30 semantics and may change.
                   */
                  mintOnchain(amount: AmountLike, quote: MintQuoteFor<'onchain'>): MintBuilder<"onchain", false>;
                  meltBolt11(quote: MeltQuoteBolt11Response, proofs: ProofLike[]): MeltBuilder<MeltQuoteBolt11Response>;
                  meltBolt12(quote: MeltQuoteBolt12Response, proofs: ProofLike[]): MeltBuilder<MeltQuoteBolt11Response>;
                  /**
                   * @experimental Onchain support follows NUT-30 semantics and may change.
                   */
                  meltOnchain(quote: MeltQuoteOnchainResponse, proofs: ProofLike[]): MeltOnchainBuilder;
              }

              /**
               * WebSocket supported methods.
               */
              export declare type WebSocketSupport = {
                  method: string;
                  unit: string;
                  commands: string[];
              };

              /* Excluded from this release type: WitnessData */

              export declare class WSConnection {
                  readonly url: URL;
                  private readonly _WS;
                  private ws;
                  private connectionPromise;
                  private subListeners;
                  private rpcListeners;
                  private messageQueue;
                  private handlingInterval?;
                  private rpcId;
                  private _logger;
                  private onCloseCallbacks;
                  constructor(url: string, logger?: Logger);
                  setLogger(logger: Logger): void;
                  connect(timeoutMs?: number): Promise<void>;
                  sendRequest(method: 'subscribe', params: JsonRpcReqParams): void;
                  sendRequest(method: 'unsubscribe', params: {
                      subId: string;
                  }): void;
                  addSubListener<TPayload = unknown>(subId: string, callback: (payload: TPayload) => void): void;
                  private stopMessageHandling;
                  private failPendingRpc;
                  private sendRpcMessage;
                  private addRpcListener;
                  private removeRpcListener;
                  private removeListener;
                  ensureConnection(timeoutMs?: number): Promise<void>;
                  private handleNextMessage;
                  createSubscription<TPayload = unknown>(params: Omit<JsonRpcReqParams, 'subId'>, callback: (payload: TPayload) => void, errorCallback: (e: Error) => void): string;
                  /**
                   * Cancels a subscription, sending an unsubscribe request and handling responses.
                   *
                   * @param subId The subscription ID to cancel.
                   * @param callback The original payload callback to remove.
                   * @param errorCallback Optional callback for unsubscribe errors (defaults to logging).
                   */
                  cancelSubscription<TPayload = unknown>(subId: string, callback: (payload: TPayload) => void, errorCallback?: (e: Error) => void): void;
                  get activeSubscriptions(): string[];
                  close(): void;
                  onClose(callback: (e: CloseEvent) => void): void;
              }

              export { }
