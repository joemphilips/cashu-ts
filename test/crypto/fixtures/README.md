# Independent CTF counter vectors

`ctf-range-counters.json` contains public test material. Never fund its seed.
`generate_ctf_range_counters.py` uses only the Python standard library. It
implements HMAC, secp256k1 point arithmetic, Cashu hash-to-curve and protocol
serialization without importing the TypeScript implementation.

From this directory, reproduce the fixture with:

```sh
python3 generate_ctf_range_counters.py > /tmp/ctf-range-counters.json
cmp ctf-range-counters.json /tmp/ctf-range-counters.json
```

The generator checks existing NUT-13 and hash-to-curve vectors before emitting
manifest, contextual authorization and boundary cases. The contextual JSON
includes its coordinator key. Its outputs are not plain seed-scan targets.
The test also checks exact amount/keyset metadata during recovery; the blinded
point alone does not commit to the amount.

The fixture uses change counters 9–10 and authorization counters 12–15.
These are deliberately arbitrary disjoint ranges for the pure APIs. They do
not illustrate the later SDK allocation policy, which reserves authorization
counters before change counters in one atomic operation.
