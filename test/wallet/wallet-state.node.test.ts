import { HttpResponse, http } from 'msw';
import { test, describe, expect, vi } from 'vitest';
import { Wallet, CheckStateEnum, Amount, Mint, type RequestFn } from '../../src';
import {
  dummyKeysResp,
  dummyKeysetResp,
  mint,
  mintInfoResp,
  unit,
  mintUrl,
  useTestServer,
} from './_setup';

const server = useTestServer();

describe('loadMint transport bounds', () => {
  test('applies the response byte limit to cold mint bootstrap', async () => {
    server.use(
      http.get(mintUrl + '/v1/info', () => HttpResponse.json({ name: 'x'.repeat(1024), nuts: {} })),
    );
    const wallet = new Wallet(mint, { unit });

    await expect(
      wallet.loadMint(undefined, {
        requestTimeout: 1_000,
        responseBodyBytesLimit: 64,
      }),
    ).rejects.toThrow('bad response');
  });

  test('decorates rather than replaces a configured mint transport', async () => {
    const customRequest = vi.fn(async ({ endpoint }: { endpoint: string }) => {
      if (endpoint.endsWith('/v1/info')) return mintInfoResp;
      if (endpoint.endsWith('/v1/keysets')) return dummyKeysetResp;
      if (endpoint.endsWith('/v1/keys')) return dummyKeysResp;
      throw new Error(`unexpected custom request: ${endpoint}`);
    }) as RequestFn;
    const customMint = new Mint(mintUrl, { customRequest });
    const wallet = new Wallet(customMint, { unit });
    const controller = new AbortController();
    const onResponseBody = vi.fn();

    await wallet.loadMint(undefined, {
      requestTimeout: 10_000,
      responseBodyBytesLimit: 256 * 1_024,
      signal: controller.signal,
      onResponseBody,
    });

    expect(customRequest).toHaveBeenCalledTimes(3);
    for (const [options] of customRequest.mock.calls) {
      expect(options).toMatchObject({
        requestTimeout: 10_000,
        responseBodyBytesLimit: 256 * 1_024,
        signal: controller.signal,
        onResponseBody,
      });
    }
  });
});

describe('checkProofsStates', () => {
  const proofs = [
    {
      id: '00bd033559de27d0',
      amount: 1n,
      secret: '1f98e6837a434644c9411825d7c6d6e13974b931f8f0652217cea29010674a13',
      C: '034268c0bd30b945adf578aca2dc0d1e26ef089869aaf9a08ba3a6da40fda1d8be',
    },
  ];
  test('test checkProofsStates - get proofs that are NOT spendable', async () => {
    server.use(
      http.post(mintUrl + '/v1/checkstate', () => {
        return HttpResponse.json({
          states: [
            {
              Y: '02d5dd71f59d917da3f73defe997928e9459e9d67d8bdb771e4989c2b5f50b2fff',
              state: 'UNSPENT',
              witness: 'witness-asd',
            },
          ],
        });
      }),
    );
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();

    const result = await wallet.checkProofsStates(proofs);
    result.forEach((r) => {
      expect(r.state).toEqual(CheckStateEnum.UNSPENT);
      expect(r.witness).toEqual('witness-asd');
    });
  });

  test('checkProofsStates with omitted witness coerces undefined → null', async () => {
    server.use(
      http.post(mintUrl + '/v1/checkstate', () => {
        return HttpResponse.json({
          states: [
            {
              Y: '02d5dd71f59d917da3f73defe997928e9459e9d67d8bdb771e4989c2b5f50b2fff',
              state: 'UNSPENT',
              // witness omitted — spec says `<str | null>`
            },
          ],
        });
      }),
    );
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();

    const result = await wallet.checkProofsStates(proofs);
    expect(result[0].witness).toBeNull();
  });

  test('checkProofsStates enforces per-call transport bounds', async () => {
    server.use(
      http.post(mintUrl + '/v1/checkstate', () =>
        HttpResponse.json({ states: [{ witness: 'x'.repeat(1024) }] }),
      ),
    );
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();

    await expect(
      wallet.checkProofsStates(proofs, {
        requestTimeout: 1_000,
        responseBodyBytesLimit: 64,
      }),
    ).rejects.toThrow('bad response');
  });

  test('checkProofsStates reports the exact NUT-07 response body bytes', async () => {
    const responseBody = JSON.stringify({
      states: [
        {
          Y: '02d5dd71f59d917da3f73defe997928e9459e9d67d8bdb771e4989c2b5f50b2fff',
          state: 'UNSPENT',
        },
      ],
    });
    server.use(
      http.post(mintUrl + '/v1/checkstate', () => new HttpResponse(responseBody, { status: 200 })),
    );
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();
    const onResponseBody = vi.fn();

    await wallet.checkProofsStates(proofs, { onResponseBody });

    expect(onResponseBody).toHaveBeenCalledWith(
      expect.objectContaining({
        decodedBodyBytes: new TextEncoder().encode(responseBody).byteLength,
      }),
    );
  });

  test.each([
    {
      name: 'a missing state',
      mutate: () => [],
    },
    {
      name: 'a duplicate state',
      mutate: (states: Array<{ Y: string; state: string }>) => [states[0], states[0]],
    },
    {
      name: 'a foreign state',
      mutate: (states: Array<{ Y: string; state: string }>) => [
        ...states,
        { Y: `03${'11'.repeat(32)}`, state: 'UNSPENT' },
      ],
    },
    {
      name: 'a malformed Y',
      mutate: () => [{ Y: 'not-a-point', state: 'UNSPENT' }],
    },
    {
      name: 'an unknown state',
      mutate: (states: Array<{ Y: string; state: string }>) => [{ ...states[0], state: 'UNKNOWN' }],
    },
  ])('rejects $name instead of partially classifying proofs', async ({ mutate }) => {
    server.use(
      http.post(mintUrl + '/v1/checkstate', async ({ request }) => {
        const body = (await request.json()) as { Ys: string[] };
        const validStates = body.Ys.map((Y) => ({ Y, state: 'UNSPENT' }));
        return HttpResponse.json({ states: mutate(validStates) });
      }),
    );
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();

    await expect(wallet.checkProofsStates(proofs)).rejects.toThrow();
  });

  test('rejects duplicate proof Ys before issuing a request', async () => {
    const check = vi.fn();
    server.use(
      http.post(mintUrl + '/v1/checkstate', () => {
        check();
        return HttpResponse.json({ states: [] });
      }),
    );
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();

    await expect(wallet.checkProofsStates([proofs[0], proofs[0]])).rejects.toThrow(
      /duplicate proof Y/i,
    );
    expect(check).not.toHaveBeenCalled();
  });

  test('maps reordered complete states back to proof order', async () => {
    const secondProof = {
      ...proofs[0],
      secret: '1f98e6837a434644c9411825d7c6d6e13974b931f8f0652217cea29010674a14',
    };
    server.use(
      http.post(mintUrl + '/v1/checkstate', async ({ request }) => {
        const body = (await request.json()) as { Ys: string[] };
        return HttpResponse.json({
          states: [
            { Y: body.Ys[1], state: 'SPENT' },
            { Y: body.Ys[0], state: 'UNSPENT' },
          ],
        });
      }),
    );
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();

    const result = await wallet.checkProofsStates([proofs[0], secondProof]);

    expect(result.map(({ state }) => state)).toEqual([
      CheckStateEnum.UNSPENT,
      CheckStateEnum.SPENT,
    ]);
  });
});

