#!/usr/bin/env python3
"""Independent P8d output vectors; Python stdlib only, no cashu-ts imports.

The seed comes from the public ADR-047 test mnemonic and must never fund a wallet.
This calculator implements NUT-13 HMAC, Cashu NUT-00 try-and-increment hash-to-curve,
secp256k1 point arithmetic, and the pinned CTF manifest tagged hash directly.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import sys
PHRASE = " ".join(["abandon"] * 23 + ["art"])
SEED = hashlib.pbkdf2_hmac("sha512", PHRASE.encode(), b"mnemonic", 2048)
KEY_RECEIVE = "01abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
KEY_OFFER = "01" + hashlib.sha256(b"bitCaster P8d independent offer keyset fixture").hexdigest()
N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
G = (
    0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,
    0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8,
)
TAG = b"Cashu/ctf/convert/manifest"
MAX_SAFE = 2**53 - 1


def sha(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()


def inv(x: int) -> int:
    return pow(x % P, P - 2, P)


def point_add(a: tuple[int, int] | None, b: tuple[int, int] | None) -> tuple[int, int] | None:
    if a is None:
        return b
    if b is None:
        return a
    x1, y1 = a
    x2, y2 = b
    if x1 == x2 and (y1 + y2) % P == 0:
        return None
    slope = ((3 * x1 * x1) * inv(2 * y1) if a == b else (y2 - y1) * inv(x2 - x1)) % P
    x3 = (slope * slope - x1 - x2) % P
    return x3, (slope * (x1 - x3) - y1) % P


def point_mul(k: int, point: tuple[int, int] | None = G) -> tuple[int, int] | None:
    k %= N
    result = None
    addend = point
    while k:
        if k & 1:
            result = point_add(result, addend)
        addend = point_add(addend, addend)
        k >>= 1
    return result


def compressed(point: tuple[int, int]) -> str:
    x, y = point
    return ("03" if y & 1 else "02") + f"{x:064x}"


def nut13(keyset: str, counter: int) -> tuple[bytes, int]:
    assert 0 <= counter <= MAX_SAFE
    base = b"Cashu_KDF_HMAC_SHA256" + bytes.fromhex(keyset) + counter.to_bytes(8, "big")
    secret = hmac.new(SEED, base + b"\x00", hashlib.sha256).digest()
    r = int.from_bytes(hmac.new(SEED, base + b"\x01", hashlib.sha256).digest(), "big") % N
    assert r != 0
    return secret, r


def hash_to_curve(secret: bytes) -> tuple[int, int]:
    msg_hash = sha(b"Secp256k1_HashToCurve_Cashu_" + secret)
    for counter in range(2**16):
        x = int.from_bytes(sha(msg_hash + counter.to_bytes(4, "little")), "big")
        if x >= P:
            continue
        y2 = (pow(x, 3, P) + 7) % P
        y = pow(y2, (P + 1) // 4, P)
        if y * y % P != y2:
            continue
        if y & 1:
            y = P - y
        return x, y
    raise ValueError("Cashu hash-to-curve exhausted")


def blind(secret: bytes, r: int) -> str:
    y = hash_to_curve(secret)
    blinded = point_add(y, point_mul(r))
    assert blinded is not None
    return compressed(blinded)


def output(secret: bytes, r: int, amount: int, keyset: str) -> dict[str, str]:
    return {
        "secret": secret.decode("ascii"),
        "r": f"{r:064x}",
        "B_": blind(secret, r),
        "amount": str(amount),
        "id": keyset,
    }


def tagged_hash(tag: bytes, message: bytes) -> str:
    th = sha(tag)
    return sha(th + th + message).hex()


def manifest_commitment(entries: list[dict[str, str]]) -> str:
    # JCS: all object keys here are ASCII, so Unicode scalar and UTF-16 ordering agree.
    canonical = b"".join(
        json.dumps(e, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
        for e in entries
    )
    return tagged_hash(TAG, canonical)


def manifest_output(role: str, index: int, counter: int, amount: int, keyset: str) -> tuple[dict, dict]:
    secret, r = nut13(keyset, counter)
    # OutputData.createSingleDeterministicData blinds the UTF-8 bytes of lowercase secret hex.
    detail = output(secret.hex().encode("ascii"), r, amount, keyset)
    entry = {
        "index": str(index),
        "role": role,
        "amount": str(amount),
        "id": keyset,
        "B_": detail["B_"],
    }
    return entry, detail


def auth_output(index: int, nonce_counter: int, r_counter: int, amount: int, commitment: str) -> dict:
    nonce, _ = nut13(KEY_OFFER, nonce_counter)
    _, r = nut13(KEY_OFFER, r_counter)
    nonce_hex = nonce.hex()
    tags = [
        ["offer_keyset", KEY_OFFER],
        ["expiry", "1900000000"],
        ["refund", f"{G[0]:064x}"],
        ["coordinator_pubkey", f"{G[0]:064x}"],
        ["rate_n", "5"],
        ["rate_d", "3"],
        ["min_receive", "1"],
        ["max_debit", "7"],
    ]
    secret_json = json.dumps(
        ["PAY_TO_UNLOCK", {"data": commitment, "nonce": nonce_hex, "tags": tags}],
        separators=(",", ":"),
        ensure_ascii=False,
    )
    detail = output(secret_json.encode(), r, amount, KEY_OFFER)
    return {
        "authorizationIndex": index,
        "nonceCounter": nonce_counter,
        "nonceSecretHex": nonce_hex,
        "blindingCounter": r_counter,
        "blindingFactorHex": f"{r:064x}",
        "amount": str(amount),
        "id": KEY_OFFER,
        "secretJson": secret_json,
        "B_": detail["B_"],
    }


def main() -> None:
    assert len(bytes.fromhex(KEY_RECEIVE)) == len(bytes.fromhex(KEY_OFFER)) == 33
    assert KEY_RECEIVE.startswith("01") and KEY_OFFER.startswith("01") and KEY_RECEIVE != KEY_OFFER
    # Cross-check public NUT-13 values retained in p8d-research/vectors.py.
    known_secret, known_r = nut13(KEY_RECEIVE, 0)
    assert known_secret.hex() == "58ac300f710285213c52f9da34694e4d6ea541fe69b41fad07b3ba8cef375be2"
    assert f"{known_r:064x}" == "f51a6c21c42ee42b124418db8e5f5038ea976a8e400255c6630c22347490045d"
    # Cross-check Cashu NUT-00 public vectors from the pinned cashu-ts/CDK sources.
    assert compressed(hash_to_curve(bytes(32))) == "024cce997d3b518f739663b757deaec95bcd9473c30a14ac2fd04023a739d1a725"
    assert compressed(hash_to_curve(bytes.fromhex("00" * 31 + "01"))) == "022e7158e11c9506f1aa4248bf531298daa7febd6194f003edcd9b93ade6253acf"

    # Ascending binary denominations covering maxReceive=5 and maxChange=3.
    specs = [
        ("receive", 0, 5, 1, KEY_RECEIVE),
        ("receive", 1, 6, 2, KEY_RECEIVE),
        ("receive", 2, 7, 4, KEY_RECEIVE),
        ("change", 3, 9, 1, KEY_OFFER),
        ("change", 4, 10, 2, KEY_OFFER),
    ]
    manifest, manifest_details = [], []
    for role, index, counter, amount, keyset in specs:
        entry, detail = manifest_output(role, index, counter, amount, keyset)
        manifest.append(entry)
        manifest_details.append({**entry, "counter": counter, **detail})
    commitment = manifest_commitment(manifest)
    auth = [
        auth_output(0, 12, 13, 1, commitment),
        auth_output(1, 14, 15, 2, commitment),
    ]

    boundaries = []
    for label, counter in [("zero", 0), ("maximum-safe-integer", MAX_SAFE)]:
        secret, r = nut13(KEY_RECEIVE, counter)
        detail = output(secret.hex().encode("ascii"), r, 1, KEY_RECEIVE)
        boundaries.append({"label": label, "counter": counter, **detail})

    fixture = {
        "schema": "bitcaster-p8d-independent-cashu-output-vectors-v1",
        "provenance": {
            "warning": "Public test mnemonic only. Never use this fixture seed for funds.",
            "mnemonic": PHRASE,
            "passphrase": "",
            "seedDerivation": "BIP39 PBKDF2-HMAC-SHA512, salt=mnemonic, iterations=2048",
            "generator": "Python standard library only; independent hand-coded secp256k1 and protocol serialization",
            "knownVectorChecks": [
                "NUT-13 HMAC keyset/counter 0 secret and r",
                "Cashu NUT-00 H2C secret 00..00 and 00..01",
            ],
        },
        "keysets": {"receive": KEY_RECEIVE, "offer": KEY_OFFER},
        "manifestCase": {
            "maxReceive": "5",
            "maxChange": "3",
            "receiveCounterRange": {"start": 5, "count": 3},
            "changeCounterRange": {"start": 9, "count": 2},
            "entries": manifest_details,
            "serializedManifest": manifest,
            "commitmentDomain": "Cashu/ctf/convert/manifest",
            "canonicalEntryBytes": [
                json.dumps(e, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
                for e in manifest
            ],
            "commitment": commitment,
        },
        "authorizationCase": {
            "counterRange": {"start": 12, "count": 4},
            "pairingRule": "nonce secret at start+2*k; r at start+2*k+1",
            "context": {
                "expiry": "1900000000",
                "refundXOnly": f"{G[0]:064x}",
                "coordinatorPublicKeyXOnly": f"{G[0]:064x}",
                "poolPolicy": {"rate_n": "5", "rate_d": "3", "min_receive": "1", "max_debit": "7"},
            },
            "outputs": auth,
            "recoveryNote": "Contextual PAY_TO_UNLOCK JSON; excluded from phrase-only scan when retained context is lost.",
        },
        "boundaryCases": boundaries,
    }
    sys.stdout.write(json.dumps(fixture, indent=2, sort_keys=True) + "\n")
    print(f"manifest commitment {commitment}", file=sys.stderr)
    print(f"manifest entries {len(manifest)}; authorization outputs {len(auth)}; boundary cases {len(boundaries)}", file=sys.stderr)


if __name__ == "__main__":
    main()
