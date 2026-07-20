import { HttpResponse, http } from 'msw';
import { test, describe, expect, vi } from 'vitest';

import { Wallet, Amount, Mint, type Proof, type RequestFn } from '../../src';

import { randomBytes } from '@noble/hashes/utils.js';
import { bls12_381 } from '@noble/curves/bls12-381.js';
import { bytesToHex } from '@noble/curves/utils.js';
import { createBlindSignatureBls, pointFromHexG1 } from '../../src/crypto';
import { deriveKeysetId } from '../../src/utils';
import { useTestServer, mint, unit, dummyKeysResp, mintUrl, logger } from './_setup';

const server = useTestServer();

describe('Restoring deterministic proofs', () => {
  test('Batch restore', async () => {
    const wallet = new Wallet(mint);
    await wallet.loadMint();
    let rounds = 0;
    const mockRestore = vi
      .spyOn(wallet, 'restore')
      .mockImplementation(async (): Promise<{ proofs: Array<Proof> }> => {
        if (rounds === 0) {
          rounds++;
          return { proofs: Array(21).fill(1) as Array<Proof> };
        }
        rounds++;
        return { proofs: [] };
      });
    const { proofs: restoredProofs } = await wallet.batchRestore();
    expect(restoredProofs.length).toBe(21);
    expect(mockRestore).toHaveBeenCalledTimes(2);
    mockRestore.mockClear();
  });
  test('Batch restore with custom values', async () => {
    const wallet = new Wallet(mint);
    await wallet.loadMint();
    let rounds = 0;
    const mockRestore = vi
      .spyOn(wallet, 'restore')
      .mockImplementation(
        async (): Promise<{ proofs: Array<Proof>; lastCounterWithSignature?: number }> => {
          if (rounds === 0) {
            rounds++;
            return { proofs: Array(42).fill(1) as Array<Proof>, lastCounterWithSignature: 41 };
          }
          rounds++;
          return { proofs: [] };
        },
      );
    const { proofs: restoredProofs, lastCounterWithSignature } = await wallet.batchRestore(
      100,
      50,
      0,
    );
    expect(restoredProofs.length).toBe(42);
    expect(mockRestore).toHaveBeenCalledTimes(3);
    expect(lastCounterWithSignature).toBe(41);
    mockRestore.mockClear();
  });

  test.each([
    { gapLimit: 0, batchSize: 1, counter: 0 },
    { gapLimit: 1, batchSize: 0, counter: 0 },
    { gapLimit: 1, batchSize: 301, counter: 0 },
    { gapLimit: 1, batchSize: 1, counter: -1 },
    { gapLimit: 1, batchSize: 1, counter: Number.MAX_SAFE_INTEGER + 1 },
    { gapLimit: Number.MAX_SAFE_INTEGER + 1, batchSize: 1, counter: 0 },
  ])('rejects invalid batch restore bounds %#', async ({ gapLimit, batchSize, counter }) => {
    const wallet = new Wallet(mint);
    await wallet.loadMint();

    await expect(wallet.batchRestore(gapLimit, batchSize, counter)).rejects.toThrow();
  });

  test('stops a mint-controlled non-empty batch loop at the configured maximum', async () => {
    const wallet = new Wallet(mint);
    await wallet.loadMint();
    const restore = vi.spyOn(wallet, 'restore').mockResolvedValue({ proofs: [{} as Proof] });

    await expect(wallet.batchRestore(1, 1, 0, undefined, { maxBatches: 2 })).rejects.toThrow(
      /maximum batch/i,
    );
    expect(restore).toHaveBeenCalledTimes(2);
  });

  test('rejects a restore batch that would cross the counter horizon', async () => {
    const wallet = new Wallet(mint);
    await wallet.loadMint();
    const restore = vi.spyOn(wallet, 'restore');

    await expect(
      wallet.batchRestore(1, 300, 900, undefined, { maxCounter: 1_000 }),
    ).rejects.toThrow(/counter horizon/i);
    expect(restore).not.toHaveBeenCalled();
  });

  test('rejects attempts to expand absolute batch or counter caps', async () => {
    const wallet = new Wallet(mint);
    await wallet.loadMint();

    await expect(wallet.batchRestore(1, 1, 0, undefined, { maxBatches: 1_001 })).rejects.toThrow(
      /maximum batches/i,
    );
    await expect(
      wallet.batchRestore(1, 1, 0, undefined, { maxCounter: 1_000_001 }),
    ).rejects.toThrow(/counter horizon/i);
  });

  test('passes absolute transport options through every batch and honors pre-abort', async () => {
    const wallet = new Wallet(mint);
    await wallet.loadMint();
    const onResponseBody = vi.fn();
    const controller = new AbortController();
    const requestOptions = {
      requestTimeout: 1_000,
      responseBodyBytesLimit: 2_048,
      signal: controller.signal,
      onResponseBody,
    };
    const restore = vi.spyOn(wallet, 'restore').mockResolvedValue({ proofs: [] });

    await wallet.batchRestore(2, 1, 0, undefined, { requestOptions });
    expect(restore).toHaveBeenCalledTimes(2);
    for (const call of restore.mock.calls) {
      expect(call[2]).toEqual({ keysetId: undefined, requestOptions });
    }

    restore.mockClear();
    controller.abort();
    await expect(wallet.batchRestore(1, 1, 0, undefined, { requestOptions })).rejects.toThrow(
      /aborted/i,
    );
    expect(restore).not.toHaveBeenCalled();
  });

  test('does not accept a restore batch when the absolute signal aborts as it resolves', async () => {
    const wallet = new Wallet(mint);
    await wallet.loadMint();
    const controller = new AbortController();
    const restoredProof = {
      id: '009a1f293253e41e',
      amount: 1,
      secret: 'secret',
      C: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    };
    vi.spyOn(wallet, 'restore').mockImplementation(async () => {
      controller.abort();
      return { proofs: [restoredProof], lastCounterWithSignature: 0 };
    });

    await expect(
      wallet.batchRestore(1, 1, 0, undefined, {
        requestOptions: { signal: controller.signal },
      }),
    ).rejects.toThrow(/aborted/i);
  });
});

