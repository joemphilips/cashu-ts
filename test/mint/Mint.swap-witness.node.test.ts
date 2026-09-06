import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  Amount,
  Mint,
  computePayToUnlockRefundDigest,
  createCtfPayToUnlockSecret,
  deriveCtfRangeRefundKey,
  signPayToUnlockRefund,
  type SwapRequest,
} from '../../src';

const mintUrl = 'https://mint.example';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('serializes signed refund witnesses without changing the signed facts or caller input', async () => {
  const keysetId = '00deadbeef123456';
  const point = '02194603ffa36356f4a56b7df9371fc3192472351453ec7398b8da8117e7c3e104';
  const refund = deriveCtfRangeRefundKey(new Uint8Array(64).fill(9), 'transport-refund');
  const request = signPayToUnlockRefund(
    {
      inputs: [
        {
          id: keysetId,
          amount: Amount.from(2),
          secret: createCtfPayToUnlockSecret({
            nonce: '88'.repeat(32),
            data: '99'.repeat(32),
            offerKeyset: keysetId,
            expiry: '100',
            refund: refund.publicKey,
          }),
          C: point,
          dleq: { e: '11'.repeat(32), s: '22'.repeat(32), r: '33'.repeat(32) },
          p2pk_e: point,
        },
      ],
      outputs: [{ id: keysetId, amount: Amount.from(2), B_: point }],
    },
    refund.privateKey,
  );
  const before = computePayToUnlockRefundDigest(request);
  let observed: SwapRequest | undefined;
  server.use(
    http.post(`${mintUrl}/v1/swap`, async ({ request: incoming }) => {
      observed = (await incoming.json()) as SwapRequest;
      return HttpResponse.json({ signatures: [] });
    }),
  );

  await new Mint(mintUrl).swap(request);

  expect(observed).toBeDefined();
  expect(typeof observed!.inputs[0].witness).toBe('string');
  expect(observed!.inputs[0].witness === JSON.stringify(request.inputs[0].witness)).toBe(true);
  expect(computePayToUnlockRefundDigest(observed!)).toBe(before);
  expect(computePayToUnlockRefundDigest(request)).toBe(before);
  expect(typeof request.inputs[0].witness).toBe('object');
});

it.each([undefined, '{"signatures":[]}', { preimage: 'test', signatures: [] }])(
  'preserves absent and encoded witnesses and encodes object witnesses',
  async (witness) => {
    const request: SwapRequest = {
      inputs: [
        {
          id: 'test',
          amount: Amount.from(1),
          secret: 'test',
          C: 'test',
          ...(witness === undefined ? {} : { witness }),
        },
      ],
      outputs: [],
    };
    let observed: SwapRequest | undefined;
    server.use(
      http.post(`${mintUrl}/v1/swap`, async ({ request: incoming }) => {
        observed = (await incoming.json()) as SwapRequest;
        return HttpResponse.json({ signatures: [] });
      }),
    );
    await new Mint(mintUrl).swap(request);
    const expected = typeof witness === 'object' ? JSON.stringify(witness) : witness;
    expect(observed!.inputs[0].witness === expected).toBe(true);
    expect(request.inputs[0].witness === witness).toBe(true);
  },
);
