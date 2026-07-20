import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Client, Server, WebSocket } from 'mock-socket';
import {
  Mint,
  MintInfo,
  MeltQuoteState,
  WSConnection,
  injectWebSocketImpl,
  RateLimitError,
  Amount,
  MintOperationError,
} from '../../src';
import type { AuthProvider, GetInfoResponse, Logger, RequestFn } from '../../src';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { MINTINFORESP } from '../consts';

type ReqArgs = {
  endpoint: string;
  method?: string;
  requestBody?: unknown;
  headers?: Record<string, string>;
  responseBodyBytesLimit?: number;
};

const mintUrl = 'https://localhost:3338';
const fakeWsUrl = 'wss://mint.example/cashu/v1/ws';

const makeRequest = <T>(payload: T): RequestFn => {
  return (async (options: ReqArgs): Promise<T> => {
    void options;
    return payload;
  }) as RequestFn;
};

function createLogger(): Logger {
  return {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    log: vi.fn(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  injectWebSocketImpl(WebSocket);
});

describe('Mint normalization', () => {
  it('caches getLazyMintInfo after the first request', async () => {
    const requestSpy = vi.fn(async () => ({
      name: 'mint',
      pubkey: '02abcd',
      version: 'test',
      contact: [],
      nuts: {
        '4': { disabled: false, methods: [] },
        '5': { disabled: false, methods: [] },
      },
    })) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const info1 = await mint.getLazyMintInfo();
    const info2 = await mint.getLazyMintInfo();

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(info1).toBe(info2);
  });

  it('setMintInfo accepts raw info objects and seeds the cache', async () => {
    const mint = new Mint(mintUrl);

    mint.setMintInfo({
      name: 'mint',
      pubkey: '02abcd',
      version: 'test',
      contact: [],
      nuts: {
        '4': { disabled: false, methods: [] },
        '5': { disabled: false, methods: [] },
      },
    });

    const cached = await mint.getLazyMintInfo();
    expect(cached).toBeInstanceOf(MintInfo);
    expect(cached.name).toBe('mint');
  });

  it('preserves the typed CTF conditional-keyset catalogue capability', () => {
    const response: GetInfoResponse = {
      name: 'mint',
      pubkey: '02abcd',
      version: 'test',
      contact: [],
      nuts: {
        '4': { disabled: false, methods: [] },
        '5': { disabled: false, methods: [] },
        CTF: {
          supported: true,
          dlc_version: '0',
          vesting_period: 2_592_000,
          default_keyset_creation: 'none',
          registration_fees: [
            {
              unit: 'sat',
              registration_fee_base: 10,
              registration_fee_per_keyset: 2,
            },
          ],
          conditional_keyset_catalogue: { version: 1, max_page_size: 100 },
        },
      },
    };

    const normalized = MintInfo.normalizeInfo(response);

    expect(normalized.nuts.CTF).toEqual(response.nuts.CTF);
  });

  it('exposes the sanitized mintUrl', () => {
    const mint = new Mint('https://localhost:3338');
    expect(mint.mintUrl).toBe('https://localhost:3338');
  });

  it('oidcAuth throws when the mint does not advertise NUT-21 discovery metadata', async () => {
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        name: 'mint',
        pubkey: '02abcd',
        version: 'test',
        contact: [],
        nuts: {
          '4': { disabled: false, methods: [] },
          '5': { disabled: false, methods: [] },
        },
      }),
    });

    await expect(mint.oidcAuth()).rejects.toThrow('Mint: no NUT-21 openid_discovery');
  });

  it('passes through AmountLike min/max amounts from getInfo()', async () => {
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        name: 'mint',
        pubkey: '02abcd',
        version: 'test',
        contact: [],
        nuts: {
          '4': {
            disabled: false,
            methods: [
              {
                method: 'bolt11',
                unit: 'sat',
                min_amount: 123n,
                max_amount: 456n,
              },
            ],
          },
          '5': {
            disabled: false,
            methods: [
              {
                method: 'bolt11',
                unit: 'sat',
                min_amount: 789n,
                max_amount: 999n,
              },
            ],
          },
          '19': { ttl: 120n, cached_endpoints: [] },
          '22': { bat_max_mint: 5n, protected_endpoints: [] },
        },
      } as any),
    });

    const info = await mint.getInfo();

    // min/max are AmountLike — wire bigint values pass through unchanged
    expect(info.nuts['4'].methods[0].min_amount).toBe(123n);
    expect(info.nuts['4'].methods[0].max_amount).toBe(456n);
    expect(info.nuts['5'].methods[0].min_amount).toBe(789n);
    expect(info.nuts['5'].methods[0].max_amount).toBe(999n);
    // metadata integers normalized by MintInfo construction
    const mintInfo = await mint.getLazyMintInfo();
    expect(mintInfo.cache.nuts['19']?.ttl).toBe(120);
    expect(mintInfo.cache.nuts['22']?.bat_max_mint).toBe(5);
  });

  it('rejects out-of-range bigint info metadata in getLazyMintInfo()', async () => {
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        name: 'mint',
        pubkey: '02abcd',
        version: 'test',
        contact: [],
        nuts: {
          '4': { disabled: false, methods: [] },
          '5': { disabled: false, methods: [] },
          '19': { ttl: 9007199254740993n, cached_endpoints: [{ method: 'GET', path: '/v1/keys' }] },
        },
      } as any),
    });

    await expect(mint.getLazyMintInfo()).rejects.toThrow('nuts.19.ttl');
  });

  it('normalizes bigint fields in getKeySets()', async () => {
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        keysets: [
          {
            id: '00ks',
            unit: 'sat',
            active: true,
            input_fee_ppk: 250n,
            final_expiry: 1_754_296_607n,
          },
        ],
      } as any),
    });

    const response = await mint.getKeySets();

    expect(response.keysets[0].input_fee_ppk).toBe(250);
    expect(response.keysets[0].final_expiry).toBe(1_754_296_607);
  });

  it('rejects out-of-range bigint keyset metadata in getKeySets()', async () => {
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        keysets: [
          {
            id: '00ks',
            unit: 'sat',
            active: true,
            input_fee_ppk: 9007199254740993n,
          },
        ],
      } as any),
    });

    await expect(mint.getKeySets()).rejects.toThrow('keyset.input_fee_ppk');
  });

  it('normalizes bigint fields in getKeys()', async () => {
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        keysets: [
          {
            id: '00ks',
            unit: 'sat',
            input_fee_ppk: 250n,
            final_expiry: 1_754_296_607n,
            keys: { 1: '02abcd' },
          },
        ],
      } as any),
    });

    const response = await mint.getKeys();

    expect(response.keysets[0].input_fee_ppk).toBe(250);
    expect(response.keysets[0].final_expiry).toBe(1_754_296_607);
  });

  it('rejects out-of-range bigint key metadata in getKeys()', async () => {
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        keysets: [
          {
            id: '00ks',
            unit: 'sat',
            input_fee_ppk: 9007199254740993n,
            keys: { 1: '02abcd' },
          },
        ],
      } as any),
    });

    await expect(mint.getKeys()).rejects.toThrow('keys.input_fee_ppk');
  });

  it('passes auth headers and NUT-19 retry policy through requestWithAuth', async () => {
    const requestSpy = vi.fn(
      async (options: ReqArgs & { ttl?: number; cached_endpoints?: unknown[] }) => {
        expect(options.endpoint).toBe(mintUrl + '/v1/swap');
        expect(options.method).toBe('POST');
        expect(options.headers?.['Blind-auth']).toBe('bat123');
        expect(options.headers?.['Clear-auth']).toBe('cat123');
        // MintInfo maps NUT-19 TTL seconds to request-layer milliseconds.
        expect(options.ttl).toBe(12_000);
        expect(options.cached_endpoints).toEqual([{ method: 'POST', path: '/v1/swap' }]);
        return { signatures: [{ amount: 1, C_: '02sig', id: '00' }] };
      },
    ) as RequestFn;
    const authProvider: AuthProvider = {
      getBlindAuthToken: vi.fn(async () => 'bat123'),
      getCAT: vi.fn(() => 'cat-fallback'),
      setCAT: vi.fn(),
      ensureCAT: vi.fn(async () => 'cat123'),
    };
    const mint = new Mint(mintUrl, { customRequest: requestSpy, authProvider });
    mint.setMintInfo({
      name: 'mint',
      pubkey: '02abcd',
      version: 'test',
      contact: [],
      nuts: {
        '4': { disabled: false, methods: [] },
        '5': { disabled: false, methods: [] },
        '19': { ttl: 12, cached_endpoints: [{ method: 'POST', path: '/v1/swap' }] },
        '21': {
          openid_discovery: 'https://auth.example/.well-known/openid-configuration',
          client_id: 'cashu-client',
          protected_endpoints: [{ method: 'POST', path: '/v1/swap' }],
        },
        '22': {
          bat_max_mint: 5,
          protected_endpoints: [{ method: 'POST', path: '/v1/swap' }],
        },
      },
    });

    const response = await mint.swap({ inputs: [], outputs: [] });

    expect(authProvider.ensureCAT).toHaveBeenCalled();
    expect(authProvider.getCAT).not.toHaveBeenCalled();
    expect(authProvider.getBlindAuthToken).toHaveBeenCalledWith({
      method: 'POST',
      path: '/v1/swap',
    });
    expect(response.signatures[0].amount.toBigInt()).toBe(1n);
  });

  it('falls back to getCAT when ensureCAT is unavailable', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.headers?.['Clear-auth']).toBe('cat-fallback');
      expect(options.headers?.['Blind-auth']).toBeUndefined();
      return { signatures: [{ amount: 1, C_: '02sig', id: '00' }] };
    }) as RequestFn;
    const authProvider: AuthProvider = {
      getBlindAuthToken: vi.fn(async () => 'unused'),
      getCAT: vi.fn(() => 'cat-fallback'),
      setCAT: vi.fn(),
    };
    const mint = new Mint(mintUrl, { customRequest: requestSpy, authProvider });
    mint.setMintInfo({
      name: 'mint',
      pubkey: '02abcd',
      version: 'test',
      contact: [],
      nuts: {
        '4': { disabled: false, methods: [] },
        '5': { disabled: false, methods: [] },
        '21': {
          openid_discovery: 'https://auth.example/.well-known/openid-configuration',
          client_id: 'cashu-client',
          protected_endpoints: [{ method: 'POST', path: '/v1/swap' }],
        },
      },
    });

    await mint.swap({ inputs: [], outputs: [] });

    expect(authProvider.getCAT).toHaveBeenCalled();
  });

  it('createMintQuoteBolt11 normalizes request and response amounts', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(mintUrl + '/v1/mint/quote/bolt11');
      expect(options.method).toBe('POST');
      expect(options.requestBody).toMatchObject({
        amount: 21n,
        unit: 'sat',
        description: 'mint me',
      });
      return {
        quote: 'q1',
        request: 'lnbc1...',
        paid: false,
        expiry: null,
        amount: 21,
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.createMintQuoteBolt11({
      amount: '21',
      unit: 'sat',
      description: 'mint me',
    });

    expect(response.amount.toBigInt()).toBe(21n);
    expect(response.expiry).toBeNull();
  });

  it('createMintQuoteBolt12 coerces omitted amount to null and normalizes paid and issued amounts', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(mintUrl + '/v1/mint/quote/bolt12');
      expect(options.method).toBe('POST');
      expect(options.requestBody).toEqual({ unit: 'sat', pubkey: '02abcd', description: 'offer' });
      return {
        quote: 'q1',
        request: 'lno1...',
        paid: true,
        expiry: 123,
        amount_paid: 5,
        amount_issued: 4,
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.createMintQuoteBolt12({
      unit: 'sat',
      pubkey: '02abcd',
      description: 'offer',
    });

    expect(response.amount).toBeNull();
    expect(response.amount_paid.toBigInt()).toBe(5n);
    expect(response.amount_issued.toBigInt()).toBe(4n);
  });

  it('createMintQuoteBolt12 preserves explicit null amount (NUT-25 amountless)', async () => {
    // Per NUT-25 the amount is <int|null>; CDK emits explicit `null` for
    // amountless offers. The wallet type is `Amount | null`, so null passes
    // through unchanged (no Amount.from(null) coercion).
    const requestSpy = vi.fn(async () => ({
      quote: 'q1',
      request: 'lno1...',
      amount: null,
      unit: 'sat',
      expiry: 0,
      pubkey: '02abcd',
      amount_paid: 0,
      amount_issued: 0,
    })) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.createMintQuoteBolt12({ unit: 'sat', pubkey: '02abcd' });

    expect(response.amount).toBeNull();
    expect(response.amount_paid.toBigInt()).toBe(0n);
    expect(response.amount_issued.toBigInt()).toBe(0n);
  });

  it('mintBolt11 posts to the expected endpoint and normalizes signature amounts', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(mintUrl + '/v1/mint/bolt11');
      expect(options.method).toBe('POST');
      return {
        signatures: [{ amount: 2, C_: '02sig', id: '00' }],
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.mintBolt11({ quote: 'q1', outputs: [] });

    expect(response.signatures[0].amount.toBigInt()).toBe(2n);
  });

  it('checkMeltQuoteBolt11 normalizes amount, fee reserve, and change signatures', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(mintUrl + '/v1/melt/quote/bolt11/q1');
      expect(options.method).toBe('GET');
      return {
        quote: 'q1',
        amount: 12,
        unit: 'sat',
        state: MeltQuoteState.PAID,
        expiry: 123,
        request: 'lnbc1...',
        fee_reserve: 1,
        change: [{ amount: 3, C_: '02change', id: '00' }],
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.checkMeltQuoteBolt11('q1');

    expect(response.amount.toBigInt()).toBe(12n);
    expect(response.fee_reserve.toBigInt()).toBe(1n);
    expect(response.change?.[0].amount.toBigInt()).toBe(3n);
  });

  it('supports custom quote methods with a normalize callback', async () => {
    const requestSpy = vi.fn(async () => ({
      quote: 'q1',
      paid: false,
      expiry: 123,
      note: 'custom',
    })) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const mintQuote = await mint.createMintQuote(
      'custom-pay',
      { unit: 'sat' },
      {
        normalize: (raw) => ({ ...raw, tag: 'mint' }) as any,
      },
    );
    const meltQuote = await mint.checkMeltQuote('custom-pay', 'q1', {
      normalize: (raw) => ({ ...raw, tag: 'melt' }) as any,
      customRequest: (async () => ({
        quote: 'q1',
        amount: 1,
        unit: 'sat',
        state: MeltQuoteState.UNPAID,
        expiry: 123,
      })) as RequestFn,
    });

    expect(mintQuote).toMatchObject({ tag: 'mint', note: 'custom' });
    expect(meltQuote).toMatchObject({ tag: 'melt', quote: 'q1' });
  });

  it('throws for invalid custom method strings', async () => {
    const mint = new Mint(mintUrl, { customRequest: makeRequest({}) });

    await expect(mint.createMintQuote('bad method', {})).rejects.toThrow(
      'Invalid mint quote method: bad method',
    );
    await expect(mint.checkMintQuote('bad method', 'q1')).rejects.toThrow(
      'Invalid mint quote method: bad method',
    );
    await expect(mint.mint('bad method', { quote: 'q1', outputs: [] })).rejects.toThrow(
      'Invalid mint method: bad method',
    );
    await expect(mint.createMeltQuote('bad method', {})).rejects.toThrow(
      'Invalid melt quote method: bad method',
    );
    await expect(mint.checkMeltQuote('bad method', 'q1')).rejects.toThrow(
      'Invalid melt quote method: bad method',
    );
    await expect(mint.melt('bad method', { quote: 'q1', inputs: [] })).rejects.toThrow(
      'Invalid melt method: bad method',
    );
  });

  it('throws on invalid swap responses', async () => {
    const logger = createLogger();
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({ not_signatures: true }),
      logger,
    });

    await expect(mint.swap({ inputs: [], outputs: [] })).rejects.toThrow(
      'Invalid response from mint',
    );
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      data: { not_signatures: true },
      op: 'swap',
    });
  });

  it('throws on invalid restore responses', async () => {
    const logger = createLogger();
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({ outputs: [] }),
      logger,
    });

    await expect(mint.restore({ outputs: [] })).rejects.toThrow('Invalid response from mint');
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      op: 'restore',
      reason: 'response must contain outputs and signatures arrays',
    });
  });

  it('throws on invalid check responses', async () => {
    const logger = createLogger();
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({ invalid: true }),
      logger,
    });

    await expect(mint.check({ Ys: [] })).rejects.toThrow('Invalid response from mint');
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      op: 'check',
      reason: 'response must contain a states array',
    });
  });

  it('sanitizes base64 keyset ids and honors an alternate mint URL in getKeys', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe('https://alt.example/v1/keys/ab_c-d');
      return { keysets: [] };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.getKeys('ab/c+d', 'https://alt.example');

    expect(response).toEqual({ keysets: [] });
    expect(requestSpy).toHaveBeenCalledTimes(1);
  });

  it('throws on invalid getKeySets responses', async () => {
    const logger = createLogger();
    const rawSentinel = 'must-not-appear-in-logs';
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({ invalid: rawSentinel }),
      logger,
    });

    await expect(mint.getKeySets()).rejects.toThrow('Invalid response from mint');
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      op: 'getKeySets',
      reason: 'response must contain a keysets array',
    });
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(rawSentinel);
  });

  it('throws on invalid getKeys responses without logging the raw body', async () => {
    const logger = createLogger();
    const rawSentinel = 'must-not-appear-in-logs';
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({ invalid: rawSentinel }),
      logger,
    });

    await expect(mint.getKeys()).rejects.toThrow('Invalid response from mint');
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      op: 'getKeys',
      reason: 'response must contain a keysets array',
    });
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(rawSentinel);
  });

  it('createRequestWithOptions preserves stricter endpoint body bounds and carries body metadata', async () => {
    const customRequest = vi.fn(async () => ({ ok: true })) as RequestFn;
    const onResponseBody = vi.fn();
    const mint = new Mint(mintUrl, { customRequest });
    const decorated = mint.createRequestWithOptions({
      responseBodyBytesLimit: 1_024,
      onResponseBody,
    });

    await decorated({
      endpoint: mintUrl + '/v1/test',
      responseBodyBytesLimit: 64,
    });

    expect(customRequest).toHaveBeenCalledWith(
      expect.objectContaining({ responseBodyBytesLimit: 64, onResponseBody }),
    );
  });

  it('createRequestWithOptions composes accounting hooks fail closed', async () => {
    const endpointHook = vi.fn(() => {
      throw new Error('accounting failed');
    });
    const decoratorHook = vi.fn();
    const customRequest = vi.fn(async (options: Parameters<RequestFn>[0]) => {
      options.onResponseBody?.({
        endpoint: options.endpoint,
        status: 200,
        requestId: 'request-1',
        attempt: 1,
        decodedBodyBytes: 2,
        complete: true,
        disposition: 'complete',
      });
      return { ok: true };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest });
    const decorated = mint.createRequestWithOptions({ onResponseBody: decoratorHook });

    await expect(
      decorated({ endpoint: mintUrl + '/v1/test', onResponseBody: endpointHook }),
    ).rejects.toThrow(/accounting callback failed/i);
    expect(endpointHook).toHaveBeenCalledOnce();
    expect(decoratorHook).toHaveBeenCalledOnce();
  });

  it('normalizes melt quote request options for amountless and mpp values', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.requestBody).toMatchObject({
        request: 'ln-offer',
        unit: 'sat',
        options: {
          amountless: { amount_msat: 5000n },
        },
      });
      return {
        quote: 'q1',
        amount: 21,
        unit: 'sat',
        state: MeltQuoteState.UNPAID,
        expiry: 123,
        request: 'ln-offer',
        fee_reserve: 1,
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.createMeltQuoteBolt12({
      request: 'ln-offer',
      unit: 'sat',
      options: {
        amountless: { amount_msat: '5000' },
      },
    });

    expect(response.amount.toBigInt()).toBe(21n);
    expect(response.fee_reserve.toBigInt()).toBe(1n);
  });

  it('throws on invalid melt base responses', async () => {
    const logger = createLogger();
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        quote: 'q1',
        amount: 1,
        unit: 'sat',
        state: 'BROKEN',
        expiry: 123,
      }),
      logger,
    });

    await expect(mint.checkMeltQuoteBolt12('q1')).rejects.toThrow('Invalid response from mint');
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      data: expect.objectContaining({ quote: 'q1', state: 'BROKEN' }),
      op: 'bolt12 melt quote',
    });
  });

  it('throws on invalid bolt melt fields', async () => {
    const logger = createLogger();
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        quote: 'q1',
        amount: 1,
        unit: 'sat',
        state: MeltQuoteState.UNPAID,
        expiry: 123,
        fee_reserve: 1,
      }),
      logger,
    });

    await expect(mint.checkMeltQuoteBolt12('q1')).rejects.toThrow('Invalid response from mint');
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      data: expect.objectContaining({ quote: 'q1' }),
      op: 'bolt12 melt quote',
    });
  });

  describe('normalizeMeltOnchainFields', () => {
    const baseOnchainQuote = {
      quote: 'q1',
      amount: 10,
      unit: 'sat',
      state: MeltQuoteState.UNPAID,
      expiry: 123,
      request: 'bc1qrecipient',
      selected_fee_index: null,
      outpoint: null,
    };

    it('normalizes a valid onchain melt quote response', async () => {
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({
          ...baseOnchainQuote,
          fee_options: [
            { fee_index: 0, fee_reserve: 5, estimated_blocks: 1 },
            { fee_index: 1, fee_reserve: 2, estimated_blocks: 6 },
          ],
        }),
      });

      const response = await mint.checkMeltQuoteOnchain('q1');

      expect(response.fee_options[0].fee_index).toBe(0);
      expect(response.fee_options[0].fee_reserve.toBigInt()).toBe(5n);
      expect(response.fee_options[0].estimated_blocks).toBe(1);
      expect(response.fee_options[1].fee_index).toBe(1);
      expect(response.fee_options[1].fee_reserve.toBigInt()).toBe(2n);
      expect(response.fee_options[1].estimated_blocks).toBe(6);
      expect(response.selected_fee_index).toBeNull();
      expect(response.outpoint).toBeNull();
    });

    it('accepts a string outpoint and a numeric selected_fee_index', async () => {
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({
          ...baseOnchainQuote,
          state: MeltQuoteState.PAID,
          fee_options: [{ fee_index: 0, fee_reserve: 2, estimated_blocks: 6 }],
          selected_fee_index: 0,
          outpoint: 'txid:0',
        }),
      });

      const response = await mint.checkMeltQuoteOnchain('q1');
      expect(response.selected_fee_index).toBe(0);
      expect(response.outpoint).toBe('txid:0');
    });

    it('treats absent selected_fee_index and outpoint as null', async () => {
      // CDK omits nullable fields when they have no value; we accept that as null.
      const { selected_fee_index: _s, outpoint: _o, ...withoutNullables } = baseOnchainQuote;
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({
          ...withoutNullables,
          fee_options: [{ fee_index: 0, fee_reserve: 2, estimated_blocks: 6 }],
        }),
      });
      const response = await mint.checkMeltQuoteOnchain('q1');
      expect(response.selected_fee_index).toBeNull();
      expect(response.outpoint).toBeNull();
    });

    it('throws when fee_options is not an array', async () => {
      const logger = createLogger();
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({ ...baseOnchainQuote, fee_options: 'nope' }),
        logger,
      });

      await expect(mint.checkMeltQuoteOnchain('q1')).rejects.toThrow('Invalid response from mint');
      expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
        data: expect.objectContaining({ quote: 'q1' }),
        op: 'onchain melt quote',
      });
    });

    it('throws when fee_options is empty', async () => {
      const logger = createLogger();
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({ ...baseOnchainQuote, fee_options: [] }),
        logger,
      });

      await expect(mint.checkMeltQuoteOnchain('q1')).rejects.toThrow('Invalid response from mint');
      expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
        data: expect.objectContaining({ quote: 'q1' }),
        op: 'onchain melt quote',
      });
    });

    it.each([
      ['missing', { fee_reserve: 2, estimated_blocks: 6 }],
      ['a non-integer', { fee_index: 1.5, fee_reserve: 2, estimated_blocks: 6 }],
      [
        'an unsafe integer',
        { fee_index: Number.MAX_SAFE_INTEGER + 1, fee_reserve: 2, estimated_blocks: 6 },
      ],
      ['a string', { fee_index: '0', fee_reserve: 2, estimated_blocks: 6 }],
    ])('throws when a fee_options entry has %s fee_index', async (_label, badOption) => {
      const logger = createLogger();
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({ ...baseOnchainQuote, fee_options: [badOption] }),
        logger,
      });

      await expect(mint.checkMeltQuoteOnchain('q1')).rejects.toThrow('Invalid response from mint');
      expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
        data: expect.objectContaining({ quote: 'q1' }),
        op: 'onchain melt quote',
      });
    });

    it('throws when request is not a string', async () => {
      const logger = createLogger();
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({
          ...baseOnchainQuote,
          request: 42,
          fee_options: [{ fee_index: 0, fee_reserve: 2, estimated_blocks: 6 }],
        }),
        logger,
      });

      await expect(mint.checkMeltQuoteOnchain('q1')).rejects.toThrow('Invalid response from mint');
      expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
        data: expect.objectContaining({ quote: 'q1' }),
        op: 'onchain melt quote',
      });
    });

    it('throws when selected_fee_index is non-null and not a safe integer', async () => {
      const logger = createLogger();
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({
          ...baseOnchainQuote,
          fee_options: [{ fee_index: 0, fee_reserve: 2, estimated_blocks: 6 }],
          selected_fee_index: 1.5,
        }),
        logger,
      });

      await expect(mint.checkMeltQuoteOnchain('q1')).rejects.toThrow('Invalid response from mint');
      expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
        data: expect.objectContaining({ quote: 'q1' }),
        op: 'onchain melt quote',
      });
    });

    it('throws when outpoint is non-null and not a string', async () => {
      const logger = createLogger();
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({
          ...baseOnchainQuote,
          fee_options: [{ fee_index: 0, fee_reserve: 2, estimated_blocks: 6 }],
          outpoint: 12345,
        }),
        logger,
      });

      await expect(mint.checkMeltQuoteOnchain('q1')).rejects.toThrow('Invalid response from mint');
      expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
        data: expect.objectContaining({ quote: 'q1' }),
        op: 'onchain melt quote',
      });
    });
  });

  it('mintOnchain posts to /v1/mint/onchain', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(mintUrl + '/v1/mint/onchain');
      expect(options.method).toBe('POST');
      return { signatures: [{ amount: 4, C_: '02sig', id: '00' }] };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.mintOnchain({ quote: 'q1', outputs: [] });

    expect(response.signatures).toHaveLength(1);
    expect(response.signatures[0].amount.toBigInt()).toBe(4n);
  });

  it('meltOnchain posts to /v1/melt/onchain and normalizes onchain fields', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(mintUrl + '/v1/melt/onchain');
      expect(options.method).toBe('POST');
      return {
        quote: 'q1',
        amount: 10,
        unit: 'sat',
        state: MeltQuoteState.PAID,
        expiry: 123,
        request: 'bc1qrecipient',
        fee_options: [{ fee_index: 0, fee_reserve: 2, estimated_blocks: 6 }],
        selected_fee_index: 0,
        outpoint: 'txid:0',
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.meltOnchain({ quote: 'q1', inputs: [], outputs: [] });

    expect(response.amount.toBigInt()).toBe(10n);
    expect(response.fee_options[0].fee_reserve.toBigInt()).toBe(2n);
    expect(response.selected_fee_index).toBe(0);
    expect(response.outpoint).toBe('txid:0');
  });

  it('mintBatchBolt11 posts to /v1/mint/bolt11/batch and normalizes signature amounts', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(mintUrl + '/v1/mint/bolt11/batch');
      expect(options.method).toBe('POST');
      return {
        signatures: [
          { amount: 1, C_: '02sig1', id: '00' },
          { amount: 2, C_: '02sig2', id: '00' },
        ],
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.mintBatchBolt11({
      quotes: ['q1', 'q2'],
      quote_amounts: [Amount.from(1), Amount.from(2)] as any,
      outputs: [],
    });

    expect(response.signatures).toHaveLength(2);
    expect(response.signatures[0].amount.toBigInt()).toBe(1n);
    expect(response.signatures[1].amount.toBigInt()).toBe(2n);
  });

  it('mintBatchBolt12 posts to /v1/mint/bolt12/batch and normalizes signature amounts', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(mintUrl + '/v1/mint/bolt12/batch');
      expect(options.method).toBe('POST');
      return {
        signatures: [{ amount: 4, C_: '02sig', id: '00' }],
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.mintBatchBolt12({
      quotes: ['q1'],
      quote_amounts: [Amount.from(4)] as any,
      outputs: [],
    });

    expect(response.signatures).toHaveLength(1);
    expect(response.signatures[0].amount.toBigInt()).toBe(4n);
  });

  it('mintBatch throws on invalid method string', async () => {
    const mint = new Mint(mintUrl, { customRequest: makeRequest({}) });

    await expect(
      mint.mintBatch('bad method', { quotes: [], quote_amounts: [], outputs: [] }),
    ).rejects.toThrow('Invalid mint method: bad method');
  });

  it('mintBatch throws on invalid response (missing signatures array)', async () => {
    const logger = createLogger();
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({ not_signatures: true }),
      logger,
    });

    await expect(
      mint.mintBatch('bolt11', {
        quotes: ['q1'],
        quote_amounts: [Amount.from(1)] as any,
        outputs: [],
      }),
    ).rejects.toThrow('Invalid response from mint');
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      data: { not_signatures: true },
      op: 'mintBatch.bolt11',
    });
  });

  it('mintBatch throws on invalid response (signatures is not an array)', async () => {
    const logger = createLogger();
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({ signatures: {} }),
      logger,
    });

    await expect(
      mint.mintBatch('bolt11', {
        quotes: ['q1'],
        quote_amounts: [Amount.from(1)] as any,
        outputs: [],
      }),
    ).rejects.toThrow('Invalid response from mint');
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      data: { signatures: {} },
      op: 'mintBatch.bolt11',
    });
  });

  it('getCtfCondition falls back to the conditions list when direct lookup is unsupported', async () => {
    const conditionId = 'a'.repeat(64);
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      if (options.endpoint === `${mintUrl}/v1/conditions/${conditionId}`) {
        throw new MintOperationError(13021, 'Condition not found');
      }
      expect(options.endpoint).toBe(`${mintUrl}/v1/conditions`);
      return {
        conditions: [
          {
            condition_id: conditionId,
            keysets: { YES: 'keyset-yes', NO: 'keyset-no' },
          },
        ],
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const condition = await mint.getCtfCondition(conditionId);

    expect(condition.condition_id).toBe(conditionId);
    expect(condition.keysets).toEqual({
      YES: 'keyset-yes',
      NO: 'keyset-no',
    });
    expect(requestSpy).toHaveBeenCalledTimes(2);
  });

  it('getCtfCondition normalizes partition keysets from current mint responses', async () => {
    const conditionId = 'b'.repeat(64);
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        condition_id: conditionId,
        partitions: [
          {
            partition: ['A', 'B', 'C'],
            collateral: 'sat',
            keysets: {
              A: 'keyset-a',
              B: 'keyset-b',
              C: 'keyset-c',
            },
          },
        ],
      }),
    });

    const condition = await mint.getCtfCondition(conditionId);

    expect(condition.condition_id).toBe(conditionId);
    expect(condition.keysets).toEqual({
      A: 'keyset-a',
      B: 'keyset-b',
      C: 'keyset-c',
    });
  });

  it('lists conditional keysets with query parameters and normalizes metadata numbers', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(
        `${mintUrl}/v1/conditional_keysets?since=1700000000&limit=5&active=true`,
      );
      expect(options.method).toBe('GET');
      return {
        keysets: [
          {
            id: '01' + 'a'.repeat(64),
            unit: 'sat',
            active: true,
            input_fee_ppk: '250',
            final_expiry: '1754296607',
            condition_id: 'b'.repeat(64),
            outcome_collection: 'YES',
            outcome_collection_id: 'c'.repeat(64),
            registered_at: '1700000001',
          },
        ],
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.getConditionalKeysets({
      since: 1_700_000_000,
      limit: 5,
      active: true,
    });

    expect(response.keysets[0].input_fee_ppk).toBe(250);
    expect(response.keysets[0].final_expiry).toBe(1_754_296_607);
    expect(response.keysets[0].registered_at).toBe(1_700_000_001);
  });

  it('uses authenticated bounded catalogue requests and preserves pagination metadata', async () => {
    const cursor = 'snapshot+/= cursor';
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(
        `${mintUrl}/v1/conditional_keysets?catalogue=1&limit=100&cursor=snapshot%2B%2F%3D+cursor`,
      );
      expect(options.method).toBe('GET');
      expect(options.headers?.['Clear-auth']).toBe('cat123');
      expect(options.responseBodyBytesLimit).toBe(16 * 1_024 * 1_024);
      return {
        keysets: [],
        next_cursor: 'next+/=',
        complete: true,
      };
    }) as RequestFn;
    const authProvider: AuthProvider = {
      getBlindAuthToken: vi.fn(async () => 'unused'),
      getCAT: vi.fn(() => 'cat-fallback'),
      setCAT: vi.fn(),
      ensureCAT: vi.fn(async () => 'cat123'),
    };
    const mint = new Mint(mintUrl, { customRequest: requestSpy, authProvider });
    mint.setMintInfo({
      name: 'mint',
      pubkey: '02abcd',
      version: 'test',
      contact: [],
      nuts: {
        '4': { disabled: false, methods: [] },
        '5': { disabled: false, methods: [] },
        '21': {
          openid_discovery: 'https://auth.example/.well-known/openid-configuration',
          client_id: 'cashu-client',
          protected_endpoints: [{ method: 'GET', path: '/v1/conditional_keysets' }],
        },
      },
    });

    await expect(mint.getConditionalKeysets({ catalogue: 1, limit: 100, cursor })).resolves.toEqual(
      {
        keysets: [],
        next_cursor: 'next+/=',
        complete: true,
      },
    );
  });

  it('uses the query-free conditional-keyset path for blind auth', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(
        `${mintUrl}/v1/conditional_keysets?catalogue=1&cursor=opaque%2Bcursor`,
      );
      expect(options.headers?.['Blind-auth']).toBe('bat123');
      return { keysets: [], complete: false };
    }) as RequestFn;
    const authProvider: AuthProvider = {
      getBlindAuthToken: vi.fn(async () => 'bat123'),
      getCAT: vi.fn(() => undefined),
      setCAT: vi.fn(),
    };
    const mint = new Mint(mintUrl, { customRequest: requestSpy, authProvider });
    mint.setMintInfo({
      name: 'mint',
      pubkey: '02abcd',
      version: 'test',
      contact: [],
      nuts: {
        '4': { disabled: false, methods: [] },
        '5': { disabled: false, methods: [] },
        '22': {
          bat_max_mint: 5,
          protected_endpoints: [{ method: 'GET', path: '/v1/conditional_keysets' }],
        },
      },
    });

    await mint.getConditionalKeysets({ catalogue: 1, cursor: 'opaque+cursor' });

    expect(authProvider.getBlindAuthToken).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/conditional_keysets',
    });
  });

  it('treats a legacy conditional-keyset response as incomplete', async () => {
    const mint = new Mint(mintUrl, { customRequest: makeRequest({ keysets: [] }) });

    await expect(mint.getConditionalKeysets()).resolves.toEqual({ keysets: [], complete: false });
  });

  it.each([null, 1, 'true', {}])(
    'rejects malformed catalogue complete metadata: %j',
    async (complete) => {
      const logger = createLogger();
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({ keysets: [], complete }),
        logger,
      });

      await expect(mint.getConditionalKeysets()).rejects.toThrow('Invalid response from mint');
      expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
        op: 'getConditionalKeysets',
        reason: 'complete must be a boolean when present',
      });
    },
  );

  it.each([null, 1, {}, ''])(
    'rejects malformed catalogue next_cursor metadata: %j',
    async (next_cursor) => {
      const mint = new Mint(mintUrl, {
        customRequest: makeRequest({ keysets: [], complete: false, next_cursor }),
      });

      await expect(mint.getConditionalKeysets()).rejects.toThrow('Invalid response from mint');
    },
  );

  it('bounds catalogue cursors by UTF-8 bytes rather than JavaScript string length', async () => {
    const oversizedMultibyteCursor = '界'.repeat(683);
    expect(oversizedMultibyteCursor.length).toBeLessThan(2_048);
    expect(new TextEncoder().encode(oversizedMultibyteCursor)).toHaveLength(2_049);
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        keysets: [],
        complete: false,
        next_cursor: oversizedMultibyteCursor,
      }),
    });

    await expect(mint.getConditionalKeysets()).rejects.toThrow('Invalid response from mint');
  });

  it('preserves a catalogue cursor at the 2048-byte UTF-8 boundary', async () => {
    const maximumMultibyteCursor = 'é'.repeat(1_024);
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({
        keysets: [],
        complete: false,
        next_cursor: maximumMultibyteCursor,
      }),
    });

    await expect(mint.getConditionalKeysets()).resolves.toEqual({
      keysets: [],
      complete: false,
      next_cursor: maximumMultibyteCursor,
    });
  });

  it('wraps condition registration with requested outcome collections', async () => {
    const conditionId = 'd'.repeat(64);
    const feeProof = {
      id: '00bd033559de27d0',
      amount: Amount.from(8),
      secret: 'fee-secret',
      C: '02'.padEnd(66, '1'),
    };
    const changeOutput = {
      id: '00bd033559de27d0',
      amount: 1,
      B_: '02'.padEnd(66, '2'),
    };
    const seen: ReqArgs[] = [];
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      seen.push(options);
      expect(options.endpoint).toBe(`${mintUrl}/v1/conditions`);
      expect(options.method).toBe('POST');
      expect(options.requestBody).toEqual({
        threshold: 1,
        tags: [['description', 'question']],
        announcements: ['abcd'],
        collateral: 'sat',
        outcome_collections: ['YES', 'NO'],
        fee: [feeProof],
        outputs: [changeOutput],
      });
      return {
        condition_id: conditionId,
        keysets: { YES: 'keyset-yes', NO: 'keyset-no' },
        change: [{ amount: 1, C_: '02change', id: '00bd033559de27d0' }],
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    await expect(
      mint.registerCondition({
        threshold: 1,
        tags: [['description', 'question']],
        announcements: ['abcd'],
        collateral: 'sat',
        outcome_collections: ['YES', 'NO'],
        fee: [feeProof],
        outputs: [changeOutput],
      }),
    ).resolves.toEqual({
      condition_id: conditionId,
      keysets: { YES: 'keyset-yes', NO: 'keyset-no' },
      change: [{ amount: Amount.from(1), C_: '02change', id: '00bd033559de27d0' }],
    });
    expect(seen).toHaveLength(1);
  });

  it('ctfConvert posts grouped inputs and outputs and normalizes signatures', async () => {
    const requestSpy = vi.fn(async (options: ReqArgs) => {
      expect(options.endpoint).toBe(`${mintUrl}/v1/ctf/convert`);
      expect(options.method).toBe('POST');
      expect(options.requestBody).toEqual({
        condition_id: 'e'.repeat(64),
        parent_collection_id: 'parent',
        inputs: { YES: [] },
        outputs: {
          NO: [{ id: '00bd033559de27d0', amount: 100, B_: '02'.padEnd(66, 'a') }],
        },
      });
      return {
        signatures: {
          NO: [
            {
              id: '00bd033559de27d0',
              amount: 100,
              C_: '021179b095a67380ab3285424b563b7aab9818bd38068e1930641b3dceb364d422',
            },
          ],
        },
      };
    }) as RequestFn;
    const mint = new Mint(mintUrl, { customRequest: requestSpy });

    const response = await mint.ctfConvert({
      condition_id: 'e'.repeat(64),
      parent_collection_id: 'parent',
      inputs: { YES: [] },
      outputs: {
        NO: [{ id: '00bd033559de27d0', amount: Amount.from(100), B_: '02'.padEnd(66, 'a') }],
      },
    });

    expect(response.signatures.NO[0].amount).toEqual(Amount.from(100));
  });

  it('throws on invalid minted signatures responses', async () => {
    const logger = createLogger();
    const mint = new Mint(mintUrl, {
      customRequest: makeRequest({ signatures: {} }),
      logger,
    });

    await expect(mint.mintBolt12({ quote: 'q1', outputs: [] })).rejects.toThrow(
      'Invalid response from mint',
    );
    expect(logger.error).toHaveBeenCalledWith('Invalid response from mint...', {
      data: { signatures: {} },
      op: 'mint.bolt12',
    });
  });

  it('connectWebSocket builds the expected URL and disconnectWebSocket closes the connection', async () => {
    injectWebSocketImpl(WebSocket);
    const server = new Server(fakeWsUrl, { mock: false });
    const mint = new Mint('https://mint.example/cashu');
    let serverSocket!: Client;

    try {
      await new Promise<void>((res) => {
        server.on('connection', (socket) => {
          serverSocket = socket;
          res();
        });
        void mint.connectWebSocket();
      });

      expect(mint.webSocketConnection?.url.toString()).toBe(fakeWsUrl);

      await new Promise<void>((res) => {
        mint.webSocketConnection?.onClose(() => res());
        mint.disconnectWebSocket();
      });

      expect(serverSocket.readyState).not.toBe(WebSocket.OPEN);
    } finally {
      server.close();
    }
  });

  it('connectWebSocket appends /v1/ws when mintUrl has no path suffix', async () => {
    injectWebSocketImpl(WebSocket);
    const wsUrl = 'ws://mint.example/v1/ws';
    const server = new Server(wsUrl, { mock: false });
    const mint = new Mint('http://mint.example');

    try {
      await new Promise<void>((res) => {
        server.on('connection', () => res());
        void mint.connectWebSocket();
      });
      expect(mint.webSocketConnection?.url.toString()).toBe(wsUrl);
    } finally {
      mint.disconnectWebSocket();
      server.close();
    }
  });

  it('connectWebSocket resets the connection when ensureConnection fails', async () => {
    injectWebSocketImpl(WebSocket);
    const ensureSpy = vi
      .spyOn(WSConnection.prototype, 'ensureConnection')
      .mockRejectedValue(new Error('boom'));
    const logger = createLogger();
    const mint = new Mint('https://mint.example/cashu', { logger });

    await expect(mint.connectWebSocket()).rejects.toThrow('Failed to connect to WebSocket...');
    expect(ensureSpy).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Failed to connect to WebSocket...', {
      e: expect.any(Error),
    });
    expect(mint.webSocketConnection).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// msw-based tests for lastResponseMetadata
// ---------------------------------------------------------------------------
const mswMintUrl = 'https://meta-test-mint.localhost:4444';
const mswServer = setupServer();

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});