describe('restore', () => {
  const VALID_POINTS = [
    '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5',
    '02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9',
  ];

  test('sends zero-amount blanks and maps signatures to proofs', async () => {
    const wallet = new Wallet(mint, { unit, bip39seed: randomBytes(32), logger });
    await wallet.loadMint();
    interface RestoreBody {
      outputs: Array<unknown>;
    }
    let seenBody: RestoreBody = { outputs: [] };

    // valid compressed secp point (any well-formed 33-byte point will do)
    server.use(
      http.post(mintUrl + '/v1/restore', async ({ request }) => {
        const body = (await request.json()) as RestoreBody;
        seenBody = body;

        // echo outputs, return one signature per output
        return HttpResponse.json({
          outputs: body.outputs,
          signatures: body.outputs.map((_, index) => ({
            id: dummyKeysResp.keysets[0].id,
            amount: 1, // any existing key amount is fine (dummyKeysResp has 1 & 2)
            C_: VALID_POINTS[index], // valid point so OutputData.toProof() doesn't choke
          })),
        });
      }),
    );

    const res = await wallet.restore(0, 3);

    // request assertions
    expect(Array.isArray(seenBody.outputs)).toBe(true);
    expect(seenBody.outputs).toHaveLength(3);
    expect(seenBody.outputs.every((o: any) => o.amount === 0)).toBe(true);

    // response shape is OK and produced proofs
    expect(Array.isArray(res.proofs)).toBe(true);
    expect(res.proofs.length).toBeGreaterThan(0);
    // proofs should be of amount 1 because we overprinted 1 in the signatures
    expect(res.proofs.every((p) => p.amount.equals(Amount.from(1)))).toBe(true);
  });

  test('passes restore request transport bounds through a configured mint transport', async () => {
    const requestOptions = {
      requestTimeout: 1_234,
      responseBodyBytesLimit: 56_789,
      signal: new AbortController().signal,
    };
    const customRequest = vi.fn(async (options: Parameters<RequestFn>[0]) => {
      if (options.endpoint.endsWith('/v1/info')) {
        return {
          name: 'restore test',
          nuts: { '9': { supported: true } },
        };
      }
      if (options.endpoint.endsWith('/v1/keysets')) {
        return { keysets: [{ ...dummyKeysResp.keysets[0], keys: undefined }] };
      }
      if (options.endpoint.endsWith('/v1/keys')) return dummyKeysResp;
      if (options.endpoint.endsWith('/v1/restore')) return { outputs: [], signatures: [] };
      throw new Error(`unexpected endpoint: ${options.endpoint}`);
    }) as RequestFn;
    const wallet = new Wallet(new Mint(mintUrl, { customRequest }), {
      unit,
      bip39seed: randomBytes(32),
      logger,
    });
    await wallet.loadMint();

    await wallet.restore(0, 1, { requestOptions });

    const restoreCall = customRequest.mock.calls.find(([options]) =>
      options.endpoint.endsWith('/v1/restore'),
    );
    expect(restoreCall?.[0]).toMatchObject(requestOptions);
  });

  test.each([
    {
      name: 'different output and signature lengths',
      mutate: (
        outputs: Array<Record<string, unknown>>,
        signatures: Array<Record<string, unknown>>,
      ) => ({ outputs, signatures: signatures.slice(1) }),
    },
    {
      name: 'a duplicate output',
      mutate: (
        outputs: Array<Record<string, unknown>>,
        signatures: Array<Record<string, unknown>>,
      ) => ({ outputs: [outputs[0], outputs[0]], signatures }),
    },
    {
      name: 'a foreign output',
      mutate: (
        outputs: Array<Record<string, unknown>>,
        signatures: Array<Record<string, unknown>>,
      ) => ({ outputs: [{ ...outputs[0], B_: `03${'11'.repeat(32)}` }, outputs[1]], signatures }),
    },
    {
      name: 'an output from another keyset',
      mutate: (
        outputs: Array<Record<string, unknown>>,
        signatures: Array<Record<string, unknown>>,
      ) => ({ outputs: [{ ...outputs[0], id: '00ffffffffffffff' }, outputs[1]], signatures }),
    },
    {
      name: 'a signature amount absent from the keyset',
      mutate: (
        outputs: Array<Record<string, unknown>>,
        signatures: Array<Record<string, unknown>>,
      ) => ({ outputs, signatures: [{ ...signatures[0], amount: 4 }, signatures[1]] }),
    },
    {
      name: 'a signature from another keyset',
      mutate: (
        outputs: Array<Record<string, unknown>>,
        signatures: Array<Record<string, unknown>>,
      ) => ({ outputs, signatures: [{ ...signatures[0], id: '00ffffffffffffff' }, signatures[1]] }),
    },
    {
      name: 'a duplicate signature',
      mutate: (
        outputs: Array<Record<string, unknown>>,
        signatures: Array<Record<string, unknown>>,
      ) => ({ outputs, signatures: [signatures[0], signatures[0]] }),
    },
  ])('rejects restore responses containing $name', async ({ mutate }) => {
    const wallet = new Wallet(mint, { unit, bip39seed: randomBytes(32), logger });
    await wallet.loadMint();
    server.use(
      http.post(mintUrl + '/v1/restore', async ({ request }) => {
        const body = (await request.json()) as { outputs: Array<Record<string, unknown>> };
        const outputs = body.outputs.map((output) => ({ ...output }));
        const signatures = outputs.map((_, index) => ({
          id: dummyKeysResp.keysets[0].id,
          amount: 1,
          C_: VALID_POINTS[index],
        }));
        return HttpResponse.json(mutate(outputs, signatures));
      }),
    );

    await expect(wallet.restore(0, 2)).rejects.toThrow();
  });

  test('rejects unsafe or oversized restore counter ranges before allocation', async () => {
    const wallet = new Wallet(mint, { unit, bip39seed: randomBytes(32), logger });
    await wallet.loadMint();

    await expect(wallet.restore(-1, 1)).rejects.toThrow(/start/i);
    await expect(wallet.restore(0, 0)).rejects.toThrow(/count/i);
    await expect(wallet.restore(0, 301)).rejects.toThrow(/count/i);
    await expect(wallet.restore(Number.MAX_SAFE_INTEGER, 2)).rejects.toThrow(/range/i);
  });

  test('restores an ordinary v3 BLS proof through the strict response binder', async () => {
    const mintPrivateKey = new Uint8Array(32);
    mintPrivateKey[31] = 7;
    const scalar = bls12_381.fields.Fr.fromBytes(mintPrivateKey);
    const publicKey = bytesToHex(bls12_381.G2.Point.BASE.multiply(scalar).toBytes(true));
    const keys = { '1': publicKey };
    const keysetId = deriveKeysetId(keys, { versionByte: 2, unit });
    const keyset = { id: keysetId, unit, active: true, input_fee_ppk: 0 };
    const mintKeys = { ...keyset, keys };
    server.use(
      http.get(mintUrl + '/v1/keysets', () => HttpResponse.json({ keysets: [keyset] })),
      http.get(mintUrl + '/v1/keys', () => HttpResponse.json({ keysets: [mintKeys] })),
      http.get(mintUrl + '/v1/keys/' + keysetId, () => HttpResponse.json({ keysets: [mintKeys] })),
      http.post(mintUrl + '/v1/restore', async ({ request }) => {
        const body = (await request.json()) as { outputs: Array<{ B_: string }> };
        const output = body.outputs[0];
        const signature = createBlindSignatureBls(
          pointFromHexG1(output.B_),
          mintPrivateKey,
          keysetId,
        );
        return HttpResponse.json({
          outputs: body.outputs,
          signatures: [{ id: keysetId, amount: 1, C_: signature.C_.toHex(true) }],
        });
      }),
    );
    const wallet = new Wallet(mint, { unit, bip39seed: randomBytes(32), logger });
    await wallet.loadMint();

    const result = await wallet.restore(0, 1, { keysetId });

    expect(result.proofs).toHaveLength(1);
    expect(result.proofs[0].id).toBe(keysetId);
    expect(result.proofs[0].amount).toEqual(Amount.from(1));
    expect(result.proofs[0].C).toMatch(/^[0-9a-f]{96}$/);
    expect(result.proofs[0].dleq).toBeUndefined();
  });

  test('maps reordered restore outputs to their original counter order', async () => {
    const seed = randomBytes(32);
    const wallet = new Wallet(mint, { unit, bip39seed: seed, logger });
    await wallet.loadMint();
    let reverse = false;
    server.use(
      http.post(mintUrl + '/v1/restore', async ({ request }) => {
        const body = (await request.json()) as { outputs: Array<Record<string, unknown>> };
        const outputs = body.outputs.map((output) => ({ ...output }));
        if (reverse) outputs.reverse();
        return HttpResponse.json({
          outputs,
          signatures: outputs.map((_, index) => ({
            id: dummyKeysResp.keysets[0].id,
            amount: 1,
            C_: reverse ? VALID_POINTS[1 - index] : VALID_POINTS[index],
          })),
        });
      }),
    );

    const ordered = await wallet.restore(0, 2);
    reverse = true;
    const reordered = await wallet.restore(0, 2);

    expect(reordered.proofs.map(({ secret }) => secret)).toEqual(
      ordered.proofs.map(({ secret }) => secret),
    );
    expect(reordered.lastCounterWithSignature).toBe(1);
  });
});
