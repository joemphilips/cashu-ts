# CTF range outputs from reserved counters

Use `createCtfRangeManifestFromCounters` to construct plain NUT-13 outputs
from your wallet seed and explicit counter ranges. Reserve the receive and
change ranges in your durable wallet transaction before calling this function.
The function does not reserve counters or write wallet state.

```ts
const manifest = createCtfRangeManifestFromCounters({
  seed,
  receiveKeyset,
  offerKeyset,
  maxReceive: 5n,
  maxChange: 3n,
  maxEntries: 128,
  receiveCounters: { start: reservedReceiveStart, count: 3 },
  changeCounters: { start: reservedChangeStart, count: 2 },
});
```

The manifest contains receive amounts 1, 2 and 4, followed by change amounts
1 and 2. Its global entry indices do not select derivation counters. Each
keyset uses its own supplied range. The ranges must have exactly the required
counts. Both keysets must have canonical version-2 IDs and must differ.

Reconstruct an entry with `deriveCtfRangeOutputFromCounter`, using its seed,
keyset ID, counter and exact amount. This also works for an inactive keyset.
Retain these values for normal retries. Never generate a different output for
an uncertain request. Do not reuse a counter for another output.

`createCtfAuthorizationOutputsFromCounters` constructs contextual
`PAY_TO_UNLOCK` outputs. Reserve two offer-keyset counters per authorization:
one for its JSON nonce and the next for its blinding factor. Reserve change
counters after this authorization range. The caller must keep these ranges
disjoint and commit all reservations and their operation binding atomically.

Authorization secrets contain contextual JSON. They cannot be reconstructed
by a plain NUT-13 seed scan. Retain the exact authorization context for normal
recovery. Deterministic nonce generation does not recover lost context, even
after an authorization expires. Ordinary manifest outputs use plain NUT-13
secret and blinding pairs; a gap-limited scan still cannot promise that it
finds every output beyond an unsigned gap.

These additive APIs preserve the existing operation-scoped APIs. Do not use
one derivation mode to reconstruct records written by the other. This change
does not add wallet migration or a recovery command.