describe('groupProofsByState', () => {
  test('test groupProofsByState groups proofs by state', async () => {
    const proofs = [
      {
        id: '00bd033559de27d0',
        amount: Amount.from(2),
        secret: '1f98e6837a434644c9411825d7c6d6e13974b931f8f0652217cea29010674a13',
        C: '034268c0bd30b945adf578aca2dc0d1e26ef089869aaf9a08ba3a6da40fda1d8be',
      },
      {
        id: '00bd033559de27d0',
        amount: Amount.from(8),
        secret: '1f98e6837a434644c9411825d7c6d6e13974b931f8f0652217cea29010674a14',
        C: '034268c0bd30b945adf578aca2dc0d1e26ef089869aaf9a08ba3a6da40fda1d8be',
      },
      {
        id: '00bd033559de27d0',
        amount: Amount.from(128),
        secret: '1f98e6837a434644c9411825d7c6d6e13974b931f8f0652217cea29010674a15',
        C: '034268c0bd30b945adf578aca2dc0d1e26ef089869aaf9a08ba3a6da40fda1d8be',
      },
      {
        id: '00bd033559de27d0',
        amount: Amount.from(4),
        secret: '1f98e6837a434644c9411825d7c6d6e13974b931f8f0652217cea29010674a16',
        C: '034268c0bd30b945adf578aca2dc0d1e26ef089869aaf9a08ba3a6da40fda1d8be',
      },
      {
        id: '00bd033559de27d0',
        amount: Amount.from(1),
        secret: '1f98e6837a434644c9411825d7c6d6e13974b931f8f0652217cea29010674a17',
        C: '034268c0bd30b945adf578aca2dc0d1e26ef089869aaf9a08ba3a6da40fda1d8be',
      },
      {
        id: '00bd033559de27d0',
        amount: Amount.from(16),
        secret: '1f98e6837a434644c9411825d7c6d6e13974b931f8f0652217cea29010674a18',
        C: '034268c0bd30b945adf578aca2dc0d1e26ef089869aaf9a08ba3a6da40fda1d8be',
      },
    ];
    server.use(
      http.post(mintUrl + '/v1/checkstate', () => {
        return HttpResponse.json({
          states: [
            {
              Y: '02d5dd71f59d917da3f73defe997928e9459e9d67d8bdb771e4989c2b5f50b2fff',
              state: 'SPENT',
              witness: 'witness-asd',
            },
            {
              Y: '02c2c185f0c66b6de36443623fd83d14c6a4725a98f7d9bf6a07f85356574f9068',
              state: 'UNSPENT',
              witness: 'witness-asd',
            },
            {
              Y: '02c801497e8c184b0b041fcd2aff4cd2f3ad35d88f6788afe1591a4540b37a0567',
              state: 'SPENT',
              witness: 'witness-asd',
            },
            {
              Y: '02120df194276661363da9a2fc558975c45ffefc06b094b228074886cddff59470',
              state: 'UNSPENT',
              witness: 'witness-asd',
            },
            {
              Y: '02e7e7e6b59cb8de7e32a9e43dd4329922ff6c93fd30a0a604f08fd3a0bc820c93',
              state: 'PENDING',
              witness: 'witness-asd',
            },
            {
              Y: '029279de78447f77619b2c6905b9140eb4fff110908359bf9efd06f8e17e354099',
              state: 'SPENT',
              witness: 'witness-asd',
            },
          ],
        });
      }),
    );
    const wallet = new Wallet(mint, { unit });
    await wallet.loadMint();
    const result = await wallet.groupProofsByState(proofs);
    expect(result.unspent[0].amount.equals(8n)).toBeTruthy();
    expect(result.unspent[1].amount.equals(4n)).toBeTruthy();
    expect(result.spent[0].amount.equals(2n)).toBeTruthy();
    expect(result.spent[1].amount.equals(128n)).toBeTruthy();
    expect(result.spent[2].amount.equals(16n)).toBeTruthy();
    expect(result.pending[0].amount.equals(1n)).toBeTruthy();
  });
});