describe('Mint.lastResponseMetadata', () => {
  it('is undefined before any request', () => {
    const mint = new Mint(mswMintUrl);
    expect(mint.lastResponseMetadata).toBeUndefined();
  });

  it('is populated after a successful request — status 200', async () => {
    mswServer.use(
      http.get(mswMintUrl + '/v1/info', () => {
        return HttpResponse.json(MINTINFORESP);
      }),
    );
    const mint = new Mint(mswMintUrl);
    await mint.getInfo();

    expect(mint.lastResponseMetadata).toBeDefined();
    expect(mint.lastResponseMetadata!.status).toBe(200);
  });

  it('updates to reflect the most recent response after multiple requests', async () => {
    mswServer.use(
      http.get(mswMintUrl + '/v1/info', () => {
        return HttpResponse.json(MINTINFORESP);
      }),
      http.get(mswMintUrl + '/v1/keys', () => {
        return HttpResponse.json(
          { keysets: [] },
          { headers: { RateLimit: 'limit=100, remaining=50, reset=30' } },
        );
      }),
    );
    const mint = new Mint(mswMintUrl);

    await mint.getInfo();
    expect(mint.lastResponseMetadata!.rateLimit).toBeUndefined();

    await mint.getKeys();
    expect(mint.lastResponseMetadata!.rateLimit).toBe('limit=100, remaining=50, reset=30');
  });

  it('rateLimit is populated when the RateLimit header is present', async () => {
    mswServer.use(
      http.get(mswMintUrl + '/v1/info', () => {
        return HttpResponse.json(MINTINFORESP, {
          headers: {
            RateLimit: 'limit=200, remaining=199, reset=60',
            'RateLimit-Policy': '200;w=60',
          },
        });
      }),
    );
    const mint = new Mint(mswMintUrl);
    await mint.getInfo();

    expect(mint.lastResponseMetadata).toBeDefined();
    expect(mint.lastResponseMetadata!.rateLimit).toBe('limit=200, remaining=199, reset=60');
    expect(mint.lastResponseMetadata!.rateLimitPolicy).toBe('200;w=60');
  });

  it('after a 429, lastResponseMetadata has status 429 and retryAfterMs even though RateLimitError was thrown', async () => {
    mswServer.use(
      http.get(mswMintUrl + '/v1/keys', () => {
        return new HttpResponse(JSON.stringify({ error: 'Too Many Requests' }), {
          status: 429,
          headers: { 'Retry-After': '30' },
        });
      }),
    );
    const mint = new Mint(mswMintUrl);

    await expect(mint.getKeys()).rejects.toThrow(RateLimitError);
    expect(mint.lastResponseMetadata).toBeDefined();
    expect(mint.lastResponseMetadata!.status).toBe(429);
    expect(mint.lastResponseMetadata!.retryAfterMs).toBe(30_000);
  });

  it('two separate Mint instances have independent lastResponseMetadata', async () => {
    const mintUrl2 = 'https://meta-test-mint2.localhost:5555';
    mswServer.use(
      http.get(mswMintUrl + '/v1/info', () => {
        return HttpResponse.json(MINTINFORESP, {
          headers: { RateLimit: 'limit=100, remaining=99, reset=60' },
        });
      }),
      http.get(mintUrl2 + '/v1/info', () => {
        return HttpResponse.json(MINTINFORESP, {
          headers: { RateLimit: 'limit=50, remaining=10, reset=30' },
        });
      }),
    );

    const mint1 = new Mint(mswMintUrl);
    const mint2 = new Mint(mintUrl2);

    await mint1.getInfo();
    await mint2.getInfo();

    expect(mint1.lastResponseMetadata!.rateLimit).toBe('limit=100, remaining=99, reset=60');
    expect(mint2.lastResponseMetadata!.rateLimit).toBe('limit=50, remaining=10, reset=30');
  });
});
