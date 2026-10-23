import { sha256 as e, sha512 as t } from "@noble/hashes/sha2.js";
import { bytesToHex as n, concatBytes as r, hexToBytes as i, randomBytes as a, utf8ToBytes as o } from "@noble/hashes/utils.js";
import { base64 as s, base64nopad as c, base64url as l, base64urlnopad as u, bech32 as d, bech32m as f } from "@scure/base";
import { pbkdf2 as p } from "@noble/hashes/pbkdf2.js";
import { schnorr as m, secp256k1 as h } from "@noble/curves/secp256k1.js";
import { bytesToNumberBE as g, equalBytes as _, hexToBytes as v, numberToBytesBE as y } from "@noble/curves/utils.js";
import { hmac as b } from "@noble/hashes/hmac.js";
import { HARDENED_OFFSET as ee, HDKey as te } from "@scure/bip32";
// src/model/Errors.ts
var x = class e extends Error {
	constructor(t, n) {
		super(t), this.name = "CTSError", n?.cause !== void 0 && Object.defineProperty(this, "cause", {
			configurable: !0,
			enumerable: !1,
			value: n.cause,
			writable: !0
		}), Object.setPrototypeOf(this, e.prototype);
	}
}, S = class e extends x {
	constructor(t, n, r) {
		super(t, r), this.status = n, this.name = "HttpResponseError", Object.setPrototypeOf(this, e.prototype);
	}
}, C = class e extends x {
	constructor(t, n) {
		super(t, n), this.name = "NetworkError", Object.setPrototypeOf(this, e.prototype);
	}
}, w = class e extends C {
	constructor(t) {
		super(t), this.name = "CallerAbortError", Object.setPrototypeOf(this, e.prototype);
	}
}, ne = class e extends C {
	constructor(t, n) {
		super(t, n), this.name = "UncancellableReadError", Object.setPrototypeOf(this, e.prototype);
	}
}, T = class e extends x {
	constructor(t) {
		super(t), this.name = "AmountError", Object.setPrototypeOf(this, e.prototype);
	}
}, re = class e extends x {
	constructor(t) {
		super(t), this.name = "AmountWithUnitError", Object.setPrototypeOf(this, e.prototype);
	}
}, ie = class e extends x {
	constructor(t, n) {
		let r = n?.refreshed ?? !1, i = n?.cause === void 0 ? r ? `Keyset '${t}' is not a keyset of this mint` : `Keyset '${t}' is not in the wallet snapshot and no refresh was attempted; call loadMint(true), or retry once the repair cooldown clears` : `Could not resolve unknown keyset '${t}': mint refresh failed`;
		super(i, n), this.keysetId = t, this.refreshed = r, this.name = "UnknownKeysetError", Object.setPrototypeOf(this, e.prototype);
	}
}, ae = class e extends x {
	constructor(t, n, r) {
		super("Melt completed but its change could not be reconstructed; recover the proofs with this error's outputData and createMeltChangeProofs()", r), this.outputData = t, this.quote = n, this.name = "MeltChangeError", Object.setPrototypeOf(this, e.prototype);
	}
}, oe = class e extends x {
	constructor(t, n) {
		super(t ? "Mint rejected a stale keyset; the snapshot has been refreshed, re-prepare the operation" : "Mint rejected a stale keyset; refresh the snapshot (loadMint(true)) and re-prepare", n), this.repaired = t, this.name = "StaleKeysetError", Object.setPrototypeOf(this, e.prototype);
	}
}, se = class e extends S {
	constructor(t, n) {
		super(t, 429), this.retryAfterMs = n, this.name = "RateLimitError", Object.setPrototypeOf(this, e.prototype);
	}
}, ce = class e extends S {
	constructor(t, n) {
		super(n || "Unknown mint operation error", 400), this.code = t, this.name = "MintOperationError", Object.setPrototypeOf(this, e.prototype);
	}
};
function le(e) {
	return e instanceof ce || e instanceof Error && e.name === "MintOperationError" && "code" in e;
}
// src/logger/NullLogger.ts
var E = {
	error() {},
	warn() {},
	info() {},
	debug() {},
	trace() {},
	log() {}
};
// src/logger/helpers.ts
function ue(e, t = E, n) {
	throw t.error(e, n), new x(e);
}
function D(e, t, n = E, r) {
	e && ue(t, n, r);
}
function de(e, t, n = E, r) {
	e ?? ue(t, n, r);
}
function O(e, t, n = E, r) {
	if (e) try {
		let i = e(t);
		i && typeof i.then == "function" && i.catch((t) => {
			try {
				n.warn("callback failed", {
					...r ?? {},
					error: t,
					cb: e.name ?? ""
				});
			} catch {}
		});
	} catch (t) {
		try {
			n.warn("callback failed", {
				...r ?? {},
				error: t,
				cb: e.name ?? ""
			});
		} catch {}
	}
}
// src/utils/limits.ts
var fe = 8192, pe = 1e4, me = 1024, he = 1024, ge = 16384, _e = 2147483647, ve = 2n ** 64n - 1n, ye = 1048576, be = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
	trace: 4
}, xe = {
	"\n": "\\n",
	"\r": "\\r",
	"	": "\\t",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
}, Se = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;
function Ce(e) {
	return String(e).replace(Se, (e) => xe[e] ?? "\\x" + e.charCodeAt(0).toString(16).padStart(2, "0"));
}
function we(e, t) {
	if (typeof e == "string") return Ce(e);
	if (e instanceof Error) return {
		message: Ce(e.message),
		stack: e.stack === void 0 ? void 0 : Ce(e.stack)
	};
	if (t >= 8 || typeof e != "object" || !e) return e;
	if (Array.isArray(e)) return e.map((e) => we(e, t + 1));
	let n = Object.getPrototypeOf(e);
	if (n !== Object.prototype && n !== null) return e;
	let r = {};
	for (let [n, i] of Object.entries(e)) Object.defineProperty(r, n, {
		value: we(i, t + 1),
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
	return r;
}
var Te = class {
	constructor(e = "info") {
		this.minLevel = e;
	}
	should(e) {
		return be[e] <= be[this.minLevel];
	}
	method(e) {
		switch (e) {
			case "error": return console.error;
			case "warn": return console.warn;
			case "info": return console.info;
			case "debug": return console.debug;
			case "trace": return console.trace;
			default: return console.log;
		}
	}
	header(e, t) {
		return `[${e.toUpperCase()}] ${Ce(t)}`;
	}
	flattenContext(e) {
		return e ? we(e, 0) : void 0;
	}
	emit(e, t, n) {
		if (!this.should(e)) return;
		let r = this.header(e, t), i = this.flattenContext(n), a = this.method(e);
		i && Object.keys(i).length ? a(r, i) : a(r);
	}
	error(e, t) {
		this.emit("error", e, t);
	}
	warn(e, t) {
		this.emit("warn", e, t);
	}
	info(e, t) {
		this.emit("info", e, t);
	}
	debug(e, t) {
		this.emit("debug", e, t);
	}
	trace(e, t) {
		this.emit("trace", e, t);
	}
	log(e, t, n) {
		this.emit(e, t, n);
	}
};
function Ee() {
	let e = Date.now();
	return { elapsed: () => Date.now() - e };
}
// src/utils/bytes.ts
var De = new TextDecoder("utf-8", {
	ignoreBOM: !0,
	fatal: !0
});
function Oe(e) {
	try {
		return De.decode(e);
	} catch (e) {
		throw new x("Malformed UTF-8 sequence", { cause: e });
	}
}
var ke = new TextDecoder("utf-8", { fatal: !0 });
function Ae(e) {
	let t;
	try {
		t = ke.decode(e);
	} catch (e) {
		throw new x("Malformed UTF-8 sequence", { cause: e });
	}
	return t.charCodeAt(0) === 65279 ? t.slice(1) : t;
}
var je = /[\uD800-\uDFFF]/u;
function Me(e) {
	return je.test(e);
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/checkPrivateRedeclaration.js
function Ne(e, t) {
	if (t.has(e)) throw TypeError("Cannot initialize the same private elements twice on an object");
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/classPrivateFieldInitSpec.js
function Pe(e, t, n) {
	Ne(e, t), t.set(e, n);
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/typeof.js
function Fe(e) {
	"@babel/helpers - typeof";
	return Fe = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Fe(e);
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/checkInRHS.js
function Ie(e) {
	if (Object(e) !== e) throw TypeError("right-hand side of 'in' should be an object, got " + (e === null ? "null" : Fe(e)));
	return e;
}
// src/model/Amount.ts
var Le, Re = !1, ze = /* @__PURE__ */ new WeakMap();
Le = Symbol.toPrimitive;
var k = class e {
	constructor(e) {
		if (Pe(this, ze, !0), e < 0n) throw new T(`Amount must be >= 0, got ${e}`);
		if (e > ve) throw new T(`Amount exceeds u64 max, got ${e}`);
		this.value = e, Object.freeze(this);
	}
	static from(t) {
		if (t instanceof e) {
			if (!ze.has(Ie(t))) throw new T("Invalid Amount instance");
			return t;
		}
		if (typeof t == "bigint") {
			if (t < 0n) throw new T(`Amount must be >= 0, got ${t}`);
			return new e(t);
		}
		if (typeof t == "number") {
			if (!Number.isFinite(t) || !Number.isInteger(t)) throw new T(`Invalid number amount: ${t}`);
			if (t < 0) throw new T(`Amount must be >= 0, got ${t}`);
			if (!Number.isSafeInteger(t)) throw new T(`Unsafe integer amount: ${t}. Use bigint or decimal string.`);
			return new e(BigInt(t));
		}
		if (typeof t == "string") {
			if (t.length > 20) throw new T(`Amount exceeds u64 max: "${t.slice(0, 20)}..."`);
			if (!/^(0|[1-9]\d*)$/.test(t)) throw new T(`Invalid amount string "${t}". Expected non-negative decimal integer.`);
			return new e(BigInt(t));
		}
		if (typeof t == "object" && t && typeof t.value == "bigint") return new e(t.value);
		throw new T("Unsupported amount input type");
	}
	static zero() {
		return new e(0n);
	}
	static one() {
		return new e(1n);
	}
	toBigInt() {
		return this.value;
	}
	toNumber() {
		if (!this.isSafeNumber()) throw new T(`Amount ${this.value} exceeds Number.MAX_SAFE_INTEGER; use toBigInt/toString/toJSON.`);
		return Number(this.value);
	}
	toNumberUnsafe() {
		return Number(this.value);
	}
	toString() {
		return this.value.toString(10);
	}
	toJSON() {
		return this.toString();
	}
	[Le](e) {
		return e === "string" ? this.toString() : (Re || (Re = !0, console.warn("Implicit numeric coercion of Amount is deprecated and throws in cashu-ts v5; use .add()/.subtract()/.compareTo(), .toBigInt() or .toNumber(), or .toString() for display.")), this.toNumberUnsafe());
	}
	add(t) {
		let n = e.from(t);
		return new e(this.value + n.value);
	}
	subtract(t) {
		let n = e.from(t), r = this.value - n.value;
		if (r < 0n) throw new T(`Amount underflow: ${this.value} - ${n.value} would be negative`);
		return new e(r);
	}
	multiplyBy(t) {
		let n = e.from(t).value;
		return new e(this.value * n);
	}
	divideBy(t) {
		let n = e.from(t).value;
		if (n <= 0n) throw new T(`Divisor must be > 0, got ${n}`);
		return new e(this.value / n);
	}
	modulo(t) {
		let n = e.from(t).value;
		if (n <= 0n) throw new T(`Divisor must be > 0, got ${n}`);
		return new e(this.value % n);
	}
	ceilPercent(t, n = 100) {
		if (!Number.isSafeInteger(t) || t < 0) throw new T(`ceilPercent: numerator must be a non-negative integer, got ${t}`);
		if (!Number.isSafeInteger(n) || n <= 0) throw new T(`ceilPercent: denominator must be a positive integer, got ${n}`);
		let r = BigInt(t), i = BigInt(n);
		return new e((this.value * r + (i - 1n)) / i);
	}
	floorPercent(t, n = 100) {
		if (!Number.isSafeInteger(t) || t < 0) throw new T(`floorPercent: numerator must be a non-negative integer, got ${t}`);
		if (!Number.isSafeInteger(n) || n <= 0) throw new T(`floorPercent: denominator must be a positive integer, got ${n}`);
		let r = BigInt(t), i = BigInt(n);
		return new e(this.value * r / i);
	}
	inRange(t, n) {
		let r = e.from(t), i = e.from(n);
		if (r.greaterThan(i)) throw new T(`inRange: min (${r.toString()}) must be <= max (${i.toString()})`);
		return this.greaterThanOrEqual(r) && this.lessThanOrEqual(i);
	}
	clamp(t, n) {
		let r = e.from(t), i = e.from(n);
		if (r.greaterThan(i)) throw new T(`clamp: min (${r.toString()}) must be <= max (${i.toString()})`);
		return e.max(r, e.min(i, this));
	}
	scaledBy(t, n) {
		let r = e.from(t).value, i = e.from(n).value;
		if (i === 0n) throw new T("scaledBy: denominator must be > 0");
		return r === 0n ? e.zero() : new e((2n * this.value * r + i) / (2n * i));
	}
	isSafeNumber() {
		let e = BigInt(2 ** 53 - 1);
		return this.value <= e;
	}
	isZero() {
		return this.value === 0n;
	}
	equals(t) {
		return this.value === e.from(t).value;
	}
	compareTo(t) {
		let n = e.from(t).value;
		return this.value < n ? -1 : +(this.value > n);
	}
	lessThan(e) {
		return this.compareTo(e) < 0;
	}
	lessThanOrEqual(e) {
		return this.compareTo(e) <= 0;
	}
	greaterThan(e) {
		return this.compareTo(e) > 0;
	}
	greaterThanOrEqual(e) {
		return this.compareTo(e) >= 0;
	}
	static min(t, n) {
		let r = e.from(t), i = e.from(n);
		return r.compareTo(i) <= 0 ? r : i;
	}
	static max(t, n) {
		let r = e.from(t), i = e.from(n);
		return r.compareTo(i) >= 0 ? r : i;
	}
	static sum(t) {
		let n = 0n;
		for (let r of t) n += e.from(r).value;
		return new e(n);
	}
	withUnit(e) {
		return new Be(this, e);
	}
}, Be = class e {
	constructor(e, t) {
		if (typeof t != "string" || t.length === 0) throw new re("unit required");
		this._amount = e, this.unit = t, Object.freeze(this);
	}
	static from(t, n) {
		return new e(k.from(t), n);
	}
	static zero(t) {
		return new e(k.zero(), t);
	}
	static one(t) {
		return new e(k.one(), t);
	}
	toAmount() {
		return this._amount;
	}
	toBigInt() {
		return this._amount.toBigInt();
	}
	toNumber() {
		return this._amount.toNumber();
	}
	toString() {
		return `[${this.unit}]: ${this._amount.toString()}`;
	}
	toJSON() {
		return {
			amount: this._amount.toString(),
			unit: this.unit
		};
	}
	[Symbol.toPrimitive](e) {
		if (e === "string") return this.toString();
		throw new re(`Implicit ${e === "number" ? "numeric" : "default"} coercion of AmountWithUnit is unsafe; use .toAmount() then explicit arithmetic, or .toString() for display.`);
	}
	isZero() {
		return this._amount.isZero();
	}
	isSafeNumber() {
		return this._amount.isSafeNumber();
	}
	requireSameUnit(e) {
		if (this.unit !== e.unit) throw new re(`unit mismatch: ${this.unit} vs ${e.unit}`);
	}
	add(t) {
		return this.requireSameUnit(t), new e(this._amount.add(t._amount), this.unit);
	}
	subtract(t) {
		return this.requireSameUnit(t), new e(this._amount.subtract(t._amount), this.unit);
	}
	equals(e) {
		return this.requireSameUnit(e), this._amount.equals(e._amount);
	}
	compareTo(e) {
		return this.requireSameUnit(e), this._amount.compareTo(e._amount);
	}
	lessThan(e) {
		return this.compareTo(e) < 0;
	}
	lessThanOrEqual(e) {
		return this.compareTo(e) <= 0;
	}
	greaterThan(e) {
		return this.compareTo(e) > 0;
	}
	greaterThanOrEqual(e) {
		return this.compareTo(e) >= 0;
	}
	inRange(e, t) {
		return this.requireSameUnit(e), this.requireSameUnit(t), this._amount.inRange(e._amount, t._amount);
	}
	clamp(t, n) {
		return this.requireSameUnit(t), this.requireSameUnit(n), new e(this._amount.clamp(t._amount, n._amount), this.unit);
	}
	multiplyBy(t) {
		return new e(this._amount.multiplyBy(t), this.unit);
	}
	divideBy(t) {
		return new e(this._amount.divideBy(t), this.unit);
	}
	modulo(t) {
		return new e(this._amount.modulo(t), this.unit);
	}
	ceilPercent(t, n) {
		return new e(this._amount.ceilPercent(t, n), this.unit);
	}
	floorPercent(t, n) {
		return new e(this._amount.floorPercent(t, n), this.unit);
	}
	scaledBy(t, n) {
		return new e(this._amount.scaledBy(t, n), this.unit);
	}
	static min(e, t) {
		return e.requireSameUnit(t), e.compareTo(t) <= 0 ? e : t;
	}
	static max(e, t) {
		return e.requireSameUnit(t), e.compareTo(t) >= 0 ? e : t;
	}
	static sum(t, n) {
		let r = n, i = 0n, a = !1;
		for (let e of t) {
			if (r === void 0) r = e.unit;
			else if (e.unit !== r) throw new re(`unit mismatch: ${r} vs ${e.unit}`);
			i += e._amount.toBigInt(), a = !0;
		}
		if (r === void 0) throw new re("cannot infer unit from empty sum");
		return new e(a ? k.from(i) : k.zero(), r);
	}
}, A = Object.freeze({
	parse: Ye,
	stringify: $e
}), Ve = 64, He;
function Ue(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function We() {
	let e = globalThis.BigInt;
	return typeof e == "function" ? e : void 0;
}
function Ge(e) {
	if (!He) {
		let t = e(String(2 ** 53 - 1));
		He = {
			max: t,
			min: -t
		};
	}
	return He;
}
var Ke = class {
	constructor(e, t, n, r) {
		this.src = e, this.strict = t, this.fallbackTo = n, this.bigIntCtor = r, this.i = 0;
	}
	parse() {
		let e = this.parseValue(0);
		if (this.skipWhitespace(), !this.isEnd()) throw this.syntaxError("Unexpected trailing input");
		return e;
	}
	parseValue(e) {
		if (e > Ve) throw this.syntaxError("JSON nesting exceeds the maximum depth");
		this.skipWhitespace();
		let t = this.peek();
		if (t === "{") return this.parseObject(e);
		if (t === "[") return this.parseArray(e);
		if (t === "\"") return this.parseString();
		if (t === "-" || this.isDigit(t)) return this.parseNumber();
		if (t === "t") return this.parseLiteral("true", !0);
		if (t === "f") return this.parseLiteral("false", !1);
		if (t === "n") return this.parseLiteral("null", null);
		throw this.syntaxError(`Unexpected token '${t || "EOF"}'`);
	}
	parseObject(e) {
		this.expect("{"), this.skipWhitespace();
		let t = {}, n = /* @__PURE__ */ new Set();
		if (this.peek() === "}") return this.expect("}"), t;
		for (; !this.isEnd();) {
			let r = this.parseString();
			if (this.strict && n.has(r)) throw this.syntaxError(`Duplicate key "${r}"`);
			if (n.add(r), this.skipWhitespace(), this.expect(":"), Object.defineProperty(t, r, {
				value: this.parseValue(e + 1),
				writable: !0,
				enumerable: !0,
				configurable: !0
			}), this.skipWhitespace(), this.peek() === "}") return this.expect("}"), t;
			this.expect(","), this.skipWhitespace();
		}
		throw this.syntaxError("Unterminated object");
	}
	parseArray(e) {
		this.expect("["), this.skipWhitespace();
		let t = [];
		if (this.peek() === "]") return this.expect("]"), t;
		for (; !this.isEnd();) {
			if (t.push(this.parseValue(e + 1)), this.skipWhitespace(), this.peek() === "]") return this.expect("]"), t;
			this.expect(","), this.skipWhitespace();
		}
		throw this.syntaxError("Unterminated array");
	}
	parseString() {
		this.expect("\"");
		let e = "";
		for (; !this.isEnd();) {
			let t = this.next();
			if (t === "\"") return e;
			if (t === "\\") {
				let t = this.next();
				switch (t) {
					case "\"":
					case "\\":
					case "/":
						e += t;
						break;
					case "b":
						e += "\b";
						break;
					case "f":
						e += "\f";
						break;
					case "n":
						e += "\n";
						break;
					case "r":
						e += "\r";
						break;
					case "t":
						e += "	";
						break;
					case "u": {
						let t = this.src.slice(this.i, this.i + 4);
						if (!/^[0-9a-fA-F]{4}$/.test(t)) throw this.syntaxError("Invalid unicode escape");
						this.i += 4, e += String.fromCharCode(parseInt(t, 16));
						break;
					}
					default: throw this.syntaxError(`Invalid escape '\\${t}'`);
				}
			} else {
				if (t < " ") throw this.syntaxError("Invalid control character in string");
				e += t;
			}
		}
		throw this.syntaxError("Unterminated string");
	}
	parseNumber() {
		let e = this.i;
		this.peek() === "-" && (this.i += 1), this.peek() === "0" ? this.i += 1 : this.readDigits(), this.peek() === "." && (this.i += 1, this.readDigits());
		let t = this.peek();
		if (t === "e" || t === "E") {
			this.i += 1;
			let e = this.peek();
			(e === "+" || e === "-") && (this.i += 1), this.readDigits();
		}
		let n = this.src.slice(e, this.i);
		if (n.indexOf(".") !== -1 || n.indexOf("e") !== -1 || n.indexOf("E") !== -1) {
			let e = Number(n);
			if (!Number.isFinite(e)) throw this.syntaxError("Bad number");
			return e;
		}
		if (!this.bigIntCtor) switch (this.fallbackTo) {
			case "number": {
				let e = Number(n);
				if (!Number.isFinite(e)) throw this.syntaxError("Bad number");
				return e;
			}
			case "string": return n;
			case "error": throw new x("BigInt is not available in this runtime");
		}
		let r = this.bigIntCtor(n), { max: i, min: a } = Ge(this.bigIntCtor);
		return r > i || r < a ? r : Number(n);
	}
	parseLiteral(e, t) {
		if (this.src.slice(this.i, this.i + e.length) !== e) throw this.syntaxError(`Unexpected token near '${this.src.slice(this.i, this.i + 8)}'`);
		return this.i += e.length, t;
	}
	readDigits() {
		let e = this.i;
		for (; this.isDigit(this.peek());) this.i += 1;
		if (this.i === e) throw this.syntaxError("Bad number");
	}
	skipWhitespace() {
		for (; !this.isEnd();) {
			let e = this.peek();
			if (e === " " || e === "\n" || e === "\r" || e === "	") this.i += 1;
			else break;
		}
	}
	expect(e) {
		if (this.next() !== e) throw this.syntaxError(`Expected '${e}'`);
	}
	peek() {
		return this.src.charAt(this.i);
	}
	next() {
		let e = this.src.charAt(this.i);
		return this.i += 1, e;
	}
	isDigit(e) {
		return e >= "0" && e <= "9";
	}
	isEnd() {
		return this.i >= this.src.length;
	}
	syntaxError(e) {
		return /* @__PURE__ */ SyntaxError(`${e} at position ${this.i}`);
	}
};
function qe(e, t, n) {
	Reflect.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
}
function Je(e, t, n) {
	let r = Array.isArray(e) ? e[Number(t)] : e[t];
	if (Array.isArray(r)) for (let e = 0; e < r.length; e += 1) {
		let t = Je(r, String(e), n);
		t === void 0 ? Reflect.deleteProperty(r, e) : qe(r, String(e), t);
	}
	else if (Ue(r)) for (let e of Object.keys(r)) {
		let t = Je(r, e, n);
		t === void 0 ? delete r[e] : qe(r, e, t);
	}
	return n.call(e, t, r);
}
function Ye(e, t, n) {
	let r = n?.strict === !0, i = n?.fallbackTo ?? "number";
	if (i !== "number" && i !== "string" && i !== "error") throw new x(`Incorrect value for fallbackTo option, must be "number", "string", "error" or undefined but passed ${String(n?.fallbackTo)}`);
	let a = new Ke(String(e), r, i, We()).parse();
	return typeof t == "function" ? Je({ "": a }, "", t) : a;
}
function Xe(e) {
	let t = JSON.stringify(e);
	if (typeof t != "string") throw new x("Failed to stringify string value");
	return t;
}
function Ze(e) {
	return typeof e == "object" && !!e && "toJSON" in e && typeof e.toJSON == "function";
}
function Qe(e) {
	return e instanceof Number || e instanceof String || e instanceof Boolean ? e.valueOf() : e;
}
function $e(e, t, n) {
	let r = "", i = "", a = /* @__PURE__ */ new WeakSet();
	if (typeof n == "number" ? i = " ".repeat(Math.min(10, Math.max(0, Math.floor(n)))) : typeof n == "string" && (i = n.slice(0, 10)), t && typeof t != "function" && !Array.isArray(t)) throw new x("stringify: replacer must be a function or array");
	let o = Array.isArray(t) ? Array.from(new Set(t.filter((e) => typeof e == "string" || typeof e == "number").map((e) => String(e)))) : void 0, s = (e, n) => {
		let c = e[n];
		switch (c instanceof k ? c = c.toBigInt() : Ze(c) && (c = c.toJSON(n)), typeof t == "function" && (c = t.call(e, n, c)), c = Qe(c), typeof c) {
			case "string": return Xe(c);
			case "number": return Number.isFinite(c) ? String(c) : "null";
			case "boolean": return c ? "true" : "false";
			case "bigint": return String(c);
			case "undefined": return;
			case "object": {
				if (c === null) return "null";
				if (a.has(c)) throw TypeError("Converting circular structure to JSON");
				a.add(c);
				let e = r;
				r += i;
				try {
					if (Array.isArray(c)) {
						let t = [], n = c;
						for (let e = 0; e < c.length; e += 1) {
							let r = s(n, String(e));
							t.push(r ?? "null");
						}
						let i = t.length === 0 ? "[]" : r ? `[\n${r}${t.join(`,\n${r}`)}\n${e}]` : `[${t.join(",")}]`;
						return r = e, i;
					}
					let t = c, n = o ?? Object.keys(t), i = [];
					for (let e of n) {
						let n = s(t, e);
						n !== void 0 && i.push(`${Xe(e)}${r ? ": " : ":"}${n}`);
					}
					let a = i.length === 0 ? "{}" : r ? `{\n${r}${i.join(`,\n${r}`)}\n${e}}` : `{${i.join(",")}}`;
					return r = e, a;
				} finally {
					a.delete(c);
				}
			}
			default: return;
		}
	};
	return s({ "": e }, "");
}
// src/utils/base64.ts
function et(e) {
	return e.trim().replace(/[\t\n\f\r ]+/g, "").replace(/={1,2}$/, "");
}
function tt(e) {
	return s.encode(e);
}
function nt(e) {
	return u.encode(e);
}
function rt(e) {
	return l.encode(e);
}
function it(e) {
	try {
		return u.decode(et(e));
	} catch (e) {
		throw new x("Invalid base64url string", { cause: e });
	}
}
function at(e) {
	try {
		return c.decode(et(e));
	} catch (e) {
		throw new x("Invalid base64 string", { cause: e });
	}
}
function ot(e) {
	try {
		return it(e);
	} catch (t) {
		try {
			return at(e);
		} catch {
			throw t;
		}
	}
}
function st(e) {
	let t = Ae(ot(e));
	return A.parse(t, void 0, { strict: !0 });
}
function ct(e) {
	if (typeof e != "string" || e.length === 0) return !1;
	let t = et(e);
	if (t.length === 0) return !1;
	let n = /[-_]/.test(t) ? u : c;
	try {
		return n.encode(n.decode(t)) === t;
	} catch {
		return !1;
	}
}
// src/utils/bech32m.ts
var lt = 1023;
function ut(e) {
	let t = e.lastIndexOf("1");
	if (t < 1 || t === e.length - 1) throw new x("Invalid bech32m string: missing or misplaced separator");
}
function dt(e, t, n = lt) {
	let r = f.toWords(t);
	return f.encode(e, r, n);
}
function ft(e, t = lt) {
	ut(e);
	let { prefix: n, words: r } = f.decode(e, t);
	return {
		hrp: n,
		data: f.fromWords(r)
	};
}
function pt(e, t = lt) {
	return ft(e, t).data;
}
// src/utils/cbor.ts
function mt(e) {
	return typeof e == "number" || typeof e == "bigint" || typeof e == "string";
}
function ht(e) {
	let t = [];
	return gt(e, t), new Uint8Array(t);
}
function gt(e, t) {
	if (e === null) t.push(246);
	else if (e === void 0) t.push(247);
	else if (typeof e == "boolean") t.push(e ? 245 : 244);
	else if (typeof e == "number") St(e, t);
	else if (typeof e == "bigint") vt(e, t);
	else if (typeof e == "string") wt(e, t);
	else if (Array.isArray(e)) Tt(e, t);
	else if (e instanceof Uint8Array) Ct(e, t);
	else if (typeof e == "object" && e && !Array.isArray(e)) Et(e, t);
	else throw new x("Unsupported type");
}
function _t(e, t) {
	e < 24 ? t.push(e) : e < 256 ? t.push(24, e) : e < 65536 ? t.push(25, e >>> 8 & 255, e & 255) : e < 4294967296 ? t.push(26, e >>> 24 & 255, e >>> 16 & 255, e >>> 8 & 255, e & 255) : vt(BigInt(e), t);
}
function vt(e, t) {
	e >= 0n ? yt(0, e, t) : yt(1, -1n - e, t);
}
function yt(e, t, n) {
	let r = e << 5;
	if (t < 24n) n.push(r | Number(t));
	else if (t < 256n) n.push(r | 24, Number(t));
	else if (t < 65536n) {
		let e = Number(t);
		n.push(r | 25, e >>> 8 & 255, e & 255);
	} else if (t < 4294967296n) {
		let e = Number(t);
		n.push(r | 26, e >>> 24 & 255, e >>> 16 & 255, e >>> 8 & 255, e & 255);
	} else if (t < 18446744073709551616n) {
		let e = Number(t >> 32n), i = Number(t & 4294967295n);
		n.push(r | 27, e >>> 24 & 255, e >>> 16 & 255, e >>> 8 & 255, e & 255, i >>> 24 & 255, i >>> 16 & 255, i >>> 8 & 255, i & 255);
	} else throw new x("BigInt value out of uint64 range");
}
function bt(e, t) {
	let n = -1 - e;
	n < 24 ? t.push(32 | n) : n < 256 ? t.push(56, n & 255) : n < 65536 ? t.push(57, n >>> 8 & 255, n & 255) : n < 4294967296 ? t.push(58, n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255) : vt(BigInt(e), t);
}
function xt(e, t) {
	let n = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	n.setFloat64(0, e, !1), t.push(251);
	for (let e = 0; e < 8; e++) t.push(n.getUint8(e));
}
function St(e, t) {
	Number.isInteger(e) ? e >= 0 ? _t(e, t) : bt(e, t) : xt(e, t);
}
function Ct(e, t) {
	let n = e.length;
	if (n < 24) t.push(64 + n);
	else if (n < 256) t.push(88, n);
	else if (n < 65536) t.push(89, n >> 8 & 255, n & 255);
	else if (n < 4294967296) t.push(90, n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255);
	else throw new x("Byte string too long to encode");
	for (let n = 0; n < e.length; n++) t.push(e[n]);
}
function wt(e, t) {
	if (Me(e)) throw new x("CBOR text must be well-formed UTF-16");
	let n = new TextEncoder().encode(e), r = n.length;
	if (r < 24) t.push(96 + r);
	else if (r < 256) t.push(120, r);
	else if (r < 65536) t.push(121, r >>> 8 & 255, r & 255);
	else if (r < 4294967296) t.push(122, r >>> 24 & 255, r >>> 16 & 255, r >>> 8 & 255, r & 255);
	else throw new x("String too long to encode");
	for (let e = 0; e < n.length; e++) t.push(n[e]);
}
function Tt(e, t) {
	let n = e.length;
	if (n < 24) t.push(128 | n);
	else if (n < 256) t.push(152, n);
	else if (n < 65536) t.push(153, n >>> 8 & 255, n & 255);
	else throw new x("Unsupported array length");
	for (let n of e) gt(n, t);
}
function Et(e, t) {
	let n = Object.keys(e), r = n.length;
	if (r >= 4294967296) throw new x("Object has too many keys to encode");
	r < 24 ? t.push(160 | r) : r < 256 ? t.push(184, r) : r < 65536 ? t.push(185, r >> 8 & 255, r & 255) : t.push(186, r >> 24 & 255, r >> 16 & 255, r >> 8 & 255, r & 255);
	for (let r of n) wt(r, t), gt(e[r], t);
}
function Dt(e) {
	return kt(new DataView(e.buffer, e.byteOffset, e.byteLength), 0).value;
}
var Ot = 64;
function kt(e, t, n = 0, r = { nodes: 0 }) {
	if (n > Ot) throw new x("CBOR nesting exceeds the maximum depth");
	if (t >= e.byteLength) throw new x("Unexpected end of data");
	let i = e.getUint8(t++), a = i >> 5, o = i & 31;
	switch (a) {
		case 0: return jt(e, t, o);
		case 1: return Mt(e, t, o);
		case 2: return Nt(e, t, o);
		case 3: return Pt(e, t, o);
		case 4: return It(e, t, o, n, r);
		case 5: return Lt(e, t, o, n, r);
		case 7: return zt(e, t, o);
		default: throw new x(`Unsupported major type: ${a}`);
	}
}
function j(e, t, n) {
	if (t + n > e.byteLength) throw new x("Unexpected end of data");
}
function At(e, t, n) {
	if (n < 24) return {
		value: n,
		offset: t
	};
	if (n === 24) return j(e, t, 1), {
		value: e.getUint8(t++),
		offset: t
	};
	if (n === 25) {
		j(e, t, 2);
		let n = e.getUint16(t, !1);
		return t += 2, {
			value: n,
			offset: t
		};
	}
	if (n === 26) {
		j(e, t, 4);
		let n = e.getUint32(t, !1);
		return t += 4, {
			value: n,
			offset: t
		};
	}
	if (n === 27) {
		j(e, t, 8);
		let n = e.getUint32(t, !1), r = e.getUint32(t + 4, !1);
		t += 8;
		let i = n * 2 ** 32 + r;
		return i > 2 ** 53 - 1 ? {
			value: BigInt(n) << 32n | BigInt(r),
			offset: t
		} : {
			value: i,
			offset: t
		};
	}
	throw new x(`Unsupported length: ${n}`);
}
function jt(e, t, n) {
	let { value: r, offset: i } = At(e, t, n);
	return {
		value: r,
		offset: i
	};
}
function Mt(e, t, n) {
	let { value: r, offset: i } = At(e, t, n);
	if (typeof r == "bigint") return {
		value: -1n - r,
		offset: i
	};
	let a = -1 - r;
	return Number.isSafeInteger(a) ? {
		value: a,
		offset: i
	} : {
		value: -1n - BigInt(r),
		offset: i
	};
}
function Nt(e, t, n) {
	let { value: r, offset: i } = At(e, t, n), a = Number(r);
	if (i + a > e.byteLength) throw new x("Byte string length exceeds data length");
	return {
		value: new Uint8Array(e.buffer, e.byteOffset + i, a),
		offset: i + a
	};
}
function Pt(e, t, n) {
	let { value: r, offset: i } = At(e, t, n), a = Number(r);
	if (i + a > e.byteLength) throw new x("String length exceeds data length");
	return {
		value: Oe(new Uint8Array(e.buffer, e.byteOffset + i, a)),
		offset: i + a
	};
}
function Ft(e) {
	if (e.nodes++, e.nodes > 262144) throw new x("CBOR payload exceeds the maximum item/entry budget");
}
function It(e, t, n, r, i) {
	let { value: a, offset: o } = At(e, t, n), s = Number(a), c = [], l = o;
	for (let t = 0; t < s; t++) {
		Ft(i);
		let t = kt(e, l, r + 1, i);
		c.push(t.value), l = t.offset;
	}
	return {
		value: c,
		offset: l
	};
}
function Lt(e, t, n, r, i) {
	let { value: a, offset: o } = At(e, t, n), s = Number(a), c = {}, l = o;
	for (let t = 0; t < s; t++) {
		Ft(i);
		let t = kt(e, l, r + 1, i);
		if (!mt(t.value)) throw new x("Invalid key type");
		let n = String(t.value);
		if (Object.prototype.hasOwnProperty.call(c, n)) throw new x(`Duplicate map key "${n}"`);
		let a = kt(e, t.offset, r + 1, i);
		Object.defineProperty(c, n, {
			value: a.value,
			writable: !0,
			enumerable: !0,
			configurable: !0
		}), l = a.offset;
	}
	return {
		value: c,
		offset: l
	};
}
function Rt(e) {
	let t = (e & 31744) >> 10, n = e & 1023, r = e & 32768 ? -1 : 1;
	return t === 0 ? r * 2 ** -14 * (n / 1024) : t === 31 ? n ? NaN : r * Infinity : r * 2 ** (t - 15) * (1 + n / 1024);
}
function zt(e, t, n) {
	if (n < 24) switch (n) {
		case 20: return {
			value: !1,
			offset: t
		};
		case 21: return {
			value: !0,
			offset: t
		};
		case 22: return {
			value: null,
			offset: t
		};
		case 23: return {
			value: void 0,
			offset: t
		};
		default: throw new x(`Unknown simple value: ${n}`);
	}
	if (n === 24) {
		j(e, t, 1);
		let n = e.getUint8(t++);
		if (n < 32) throw new x(`Invalid extended simple value: ${n}`);
		return {
			value: n,
			offset: t
		};
	}
	if (n === 25) {
		j(e, t, 2);
		let n = Rt(e.getUint16(t, !1));
		return t += 2, {
			value: n,
			offset: t
		};
	}
	if (n === 26) {
		j(e, t, 4);
		let n = e.getFloat32(t, !1);
		return t += 4, {
			value: n,
			offset: t
		};
	}
	if (n === 27) {
		j(e, t, 8);
		let n = e.getFloat64(t, !1);
		return t += 8, {
			value: n,
			offset: t
		};
	}
	throw new x(`Unknown simple or float value: ${n}`);
}
// src/crypto/bip39.ts
var Bt = [
	12,
	15,
	18,
	21,
	24
];
function Vt(e, n = "") {
	if (typeof e != "string" || typeof n != "string") throw new x("mnemonicToSeedSync: mnemonic and passphrase must be strings");
	let r = e.normalize("NFKD");
	if (!Bt.includes(r.split(" ").length)) throw new x("mnemonicToSeedSync: a mnemonic has 12, 15, 18, 21 or 24 words");
	return p(t, r, ("mnemonic" + n).normalize("NFKD"), {
		c: 2048,
		dkLen: 64
	});
}
// src/crypto/core.ts
var Ht = o("Secp256k1_HashToCurve_Cashu_");
function M(t) {
	let i = e(r(Ht, t)), a = 0, o = /* @__PURE__ */ new Uint8Array(4), s = new DataView(o.buffer), c = 2 ** 16;
	for (let t = 0; t < c; t++) {
		s.setUint32(0, a, !0);
		let t = e(r(i, o));
		try {
			return N(n(r(new Uint8Array([2]), t)));
		} catch {
			a++;
		}
	}
	throw new x("No valid point found");
}
function Ut(t) {
	let n = t.map((e) => e.toHex(!1)).join("");
	return e(new TextEncoder().encode(n));
}
function Wt(e) {
	return h.Point.fromHex(n(e));
}
function N(e) {
	return h.Point.fromHex(e);
}
function Gt(e) {
	try {
		return N(e.toHex(!0));
	} catch (e) {
		throw new x("Invalid point: not a valid secp256k1 point", { cause: e });
	}
}
var Kt = 12, qt = (e) => {
	let t, n = (e) => g(ot(e)) % BigInt(2 ** 31 - 1);
	if (e.length === 12 && ct(e)) t = n(e);
	else if (W(e)) t = Oo(e) % BigInt(2 ** 31 - 1);
	else if (ct(e)) t = n(e);
	else throw new x("Invalid keyset id: neither hex nor base64");
	return t;
};
function Jt() {
	return h.utils.randomSecretKey();
}
function Yt(e, t, n) {
	let r = h.Point.Fn.fromBytes(t);
	return {
		C_: Gt(e).multiply(r),
		id: n
	};
}
function Xt() {
	let e = n(a(32));
	return P(new TextEncoder().encode(e));
}
function P(e, t) {
	let n = M(e);
	if (t === void 0) t = h.Point.Fn.fromBytes(Jt());
	else if (t === 0n) throw new x("Blinding factor r must be non-zero");
	let r = h.Point.BASE.multiply(t);
	return {
		B_: n.add(r),
		r: t,
		secret: e
	};
}
function Zt(e, t, n) {
	return e.subtract(n.multiply(t));
}
function Qt(e, t, n, r) {
	let i = Zt(e.C_, t, r);
	return {
		id: e.id,
		secret: n,
		C: i
	};
}
function $t(t, r = !1) {
	if (Me(t)) throw new x("Message must be well-formed UTF-16");
	let i = e(new TextEncoder().encode(t));
	return r ? n(i) : i;
}
var F = (e, t) => {
	let r = typeof e == "string" ? i(e) : e, a = typeof t == "string" ? i(t) : t, o = m.sign(r, a);
	return n(o);
}, en = (e, t) => F($t(e), t), tn = (e, t, n, r = !1) => {
	try {
		return nn(e, $t(t), n, r);
	} catch (e) {
		if (r) throw e;
	}
	return !1;
}, nn = (e, t, n, r = !1) => {
	try {
		let r = typeof t == "string" ? i(t) : t;
		return m.verify(i(e), r, i(rn(n)));
	} catch (e) {
		if (r) throw e;
	}
	return !1;
};
function rn(e) {
	if (typeof e != "string") return e;
	let t = e.toLowerCase();
	return t.length === 66 && (t.startsWith("02") || t.startsWith("03")) ? t.slice(2) : t;
}
function an(e, t) {
	let r = Array.isArray(t) ? t : [t], a = e.toLowerCase();
	for (let e of r) {
		let t = n(h.getPublicKey(i(e), !0));
		if (t === a) return e;
		if (t.slice(2) === a.slice(2)) {
			let t = h.Point.Fn.fromBytes(i(e));
			return n(h.Point.Fn.toBytes(h.Point.Fn.neg(t)));
		}
	}
	throw new x(`No private key matches quote pubkey ${e}`);
}
function on(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let e of n) {
		let t = rn(e);
		r.has(t) || r.set(t, e);
	}
	return Array.from(r.values()).filter((n) => e.some((e) => tn(e, t, n)));
}
var sn = (e, t, n, r = 1) => !Number.isInteger(r) || r < 1 ? !1 : on(e, t, n).length >= r, cn = /^[a-z0-9_-]+$/;
function ln(e) {
	if (!e) throw new x("Cannot compute keyset ID version 01: unit is required.");
	if (!cn.test(e.toLowerCase())) throw new x(`Invalid keyset unit: ${e}`);
}
function un(e) {
	for (let t of Object.keys(e)) if (t.length > 20) throw new x("Invalid keyset denomination: exceeds 20 digits");
}
function dn(e) {
	let t = Object.keys(e).length;
	if (t === 0 || t > 256) throw new x("Keyset must contain 1..256 denominations");
	if (un(e), new Set(Object.values(e).map((e) => e.toLowerCase())).size !== t) throw new x("Keyset contains duplicate denomination public keys");
}
// src/crypto/CTF.ts
function fn(t) {
	pn(t.conditionId, "conditionId"), pn(t.outcomeCollectionId, "outcomeCollectionId"), ln(t.unit), dn(t.keys);
	let r = Object.entries(t.keys).sort(([e], [t]) => k.from(e).compareTo(t)).map(([e, t]) => `${e}:${t.toLowerCase()}`).join(",");
	return r += `|unit:${t.unit.toLowerCase()}`, t.input_fee_ppk && (r += `|input_fee_ppk:${t.input_fee_ppk}`), t.final_expiry && (r += `|final_expiry:${t.final_expiry}`), r += `|condition_id:${t.conditionId.toLowerCase()}`, r += `|outcome_collection_id:${t.outcomeCollectionId.toLowerCase()}`, "01" + n(e(o(r)));
}
function pn(e, t) {
	if (!/^[0-9a-fA-F]{64}$/.test(e)) throw new x(`${t} must be a 64-character hex string`);
}
function mn(e, t = "keyset id") {
	if (!/^(00[0-9a-f]{14}|01[0-9a-f]{64})$/.test(e)) throw new x(`${t} must be a canonical secp256k1 NUT-02 keyset id`);
	return e;
}
// src/model/BlindedMessage.ts
var hn = class {
	constructor(e, t, n) {
		this.amountValue = k.from(e), this.B_ = t, this.id = n;
	}
	get amount() {
		return this.amountValue;
	}
	getSerializedBlindedMessage() {
		return {
			amount: this.amountValue,
			B_: this.B_.toHex(!0),
			id: this.id
		};
	}
}, gn = /* @__PURE__ */ new Set([
	"locktime",
	"pubkeys",
	"n_sigs",
	"refund",
	"n_sigs_refund",
	"sigflag"
]);
function _n(e) {
	if (!e || typeof e != "string") throw new x("tag key must be a non empty string");
	if (gn.has(e)) throw new x(`additionalTags must not use reserved key "${e}"`);
}
var I = class e {
	constructor(e, t, n, r) {
		if (typeof t != "bigint" || t <= 0n) throw new x("OutputData: blindingFactor must be a positive bigint");
		if (!(n instanceof Uint8Array) || n.length === 0) throw new x("OutputData: secret must be a non-empty Uint8Array");
		if (e == null) throw new x("OutputData: blindedMessage is required");
		this.secret = n, this.blindingFactor = t, this.blindedMessage = e, this.ephemeralE = r;
	}
	toProof(e, t) {
		if (e == null) throw new x("Mint response is missing a signature for one of the outputs. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.");
		if (!this.blindedMessage.amount.isZero() && e.id !== this.blindedMessage.id) throw new x(`Mint signature keyset id ${e.id} does not match output ${this.blindedMessage.id}`);
		let r = this.blindedMessage.amount;
		if (!r.isZero() && !e.amount.equals(r)) throw new x(`Mint signature amount ${e.amount.toString()} does not match requested amount ${r.toString()}. Inputs may already be spent; try restoring (NUT-09) to recover.`);
		let a;
		e.dleq && (a = {
			s: i(e.dleq.s),
			e: i(e.dleq.e),
			r: this.blindingFactor
		});
		let o = e.amount.toString(), s = N(t.keys[o]);
		if (a) {
			let t = N(this.blindedMessage.B_), n = N(e.C_);
			if (!ga(a, t, n, s)) throw new x("DLEQ verification failed on mint response");
		}
		let c = Qt({
			id: e.id,
			C_: N(e.C_)
		}, this.blindingFactor, this.secret, s), l = {
			id: e.id,
			amount: e.amount,
			C: c.C.toHex(!0),
			secret: Oe(c.secret),
			...a && { dleq: {
				s: n(a.s),
				e: n(a.e),
				r: ko(this.blindingFactor)
			} }
		};
		return this.ephemeralE && (l.p2pk_e = this.ephemeralE), l;
	}
	static createP2PKData(e, t, n, r) {
		let i = U(t, n.keys, r), a = e.blindKeys && e.sigFlag === "SIG_ALL" ? Jt() : void 0;
		return i.map((t) => this.createSingleP2PKData(e, t, n.id, a));
	}
	static createSingleP2PKData(t, r, i, o) {
		let s = k.from(r), c = Ui(t), l = Array.isArray(c.pubkey) ? c.pubkey : [c.pubkey], u = c.refundKeys ?? [], d = c.requiredSignatures ?? 1, f = c.requiredRefundSignatures ?? 1, p = c.hashlock, m = typeof p == "string" && p.length > 0, h = m ? p : l[0], g = m ? l : l.slice(1), _ = u, v;
		if (t.blindKeys) {
			let { blinded: e, Ehex: t } = Mi([...l, ...u], o, !m);
			m ? g = e.slice(0, l.length) : (h = e[0], g = e.slice(1, l.length)), _ = e.slice(l.length), v = t;
		}
		let y = [], b = c.locktime ?? NaN;
		if (Number.isSafeInteger(b) && b >= 0 && y.push(["locktime", String(b)]), g.length > 0 && (y.push(["pubkeys", ...g]), d > 1 && y.push(["n_sigs", String(d)])), _.length > 0 && (y.push(["refund", ..._]), f > 1 && y.push(["n_sigs_refund", String(f)])), c.sigFlag == "SIG_ALL" && y.push(["sigflag", "SIG_ALL"]), c.additionalTags?.length) {
			let e = c.additionalTags.map(([e, ...t]) => (_n(e), [e, ...t.map(String)]));
			y.push(...e);
		}
		let ee = [m ? "HTLC" : "P2PK", {
			nonce: n(a(32)),
			data: h,
			tags: y
		}], te = JSON.stringify(ee), S = [...te].length;
		if (S > 1024) throw new x(`Secret too long (${S} characters), maximum is ${he}`);
		let C = new TextEncoder().encode(te), { r: w, B_: ne } = P(C);
		return new e(new hn(s, ne, i).getSerializedBlindedMessage(), w, C, v);
	}
	static createRandomData(e, t, n) {
		return U(e, t.keys, n).map((e) => this.createSingleRandomData(e, t.id));
	}
	static createSingleData(t, n, r, i) {
		let a = k.from(t), o = typeof r == "string" ? new TextEncoder().encode(r) : r, { r: s, B_: c } = P(o, i);
		return new e(new hn(a, c, n).getSerializedBlindedMessage(), s, o);
	}
	static createSingleRandomData(t, r) {
		let i = k.from(t), o = n(a(32)), s = new TextEncoder().encode(o), { r: c, B_: l } = P(s);
		return new e(new hn(i, l, r).getSerializedBlindedMessage(), c, s);
	}
	static createDeterministicData(e, t, n, r, i) {
		let a = U(e, r.keys, i), o = jr(t, r.id);
		return a.map((e, t) => vn(e, r.id, o(n + t)));
	}
	static createSingleDeterministicData(e, t, n, r) {
		return vn(e, r, Ar(t, r, n));
	}
	static sumOutputAmounts(e) {
		return k.sum(e.map((e) => e.blindedMessage.amount));
	}
	static serialize(e) {
		return {
			blindedMessage: {
				amount: e.blindedMessage.amount.toString(),
				B_: e.blindedMessage.B_,
				id: e.blindedMessage.id
			},
			blindingFactor: e.blindingFactor.toString(),
			secret: n(e.secret),
			...e.ephemeralE && { ephemeralE: e.ephemeralE }
		};
	}
	static deserialize(t) {
		try {
			if (!/^(0|[1-9]\d*)$/.test(t.blindingFactor)) throw new x("blindingFactor must be a canonical decimal integer");
			let n = i(t.secret);
			Oe(n);
			let r = BigInt(t.blindingFactor), { B_: a } = P(n, r);
			if (a.toHex(!0) !== t.blindedMessage.B_.toLowerCase()) throw new x("stored output does not match its secret. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.");
			return new e({
				amount: k.from(t.blindedMessage.amount),
				B_: t.blindedMessage.B_,
				id: t.blindedMessage.id
			}, r, n, t.ephemeralE ? N(t.ephemeralE).toHex(!0) : void 0);
		} catch (e) {
			throw new x(`Invalid SerializedOutputData: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
		}
	}
};
function vn(e, t, r) {
	let i = k.from(e), a = n(r.secret), o = new TextEncoder().encode(a), { r: s, B_: c } = P(o, g(r.blindingFactor));
	return new I(new hn(i, c, t).getSerializedBlindedMessage(), s, o);
}
// src/crypto/CTFSettlement.ts
var yn = "Cashu/ctf/convert/recv", bn = "Cashu/ctf/convert/manifest", xn = "Cashu/ctf/convert/request", Sn = "Cashu/ctf/convert/coordinator", Cn = "Cashu/PAY_TO_UNLOCK/refund", wn = "PAY_TO_UNLOCK", Tn = 18446744073709551615n, L = 340282366920938463463374607431768211455n, En = "00".repeat(32), Dn = /* @__PURE__ */ new Set([
	"offer_keyset",
	"expiry",
	"refund",
	"coordinator_pubkey",
	"rate_n",
	"rate_d",
	"min_receive",
	"max_debit"
]);
function On(t, i) {
	let a = e(o(t));
	return n(e(r(a, a, i)));
}
function kn(e) {
	if (e.length > 4294967295) throw new x("CTF output count exceeds uint32");
	let t = /* @__PURE__ */ new Uint8Array(4);
	new DataView(t.buffer).setUint32(0, e.length, !0);
	let n = e.map((e) => o(Gn(e)));
	return On(yn, r(t, ...n));
}
function An(e) {
	Zn(e);
	let t = e.map((e) => o(qn(e)));
	return On(bn, r(...t));
}
function jn(e, t) {
	hr(e);
	let r = new Uint8Array(Math.ceil(e / 8)), i = /* @__PURE__ */ new Set();
	for (let n of t) {
		if (!Number.isSafeInteger(n) || n < 0 || n >= e) throw new x("CTF selection index is out of range");
		if (i.has(n)) throw new x("CTF selection contains a duplicate index");
		i.add(n), r[n >> 3] |= 1 << (n & 7);
	}
	return n(r);
}
function Mn(e, t) {
	hr(t);
	let n = Math.ceil(t / 8) * 2;
	if (e.length !== n) throw new x("CTF selection has an incorrect byte length");
	if (!/^[0-9a-f]*$/.test(e)) throw new x("CTF selection must be lowercase hexadecimal");
	let r = v(e);
	return gr(r, t), _r(r, t);
}
function Nn(e, t) {
	return Zn(e), Mn(t, e.length).map((t) => vr(e[t]));
}
function Pn(e, t, n) {
	Zn(e);
	let r = yr(e, "receive", k.from(t)), i = yr(e, "change", k.from(n)), a = [...r, ...i].sort((e, t) => e - t), o = jn(e.length, a);
	return {
		selection: o,
		selectedIndices: a,
		outputs: Nn(e, o),
		receiveTotal: k.from(t),
		changeTotal: k.from(n)
	};
}
function Fn(e) {
	return On(xn, zn(e));
}
function In(e) {
	return On(Sn, zn(e));
}
function Ln(e, t) {
	let r = dr(t, "coordinator"), i = fr(e);
	if (n(h.getPublicKey(r, !0).slice(1)) !== i) throw new x("coordinator private key does not match PAY_TO_UNLOCK condition");
	return {
		...e,
		coordinator_sig: F(In(e), r)
	};
}
function Rn(e) {
	try {
		let t = pr(e);
		return t === void 0 ? e.coordinator_sig === void 0 : /^[0-9a-f]{128}$/.test(e.coordinator_sig ?? "") ? m.verify(v(e.coordinator_sig), v(In(e)), v(t)) : !1;
	} catch {
		return !1;
	}
}
function zn(e) {
	let t = cr(e.condition_id, "condition_id"), n = cr(e.parent_collection_id ?? En, "parent_collection_id");
	return or(e.participants), r(v(t), v(n), ...e.participants.map(Jn));
}
function Bn(e) {
	let t = cr(e.nonce, "nonce"), n = cr(e.data, "data"), r = lr(e.offerKeyset, "offer_keyset"), i = z(e.expiry, "expiry", Tn).toString(), a = ur(e.refund, "refund"), o = [
		["offer_keyset", r],
		["expiry", i],
		["refund", a]
	];
	return e.coordinatorPublicKey !== void 0 && o.push(["coordinator_pubkey", ur(e.coordinatorPublicKey, "coordinator public key")]), e.poolPolicy && o.push(...ir(nr(e.poolPolicy))), JSON.stringify([wn, {
		data: n,
		nonce: t,
		tags: o
	}]);
}
function Vn(e) {
	let t = $n(e), n = er(t.tags);
	return {
		nonce: cr(t.nonce, "nonce"),
		data: cr(t.data, "data"),
		offerKeyset: lr(ar(n, "offer_keyset"), "offer_keyset"),
		expiry: z(ar(n, "expiry"), "expiry", Tn),
		refund: ur(ar(n, "refund"), "refund"),
		...n.has("coordinator_pubkey") ? { coordinatorPublicKey: ur(ar(n, "coordinator_pubkey"), "coordinator public key") } : {},
		mode: tr(n)
	};
}
function Hn(e, t, n, r) {
	rr(e);
	for (let [e, i] of [
		["inputTotal", t],
		["receiveTotal", n],
		["changeTotal", r]
	]) if (i < 0n || i > L) throw new x(`${e} must fit u128`);
	if (e.maxDebit > t) throw new x("maxDebit exceeds input total");
	if (r > t) throw new x("change exceeds input total");
	let i = t - r;
	if (Cr(n, e.rateD) < Cr(i, e.rateN)) throw new x("selected rate is below the limit");
	if (n < e.minReceive) throw new x("receive is below minReceive");
	if (i > e.maxDebit) throw new x("debit exceeds maxDebit");
}
function Un(e) {
	let t = R({
		inputs: e.inputs.map((e) => Yn(e, !1)),
		outputs: e.outputs.map(Kn)
	});
	return On(Cn, o(t));
}
function Wn(e, t) {
	let r = dr(t, "refund"), i = n(h.getPublicKey(r, !0).slice(1)), a = Un(e);
	return {
		inputs: e.inputs.map((e) => {
			if (Vn(e.secret).refund !== i) throw new x("refund private key does not match PAY_TO_UNLOCK condition");
			return {
				...e,
				witness: { signatures: [F(a, r)] }
			};
		}),
		outputs: e.outputs
	};
}
function Gn(e) {
	return R(Kn(e));
}
function Kn(e) {
	return Qn(e), {
		B_: e.B_,
		amount: mr(e.amount),
		id: e.id
	};
}
function qn(e) {
	return R({
		B_: e.B_,
		amount: e.amount,
		id: e.id,
		index: e.index,
		role: e.role
	});
}
function Jn(e) {
	sr(e.inputs);
	let t = {
		inputs: e.inputs.map((e) => Yn(e, !0)),
		outputs: e.outputs.map(Kn)
	};
	if (e.pool_manifest !== void 0 != (e.pool_selection !== void 0)) throw new x("pool_manifest and pool_selection must appear together");
	if (e.pool_manifest && e.pool_selection !== void 0) {
		if (Zn(e.pool_manifest), !xr(Nn(e.pool_manifest, e.pool_selection), e.outputs)) throw new x("pool selection does not exactly match participant outputs");
		return t.pool_manifest = e.pool_manifest.map((e) => ({
			B_: e.B_,
			amount: e.amount,
			id: e.id,
			index: e.index,
			role: e.role
		})), r(o(R(t)), v(e.pool_selection));
	}
	return o(R(t));
}
function Yn(e, t) {
	let n = {
		C: e.C,
		amount: mr(e.amount),
		id: e.id,
		secret: e.secret
	};
	return e.dleq && (n.dleq = Xn(e.dleq)), e.p2pk_e !== void 0 && (n.p2pk_e = e.p2pk_e), t && e.witness !== void 0 && (n.witness = typeof e.witness == "string" ? e.witness : Xn(e.witness)), n;
}
function Xn(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) if (r !== void 0) {
		if (typeof r == "string" || typeof r == "boolean" || typeof r == "number") t[n] = r;
		else if (Array.isArray(r)) t[n] = r.map((e) => String(e));
		else throw new x(`Unsupported canonical object field ${n}`);
	}
	return t;
}
function R(e) {
	return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string" ? JSON.stringify(e) : Array.isArray(e) ? `[${e.map(R).join(",")}]` : `{${Object.keys(e).sort().map((t) => `${JSON.stringify(t)}:${R(e[t])}`).join(",")}}`;
}
function Zn(e) {
	if (e.length < 2) throw new x("CTF manifest requires receive and change entries");
	let t = !1, n = !1, r = /* @__PURE__ */ new Set();
	if (e.forEach((e, i) => {
		if (e.index !== String(i)) throw new x("CTF manifest indices must be contiguous");
		if (e.role === "receive" && n) throw new x("CTF manifest receive entries must precede change entries");
		if (e.role === "receive" && (t = !0), e.role === "change" && (n = !0), e.role !== "receive" && e.role !== "change") throw new x("CTF manifest has an unknown role");
		if (z(e.amount, "pool_manifest.amount", Tn), Qn(vr(e)), r.has(e.B_)) throw new x("CTF manifest has a duplicate blinded message");
		r.add(e.B_);
	}), !t || !n) throw new x("CTF manifest requires receive and change entries");
}
function Qn(e) {
	if (mr(e.amount), lr(e.id, "output id"), e.B_ !== e.B_.toLowerCase()) throw new x("blinded message must use canonical lowercase hex");
	try {
		if (N(e.B_).toHex(!0) !== e.B_) throw new x("unsupported or noncanonical point");
	} catch (e) {
		throw new x("blinded message contains an invalid point", { cause: e });
	}
}
function $n(e) {
	let t;
	try {
		t = JSON.parse(e);
	} catch (e) {
		throw new x("PAY_TO_UNLOCK condition is malformed", { cause: e });
	}
	if (!Array.isArray(t) || t.length !== 2 || t[0] !== wn) throw new x("condition kind must be PAY_TO_UNLOCK");
	if (!wr(t[1]) || !Tr(t[1], [
		"nonce",
		"data",
		"tags"
	])) throw new x("PAY_TO_UNLOCK condition fields are malformed");
	if (typeof t[1].nonce != "string" || typeof t[1].data != "string" || !Array.isArray(t[1].tags)) throw new x("PAY_TO_UNLOCK condition values are malformed");
	return {
		nonce: t[1].nonce,
		data: t[1].data,
		tags: t[1].tags
	};
}
function er(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (!Array.isArray(n) || typeof n[0] != "string") throw new x("each PAY_TO_UNLOCK tag must contain exactly one string value");
		if (!Dn.has(n[0])) throw new x(`unknown PAY_TO_UNLOCK tag ${n[0]}`);
		if (n.length !== 2 || typeof n[1] != "string") throw new x("each PAY_TO_UNLOCK tag must contain exactly one string value");
		if (t.has(n[0])) throw new x(`duplicate PAY_TO_UNLOCK tag ${n[0]}`);
		t.set(n[0], n[1]);
	}
	return t;
}
function tr(e) {
	let t = [
		"rate_n",
		"rate_d",
		"min_receive",
		"max_debit"
	].map((t) => e.get(t));
	if (t.every((e) => e === void 0)) return { kind: "standard" };
	if (t.some((e) => e === void 0)) throw new x("pool mode requires all four pool tags");
	return {
		kind: "pool",
		policy: nr({
			rateN: t[0],
			rateD: t[1],
			minReceive: t[2],
			maxDebit: t[3]
		})
	};
}
function nr(e) {
	let t = {
		rateN: z(e.rateN, "rate_n", L),
		rateD: z(e.rateD, "rate_d", L),
		minReceive: z(e.minReceive, "min_receive", L),
		maxDebit: z(e.maxDebit, "max_debit", L)
	};
	return rr(t), t;
}
function rr(e) {
	for (let t of Object.values(e)) if (t < 0n || t > L) throw new x("pool policy value must fit u128");
	if (e.rateD === 0n) throw new x("rate_d must be positive");
	if (e.minReceive === 0n) throw new x("min_receive must be positive");
	if (Sr(e.rateN, e.rateD) !== 1n) throw new x("rate_n/rate_d must be a reduced fraction");
}
function ir(e) {
	return [
		["rate_n", e.rateN.toString()],
		["rate_d", e.rateD.toString()],
		["min_receive", e.minReceive.toString()],
		["max_debit", e.maxDebit.toString()]
	];
}
function ar(e, t) {
	let n = e.get(t);
	if (n === void 0) throw new x(`missing PAY_TO_UNLOCK tag ${t}`);
	return n;
}
function or(e) {
	if (e.length < 2) throw new x("CTF settlement requires at least two participants");
	let t;
	for (let n of e) {
		sr(n.inputs);
		let e = n.inputs[0];
		if (!e) throw new x("CTF settlement participant requires an input");
		let r = `${e.id}\u0000${e.secret}`;
		if (t !== void 0 && r <= t) throw new x("CTF settlement participants are not in canonical order");
		t = r;
	}
}
function sr(e) {
	if (e.length === 0) throw new x("CTF settlement participant requires an input");
	let t;
	for (let n of e) {
		let e = `${n.id}\u0000${n.secret}`;
		if (t !== void 0 && e <= t) throw new x("CTF settlement inputs are not in canonical order");
		t = e;
	}
}
function cr(e, t) {
	if (!/^[0-9a-f]{64}$/.test(e)) throw new x(`${t} must be canonical lowercase 32-byte hex`);
	return e;
}
function lr(e, t) {
	return mn(e, t);
}
function ur(e, t) {
	if (!/^[0-9a-f]{64}$/.test(e)) throw new x(`${t} must be canonical lowercase x-only public key hex`);
	try {
		h.Point.fromHex(`02${e}`);
	} catch (e) {
		throw new x(`${t} is not a valid x-only public key`, { cause: e });
	}
	return e;
}
function dr(e, t) {
	if (e instanceof Uint8Array) {
		if (e.length !== 32) throw new x(`${t} private key must contain exactly 32 bytes`);
		try {
			h.getPublicKey(e, !0);
		} catch (e) {
			throw new x(`${t} private key is invalid`, { cause: e });
		}
		return e;
	}
	if (!/^[0-9a-f]{64}$/.test(e)) throw new x(`${t} private key must be canonical lowercase 32-byte hex`);
	let n = v(e);
	try {
		h.getPublicKey(n, !0);
	} catch (e) {
		throw new x(`${t} private key is invalid`, { cause: e });
	}
	return n;
}
function fr(e) {
	let t = pr(e);
	if (t === void 0) throw new x("settlement request is not bound to a coordinator");
	return t;
}
function pr(e) {
	let t;
	for (let n of e.participants) for (let e of n.inputs) {
		let n = Vn(e.secret).coordinatorPublicKey;
		if (n !== void 0) {
			if (t !== void 0 && t !== n) throw new x("settlement request contains conflicting coordinator keys");
			t = n;
		}
	}
	return t;
}
function mr(e) {
	let t = k.from(e).toBigInt();
	if (t > Tn) throw new x("amount exceeds u64");
	return t.toString();
}
function z(e, t, n) {
	if (typeof e == "number" && (!Number.isSafeInteger(e) || e < 0)) throw new x(`${t} number must be a non-negative safe integer`);
	let r = typeof e == "string" ? e : String(e);
	if (!/^(0|[1-9]\d*)$/.test(r)) throw new x(`${t} must be a minimal unsigned decimal`);
	let i = BigInt(r);
	if (n !== void 0 && i > n) throw new x(`${t} exceeds its limit`);
	return i;
}
function hr(e) {
	if (!Number.isSafeInteger(e) || e < 1) throw new x("CTF selection entry count must be a positive safe integer");
}
function gr(e, t) {
	let n = t & 7;
	if (n === 0) return;
	let r = e[e.length - 1];
	if (r !== void 0 && r >> n !== 0) throw new x("CTF selection unused trailing bits must be zero");
}
function _r(e, t) {
	let n = [];
	for (let r = 0; r < t; r += 1) e[r >> 3] & 1 << (r & 7) && n.push(r);
	return n;
}
function vr(e) {
	return {
		amount: k.from(e.amount),
		id: e.id,
		B_: e.B_
	};
}
function yr(e, t, n) {
	let r = e.map((e, t) => ({
		entry: e,
		index: t
	})).filter(({ entry: e }) => e.role === t);
	br(r.map(({ entry: e }) => e.amount), t);
	let i = n.toBigInt(), a = [];
	for (let e = r.length - 1; e >= 0; --e) {
		let t = BigInt(r[e].entry.amount);
		t > i || (i -= t, a.push(r[e].index));
	}
	if (i !== 0n) throw new x(`${t} amount exceeds the manifest range`);
	return a;
}
function br(e, t) {
	let n = 1n;
	for (let r of e) {
		if (BigInt(r) !== n) throw new x(`${t} manifest is not a canonical binary range`);
		n <<= 1n;
	}
}
function xr(e, t) {
	return e.length === t.length && e.every((e, n) => e.B_ === t[n].B_ && e.id === t[n].id && k.from(e.amount).equals(t[n].amount));
}
function Sr(e, t) {
	for (; t !== 0n;) {
		let n = e % t;
		e = t, t = n;
	}
	return e;
}
function Cr(e, t) {
	let n = e * t;
	if (n > L) throw new x("pool policy arithmetic exceeds u128");
	return n;
}
function wr(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Tr(e, t) {
	let n = Object.keys(e).sort(), r = [...t].sort();
	return n.length === r.length && n.every((e, t) => e === r[t]);
}
// src/crypto/NUT13.ts
var Er = "m/129372'/0'", Dr = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"), Or = (e, t, n) => Ar(e, t, n).secret, kr = (e, t, n) => Ar(e, t, n).blindingFactor;
function Ar(e, t, n) {
	return jr(e, t)(n);
}
function jr(e, t) {
	switch (Nr(e), Mr(t)) {
		case 0: {
			let n = qt(t), r = te.fromMasterSeed(e).derive(`${Er}/${n}'`);
			return (e) => Pr(r, e);
		}
		case 1: return (n) => Fr(e, t, n);
	}
}
function Mr(e) {
	if (e.length === 12 && ct(e)) return 0;
	let t = /^[a-fA-F0-9]+$/.test(e), n = e.startsWith("01");
	if (t && n && e.length % 2 != 0) throw new x("Invalid hex string: odd length.");
	if (!t && ct(e) || t && e.startsWith("00")) return 0;
	if (t && n) return 1;
	throw new x(`Unrecognized keyset ID version ${e.slice(0, 2)}`);
}
function Nr(e) {
	if (!(e instanceof Uint8Array) || e.length < 16 || e.length > 64) throw new x("seed must be a 16 to 64 byte Uint8Array");
}
function Pr(e, t) {
	if (!Number.isInteger(t) || t < 0 || t >= 2147483648) throw new x("Counter must be an integer in the range 0 <= counter < 2^31");
	let n = e.deriveChild(ee + t), r = n.deriveChild(0).privateKey, i = n.deriveChild(1).privateKey;
	/* c8 ignore next */
	if (r === null || i === null) throw new x("Could not derive private key");
	return {
		secret: r,
		blindingFactor: i
	};
}
function Fr(e, t, n) {
	if (!Number.isSafeInteger(n) || n < 0) throw new x("Counter must be an integer in the range 0 <= counter <= 2^53 - 1");
	return {
		secret: Ir(e, t, n, 0),
		blindingFactor: Ir(e, t, n, 1)
	};
}
function Ir(t, n, a, s) {
	let c = r(o("Cashu_KDF_HMAC_SHA256"), i(n), y(a, 8));
	switch (s) {
		case 0:
			c = r(c, i("00"));
			break;
		case 1: c = r(c, i("01"));
	}
	let l = b(e, t, c);
	if (s === 1) {
		let e = g(l), t = e >= Dr ? e - Dr : e;
		/* c8 ignore next */
		if (t === 0n) throw new x("Derived invalid blinding scalar r == 0");
		return y(t, 32);
	}
	return l;
}
// src/crypto/CTFRange.ts
var Lr = "Cashu/ctf/range/v1", Rr = 18446744073709551615n;
function zr(e) {
	let t = Hr(() => {
		if (Ur(e.seed), Wr(e.receiveKeyset.id), Wr(e.offerKeyset.id), ii(e.receiveKeyset, "receive"), ii(e.offerKeyset, "offer"), e.receiveKeyset.id === e.offerKeyset.id) throw new x("CTF keysets must differ");
		if (!Number.isSafeInteger(e.maxEntries) || e.maxEntries < 2) throw new x("Invalid CTF manifest limit");
		let t = ni(e.receiveKeyset, e.maxReceive, "receive"), n = ni(e.offerKeyset, e.maxChange, "change");
		if (t.length + n.length > e.maxEntries) throw new x("CTF manifest exceeds maxEntries");
		return Gr(e.receiveCounters, t.length), Gr(e.changeCounters, n.length), [...t.map((t, n) => ({
			...t,
			counter: e.receiveCounters.start + n
		})), ...n.map((t, n) => ({
			...t,
			counter: e.changeCounters.start + n
		}))];
	}).map((t, n) => {
		let r = I.createSingleDeterministicData(t.amount, e.seed, t.counter, t.keysetId);
		return {
			entry: {
				index: String(n),
				role: t.role,
				amount: t.amount.toString(),
				id: t.keysetId,
				B_: r.blindedMessage.B_
			},
			outputData: r
		};
	}), n = t.map(({ entry: e }) => e);
	return {
		entries: t,
		serialized: n,
		commitment: An(n)
	};
}
function Br(e) {
	let t = Hr(() => {
		Ur(e.seed), Wr(e.keysetId), Gr({
			start: e.counter,
			count: 1
		}, 1);
		let t = Kr(e.amount), n = t.toBigInt();
		if ((n & n - 1n) != 0n) throw new x("Invalid CTF range amount");
		return t;
	});
	return I.createSingleDeterministicData(t, e.seed, e.counter, e.keysetId);
}
function Vr(e) {
	return Hr(() => {
		if (Ur(e.seed), Wr(e.offerKeysetId), !Array.isArray(e.amounts) || e.amounts.length === 0) throw new x("Invalid CTF authorization amounts");
		Gr(e.authorizationCounters, e.amounts.length * 2);
		let t = Array.from(e.amounts, Kr);
		return ai(e.expiry, e.expiryContext), Bn({
			nonce: "00".repeat(32),
			data: e.commitment,
			offerKeyset: e.offerKeysetId,
			expiry: e.expiry,
			refund: e.refund,
			coordinatorPublicKey: e.coordinatorPublicKey,
			poolPolicy: e.poolPolicy
		}), t;
	}).map((t, r) => {
		let i = e.authorizationCounters.start + r * 2, a = Ar(e.seed, e.offerKeysetId, i).secret, o = Ar(e.seed, e.offerKeysetId, i + 1).blindingFactor, s = Bn({
			nonce: n(a),
			data: e.commitment,
			offerKeyset: e.offerKeysetId,
			expiry: e.expiry,
			refund: e.refund,
			coordinatorPublicKey: e.coordinatorPublicKey,
			poolPolicy: e.poolPolicy
		});
		return I.createSingleData(t, e.offerKeysetId, s, g(o));
	});
}
function Hr(e) {
	try {
		return e();
	} catch {
		throw new x("Invalid CTF counter input");
	}
}
function Ur(e) {
	if (!(e instanceof Uint8Array) || e.length < 16 || e.length > 64) throw new x("Invalid CTF seed");
}
function Wr(e) {
	if (typeof e != "string" || !/^01[0-9a-f]{64}$/.test(e)) throw new x("Invalid CTF keyset");
}
function Gr(e, t) {
	if (!e || !Number.isSafeInteger(e.start) || e.start < 0 || !Number.isSafeInteger(e.count) || e.count < 0 || !Number.isSafeInteger(t) || e.count !== t) throw new x("Invalid CTF counter range");
	if (t > 0 && e.start > 2 ** 53 - 1 - (t - 1)) throw new x("CTF counter range exhausted");
}
function Kr(e) {
	let t = k.from(e);
	if (t.toBigInt() < 1n || t.toBigInt() > Rr) throw new x("Invalid CTF amount");
	return t;
}
function qr(e) {
	if (ii(e.receiveKeyset, "receive"), ii(e.offerKeyset, "offer"), e.receiveKeyset.id === e.offerKeyset.id) throw new x("CTF receive and offer keysets must differ");
	if (!Number.isSafeInteger(e.maxEntries) || e.maxEntries < 2) throw new x("maxEntries must be a safe integer of at least two");
	let t = [...ni(e.receiveKeyset, e.maxReceive, "receive"), ...ni(e.offerKeyset, e.maxChange, "change")];
	if (t.length > e.maxEntries) throw new x("CTF manifest exceeds maxEntries");
	let n = fi(e.seed, e.operationId, "manifest"), r = t.map((e, t) => ti(n, e, t)), i = r.map(({ entry: e }) => e);
	return {
		entries: r,
		serialized: i,
		commitment: An(i)
	};
}
function Jr(e) {
	if (!Number.isSafeInteger(e.manifestIndex) || e.manifestIndex < 0) throw new x("manifestIndex must be a non-negative safe integer");
	mn(e.keysetId, "manifest keyset id");
	let t = k.from(e.amount), n = t.toBigInt();
	if (n < 1n || n > Rr || (n & n - 1n) != 0n) throw new x("CTF range maximum must be in [1, u64::MAX]");
	return I.createSingleDeterministicData(t, fi(e.seed, e.rangeOperationId, "manifest"), e.manifestIndex, e.keysetId);
}
function Yr(t, r) {
	let i = fi(t, r, "refund"), a = h.Point.CURVE().n;
	for (let t = 0; t < 65536; t += 1) {
		let r = b(e, i, pi(t)), o = g(r);
		if (!(o === 0n || o >= a)) return {
			privateKey: ko(o),
			publicKey: n(h.getPublicKey(r, !0).slice(1))
		};
	}
	throw new x("could not derive a valid CTF refund key");
}
function Xr(e) {
	if (e.amounts.length === 0) throw new x("CTF authorization requires an amount");
	ai(e.expiry, e.expiryContext);
	let t = fi(e.seed, e.operationId, "authorization");
	return e.amounts.map((r, i) => {
		let a = Ar(t, e.offerKeysetId, i), o = Bn({
			nonce: n(a.secret),
			data: e.commitment,
			offerKeyset: e.offerKeysetId,
			expiry: e.expiry,
			refund: e.refund,
			coordinatorPublicKey: e.coordinatorPublicKey,
			poolPolicy: e.poolPolicy
		});
		return I.createSingleData(r, e.offerKeysetId, o, g(a.blindingFactor));
	});
}
function Zr(e, t) {
	if (t === void 0) return {
		mode: "unknown",
		outputs: e.map(({ outputData: e }) => e.blindedMessage),
		manifestBs: e.map(({ entry: e }) => e.B_)
	};
	let n = Mn(t, e.length).map((t) => e[t].outputData.blindedMessage);
	return {
		mode: "known",
		outputs: n,
		expectedOutputBs: n.map(({ B_: e }) => e)
	};
}
function Qr(e, t) {
	if (t.length === 0) throw new x("NUT-09 restored no CTF outputs");
	let n = new Map(e.map(({ entry: e }, t) => [e.B_, t])), r = t.map(({ B_: e }) => {
		let t = n.get(e);
		if (t === void 0) throw new x("NUT-09 returned an output outside the manifest");
		return t;
	});
	return jn(e.length, r);
}
function $r(e) {
	if (!Number.isSafeInteger(e.now) || !Number.isSafeInteger(e.expiry) || e.now < 0 || e.expiry < 0) throw new x("recovery timestamps must be non-negative safe integers");
	return si(e.outputRecovery) ? "confirmed" : e.outputRecovery.restoredOutputBs.length > 0 || !li(e.inputStates, e.expectedInputYs) || !e.inputStates.every(({ state: e }) => e === "UNSPENT") ? "reconciling" : e.now >= e.expiry ? "refundable" : "waiting";
}
function ei(e, t, n, r) {
	if (t.length !== n.length) throw new x("NUT-09 outputs and signatures have different lengths");
	let i = new Map(e.map((e) => [e.entry.B_, e.outputData])), a = /* @__PURE__ */ new Set();
	return t.map((e, t) => {
		if (a.has(e.B_)) throw new x("NUT-09 returned a duplicate output");
		a.add(e.B_);
		let o = i.get(e.B_);
		if (!o) throw new x("NUT-09 returned an output outside the retained manifest");
		if (e.id !== o.blindedMessage.id || !k.from(e.amount).equals(o.blindedMessage.amount)) throw new x("NUT-09 returned mismatched output metadata");
		let s = r(e.id);
		if (!s) throw new x(`NUT-09 recovery keyset ${e.id} is not loaded`);
		return o.toProof(n[t], s);
	});
}
function ti(e, t, n) {
	let r = I.createSingleDeterministicData(t.amount, e, n, t.keysetId);
	return {
		entry: {
			index: String(n),
			role: t.role,
			amount: t.amount.toString(),
			id: t.keysetId,
			B_: r.blindedMessage.B_
		},
		outputData: r
	};
}
function ni(e, t, n) {
	return ri(t).map((t) => {
		if (e.keys[t.toString()] === void 0) throw new x(`${n} keyset does not publish denomination ${t.toString()}`);
		return {
			amount: t,
			keysetId: e.id,
			role: n
		};
	});
}
function ri(e) {
	let t = k.from(e).toBigInt();
	if (t < 1n || t > Rr) throw new x("CTF range maximum must be in [1, u64::MAX]");
	let n = [], r = 0n;
	for (let e = 1n; r < t; e <<= 1n) n.push(k.from(e)), r += e;
	return n;
}
function ii(e, t) {
	if (!e.active) throw new x(`${t} keyset must be active`);
	mn(e.id, `${t} keyset id`);
}
function ai(e, t) {
	let n = di(e, "expiry"), r = di(t.now, "now"), i = di(t.maxExpirySeconds, "maxExpirySeconds");
	if (i === 0n) throw new x("maxExpirySeconds must be positive");
	let a = oi(t);
	if (n <= r) throw new x("CTF authorization expiry must be in the future");
	if (r + i > Rr) throw new x("CTF authorization expiry ceiling exceeds u64");
	let o = r + i, s = a.flatMap(({ final_expiry: e }) => e === void 0 ? [] : [di(e, "final_expiry")]).sort((e, t) => e < t ? -1 : +(e > t));
	if (n >= (s[0] === void 0 || o < s[0] ? o : s[0])) throw new x("CTF authorization expiry must precede the effective keyset expiry ceiling");
}
function oi(e) {
	let t = ui(e.condition.condition_id, "condition_id"), n = /* @__PURE__ */ new Set([...Object.values(e.condition.keysets), ...(e.condition.partitions ?? []).flatMap((e) => Object.values(e.keysets ?? {}))]);
	if (n.size === 0 || e.conditionalKeysets.length !== n.size) throw new x("complete conditional keyset lifecycle metadata is required");
	let r = /* @__PURE__ */ new Set();
	for (let i of e.conditionalKeysets) {
		if (mn(i.id, "conditional keyset id"), i.condition_id !== t || !n.has(i.id)) throw new x("conditional keyset metadata does not match the condition");
		if (r.has(i.id)) throw new x("conditional keyset metadata contains a duplicate keyset");
		r.add(i.id);
	}
	if ([...n].some((e) => !r.has(e))) throw new x("complete conditional keyset lifecycle metadata is required");
	return e.conditionalKeysets;
}
function si(e) {
	if (!e.queryCompleted || e.restoredOutputBs.length === 0) return !1;
	let t = new Set(e.restoredOutputBs);
	if (t.size !== e.restoredOutputBs.length) return !1;
	if (e.query.mode === "known") {
		let n = new Set(e.query.expectedOutputBs);
		return n.size > 0 && n.size === e.query.expectedOutputBs.length && ci(e.query.outputs, n) && n.size === t.size && [...t].every((e) => n.has(e));
	}
	let n = new Set(e.query.manifestBs);
	return n.size > 0 && n.size === e.query.manifestBs.length && ci(e.query.outputs, n) && [...t].every((e) => n.has(e));
}
function ci(e, t) {
	let n = new Set(e.map(({ B_: e }) => e));
	return e.length === t.size && n.size === t.size && [...n].every((e) => t.has(e));
}
function li(e, t) {
	if (t.length === 0 || e.length !== t.length) return !1;
	let n = new Set(t);
	if (n.size !== t.length) return !1;
	let r = new Set(e.map(({ Y: e }) => e));
	return r.size === e.length && r.size === n.size && [...r].every((e) => n.has(e));
}
function ui(e, t) {
	if (!/^[0-9a-f]{64}$/.test(e)) throw new x(`${t} must be canonical lowercase 32-byte hex`);
	return e;
}
function di(e, t) {
	if (typeof e == "number" && (!Number.isSafeInteger(e) || e < 0)) throw new x(`${t} must be a non-negative safe integer`);
	let n = typeof e == "string" ? e : String(e);
	if (!/^(0|[1-9]\d*)$/.test(n)) throw new x(`${t} must be a minimal unsigned integer`);
	let r = BigInt(n);
	if (r > Rr) throw new x(`${t} exceeds u64`);
	return r;
}
function fi(t, n, i) {
	if (t.length === 0) throw new x("wallet seed must not be empty");
	let a = o(n);
	if (a.length === 0 || a.length > 1024) throw new x("operationId must encode to 1..1024 bytes");
	let s = r(o(Lr), pi(a.length), a, o(i));
	return b(e, t, s);
}
function pi(e) {
	let t = /* @__PURE__ */ new Uint8Array(4);
	return new DataView(t.buffer).setUint32(0, e, !1), t;
}
// src/crypto/NUT01.ts
var mi = "m/0'/0'/0'";
function hi(e) {
	let t = {};
	return Object.keys(e).forEach((r) => {
		t[r] = n(e[r]);
	}), t;
}
function gi(e) {
	let t = {};
	return Object.keys(e).forEach((n) => {
		t[n] = i(e[n]);
	}), t;
}
function _i(e) {
	return h.getPublicKey(e, !0);
}
function vi(e, t, n) {
	if (!Number.isInteger(e) || e < 0 || e > 64) throw new x("createNewMintKeys: pow2height must be an integer in [0, 64]");
	let { expiry: r, input_fee_ppk: i, unit: a = "sat", versionByte: o = 1 } = n || {}, s = 0n, c = {}, l = {}, u;
	for (t && (u = te.fromMasterSeed(t)); s < e;) {
		let e = (2n ** s).toString();
		if (u) {
			let t = u.derive(`${mi}/${s}`).privateKey;
			if (t) l[e] = t;
			else throw new x(`Could not derive Private key from: ${mi}/${s}`);
		} else l[e] = Jt();
		c[e] = _i(l[e]), s++;
	}
	return {
		pubKeys: c,
		privKeys: l,
		keysetId: qo(hi(c), {
			expiry: r,
			input_fee_ppk: i,
			unit: a,
			versionByte: o
		})
	};
}
function yi(e, t) {
	let n = M(e.secret), r = h.Point.Fn.fromBytes(t);
	return n.multiply(r).equals(e.C);
}
// src/crypto/NUT10.ts
function bi(e, t, r) {
	let i = [e, {
		nonce: n(a(32)),
		data: t,
		tags: r
	}];
	return JSON.stringify(i);
}
function xi(e) {
	let t;
	if (typeof e == "string" && Me(e)) throw new x("Invalid NUT-10 secret Unicode");
	try {
		t = typeof e == "string" ? JSON.parse(e) : e;
	} catch (e) {
		throw new x("Can't parse secret", { cause: e });
	}
	if (!Array.isArray(t) || t.length !== 2 || typeof t[0] != "string" || typeof t[1] != "object" || t[0].trim().length === 0 || t[1] === null) throw new x("Invalid NUT-10 secret");
	let [n, r] = t;
	if (typeof r.nonce != "string" || typeof r.data != "string") throw new x("Invalid NUT-10 secret nonce / data");
	if (r.tags != null) {
		if (!Array.isArray(r.tags)) throw new x("Invalid NUT-10 secret tags");
		if (r.tags.some((e) => !Array.isArray(e) || e.length === 0 || e.some((e) => typeof e != "string" || !e.length))) throw new x("Invalid NUT-10 tag(s)");
	}
	return [n, {
		nonce: r.nonce,
		data: r.data,
		tags: r.tags ?? void 0
	}];
}
function Si(e, t) {
	let n = Array.isArray(e) ? e : [e], r = xi(t), i = r[0];
	if (!n.includes(i)) throw new x(`Invalid secret kind: ${i} Allowed: ${n.join(", ")}`);
	return r;
}
function Ci(e) {
	return xi(e)[0];
}
function wi(e) {
	return xi(e)[1];
}
function Ti(e) {
	let { data: t } = wi(e);
	return t;
}
function Ei(e) {
	let { tags: t } = wi(e);
	return t ?? [];
}
function Di(e, t) {
	return Ei(e).some((e) => e[0] === t);
}
function Oi(e, t) {
	let n = Ei(e).find((e) => e[0] === t);
	if (!(!n || n.length <= 1)) return n.slice(1);
}
function ki(e, t) {
	let n = Oi(e, t);
	if (n !== void 0) {
		if (n.length !== 1) throw new x(`Invalid NUT-10 tag "${t}": must carry a single value`);
		return n[0];
	}
}
function B(e, t) {
	let n = ki(e, t);
	if (n === void 0) return;
	let r = /^-?\d+$/.test(n) ? Number(n) : NaN;
	if (!Number.isSafeInteger(r)) throw new x(`Invalid NUT-10 tag "${t}": must be an integer`);
	return r;
}
// src/crypto/NUT28.ts
var Ai = o("Cashu_P2BK_v1"), ji = Ai.slice();
function Mi(e, t, r = !0) {
	let i = +!r, a = e.length + i;
	if (a > 11) throw new x(`Too many pubkeys, ${a} slots provided, maximum allowed is 11 in total`);
	if (!e.length) return {
		blinded: [],
		Ehex: ""
	};
	t = t ?? h.utils.randomSecretKey();
	let o = h.Point.Fn.fromBytes(t), s = h.getPublicKey(t, !0);
	return {
		blinded: e.map((e, t) => {
			let n = N(e), r = Fi(n, o, t + i), a = n.add(h.Point.BASE.multiply(r));
			if (a.equals(h.Point.ZERO)) throw new x("Blinded key at infinity");
			return a.toHex(!0);
		}),
		Ehex: n(s)
	};
}
function Ni(e, t, n, r = !0) {
	let a = +!r, o = Array.isArray(t) ? t : [t], s = Array.isArray(n) ? n : [n], c = /* @__PURE__ */ new Set(), l = h.Point.fromHex(e);
	for (let e of o) {
		let t = h.Point.Fn.fromBytes(i(e)), n = h.getPublicKey(i(e), !0);
		s.forEach((r, o) => {
			let s = Fi(l, t, o + a), u = i(r), d = Pi(e, s, u, n);
			d && c.add(d);
		});
	}
	return Array.from(c);
}
function Pi(e, t, r, i) {
	let a = h.Point.CURVE().n, o = typeof e == "string" ? Oo(e) : e, s = typeof t == "string" ? Oo(t) : t;
	if (o <= 0n || o >= a) throw new x("Invalid private key");
	if (s <= 0n || s >= a) throw new x("Invalid scalar r");
	if (i = i ?? h.Point.BASE.multiply(o).toBytes(!0), i.length !== 33) throw new x("naturalPub must be 33 bytes");
	let c = (o + s) % a, l = (a - o + s) % a;
	if (!r) {
		if (c === 0n) throw new x("Derived secret key is zero");
		return ko(c);
	}
	if (r.length !== 33) throw new x("blindPubkey must be 33 bytes");
	let u = h.Point.fromHex(n(r)), d = h.Point.BASE.multiply(s), f = u.subtract(d);
	if (f.equals(h.Point.ZERO)) return null;
	let p = f.toBytes(!0).slice(1), m = i.slice(1);
	if (!_(p, m)) return null;
	let g = (f.toBytes(!0)[0] & 1) == (i[0] & 1) ? c : l;
	if (g === 0n) throw new x("Derived secret key is zero");
	return ko(g);
}
function Fi(t, n, i) {
	if (!Number.isInteger(i) || i < 0 || i > 255) throw new x("P2BK: slot index must be an integer in [0, 255]");
	let a = t.multiply(n).toBytes(!0).slice(1), o = new Uint8Array([i & 255]), s = g(e(r(Ai, a, o)));
	if ((s === 0n || s >= h.Point.CURVE().n) && (s = g(e(r(Ai, a, o, new Uint8Array([255])))), s === 0n || s >= h.Point.CURVE().n)) throw new x("P2BK: tweak derivation failed");
	return s;
}
// src/crypto/NUT11.ts
var Ii = {
	SIG_INPUTS: "SIG_INPUTS",
	SIG_ALL: "SIG_ALL"
}, Li = new Set(Object.values(Ii)), Ri = /* @__PURE__ */ new Set([
	"locktime",
	"pubkeys",
	"n_sigs",
	"refund",
	"n_sigs_refund",
	"sigflag"
]);
function zi(e) {
	return Ri.has(e);
}
function Bi(e, t) {
	let n = bi("P2PK", e, t);
	return V(n), n;
}
function V(e) {
	if (typeof e == "string" && e.length > 1024) throw new x(`Secret too long (${e.length} characters), maximum is ${he}`);
	let t = Si(["P2PK", "HTLC"], e);
	ia(Ei(t));
	let n = ki(t, "sigflag");
	return n !== void 0 && aa(n), t;
}
function Vi(e) {
	let t = e.toLowerCase();
	if (t.length === 66 && (t.startsWith("02") || t.startsWith("03"))) return t;
	if (t.length === 64) return `02${t}`;
	throw new x(`Invalid pubkey, expected 33 byte compressed or 32 byte x only, got length ${t.length}`);
}
function Hi(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e) {
		let e = Vi(r), i = e.slice(-64);
		t.has(i) || (t.add(i), n.push(e));
	}
	return n;
}
function Ui(e) {
	let t = Hi(Array.isArray(e.pubkey) ? e.pubkey : [e.pubkey]), n = Hi(e.refundKeys ?? []), r = typeof e.hashlock == "string" && e.hashlock.length > 0;
	if (t.length === 0 && !r) throw new x("P2PK requires at least one pubkey");
	let i = +!!r + t.length + n.length;
	if (i > 11) throw new x(`Too many pubkeys, ${i} slots provided, maximum allowed is 11 in total`);
	e.sigFlag !== void 0 && aa(e.sigFlag);
	let a = t.length > 0 ? e.requiredSignatures ?? 1 : e.requiredSignatures, o = e.requiredRefundSignatures;
	return sa({
		mainKeyCount: t.length,
		refundKeyCount: n.length,
		nSigs: a,
		nSigsRefund: o,
		hasLocktime: e.locktime !== void 0
	}), {
		pubkey: t.length === 1 ? t[0] : t,
		...e.locktime === void 0 ? {} : { locktime: e.locktime },
		...n.length > 0 ? { refundKeys: n } : {},
		...a !== void 0 && a > 1 ? { requiredSignatures: a } : {},
		...o !== void 0 && o > 1 ? { requiredRefundSignatures: o } : {},
		...e.additionalTags?.length ? { additionalTags: e.additionalTags } : {},
		...e.blindKeys ? { blindKeys: !0 } : {},
		...e.sigFlag === void 0 ? {} : { sigFlag: e.sigFlag },
		...e.hashlock ? { hashlock: e.hashlock } : {}
	};
}
function Wi(e) {
	let t = V(e), n = da(ua(t)), r = ca(t), i = la(t);
	return n === "ACTIVE" || n === "PERMANENT" ? r : n === "EXPIRED" && i.length ? Array.from(/* @__PURE__ */ new Set([...r, ...i])) : [];
}
function Gi(e) {
	return ki(V(e), "sigflag") ?? "SIG_INPUTS";
}
function Ki(e) {
	let t = qi(e)?.signatures ?? [];
	if (t.length > 64) throw new x(`Too many witness signatures: ${t.length}`);
	return t;
}
function qi(e) {
	if (!e) return;
	if (typeof e == "string" && e.length > 16384) throw new x(`Witness too long (${e.length} characters), maximum is ${ge}`);
	let t;
	try {
		t = typeof e == "string" ? JSON.parse(e) : e;
	} catch {
		return;
	}
	if (!t || typeof t != "object") return;
	let n = { signatures: Array.isArray(t.signatures) ? t.signatures : [] };
	return typeof t.preimage == "string" && t.preimage.length > 0 && (n.preimage = t.preimage), n;
}
function Ji(e, t, r = E, i) {
	let a = (e) => typeof e == "string" ? e : n(e), o = Array.isArray(t) ? t.map(a) : a(t);
	return e.map((e, t) => {
		let n = ea(o, e), a = e;
		for (let e of n) try {
			a = Xi(a, e, i);
		} catch (e) {
			let n = e instanceof Error ? e.message : "Unknown error";
			r.warn(`Proof #${t + 1}: ${n}`);
		}
		return a;
	});
}
function Yi(e, t) {
	let r = typeof t == "string" ? i(t) : t, a = n(m.getPublicKey(r));
	if (!Wi(e).some((e) => e.slice(2) === a)) throw new x(`Signature not required from [02|03]${a}`);
	return a;
}
function Xi(e, t, n) {
	let r = V(e.secret), i = Gi(r) === "SIG_ALL";
	if (i && n === void 0) throw new x("Cannot sign a SIG_ALL proof without the message to sign");
	if (!i && n !== void 0) throw new x("A message override is only valid for SIG_ALL proofs");
	n = n ?? e.secret;
	let a = Yi(r, t), o = Ki(e.witness);
	if (o.some((e) => tn(e, n, a))) throw new x(`Proof already signed by [02|03]${a}`);
	if (o.length >= 64) throw new x("Cannot sign: witness already at the 64-signature limit");
	let s = en(n, t), c = qi(e.witness), l = {
		...c && c.preimage !== void 0 ? { preimage: c.preimage } : {},
		signatures: [...c?.signatures ?? [], s]
	};
	return {
		...e,
		witness: l
	};
}
function Zi(e, t, n) {
	if (!t.witness) return !1;
	if (!ra([t])) n = t.secret;
	else if (!n) throw new x("Cannot verify a SIG_ALL proof without the message to sign");
	return Ki(t.witness).some((t) => tn(t, n, e));
}
function Qi(e, t = E, n) {
	if (!ra([e])) n = e.secret;
	else if (!n) throw t.error("Cannot verify a SIG_ALL proof without the message to sign"), new x("Cannot verify a SIG_ALL proof without the message to sign");
	let r = V(e.secret), i = ca(r), a = la(r);
	sa({
		mainKeyCount: i.length,
		refundKeyCount: a.length,
		nSigs: B(r, "n_sigs"),
		nSigsRefund: B(r, "n_sigs_refund"),
		hasLocktime: Number.isFinite(ua(r))
	});
	let o = Ki(e.witness), s = ua(r), c = da(s), l = i.length === 0 ? 0 : fa(r, c, a), u = pa(r, c, a), d = on(o, n, i), f = a.length ? on(o, n, a) : [], p = {
		locktime: s,
		lockState: c,
		main: {
			pubkeys: i,
			requiredSigners: l,
			receivedSigners: d
		},
		refund: {
			pubkeys: a,
			requiredSigners: u,
			receivedSigners: f
		}
	};
	if (i.length && l > 0 && d.length >= l) {
		let e = {
			...p,
			success: !0,
			path: "MAIN"
		};
		return t.debug("Spending condition satisfied via main pubkeys", { result: e }), e;
	}
	if (c !== "EXPIRED") {
		let e = {
			...p,
			success: !1,
			path: "FAILED"
		};
		return t.debug("P2PK lock enabled, but threshold not met by main pubkeys", { result: e }), e;
	}
	if (t.debug("P2PK lock expired. Checking refund path.", { lockState: c }), a.length) {
		if (u > 0 && f.length >= u) {
			let e = {
				...p,
				success: !0,
				path: "REFUND"
			};
			return t.debug("Spending condition satisfied via refund pubkeys", { result: e }), e;
		}
		let e = {
			...p,
			success: !1,
			path: "FAILED"
		};
		return t.debug("Spending threshold not met by either pathway", { result: e }), e;
	}
	let m = {
		...p,
		success: !0,
		path: "UNLOCKED"
	};
	return t.debug("No refund pubkeys, anyone can spend.", { result: m }), m;
}
function $i(e, t = E, n) {
	return Qi(e, t, n).success;
}
function ea(e, t) {
	let n = Array.isArray(e) ? e : [e], r = t?.p2pk_e;
	if (!r) return Array.from(new Set(n));
	let i = V(t.secret), a = [...ca(i), ...la(i)], o = Ci(i) === "P2PK", s = Ni(r, n, a, o);
	return !o && !s.length ? Ni(r, n, a) : s;
}
function ta(e) {
	if (e.length === 0) throw new x("No proofs");
	let t = V(e[0].secret);
	if (Gi(t) !== "SIG_ALL") throw new x("First proof is not SIG_ALL");
	let n = t[1].data, r = JSON.stringify(t[1].tags ?? []);
	for (let i = 1; i < e.length; i++) {
		let a = V(e[i].secret);
		if (a[0] !== t[0]) throw new x(`Proof #${i + 1} is not ${t[0]}`);
		if (Gi(a) !== "SIG_ALL") throw new x(`Proof #${i + 1} is not SIG_ALL`);
		if (a[1].data !== n) throw new x("SIG_ALL inputs must share identical Secret.data");
		if (JSON.stringify(a[1].tags ?? []) !== r) throw new x("SIG_ALL inputs must share identical Secret.tags");
	}
}
function na(e, t, n) {
	let r = [];
	for (let t of e) r.push(t.secret, t.C);
	for (let e of t) r.push(String(e.blindedMessage.amount), e.blindedMessage.B_);
	return n && r.push(n), r.join("");
}
function ra(e) {
	return e.some((e) => {
		try {
			return Gi(e.secret) === "SIG_ALL";
		} catch {
			return !1;
		}
	});
}
function ia(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		let e = n[0];
		if (zi(e)) {
			if (t.has(e)) throw new x(`Duplicate P2PK tag "${e}"`);
			t.add(e);
		}
	}
}
function aa(e) {
	if (!Li.has(e)) throw new x(`Invalid sigflag "${e}": must be "SIG_INPUTS" or "SIG_ALL"`);
}
function oa(e, t) {
	if (!Number.isInteger(e) || e < 1) throw new x(`${t} must be a positive integer, got ${e}`);
	return e;
}
function sa(e) {
	let { mainKeyCount: t, refundKeyCount: n, nSigs: r, nSigsRefund: i, hasLocktime: a } = e;
	if (r !== void 0 && (oa(r, "requiredSignatures (n_sigs)"), r > t)) throw new x(`requiredSignatures (n_sigs) (${r}) exceeds available pubkeys (${t})`);
	if (i !== void 0) {
		if (oa(i, "requiredRefundSignatures (n_sigs_refund)"), n === 0) throw new x("requiredRefundSignatures (n_sigs_refund) requires refund keys");
		if (i > n) throw new x(`requiredRefundSignatures (n_sigs_refund) (${i}) exceeds available refund keys (${n})`);
	}
	if (n > 0 && !a) throw new x("refund keys require a locktime");
}
function ca(e) {
	let t = Ci(e) === "P2PK" ? Ti(e) : "", n = Oi(e, "pubkeys") ?? [];
	if (n.length > 16) throw new x(`Too many pubkeys: ${n.length}`);
	let r = (t ? [t, ...n] : n).map((e) => Vi(e));
	if (Hi(r).length !== r.length) throw new x("Duplicate main pubkeys are not allowed");
	return r;
}
function la(e) {
	let t = Oi(e, "refund") ?? [];
	if (t.length > 16) throw new x(`Too many refund pubkeys: ${t.length}`);
	let n = t.map((e) => Vi(e));
	if (Hi(n).length !== n.length) throw new x("Duplicate refund pubkeys are not allowed");
	return n;
}
function ua(e) {
	let t = ki(e, "locktime"), n = t !== void 0 && /^\d+$/.test(t) ? Number(t) : NaN;
	return Number.isSafeInteger(n) ? n : Infinity;
}
function da(e, t = Math.floor(Date.now() / 1e3)) {
	return Number.isFinite(e) ? t <= e ? "ACTIVE" : "EXPIRED" : "PERMANENT";
}
function fa(e, t, n) {
	return !n.length && t === "EXPIRED" ? 0 : Math.max(B(e, "n_sigs") ?? 1, 1);
}
function pa(e, t, n) {
	return n.length && t === "EXPIRED" ? Math.max(B(e, "n_sigs_refund") ?? 1, 1) : 0;
}
// src/crypto/NUT12.ts
var ma = o("Cashu_DLEQ_R_v1");
function ha(t, n, i, a) {
	let o = r(ma, n.toBytes(!1), i.toBytes(!1), a.toBytes(!1));
	for (let n = 0; n < 256; n++) {
		let i = b(e, t, r(o, new Uint8Array([n]))), a = g(i);
		/* c8 ignore next */
		if (a > 0n && a < h.Point.CURVE().n) return a;
	}
	/* c8 ignore next */
	throw new x("DLEQ nonce derivation failed");
}
var ga = (e, t, n, r) => {
	let i = h.Point.Fn.fromBytes(e.s), a = h.Point.Fn.fromBytes(e.e), o = h.Point.BASE.multiply(i), s = r.multiply(a), c = t.multiply(i), l = n.multiply(a), u = Ut([
		o.subtract(s),
		c.subtract(l),
		r,
		n
	]);
	return _(u, e.e);
}, _a = (e, t, n, r) => {
	if (t.r === void 0) throw new x("verifyDLEQProof_reblind: Undefined blinding factor");
	let i = M(e), a = n.add(r.multiply(t.r)), o = h.Point.BASE.multiply(t.r);
	return ga(t, i.add(o), a, r);
}, va = (e, t) => {
	e = Gt(e);
	let n = h.Point.Fn.fromBytes(t), r = h.Point.BASE.multiply(n), i = e.multiply(n), a = ha(t, r, e, i), o = Ut([
		h.Point.BASE.multiply(a),
		e.multiply(a),
		r,
		i
	]), s = h.Point.Fn.fromBytes(o), c = h.Point.Fn.add(a, h.Point.Fn.mul(s, n));
	return {
		s: y(c, 32),
		e: o
	};
};
// src/crypto/NUT14.ts
function ya(e, t) {
	if (!/^[0-9a-f]{64}$/i.test(e)) throw new x("Hashlock must be a 64-character hex string (32 bytes).");
	return bi("HTLC", e.toLowerCase(), t);
}
function ba(e) {
	return Si("HTLC", V(e));
}
function xa(t) {
	let r = t !== void 0;
	if (r && !/^[0-9a-f]{64}$/i.test(t)) throw new x("Preimage must be a 64 character hexadecimal string (32 bytes).");
	let o = r ? i(t) : a(32);
	return {
		hash: n(e(o)),
		preimage: n(o)
	};
}
function Sa(e, t) {
	try {
		return xa(e).hash === t;
	} catch {
		return !1;
	}
}
function Ca(e, t = E, n) {
	let r, i = V(e.secret), a = Ci(i) === "HTLC", o = a ? Ti(i) : "", s = Qi(e, t, n);
	if (!a) return s;
	let c = s.main.pubkeys.length === 0;
	if (!c && s.path !== "MAIN" || c && s.success) return s;
	let l = Ta(e.witness);
	if (l && Sa(l, o)) return r = {
		...s,
		success: !0,
		path: "MAIN"
	}, t.debug("Spending condition satisfied via hashlock (receiver) pathway", { result: r }), r;
	let { refund: u } = s;
	return u.requiredSigners > 0 && u.receivedSigners.length >= u.requiredSigners ? (r = {
		...s,
		success: !0,
		path: "REFUND"
	}, t.debug("Spending condition satisfied via refund pubkeys", { result: r }), r) : l ? (r = {
		...s,
		success: !1,
		path: "FAILED"
	}, t.debug("Hashlock spend failed, wrong preimage for hash", { result: r }), r) : (r = {
		...s,
		success: !1,
		path: "FAILED"
	}, t.debug("Hashlock spend failed, no preimage found", { result: r }), r);
}
function wa(e, t = E, n) {
	return Ca(e, t, n).success;
}
function Ta(e) {
	return qi(e)?.preimage;
}
// src/crypto/NUT20.ts
var Ea = o("Cashu_MintQuoteSig_v1");
function Da(e) {
	let t = k.from(e.amount).toBigInt();
	if (t === 0n) return /* @__PURE__ */ new Uint8Array();
	let n = t.toString(16);
	return i(n.length % 2 == 1 ? "0" + n : n);
}
function Oa(t, n) {
	let r = e.create();
	r.update(Ea);
	let a = o(t);
	r.update(y(a.length, 4)), r.update(a);
	for (let e of n) {
		let t = Da(e);
		r.update(y(t.length, 4)), r.update(t);
		let n = i(e.B_);
		r.update(y(n.length, 4)), r.update(n);
	}
	return r.digest();
}
function ka(t, n) {
	let r = t;
	for (let e of n) r += e.B_;
	return e(o(r));
}
function Aa(e) {
	return typeof e == "string" && e.length === 66;
}
function ja(e, t, n) {
	return F(ka(t, n), e);
}
function Ma(e, t, n, r) {
	if (!Aa(e)) return !1;
	try {
		return nn(r, ka(t, n), e);
	} catch {
		return !1;
	}
}
function Na(e, t, n) {
	return F(Oa(t, n), e);
}
// src/wallet/types/payment-requests.ts
var Pa = /* @__PURE__ */ function(e) {
	return e.POST = "post", e.NOSTR = "nostr", e;
}({}), Fa = 1, Ia = 2, La = 3, Ra = 4, za = 5, Ba = 6, Va = 7, Ha = 8, Ua = 1, Wa = 2, Ga = 3, Ka = 0, qa = 1, Ja = 1, Ya = 2, Xa = 3, Za = 0, Qa = 1;
function $a(e) {
	let t = eo(e), n = {};
	for (let e of t) switch (e.tag) {
		case Fa:
			if (n.id !== void 0) throw new x("invalid pr: multiple id fields");
			n.id = no(e.value);
			break;
		case Ia:
			if (n.amount !== void 0) throw new x("invalid pr: multiple amount fields");
			n.amount = ro(e.value);
			break;
		case La:
			if (n.unit !== void 0) throw new x("invalid pr: multiple unit fields");
			n.unit = e.value.length === 1 && e.value[0] === 0 ? "sat" : no(e.value);
			break;
		case Ra:
			if (n.singleUse !== void 0) throw new x("invalid pr: multiple single_use fields");
			n.singleUse = io(e.value) === 1;
			break;
		case za:
			n.mints || (n.mints = []), n.mints.push(no(e.value));
			break;
		case Ba:
			if (n.description !== void 0) throw new x("invalid pr: multiple description fields");
			n.description = no(e.value);
			break;
		case Va:
			n.transports || (n.transports = []), n.transports.push(so(e.value));
			break;
		case Ha:
			if (n.nut10) throw new x("invalid pr: multiple nut10 spending conditions");
			n.nut10 = co(e.value);
	}
	return n;
}
function eo(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = to(e.subarray(n));
		t.push(r), n += 3 + r.length;
	}
	return t;
}
function to(e) {
	if (e.length < 3) throw new x("TLV data too short: need at least 3 bytes for tag and length");
	let t = new DataView(e.buffer, e.byteOffset, e.byteLength), n = t.getUint8(0), r = t.getUint16(1, !1);
	if (e.length < 3 + r) throw new x(`TLV data too short: expected ${3 + r} bytes, got ${e.length}`);
	return {
		tag: n,
		length: r,
		value: e.subarray(3, 3 + r)
	};
}
function no(e) {
	return Oe(e);
}
function ro(e) {
	if (e.length !== 8) throw new x(`Invalid u64: expected 8 bytes, got ${e.length}`);
	return new DataView(e.buffer, e.byteOffset, e.byteLength).getBigUint64(0, !1);
}
function io(e) {
	if (e.length !== 1) throw new x(`Invalid u8: expected 1 byte, got ${e.length}`);
	return e[0];
}
function ao(e) {
	switch (e) {
		case Ka: return "nostr";
		case qa: return "post";
		default: throw new x(`Unsupported transport kind: ${e}`);
	}
}
function oo(e) {
	switch (e) {
		case Za: return "P2PK";
		case Qa: return "HTLC";
		default: throw new x(`Unsupported NUT-10 kind: ${e}`);
	}
}
function so(e) {
	let t = eo(e), n, r, i;
	for (let e of t) switch (e.tag) {
		case Ua:
			if (n !== void 0) throw new x("invalid pr: multiple transport kind fields");
			n = io(e.value);
			break;
		case Wa:
			if (r !== void 0) throw new x("invalid pr: multiple transport target fields");
			r = e.value;
			break;
		case Ga: i || (i = []), i.push(lo(e.value));
	}
	if (n === void 0) throw new x("Transport missing required kind field");
	if (r === void 0) throw new x("Transport missing required target field");
	let a;
	if (n === Ka) {
		let e = i?.filter((e) => e[0] === "r").flatMap((e) => e.slice(1)) ?? [];
		a = xo(r, e), i = i?.filter((e) => e[0] !== "r");
	} else a = no(r);
	let o = i && i.length > 0 ? i : void 0;
	return {
		type: ao(n),
		target: a,
		tags: o
	};
}
function co(e) {
	let t = eo(e), n, r, i;
	for (let e of t) switch (e.tag) {
		case Ja:
			if (n !== void 0) throw new x("invalid pr: multiple nut10 kind fields");
			n = io(e.value);
			break;
		case Ya:
			if (r !== void 0) throw new x("invalid pr: multiple nut10 data fields");
			r = no(e.value);
			break;
		case Xa: i || (i = []), i.push(lo(e.value));
	}
	if (n === void 0) throw new x("NUT-10 spending condition missing required kind field");
	if (r === void 0) throw new x("NUT-10 spending condition missing required data field");
	let a = i && i.length > 0 ? i : void 0;
	return {
		kind: oo(n),
		data: r,
		tags: a
	};
}
function lo(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = e[n];
		if (n += 1, e.length - n < r) throw new x(`Tag tuple data too short: expected ${r} bytes, got ${e.length - n}`);
		let i = no(e.subarray(n, n + r));
		t.push(i), n += r;
	}
	return t;
}
function uo(e) {
	let t = [];
	if (e.id && t.push(H(Fa, fo(e.id))), e.amount !== void 0 && t.push(H(Ia, po(e.amount))), e.unit) {
		if (e.unit === "sat") t.push(H(La, new Uint8Array([0])));
		else {
			let n = fo(e.unit);
			if (n.length === 1 && n[0] === 0) throw new x("invalid pr: unit encoding is reserved for sat");
			t.push(H(La, n));
		}
	}
	if (e.singleUse !== void 0 && t.push(H(Ra, mo(+!!e.singleUse))), e.mints && e.mints.length > 0) for (let n of e.mints) t.push(H(za, fo(n)));
	if (e.description && t.push(H(Ba, fo(e.description))), e.transports && e.transports.length > 0) for (let n of e.transports) t.push(H(Va, _o(n)));
	e.nut10 && t.push(H(Ha, vo(e.nut10)));
	let n = t.reduce((e, t) => e + t.length, 0), r = new Uint8Array(n), i = 0;
	for (let e of t) r.set(e, i), i += e.length;
	return r;
}
function H(e, t) {
	let n = t.length;
	if (n > 65535) throw new x(`TLV value too long: ${n} bytes (max 65535)`);
	let r = new Uint8Array(3 + n);
	return r[0] = e, r[1] = n >> 8 & 255, r[2] = n & 255, r.set(t, 3), r;
}
function fo(e) {
	if (Me(e)) throw new x("TLV text must be well-formed UTF-16");
	return new TextEncoder().encode(e);
}
function po(e) {
	let t = /* @__PURE__ */ new ArrayBuffer(8);
	return new DataView(t).setBigUint64(0, e, !1), new Uint8Array(t);
}
function mo(e) {
	return new Uint8Array([e]);
}
function ho(e) {
	switch (e) {
		case Pa.NOSTR: return Ka;
		case Pa.POST: return qa;
		default: throw new x(`Unsupported transport type: ${e}`);
	}
}
function go(e) {
	switch (e) {
		case "P2PK": return Za;
		case "HTLC": return Qa;
		default: throw new x(`Unsupported NUT-10 type: ${e}`);
	}
}
function _o(e) {
	let t = [], n = ho(e.type);
	t.push(H(Ua, mo(n)));
	let r, i = [];
	if (e.type === Pa.NOSTR) {
		let { pubkey: t, relays: n } = bo(e.target);
		r = t, i = n.map((e) => ["r", e]);
	} else r = fo(e.target);
	t.push(H(Wa, r));
	let a = [...i, ...e.tags || []];
	if (a.length > 0) for (let e of a) t.push(H(Ga, yo(e)));
	let o = t.reduce((e, t) => e + t.length, 0), s = new Uint8Array(o), c = 0;
	for (let e of t) s.set(e, c), c += e.length;
	return s;
}
function vo(e) {
	let t = [], n = go(e.kind);
	if (t.push(H(Ja, mo(n))), t.push(H(Ya, fo(e.data))), e.tags && e.tags.length > 0) for (let n of e.tags) t.push(H(Xa, yo(n)));
	let r = t.reduce((e, t) => e + t.length, 0), i = new Uint8Array(r), a = 0;
	for (let e of t) i.set(e, a), a += e.length;
	return i;
}
function yo(e) {
	let t = new TextEncoder(), n = [];
	for (let r of e) {
		let e = t.encode(r);
		if (e.length > 255) throw new x(`Tag tuple string too long: ${r} (max 255 bytes)`);
		let i = new Uint8Array(1 + e.length);
		i[0] = e.length, i.set(e, 1), n.push(i);
	}
	let r = n.reduce((e, t) => e + t.length, 0), i = new Uint8Array(r), a = 0;
	for (let e of n) i.set(e, a), a += e.length;
	return i;
}
function bo(e) {
	let t = d.decode(e, 1024);
	if (t.prefix !== "nprofile") throw new x(`Invalid nprofile: expected prefix 'nprofile', got '${t.prefix}'`);
	let n = d.fromWords(t.words), r = new Uint8Array(n), i, a = [], o = 0;
	for (; o < r.length;) {
		if (o + 2 > r.length) throw new x("Nprofile TLV data too short");
		let e = r[o], t = r[o + 1];
		if (o += 2, o + t > r.length) throw new x(`Nprofile TLV value too short: expected ${t} bytes`);
		let n = r.subarray(o, o + t);
		if (o += t, e === 0) {
			if (i !== void 0) throw new x("Nprofile contains multiple pubkeys");
			if (n.length !== 32) throw new x(`Invalid pubkey length: expected 32 bytes, got ${n.length}`);
			i = n;
		} else e === 1 && a.push(Oe(n));
	}
	if (!i) throw new x("Nprofile missing required pubkey");
	return {
		pubkey: i,
		relays: a
	};
}
function xo(e, t) {
	let n = So(e, t), r = d.toWords(n);
	return d.encode("nprofile", r, 1024);
}
function So(e, t) {
	if (e.length !== 32) throw new x(`Invalid pubkey: expected 32 bytes, got ${e.length}`);
	let n = new TextEncoder(), r = t.map((e) => n.encode(e));
	for (let e = 0; e < r.length; e++) if (r[e].length > 255) throw new x(`Relay URL too long: ${t[e]} (max 255 bytes)`);
	let i = 34 + r.reduce((e, t) => e + 2 + t.length, 0), a = new Uint8Array(i), o = 0;
	a[o++] = 0, a[o++] = 32, a.set(e, o), o += 32;
	for (let e of r) a[o++] = 1, a[o++] = e.length, a.set(e, o), o += e.length;
	return a;
}
// src/model/PaymentRequest.ts
var Co = class e {
	constructor(e, t, n, r, i, a, o = !1, s) {
		this.transport = e, this.id = t, this.unit = r, this.mints = i, this.description = a, this.singleUse = o, this.nut10 = s, this.amount = n === void 0 ? void 0 : k.from(n);
	}
	toRawRequest() {
		let e = {};
		return this.transport && (e.t = this.transport.map((e) => ({
			t: e.type,
			a: e.target,
			g: e.tags
		}))), this.id && (e.i = this.id), this.amount && (e.a = this.amount.toBigInt()), this.unit && (e.u = this.unit), this.mints && (e.m = this.mints), this.description && (e.d = this.description), this.singleUse && (e.s = this.singleUse), this.nut10 && (e.nut10 = {
			k: this.nut10.kind,
			d: this.nut10.data,
			t: this.nut10.tags
		}), e;
	}
	toEncodedRequest() {
		return "creqA" + rt(ht(this.toRawRequest()));
	}
	toEncodedCreqA() {
		return this.toEncodedRequest();
	}
	toEncodedCreqB() {
		return dt("creqb", uo({
			id: this.id,
			amount: this.amount === void 0 ? void 0 : this.amount.toBigInt(),
			unit: this.unit,
			singleUse: this.singleUse,
			mints: this.mints,
			description: this.description,
			transports: this.transport,
			nut10: this.nut10 ? {
				kind: this.nut10.kind,
				data: this.nut10.data,
				tags: this.nut10.tags
			} : void 0
		})).toUpperCase();
	}
	getTransport(e) {
		return this.transport?.find((t) => t.type === e);
	}
	toP2PKOptions() {
		let e = this.nut10, t = e?.kind === "HTLC";
		if (!e || e.kind !== "P2PK" && !t) return;
		if (!e.data) throw new x(`NUT-10 ${e.kind} option is missing its data field`);
		let n = V([e.kind, {
			nonce: "",
			data: e.data,
			tags: e.tags ?? []
		}]), r = Oi(n, "pubkeys") ?? [], i = [e.data, ...r], a = t ? {
			hashlock: e.data,
			pubkey: r
		} : { pubkey: i.length === 1 ? i[0] : i };
		a.locktime = B(n, "locktime"), a.refundKeys = Oi(n, "refund"), a.requiredSignatures = B(n, "n_sigs"), a.requiredRefundSignatures = B(n, "n_sigs_refund"), ki(n, "sigflag") === "SIG_ALL" && (a.sigFlag = "SIG_ALL");
		let o = (e.tags ?? []).filter((e) => e.length > 0 && !zi(e[0]));
		return o.length > 0 && (a.additionalTags = o), a;
	}
	static fromRawRequest(t) {
		let n = t.t ? t.t.map((e) => ({
			type: e.t,
			target: e.a,
			tags: e.g
		})) : void 0, r = t.nut10 ? {
			kind: t.nut10.k,
			data: t.nut10.d,
			tags: t.nut10.t
		} : void 0;
		return new e(n, t.i, t.a, t.u, t.m, t.d, t.s, r);
	}
	static fromEncodedRequest(t) {
		let n = t.toLowerCase();
		if (n.startsWith("creqb")) {
			let t = $a(pt(n)), r = t.nut10 ? {
				kind: t.nut10.kind,
				data: t.nut10.data,
				tags: t.nut10.tags ?? []
			} : void 0;
			return new e(t.transports, t.id, t.amount, t.unit, t.mints, t.description, t.singleUse ?? !1, r);
		}
		if (!t.startsWith("creq")) throw new x("unsupported pr: invalid prefix");
		if (t[4] !== "A") throw new x("unsupported pr version");
		let r = Dt(ot(t.slice(5)));
		return this.fromRawRequest(r);
	}
};
// src/utils/core.ts
function U(e, t, n, r) {
	let i = Do(e, "splitAmount.value", !0), a = n?.map((e) => Do(e, "splitAmount.split", !0));
	if (a) {
		if (a.length > 8192) throw new x(`Cannot split amount: split would exceed ${fe} outputs`);
		let e = k.sum(a);
		if (i.isZero() && e.isZero()) return a;
		let n = a.filter((e) => !e.isZero()), r = k.sum(n);
		if (r.greaterThan(i)) throw new x(`Split is greater than total amount: ${r.toString()} > ${i.toString()}`);
		if (n.some((e) => !Eo(e, t))) throw new x("Provided amount preferences do not match the amounts of the mint keyset.");
		if (r.equals(i)) return n;
		a = n, i = i.subtract(r);
	} else a = [];
	let o = To(t, "desc");
	if (o.length === 0) throw new x("Cannot split amount, keyset is inactive or contains no keys");
	for (let e of o) {
		if (e.isZero()) continue;
		let t = i.divideBy(e), n = fe - a.length;
		if (n <= 0 || t.greaterThan(n)) throw new x(`Cannot split amount: fill would exceed ${fe} outputs`);
		let r = t.toNumber();
		for (let t = 0; t < r; t++) a.push(e);
		if (i = i.subtract(e.multiplyBy(t)), i.isZero()) break;
	}
	if (!i.isZero()) throw new x(`Unable to split remaining amount: ${i.toString()}`);
	return r && (a = a.sort((e, t) => r === "desc" ? t.compareTo(e) : e.compareTo(t))), a;
}
function wo(e, t = "desc") {
	return To(e, t);
}
function To(e, t) {
	let n = Object.keys(e).map((e) => k.from(e));
	return n.sort((e, n) => t === "desc" ? n.compareTo(e) : e.compareTo(n)), n;
}
function Eo(e, t) {
	let n = Do(e, "hasCorrespondingKey.amount", !0).toString();
	return Object.prototype.hasOwnProperty.call(t, n);
}
function Do(e, t, n = !1) {
	let r = k.from(e);
	if (!n && r.isZero()) throw new x(`Amount must be positive: ${r.toString()}, op: ${t}`);
	return r;
}
function Oo(e) {
	return e ? BigInt(`0x${e}`) : 0n;
}
function ko(e) {
	return e.toString(16).padStart(64, "0");
}
function W(e) {
	return typeof e == "string" && e.length % 2 == 0 && /^[a-f0-9]+$/i.test(e);
}
function Ao(e) {
	return Array.isArray(e) ? e.some((e) => !W(e.id)) : !W(e.id);
}
function jo(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
function Mo(e) {
	return e.map((e) => {
		let t = { ...e };
		return t.id = t.id.slice(0, 16), t;
	});
}
function No(e, t) {
	let n = X(e.proofs);
	if (Ao(n)) throw new x("Proofs contain a legacy keyset ID and cannot be encoded. Swap them at the mint first.");
	return Po({
		...e,
		proofs: n
	}, t?.removeDleq);
}
function Po(e, t) {
	let n = e.proofs;
	if (t && (n = es(n)), Ao(n)) throw new x("can not encode to v4 token if proofs contain non-hex keyset id");
	return n = Mo(n), "cashuB" + nt(ht(Io({
		...e,
		proofs: n
	})));
}
function Fo(e) {
	if (e.r == null) throw new x("Missing blinding factor in included DLEQ proof");
	return {
		e: i(e.e),
		s: i(e.s),
		r: i(e.r)
	};
}
function Io(e) {
	let t = Object.create(null), n = e.mint;
	for (let n = 0; n < e.proofs.length; n++) {
		let r = e.proofs[n];
		t[r.id] ? t[r.id].push(r) : t[r.id] = [r];
	}
	let r = {
		m: n,
		u: e.unit || "sat",
		t: Object.keys(t).map((e) => ({
			i: i(e),
			p: t[e].map((e) => ({
				a: e.amount.toBigInt(),
				s: e.secret,
				c: i(e.C),
				...e.dleq && { d: Fo(e.dleq) },
				...e.p2pk_e && { pe: i(e.p2pk_e) },
				...e.witness && { w: typeof e.witness == "string" ? e.witness : JSON.stringify(e.witness) }
			}))
		}))
	};
	return e.memo && (r.d = e.memo), r;
}
function Lo(e, t) {
	if (!(e instanceof Uint8Array) || e.length === 0) throw new x(`Invalid token: ${t} must be a non-empty byte string`);
	return n(e);
}
function Ro(e, t) {
	if (typeof e != "string" || e.length === 0) throw new x(`Invalid token: ${t} must be a non-empty string`);
	return e;
}
function zo(e) {
	return e != null && e.e != null && e.s != null && e.r != null;
}
function Bo(e) {
	if (!e || !Array.isArray(e.t)) throw new x("Invalid token");
	let t = Ro(e.m, "mint"), n = e.u ? Ro(e.u, "unit") : "sat", r = e.d ? Ro(e.d, "memo") : void 0, i = [];
	return e.t.forEach((e) => {
		if (!e || !Array.isArray(e.p)) throw new x("Invalid token");
		e.p.forEach((t) => {
			let n = Lo(e.i, "keyset id"), r = Ro(t.s, "secret"), a = t.w ? Ro(t.w, "witness") : void 0;
			i.push({
				secret: r,
				C: Lo(t.c, "proof C"),
				amount: k.from(t.a),
				id: n,
				...zo(t.d) && { dleq: {
					r: Lo(t.d.r, "dleq r"),
					s: Lo(t.d.s, "dleq s"),
					e: Lo(t.d.e, "dleq e")
				} },
				...t.pe && { p2pk_e: Lo(t.pe, "p2pk_e") },
				...a && { witness: a }
			});
		});
	}), {
		mint: t,
		proofs: i,
		unit: n,
		...r && { memo: r }
	};
}
function Vo(e, t) {
	if (!Array.isArray(t)) throw new x("getDecodedToken requires keysetIds (the wallet keyset id list) as its second argument; see the v4 migration guide, or use wallet.decodeToken()");
	let n = Uo(os(e));
	return n.proofs = ts(n.proofs, t), n;
}
function Ho(e) {
	e = os(e);
	let t = Uo(e);
	return {
		unit: t.unit || "sat",
		mint: t.mint,
		amount: Y(t.proofs),
		...t.memo && { memo: t.memo },
		incompleteProofs: t.proofs.map((e) => {
			let { id: t, ...n } = e;
			return n;
		}),
		proofAmounts: t.proofs.map((e) => e.amount)
	};
}
function Uo(e) {
	let t = e.slice(0, 1), n = e.slice(1);
	if (t === "A") {
		let e = st(n);
		if (!e || !Array.isArray(e.token)) throw new x("Invalid token");
		if (e.token.length > 1) throw new x("Multi entry token are not supported");
		let t = e.token[0];
		if (!t || !Array.isArray(t.proofs)) throw new x("Invalid token");
		let r = t.proofs.map((e) => {
			let { dleq: t, ...n } = e;
			return {
				...n,
				amount: k.from(e.amount),
				...t?.r && t.s && t.e && { dleq: t }
			};
		}), i = {
			mint: t.mint,
			proofs: r,
			unit: e.unit || "sat"
		};
		return e.memo && (i.memo = e.memo), i;
	}
	if (t === "B") return Bo(Dt(ot(n)));
	throw new x("Token version is not supported");
}
var Wo = 1, Go = (e) => `v${e + 1}`;
function Ko(e, t) {
	let n = W(e) ? Number.parseInt(e.slice(0, 2), 16) : -1;
	D(n > 1, `Keyset '${e}' is a ${Go(n)} keyset; this build of cashu-ts supports up to ${Go(1)}. Upgrade to use this keyset.`, t, {
		keysetId: e,
		versionByte: n,
		supported: 1
	});
}
function qo(t, r) {
	un(t);
	let a = r?.unit ?? "sat", s = r?.expiry, c = r?.versionByte ?? 1, l = r?.input_fee_ppk;
	if (r?.isDeprecatedBase64 ?? !1) {
		let n = Object.entries(t).sort(([e], [t]) => k.from(e).compareTo(t)).map(([, e]) => e).reduce((e, t) => e + t, "");
		return tt(e(o(n))).slice(0, 12);
	}
	switch (c) {
		case 0: {
			let r = Jo(...Object.entries(t).sort(([e], [t]) => k.from(e).compareTo(t)).map(([, e]) => i(e))), a = e(r);
			return "00" + n(a).slice(0, 14);
		}
		case 1: {
			ln(a);
			let r = Object.entries(t).sort(([e], [t]) => k.from(e).compareTo(t)).map(([e, t]) => `${e}:${t}`).join(",");
			r += `|unit:${a}`, l && (r += `|input_fee_ppk:${l}`), s && (r += `|final_expiry:${s}`);
			let i = e(o(r));
			return "01" + n(i);
		}
		default: throw new x(`Unrecognized keyset ID version: ${c}`);
	}
}
function Jo(...e) {
	let t = e.reduce((e, t) => e + t.length, 0), n = new Uint8Array(t), r = 0;
	for (let t of e) n.set(t, r), r += t.length;
	return n;
}
function Yo(e) {
	return [...e].sort((e, t) => e.id.localeCompare(t.id));
}
function G(e) {
	return typeof e == "object" && !!e;
}
function K(e) {
	return G(e) && !Array.isArray(e);
}
function q(e, ...t) {
	for (let n of t) e[n] === void 0 && (e[n] = null);
}
function J(...e) {
	return e.map((e) => e.replace(/(^\/+|\/+$)/g, "")).join("/");
}
function Xo(e) {
	let t;
	try {
		t = new URL(e);
	} catch (t) {
		throw new x(`Invalid mint URL: ${e}`, { cause: t });
	}
	if (t.protocol !== "http:" && t.protocol !== "https:") throw new x(`Invalid mint URL scheme: ${t.protocol}`);
	if (t.username || t.password) throw new x("Mint URL must not contain credentials");
	if (t.search || t.href.includes("?")) throw new x("Mint URL must not contain query parameters");
	if (t.hash || t.href.includes("#")) throw new x("Mint URL must not contain a fragment");
	if (/%[0-9a-f]{2}/i.test(t.pathname)) throw new x("Mint URL path must not contain percent-encoded characters");
	return t.href.replace(/\/+$/, "");
}
function Y(e) {
	return k.sum(e.map((e) => e.amount));
}
function X(e) {
	return e.map((e) => ({
		...e,
		amount: k.from(e.amount)
	}));
}
function Zo(e) {
	return (Array.isArray(e) ? e : [e]).map((e) => A.stringify(e));
}
function Qo(e) {
	if (!Array.isArray(e)) {
		let t = A.parse(e);
		if (!Array.isArray(t)) throw TypeError("deserializeProofs: expected a JSON array of proofs");
		e = t;
	}
	return X(e.map((e) => typeof e == "string" ? A.parse(e) : e));
}
function $o(e) {
	return Co.fromEncodedRequest(e);
}
function es(e) {
	return e.map((e) => {
		let { dleq: t, ...n } = e;
		return n;
	});
}
function ts(e, t) {
	let n = [...new Set(t.map((e) => e.toLowerCase()))], r = [];
	for (let t of e) {
		let e;
		try {
			e = i(t.id);
		} catch {
			r.push(t);
			continue;
		}
		if (e[0] === 0) r.push(t);
		else if (e[0] === 1) {
			if (!n.length) throw new x("A short keyset ID v2 was encountered, but got no keysets to map it to.");
			let e = t.id.toLowerCase(), i = n.filter((t) => e === t.slice(0, e.length));
			if (i.length > 1) throw new x(`Short keyset ID ${t.id} is ambiguous.`);
			if (i.length === 0) throw new x(`Couldn't map short keyset ID ${t.id} to any known keysets of the current Mint`);
			t.id = i[0], r.push(t);
		} else throw new x(`Unknown keyset ID version: ${e[0]}`);
	}
	return r;
}
function ns(e, t, n) {
	let r = n?.require ?? !0;
	if (!Eo(e.amount, t.keys)) throw new x(Object.keys(t.keys).length === 0 ? `No keys loaded for keyset ${t.id}` : `Undefined key for amount ${e.amount.toString()} in keyset ${t.id}`);
	if (e?.dleq == null) return !r;
	if (e.dleq.r == null) return !1;
	let a = t.keys[e.amount.toString()];
	try {
		let t = {
			e: i(e.dleq.e),
			s: i(e.dleq.s),
			r: Oo(e.dleq.r)
		};
		return _a(new TextEncoder().encode(e.secret), t, N(e.C), N(a));
	} catch {
		return !1;
	}
}
function rs(e, t) {
	return ns(e, t, { require: !1 });
}
function is(e) {
	let t = new TextEncoder(), n = X(e.proofs);
	if (Ao(n)) throw new x("Proofs contain a legacy keyset ID and cannot be encoded. Swap them at the mint first.");
	let r = ht(Io({
		...e,
		proofs: n
	}));
	return Jo(t.encode("craw"), t.encode("B"), r);
}
function as(e, t) {
	if (e.length < 5 || [
		99,
		114,
		97,
		119,
		66
	].some((t, n) => e[n] !== t)) throw new x("not a valid binary token");
	let n = Bo(Dt(e.slice(5)));
	return Array.isArray(t) && (n.proofs = ts(n.proofs, t)), n;
}
function os(e) {
	for (let t of [
		"web+cashu://",
		"cashu://",
		"cashu:"
	]) if (e.startsWith(t)) {
		e = e.slice(t.length);
		break;
	}
	return e.startsWith("cashu") && (e = e.slice(5)), e;
}
function ss(e) {
	try {
		return us(e) !== null;
	} catch {
		return !1;
	}
}
var cs = {
	m: 100000000n,
	u: 100000n,
	n: 100n
}, ls = 100000000000n;
function us(e) {
	if (typeof e != "string") throw new x("BOLT11 invoice must be a string");
	let t = e.toLowerCase(), n = t.lastIndexOf("1");
	if (!t.startsWith("ln") || n < 3 || n > 100 || n === t.length - 1) throw new x("Invalid BOLT11 invoice");
	let r = /^ln[a-z]+?(\d*)([munp]?)$/.exec(t.slice(0, n));
	if (!r) throw new x("Invalid BOLT11 invoice");
	let [, i, a] = r;
	if (i === "") return null;
	if (i.startsWith("0")) throw new x("Invalid BOLT11 amount");
	let o = BigInt(i);
	if (a === "") return o * ls;
	if (a === "p") {
		if (o % 10n != 0n) throw new x("Invalid BOLT11 amount");
		return o / 10n;
	}
	return o * cs[a];
}
function ds(e) {
	if (typeof e != "string") throw new x("BOLT11 invoice must be a string");
	let t;
	try {
		({words: t} = d.decode(e.toLowerCase(), !1));
	} catch (e) {
		throw new x("Invalid BOLT11 invoice", { cause: e });
	}
	let r = t.length - 104;
	for (let e = 7; e + 3 <= r;) {
		let i = t[e], a = t[e + 1] << 5 | t[e + 2], o = e + 3 + a;
		if (o > r) break;
		if (i === 1 && a === 52) try {
			return n(d.fromWords(t.slice(e + 3, o)));
		} catch (e) {
			throw new x("Invalid BOLT11 payment hash", { cause: e });
		}
		e = o;
	}
	throw new x("BOLT11 invoice has no payment hash");
}
function fs(t, r) {
	let a = ds(t);
	return /^[0-9a-fA-F]{64}$/.test(r) && n(e(i(r))) === a;
}
function ps(e) {
	let t = e ?? 32;
	if (!Number.isSafeInteger(t) || t < 1) throw new x("chunkSize must be a positive safe integer");
	return t;
}
function ms(e) {
	let t = e ?? 50;
	if (!Number.isFinite(t) || t < 0) throw new x("budgetMs must be a finite, non-negative number");
	return t;
}
async function hs() {
	let e = globalThis;
	if (typeof e.scheduler?.yield == "function") return e.scheduler.yield();
	typeof e.MessageChannel == "function" ? await new Promise((t) => {
		let { port1: n, port2: r } = new e.MessageChannel();
		n.onmessage = () => {
			n.close(), t();
		}, r.postMessage(null);
	}) : await new Promise((e) => setTimeout(e, 0));
}
async function gs(e, t, n) {
	let r = ps(n?.chunkSize), i = ms(n?.budgetMs), a = e.length, o = Array(a), s = () => {
		if (n?.signal?.aborted) throw new w("Operation aborted by caller");
	};
	s();
	let c = performance.now(), l = 0;
	for (let u = 0; u < a; u++) o[u] = t(e[u], u), l++, u + 1 !== a && (l >= r || performance.now() - c >= i) && (n?.onProgress?.(u + 1, a), await hs(), s(), c = performance.now(), l = 0);
	return n?.onProgress?.(a, a), o;
}
// src/utils/verifyProofs.ts
function _s(e) {
	return e instanceof Error ? e.message : String(e);
}
function vs(e, t, n) {
	let r;
	try {
		r = {
			...e,
			amount: k.from(e.amount)
		};
	} catch (t) {
		return new x(`Invalid amount ${String(e.amount)} in keyset ${e.id}`, { cause: t });
	}
	let a;
	try {
		a = t(r.id);
	} catch (e) {
		return new x(_s(e), { cause: e });
	}
	if (Object.keys(a.keys).length === 0) return new x(`No keys loaded for keyset ${a.id}`);
	let o = a.keys[r.amount.toString()];
	if (!o) return new x(`Undefined key for amount ${r.amount.toString()} in keyset ${a.id}`);
	let s = () => new x(`${n ? "Token contains proofs with invalid or missing DLEQ" : "Token contains a proof with an invalid DLEQ"} (keyset ${r.id}, amount ${r.amount.toString()})`);
	if (r.dleq == null) return n ? s() : void 0;
	if (r.dleq.r == null) return s();
	try {
		return _a(new TextEncoder().encode(r.secret), {
			e: i(r.dleq.e),
			s: i(r.dleq.s),
			r: Oo(r.dleq.r)
		}, N(r.C), N(o)) ? void 0 : s();
	} catch {
		return s();
	}
}
async function ys(e, t, n) {
	if (e.length > 1e4) throw new x(`Token contains too many proofs: ${e.length}, maximum is ${pe}`);
	let r = n?.require ?? !1, i = await gs(e, (e) => vs(e, t, r), {
		chunkSize: ps(n?.chunkSize),
		budgetMs: ms(n?.budgetMs),
		signal: n?.signal,
		onProgress: n?.onProgress
	}), a = {
		valid: [],
		invalid: []
	};
	return i.forEach((t, n) => {
		t ? a.invalid.push({
			proof: e[n],
			error: t
		}) : a.valid.push(e[n]);
	}), a;
}
function bs(e, t, n) {
	return ys(e, t, n);
}
function xs(e, t, n) {
	return ys(e, t, n);
}
// src/utils/meltPreimage.ts
function Ss(e, t, n, r) {
	let i;
	try {
		i = fs(e, t);
	} catch (e) {
		return n.debug("Melt quote request is not a parseable BOLT11 invoice", {
			op: r,
			err: e
		}), t;
	}
	return i ? t : (n.warn("Mint returned a payment_preimage that does not match the invoice", { op: r }), null);
}
// src/utils/normalizeNumbers.ts
function Z(e, t, n) {
	if (e == null) {
		if (arguments.length >= 3) return n;
		throw new x(`Invalid ${t}: missing value`);
	}
	try {
		return k.from(e).toNumber();
	} catch (e) {
		throw new x(`Invalid ${t}: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
	}
}
function Cs(e) {
	return {
		...e,
		input_fee_ppk: Z(e.input_fee_ppk, "keyset.input_fee_ppk", void 0),
		final_expiry: Z(e.final_expiry, "keyset.final_expiry", void 0)
	};
}
function ws(e) {
	return {
		...e,
		input_fee_ppk: Z(e.input_fee_ppk, "keys.input_fee_ppk", void 0),
		final_expiry: Z(e.final_expiry, "keys.final_expiry", void 0)
	};
}
// src/auth/OIDCAuth.ts
function Ts(e, t) {
	let n;
	try {
		n = new URL(e).protocol;
	} catch {
		throw new x(`OIDCAuth: ${t} is not a valid URL`);
	}
	if (n !== "https:" && n !== "http:") throw new x(`OIDCAuth: ${t} must be an http(s) URL`);
	return n;
}
var Es = class t {
	static fromMintInfo(e, n) {
		let r = e?.nuts?.["21"];
		if (!r?.openid_discovery) throw new x("OIDCAuth: mint does not advertise NUT-21 openid_discovery");
		let i = n?.clientId ?? r.client_id ?? "cashu-client";
		return new t(r.openid_discovery, {
			...n,
			clientId: i
		});
	}
	constructor(e, t) {
		this.tokenListeners = [], this.inflightRefreshes = /* @__PURE__ */ new Map(), this.discoveryUrl = e, this.secureDiscovery = e.startsWith("https:"), this.logger = t?.logger ?? E, this.clientId = t?.clientId ?? "cashu-client", this.scope = t?.scope ?? "openid", this.onTokens = t?.onTokens;
	}
	setClient(e) {
		this.clientId = e;
	}
	setScope(e) {
		this.scope = e ?? "openid";
	}
	addTokenListener(e) {
		this.tokenListeners = [...this.tokenListeners, e];
	}
	removeTokenListener(e) {
		this.tokenListeners = this.tokenListeners.filter((t) => t !== e);
	}
	async loadConfig() {
		if (this.config) return this.config;
		let e = await fetch(this.discoveryUrl, {
			method: "GET",
			headers: { Accept: "application/json" }
		}), t = await e.text(), n, r;
		try {
			n = t ? JSON.parse(t) : void 0;
		} catch (e) {
			r = e, this.logger.warn("OIDCAuth: bad discovery JSON", { err: e });
		}
		if (!e.ok || !n) throw new x("OIDCAuth: invalid discovery document", { cause: r });
		let i = n;
		if (typeof i.token_endpoint != "string" || i.token_endpoint.length === 0) throw new x("OIDCAuth: invalid discovery document, missing token_endpoint");
		return this.assertEndpoint(i.token_endpoint, "token_endpoint"), this.config = i, i;
	}
	assertEndpoint(e, t) {
		let n = Ts(e, t);
		this.secureDiscovery && n !== "https:" && this.logger.warn(`OIDCAuth: ${t} is not https although discovery is; v5 rejects this`, { label: t });
	}
	generatePKCE() {
		let t = nt(a(48)), n = o(t);
		return {
			verifier: t,
			challenge: nt(e(n))
		};
	}
	async buildAuthCodeUrl(e) {
		let t = await this.loadConfig(), n = e.scope ?? this.scope, r = e.codeChallengeMethod;
		r !== void 0 && r !== "S256" && this.logger.warn(`OIDCAuth: codeChallengeMethod '${typeof r == "string" ? r : typeof r}' is not supported by cashu-ts v5, which accepts S256 only.`);
		let i = new URLSearchParams({
			response_type: "code",
			client_id: this.clientId,
			redirect_uri: e.redirectUri,
			scope: n,
			code_challenge_method: e.codeChallengeMethod ?? "S256",
			code_challenge: e.codeChallenge
		});
		if (e.state && i.set("state", e.state), !t.authorization_endpoint) throw new x("OIDCAuth: discovery lacks authorization_endpoint");
		return this.assertEndpoint(t.authorization_endpoint, "authorization_endpoint"), `${t.authorization_endpoint}?${i.toString()}`;
	}
	async exchangeAuthCode(e) {
		let t = await this.loadConfig(), n = this.toForm({
			grant_type: "authorization_code",
			code: e.code,
			redirect_uri: e.redirectUri,
			client_id: this.clientId,
			code_verifier: e.codeVerifier
		}), r = await this.postFormStrict(t.token_endpoint, n);
		return this.handleTokens(r, "signin"), r;
	}
	async deviceStart() {
		let e = (await this.loadConfig()).device_authorization_endpoint;
		if (!e) throw new x("OIDCAuth: provider lacks device_authorization_endpoint");
		this.assertEndpoint(e, "device_authorization_endpoint");
		let t = this.toForm({
			client_id: this.clientId,
			scope: this.scope
		}), n = await this.postFormStrict(e, t);
		return Ts(n.verification_uri, "verification_uri"), n.verification_uri_complete !== void 0 && Ts(n.verification_uri_complete, "verification_uri_complete"), n;
	}
	async devicePoll(e, t = 5) {
		let n = await this.loadConfig(), r = Number(t), i = Number.isFinite(r) ? Math.max(1, r) : 5;
		for (;;) {
			await this.sleep(i * 1e3);
			let t = this.toForm({
				grant_type: "urn:ietf:params:oauth:grant-type:device_code",
				device_code: e,
				client_id: this.clientId
			}), r = await this.postFormLoose(n.token_endpoint, t);
			if (r.access_token) return this.handleTokens(r, "signin", this.tokenListeners), r;
			let a = (r.error ?? "").toString();
			if (a !== "authorization_pending") {
				if (a === "slow_down") i = Math.max(i + 5, i * 2);
				else throw new x(`OIDCAuth: ${r.error_description || a || "device authorization failed"}`);
			}
		}
	}
	async startDeviceAuth(e = 5) {
		let t = await this.deviceStart(), n = Number(t.interval), r = Number.isFinite(n) && n > 0 ? n : 1, i = Number(e), a = Math.max(r, Number.isFinite(i) ? i : 5), o = new AbortController(), s, c = new Promise((e) => {
			s = e;
		}), l = /* @__PURE__ */ new Set(), u = () => {
			if (o.signal.aborted) throw new x("OIDCAuth: device polling cancelled");
		}, d = async () => {
			let e = await this.loadConfig(), n = Math.max(1, a);
			for (;;) {
				u();
				let r;
				await this.sleep(n * 1e3, (e) => {
					r = e, l.add(e);
				}), l.delete(r), u();
				let i = this.toForm({
					grant_type: "urn:ietf:params:oauth:grant-type:device_code",
					device_code: t.device_code,
					client_id: this.clientId
				}), a = await this.postFormLoose(e.token_endpoint, i, o.signal);
				if (u(), a.access_token) return this.handleTokens(a, "signin"), a;
				let s = (a.error ?? "").toString();
				if (s !== "authorization_pending") {
					if (s === "slow_down") n = Math.max(n + 5, n * 2);
					else throw new x(`OIDCAuth: ${a.error_description || s || "device authorization failed"}`);
				}
			}
		}, f = () => {
			o.abort(), s();
			for (let e of l) e();
			l.clear();
		};
		return {
			...t,
			poll: () => Promise.race([d(), c.then(() => {
				throw new x("OIDCAuth: device polling cancelled");
			})]),
			cancel: f
		};
	}
	async refresh(e) {
		let t = this.clientId, n = this.tokenListeners, r = this.inflightRefreshes.get(e);
		if (r?.listeners === n && r.clientId === t) return r.promise;
		let i = (async () => {
			let r = await this.loadConfig(), i = this.toForm({
				grant_type: "refresh_token",
				refresh_token: e,
				client_id: t
			}), a = await this.postFormStrict(r.token_endpoint, i);
			return a.refresh_token || (a.refresh_token = e), this.handleTokens(a, "refresh", n), a;
		})();
		this.inflightRefreshes.set(e, {
			clientId: t,
			listeners: n,
			promise: i
		});
		try {
			return await i;
		} finally {
			this.inflightRefreshes.get(e)?.promise === i && this.inflightRefreshes.delete(e);
		}
	}
	async passwordGrant(e, t) {
		let n = await this.loadConfig(), r = this.toForm({
			grant_type: "password",
			client_id: this.clientId,
			username: e,
			password: t,
			scope: this.scope
		}), i = await this.postFormStrict(n.token_endpoint, r);
		return this.handleTokens(i, "signin"), i;
	}
	handleTokens(e, t, n = this.tokenListeners) {
		if (!e.access_token) throw new x(`OIDCAuth: ${e.error_description || e.error || "token response missing access_token"}`);
		queueMicrotask(() => O((e) => this.onTokens?.(e, t), e, this.logger, { where: "OIDCAuth.handleTokens" }));
		let r = new Set(this.tokenListeners);
		for (let i of n) r.has(i) && queueMicrotask(() => O((e) => i(e, t), e, this.logger, { where: "OIDCAuth.handleTokens.listener" }));
	}
	toForm(e) {
		let t = (e) => encodeURIComponent(e).replace(/%20/g, "+");
		return Object.entries(e).map(([e, n]) => `${t(e)}=${t(n)}`).join("&");
	}
	async postFormStrict(e, t) {
		try {
			let n = await fetch(e, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json"
				},
				body: t,
				redirect: "error"
			}), r = await n.text(), i, a;
			try {
				i = r ? JSON.parse(r) : void 0;
			} catch (e) {
				a = e, this.logger.warn("OIDCAuth: bad JSON (strict)", { err: e });
			}
			if (!n.ok) {
				let e = i ?? {};
				throw new x(`OIDCAuth: ${e.error_description || e.error || `HTTP ${n.status}`}`, { cause: a });
			}
			return this.logger.debug("OIDCAuth Response", { status: n.status }), i ?? {};
		} catch (e) {
			throw this.logger.error("OIDCAuth: postFormStrict failed", { err: e }), e;
		}
	}
	async postFormLoose(e, t, n) {
		try {
			let r = await fetch(e, {
				method: "POST",
				signal: n,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json"
				},
				body: t,
				redirect: "error"
			}), i = await r.text(), a;
			try {
				a = i ? JSON.parse(i) : void 0;
			} catch (e) {
				this.logger.warn("OIDCAuth: bad JSON (loose)", { err: e });
			}
			return this.logger.debug("OIDCAuth Response", { status: r.status }), a ?? {};
		} catch (e) {
			return this.logger.error("OIDCAuth: postFormLoose network error", { err: e }), {
				error: "network_error",
				error_description: String(e)
			};
		}
	}
	sleep(e, t) {
		let n = Math.min(e, _e);
		return new Promise((e) => {
			let r = setTimeout(e, n);
			t?.(() => {
				clearTimeout(r), e();
			});
		});
	}
}, Q = class e {
	constructor(t, n) {
		let r = n ?? E;
		this._mintInfo = e.normalizeInfo(t, r), this._maxArrayLength = e.resolveMaxArrayLength(t.max_array_length, r);
		let i = this.toEndpoints(this._mintInfo?.nuts?.[22]?.protected_endpoints, r);
		this._protected22 = this.buildIndex(i);
		let a = this.toEndpoints(this._mintInfo?.nuts?.[21]?.protected_endpoints, r);
		this._protected21 = this.buildIndex(a);
	}
	static normalizeInfo(t, n = E) {
		if (!K(t) || !K(t.nuts)) throw n.error("MintInfo: malformed info response", { op: "normalizeInfo" }), new x("Invalid response from mint");
		return {
			...t,
			...Array.isArray(t.contact) ? { contact: e.capList(t.contact, "contact", n) } : {},
			...Array.isArray(t.urls) ? { urls: e.capList(t.urls, "urls", n) } : {},
			nuts: {
				...t.nuts,
				...t.nuts[4] ? { 4: e.normalizeSwapSection(t.nuts[4], "nuts.4", n) } : {},
				...t.nuts[5] ? { 5: e.normalizeSwapSection(t.nuts[5], "nuts.5", n) } : {},
				...t.nuts[15] ? { 15: e.normalizeNut15(t.nuts[15], n) } : {},
				...t.nuts[17] ? { 17: e.normalizeNut17(t.nuts[17], n) } : {},
				...t.nuts[19] ? { 19: e.normalizeNut19(t.nuts[19], n) } : {},
				...t.nuts[21] ? { 21: e.normalizeNut21(t.nuts[21], n) } : {},
				...t.nuts[22] ? { 22: e.normalizeNut22(t.nuts[22], n) } : {},
				...t.nuts[29] ? { 29: e.normalizeNut29(t.nuts[29], n) } : {}
			}
		};
	}
	static dropSection(e, t) {
		t.warn(`MintInfo: ${e} is malformed and was omitted`);
	}
	static normalizeSwapSection(t, n, r) {
		if (!K(t)) throw r.error("MintInfo: malformed info response", { op: n }), new x("Invalid response from mint");
		return {
			...t,
			methods: e.normalizeSwapMethods(t.methods, r)
		};
	}
	static normalizeSwapMethods(t, n) {
		return Array.isArray(t) ? e.capList(t, "nuts.4/5.methods", n).filter((e) => K(e)).map((e) => {
			let t = { ...e };
			return q(t, "min_amount", "max_amount"), t;
		}) : (n.warn("MintInfo: nuts.4/5.methods is malformed and was omitted"), []);
	}
	static resolveMaxArrayLength(e, t) {
		if (e == null) return 500;
		let n;
		try {
			n = Z(e, "max_array_length");
		} catch {
			return t.warn("MintInfo: max_array_length is malformed, defaulting to internal default", { value: e }), 500;
		}
		if (n < 1 || n > 1e4) {
			let e = Math.min(Math.max(n, 1), pe);
			return t.warn("MintInfo: max_array_length is out of range and was clamped", {
				advertised: n,
				clampedTo: e
			}), e;
		}
		return n;
	}
	static normalizeNut15(t, n) {
		return K(t) ? Array.isArray(t.methods) ? {
			...t,
			methods: e.capList(t.methods, "nuts.15.methods", n)
		} : t : e.dropSection("nuts.15", n);
	}
	static normalizeNut17(t, n) {
		return K(t) ? Array.isArray(t.supported) ? {
			...t,
			supported: e.capList(t.supported, "nuts.17.supported", n)
		} : t : e.dropSection("nuts.17", n);
	}
	static normalizeNut19(t, n) {
		return K(t) ? {
			...t,
			...Array.isArray(t.cached_endpoints) ? { cached_endpoints: e.capList(t.cached_endpoints, "nuts.19.cached_endpoints", n) } : {},
			ttl: Z(t.ttl, "nuts.19.ttl", null)
		} : e.dropSection("nuts.19", n);
	}
	static normalizeNut21(t, n) {
		return K(t) ? Array.isArray(t.protected_endpoints) ? {
			...t,
			protected_endpoints: e.capList(t.protected_endpoints, "nuts.21.protected_endpoints", n)
		} : t : e.dropSection("nuts.21", n);
	}
	static normalizeNut22(t, n) {
		if (!K(t)) return e.dropSection("nuts.22", n);
		let r = 100;
		try {
			r = Z(t.bat_max_mint, "nuts.22.bat_max_mint", 100);
		} catch {
			n.warn("MintInfo: nuts.22.bat_max_mint is malformed, defaulting to internal cap", { value: t.bat_max_mint });
		}
		return r > 100 && (n.warn("MintInfo: nuts.22.bat_max_mint exceeds internal cap and was clamped", {
			advertised: r,
			clampedTo: 100
		}), r = 100), {
			...t,
			...Array.isArray(t.protected_endpoints) ? { protected_endpoints: e.capList(t.protected_endpoints, "nuts.22.protected_endpoints", n) } : {},
			bat_max_mint: r
		};
	}
	static normalizeNut29(t, n) {
		if (!K(t)) return e.dropSection("nuts.29", n);
		let r = 100;
		try {
			r = Z(t.max_batch_size, "nuts.29.max_batch_size", 100);
		} catch {
			n.warn("MintInfo: nuts.29.max_batch_size is malformed, defaulting to internal cap", { value: t.max_batch_size });
		}
		return r > 100 && (n.warn("MintInfo: nuts.29.max_batch_size exceeds internal cap and was clamped", {
			advertised: r,
			clampedTo: 100
		}), r = 100), {
			methods: Array.isArray(t.methods) ? e.capList(t.methods, "nuts.29.methods", n) : t.methods,
			max_batch_size: r
		};
	}
	isSupported(e) {
		switch (e) {
			case 4:
			case 5: return this.checkMintMelt(e);
			case 7:
			case 8:
			case 9:
			case 10:
			case 11:
			case 12:
			case 14:
			case 20: return this.checkGenericNut(e);
			case 17: return this.checkNut17();
			case 15: return this.checkNut15();
			case 19: return this.checkNut19();
			case 29: return this.checkNut29();
			default: throw new x("nut is not supported by cashu-ts");
		}
	}
	requiresBlindAuthToken(e, t) {
		return this.matchesProtected(this._protected22, e, t);
	}
	requiresClearAuthToken(e, t) {
		return this.matchesProtected(this._protected21, e, t);
	}
	matchesProtected(e, t, n) {
		if (!e) return !1;
		let r = e.exact[t], i = e.prefix[t];
		if (!r || !i) return !1;
		if (e.exact[t].has(n)) return !0;
		for (let r of e.prefix[t]) if (n.startsWith(r)) return !0;
		return !1;
	}
	checkGenericNut(e) {
		return { supported: this._mintInfo.nuts[e]?.supported === !0 };
	}
	checkMintMelt(t) {
		let n = this._mintInfo.nuts[t];
		return n && n.methods.length > 0 && !n.disabled ? {
			disabled: !1,
			params: e.snapshot(n.methods)
		} : {
			disabled: !0,
			params: e.snapshot(n?.methods ?? [])
		};
	}
	checkNut17() {
		return this._mintInfo.nuts[17] && this._mintInfo.nuts[17].supported.length > 0 ? {
			supported: !0,
			params: e.snapshot(this._mintInfo.nuts[17].supported)
		} : { supported: !1 };
	}
	checkNut15() {
		return this._mintInfo.nuts[15] && this._mintInfo.nuts[15].methods.length > 0 ? {
			supported: !0,
			params: e.snapshot(this._mintInfo.nuts[15].methods)
		} : { supported: !1 };
	}
	checkNut19() {
		let t = this._mintInfo.nuts?.[19];
		if (t && (t?.cached_endpoints?.length || 0) > 0) {
			let n = Z(t.ttl, "nuts.19.ttl", null);
			return {
				supported: !0,
				params: {
					ttl: n === null ? Infinity : Math.max(n, 0) * 1e3,
					cached_endpoints: e.snapshot(t.cached_endpoints)
				}
			};
		}
		return { supported: !1 };
	}
	checkNut29() {
		let t = this._mintInfo.nuts?.[29];
		return t ? {
			supported: !0,
			params: e.snapshot(t)
		} : { supported: !1 };
	}
	static capList(e, t, n) {
		return e.length <= 1024 ? e : (n.warn(`MintInfo: ${t} exceeds internal cap and was truncated`, {
			advertised: e.length,
			cap: me
		}), e.slice(0, me));
	}
	toEndpoints(t, n) {
		if (!Array.isArray(t)) return [];
		let r = e.capList(t, "nuts.21/22.protected_endpoints", n), i = [];
		for (let e of r) if (e && typeof e == "object") {
			let t = e, n = t.method, r = t.path;
			if (typeof n == "string" && typeof r == "string") {
				let e = n.toUpperCase();
				(e === "GET" || e === "POST") && i.push({
					method: e,
					path: r
				});
			}
		}
		return i;
	}
	buildIndex(e) {
		if (!e?.length) return;
		let t = {
			GET: /* @__PURE__ */ new Set(),
			POST: /* @__PURE__ */ new Set()
		}, n = {
			GET: [],
			POST: []
		};
		for (let r of e) {
			let e = r.path;
			e.startsWith("^") && (e = e.slice(1)), e.endsWith("$") && (e = e.slice(0, -1)), e.endsWith(".*") ? n[r.method].push(e.slice(0, -2)) : e.endsWith("*") ? n[r.method].push(e.slice(0, -1)) : t[r.method].add(e);
		}
		return n.GET.sort((e, t) => t.length - e.length), n.POST.sort((e, t) => t.length - e.length), {
			exact: t,
			prefix: n
		};
	}
	static snapshot(t, n = 0) {
		if (typeof t != "object" || !t || t instanceof k) return t;
		if (n > 64) throw new x("Mint info nesting exceeds 64 levels");
		if (Array.isArray(t)) return t.map((t) => e.snapshot(t, n + 1));
		let r = {};
		for (let [i, a] of Object.entries(t)) r[i] = e.snapshot(a, n + 1);
		return r;
	}
	get cache() {
		return e.snapshot(this._mintInfo);
	}
	get contact() {
		return e.snapshot(this._mintInfo.contact);
	}
	get description() {
		return this._mintInfo.description;
	}
	get description_long() {
		return this._mintInfo.description_long;
	}
	get name() {
		return this._mintInfo.name;
	}
	get pubkey() {
		return this._mintInfo.pubkey;
	}
	get nuts() {
		return e.snapshot(this._mintInfo.nuts);
	}
	get version() {
		return this._mintInfo.version;
	}
	get motd() {
		return this._mintInfo.motd;
	}
	get icon_url() {
		return this._mintInfo.icon_url;
	}
	get urls() {
		return e.snapshot(this._mintInfo.urls);
	}
	get time() {
		return this._mintInfo.time;
	}
	get tos_url() {
		return this._mintInfo.tos_url;
	}
	get maxArrayLength() {
		return this._maxArrayLength;
	}
	supportsNut04Description(e, t) {
		return this._mintInfo.nuts[4]?.methods.some((n) => n.method === e && (!t || n.unit === t) && (n.options?.description === !0 || n.description === !0));
	}
	supportsMintMeltMethod(e, t, n) {
		let { disabled: r, params: i } = this.isSupported(e === "mint" ? 4 : 5);
		return !r && i.some((e) => e.method === t && e.unit === n);
	}
	supportsAmountless(e = "bolt11", t = "sat") {
		let n = this._mintInfo?.nuts?.[5]?.methods ?? [];
		return Array.isArray(n) ? n.some((n) => n.method === e && n.unit === t && n.options?.amountless === !0) : !1;
	}
}, Ds = {
	UNPAID: "UNPAID",
	PAID: "PAID",
	ISSUED: "ISSUED"
}, Os = {
	UNPAID: "UNPAID",
	PENDING: "PENDING",
	PAID: "PAID"
}, ks = {
	UNSPENT: "UNSPENT",
	PENDING: "PENDING",
	SPENT: "SPENT"
};
// src/transport/request.ts
function As(e) {
	return e.window !== void 0 && e.window.document !== void 0 || e.WorkerGlobalScope !== void 0 && e.self !== void 0 && e.self instanceof e.WorkerGlobalScope;
}
var js = As(globalThis);
function Ms(e, t, n = js) {
	return nc({
		Accept: "application/json, text/plain, */*",
		...e ? { "Content-Type": "application/json" } : void 0,
		...n ? void 0 : { "User-Agent": "Mozilla/5.0" }
	}, t);
}
function Ns(e, t) {
	return e instanceof Error ? e.message : t;
}
function Ps(e, t, n) {
	let r = e;
	for (;;) {
		let e = r.cause;
		if (!(e instanceof Error) || e === r) break;
		r = e;
	}
	let i = "";
	if (r instanceof Error && r !== e && r.message) {
		let e = r.code;
		i = ` (${r.message}${typeof e == "string" ? `, ${e}` : ""})`;
	}
	return `${Ns(e, t)}${i} at ${Fs(n)}`;
}
function Fs(e) {
	try {
		return new URL(e).origin;
	} catch {
		return e;
	}
}
function Is(e, t, n, r) {
	if (t?.signal.aborted) return new ne(`Request timed out after ${n}ms`, { cause: e });
	if (r?.aborted) return new w(Ns(e, "Request aborted by caller"));
}
async function Ls(e, t) {
	if (t?.aborted) throw new x("response body read aborted");
	let n = e.text();
	if (!t) return n;
	n.catch(() => void 0);
	let r, i = new Promise((e, n) => {
		r = () => n(new x("response body read aborted")), t.aborted ? r() : t.addEventListener("abort", r, { once: !0 });
	});
	i.catch(() => void 0);
	try {
		return await Promise.race([n, i]);
	} finally {
		r && t.removeEventListener("abort", r);
	}
}
function Rs(e) {
	if (e === null) return;
	let t = e.trim();
	if (t !== "") {
		if (/^\d+$/.test(t)) return Math.max(Number(t) * 1e3, 0);
		if (/[a-zA-Z]/.test(t)) {
			let e = new Date(t).getTime();
			if (!Number.isNaN(e)) return Math.max(e - Date.now(), 0);
		}
	}
}
var zs = {
	endpoint: !0,
	requestBody: !0,
	logger: !0,
	ttl: !0,
	cached_endpoints: !0,
	requestTimeout: !0,
	onResponseMeta: !0
}, Bs = {}, Vs = E;
function Hs(e) {
	Bs = e;
}
function Us(e) {
	Vs = e;
}
var Ws = 9, Gs = 1e3, Ks = 3e5, qs = 100, Js = ["blind-auth", "clear-auth"];
function Ys(e) {
	return e instanceof w || e instanceof ne ? !1 : e instanceof C || e instanceof S && e.status >= 500;
}
function Xs(e, t) {
	return t ? new Promise((n, r) => {
		if (t.aborted) {
			r(new w("Request aborted by caller"));
			return;
		}
		let i = () => {
			clearTimeout(a), t.removeEventListener("abort", i), r(new w("Request aborted by caller"));
		};
		t.addEventListener("abort", i, { once: !0 });
		let a = setTimeout(() => {
			t.removeEventListener("abort", i), n();
		}, e);
	}) : new Promise((t) => setTimeout(t, e));
}
function Zs(e) {
	try {
		return new URL(e).pathname;
	} catch {
		return e.startsWith("/") ? e.split(/[?#]/, 1)[0] : void 0;
	}
}
function Qs(e, t) {
	return e === t || e.endsWith(t);
}
async function $s(e) {
	let { ttl: t, cached_endpoints: n, endpoint: r } = e, i = e.logger ?? Vs;
	if (Object.keys(e.headers ?? {}).some((e) => e.toLowerCase() === "blind-auth")) return await ec(e);
	let a = Zs(r), o = e.method?.toUpperCase() ?? "GET";
	if (!(a !== void 0 && n?.some((e) => Qs(a, e.path) && e.method === o) && t)) return await ec(e);
	let s = 0, c = Date.now(), l = async () => {
		try {
			return await ec(e);
		} catch (n) {
			if (Ys(n)) {
				let r = Date.now() - c;
				if (s < Ws && (!t || r < t)) {
					let a = Math.min(2 ** s * qs, Gs) / 2, o = a + Math.random() * a;
					if (r + o > t) throw i.warn(`Network Error: request abandoned after ${s} retries`, {
						e: n,
						retries: s
					}), n;
					return s++, i.info(`Network Error: attempting retry ${s} in ${o}ms`, {
						e: n,
						retries: s,
						delay: o
					}), await Xs(o, e.signal), l();
				}
			}
			throw i.debug("Request failed and could not be retried", { e: n }), n;
		}
	};
	return l();
}
async function ec(e) {
	let { endpoint: t, requestBody: n, headers: r, requestTimeout: i, onResponseMeta: a, cached_endpoints: o, ttl: s, logger: c, ...l } = e, u = c ?? Vs, d = n ? A.stringify(n) : void 0, f = Ms(d, r), p = Object.keys(f).some((e) => Js.includes(e.toLowerCase())), m = e.signal ?? void 0;
	if (m?.aborted) throw new w("Request aborted by caller");
	let h = i !== void 0 && Number.isFinite(i) ? new AbortController() : void 0, g = m, _, v;
	if (h) {
		if (_ = setTimeout(() => h.abort(), i), !m) g = h.signal;
		else {
			let e = new AbortController(), t = () => e.abort();
			m.addEventListener("abort", t, { once: !0 }), h.signal.addEventListener("abort", t, { once: !0 }), v = () => {
				m.removeEventListener("abort", t), h.signal.removeEventListener("abort", t);
			}, g = e.signal;
		}
	}
	try {
		let e;
		try {
			e = await fetch(t, {
				body: d,
				headers: f,
				cache: "no-store",
				credentials: "omit",
				referrer: "",
				referrerPolicy: "no-referrer",
				...d === void 0 ? void 0 : { redirect: "error" },
				...l,
				...p ? { redirect: "error" } : void 0,
				signal: g
			});
		} catch (e) {
			let n = !!h?.signal.aborted, r = !!m?.aborted;
			throw n ? new C(`Request timed out after ${i}ms at ${Fs(t)}`, { cause: e }) : r ? new w(Ns(e, "Request aborted by caller")) : e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError") ? new C(Ps(e, e.message, t), { cause: e }) : new C(Ps(e, "Network request failed", t), { cause: e });
		}
		let n = Rs(e.headers.get("Retry-After"));
		if (a && e.headers && O(a, {
			endpoint: t,
			status: e.status,
			retryAfterMs: n,
			rateLimit: e.headers.get("RateLimit") ?? void 0,
			rateLimitPolicy: e.headers.get("RateLimit-Policy") ?? void 0,
			headers: e.headers
		}, u, {
			op: "request.onResponseMeta",
			status: e.status,
			endpoint: t
		}), !e.ok) {
			if (e.status === 429) {
				let t = e.body;
				throw t && typeof t.cancel == "function" && t.cancel().catch(() => void 0), new se("429 Too Many Requests", n);
			}
			let t, r;
			try {
				t = tc(await Ls(e, g));
			} catch (e) {
				let n = Is(e, h, i, m);
				if (n) throw n;
				r = e, t = { error: "bad response" };
			}
			if (e.status === 400 && "code" in t && typeof t.code == "number" && "detail" in t && typeof t.detail == "string") throw new ce(t.code, t.detail);
			let a = "HTTP request failed";
			throw "error" in t && typeof t.error == "string" ? a = t.error : "detail" in t && typeof t.detail == "string" && (a = t.detail), new S(a, e.status, { cause: r });
		}
		let r;
		try {
			r = await Ls(e, g);
		} catch (t) {
			throw Is(t, h, i, m) || (u.error("Failed to read HTTP response", { err: t }), new S("bad response", e.status, { cause: t }));
		}
		try {
			if (!r) throw new x("Empty response body");
			return A.parse(r, void 0, { strict: !0 });
		} catch (t) {
			throw u.error("Failed to parse HTTP response", { err: t }), new S("bad response", e.status, { cause: t });
		}
	} finally {
		clearTimeout(_), v?.();
	}
}
function tc(e) {
	if (!e) return { detail: "bad response" };
	let t;
	try {
		t = A.parse(e, void 0, { strict: !0 });
	} catch {
		return { detail: e };
	}
	return typeof t == "object" && t && ("detail" in t || "code" in t || "error" in t) ? t : { detail: t };
}
function nc(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of [e, t]) for (let [e, t] of Object.entries(r ?? {})) n.set(e.toLowerCase(), [e, t]);
	return Object.fromEntries(n.values());
}
async function rc(e) {
	let t = e.onResponseMeta, n = Bs.onResponseMeta, r = {
		...e,
		...Bs
	};
	for (let t of Object.keys(zs)) e[t] !== void 0 && (r[t] = e[t]);
	if (r.requestTimeout === void 0 && (r.requestTimeout = Ks), r.headers = nc(Bs.headers, e.headers), t && n && t !== n) {
		let i = r.logger ?? Vs;
		r.onResponseMeta = (r) => {
			O(t, r, i, {
				op: "request.onResponseMeta",
				scope: "per-request",
				endpoint: e.endpoint
			}), O(n, r, i, {
				op: "request.onResponseMeta",
				scope: "global",
				endpoint: e.endpoint
			});
		};
	}
	return await $s(r);
}
// src/transport/ws.ts
var ic;
typeof WebSocket < "u" && (ic = WebSocket);
function ac(e) {
	ic = e;
}
function oc() {
	if (ic === void 0) throw new x("WebSocket implementation not initialized");
	return ic;
}
// src/transport/WSConnection.ts
var sc = 1006, cc = class {
	constructor(e) {
		this.next = null, this.value = e;
	}
}, lc = class {
	constructor() {
		this._first = null, this._last = null, this.size = 0;
	}
	enqueue(e) {
		let t = new cc(e);
		return this._last ? this._last.next = t : this._first = t, this._last = t, this.size++, !0;
	}
	dequeue() {
		if (!this._first) return null;
		let e = this._first;
		return this._first = e.next, this._first || (this._last = null), this.size--, e.value;
	}
}, uc = class {
	constructor(e, t) {
		this.subListeners = {}, this.rpcListeners = {}, this.rpcId = 0, this.onCloseCallbacks = [], this._WS = oc(), this.url = new URL(e), this.messageQueue = new lc(), this._logger = t ?? E;
	}
	setLogger(e) {
		this._logger = e;
	}
	connect(e = 1e4) {
		return this.connectionPromise || (this.connectionPromise = new Promise((t, n) => {
			let r = !1, i = !1, a = null, o = (e) => {
				i || (i = !0, a && clearTimeout(a), this.abandonConnect = void 0, e());
			};
			this.abandonConnect = (e) => o(() => n(e));
			let s = (e) => {
				if (this.ws) {
					try {
						this.ws.onopen = null, this.ws.onerror = null, this.ws.onmessage = null, this.ws.onclose = null;
					} catch {}
					try {
						this.ws.close();
					} catch {}
					this.ws = void 0, this.stopMessageHandling(e);
				}
			}, c = (e) => {
				this.connectionPromise = void 0;
				let t = e instanceof Error ? e : new x(String(e), { cause: e });
				s(t), this.failPendingRpc(t), o(() => n(t));
			}, l;
			try {
				l = new this._WS(this.url.toString()), this.ws = l;
			} catch (e) {
				c(e);
				return;
			}
			let u = () => this.ws === l;
			a = setTimeout(() => {
				c(new x(`WebSocket connect timeout after ${e}ms`));
			}, e), l.onopen = () => {
				u() && (r = !0, o(t));
			}, l.onerror = (e) => {
				u() && (r ? this._logger.error("WebSocket error after open", { ev: e }) : c(new x("Failed to open WebSocket")));
			}, l.onmessage = (e) => {
				if (u()) {
					if (this.messageQueue.size >= 1e4) {
						this._logger.error("WebSocket message queue exceeded its bound, closing connection", { size: this.messageQueue.size });
						let e = new x("WebSocket message queue exceeded its bound");
						c(e), this.onCloseCallbacks.forEach((t) => t({
							code: sc,
							reason: e.message,
							wasClean: !1
						}));
					} else this.messageQueue.enqueue(e.data), this.handlingInterval || (this.handlingInterval = setInterval(this.handleNextMessage.bind(this), 0));
				}
			}, l.onclose = (e) => {
				if (this.ws && this.ws !== l) return;
				if (this.connectionPromise = void 0, !r) {
					let t = e?.reason ? `, ${e.reason}` : "";
					c(new x(`WebSocket closed before open (code ${e?.code ?? 0}${t})`));
					return;
				}
				let t = e?.reason ? `, ${e.reason}` : "", n = e?.code ?? 0, i = typeof e.wasClean != "boolean" || e.wasClean, a = new x(`WebSocket closed (code ${n}${t})`);
				this.stopMessageHandling(a), !i || n !== 1e3 && n !== 1001 ? this.failPendingRpc(a) : this.rpcListeners = {}, this.onCloseCallbacks.forEach((t) => t(e));
			};
		})), this.connectionPromise;
	}
	sendRequest(e, t) {
		if (this.ws?.readyState !== this._WS.OPEN) {
			if (e === "unsubscribe") return;
			throw this._logger.error("Attempted sendRequest, but socket was not open"), new x("Socket not open");
		}
		let n = this.rpcId;
		this.rpcId++, this.sendRpcMessage(e, t, n);
	}
	addSubListener(e, t, n) {
		(this.subListeners[e] = this.subListeners[e] || []).push({
			callback: t,
			errorCallback: n
		});
	}
	stopMessageHandling(e) {
		for (this.handlingInterval && (clearInterval(this.handlingInterval), this.handlingInterval = void 0); this.messageQueue.size > 0;) this.messageQueue.dequeue();
		let t = this.subListeners;
		this.subListeners = {};
		for (let n of Object.values(t)) for (let { errorCallback: t } of n) try {
			t?.(e);
		} catch {}
	}
	failPendingRpc(e) {
		let t = this.rpcListeners;
		this.rpcListeners = {};
		for (let n of Object.keys(t)) try {
			t[n].errorCallback(e);
		} catch {}
	}
	sendRpcMessage(e, t, n) {
		if (this.ws?.readyState !== this._WS.OPEN) throw new x("Socket not open");
		let r = JSON.stringify({
			jsonrpc: "2.0",
			method: e,
			params: t,
			id: n
		});
		try {
			this.ws.send(r);
		} catch (e) {
			this._logger.error("WebSocket send failed", { e }), this.connectionPromise = void 0;
			try {
				this.ws.close();
			} catch {}
			this.ws = void 0;
			let t = e instanceof Error ? e : new x(String(e), { cause: e });
			throw this.stopMessageHandling(t), this.failPendingRpc(t), t;
		}
	}
	addRpcListener(e, t, n) {
		this.rpcListeners[n] = {
			callback: e,
			errorCallback: t
		};
	}
	removeRpcListener(e) {
		delete this.rpcListeners[e];
	}
	removeListener(e, t) {
		this.subListeners[e] && (this.subListeners[e].length === 1 ? delete this.subListeners[e] : this.subListeners[e] = this.subListeners[e].filter((e) => e.callback !== t));
	}
	async ensureConnection(e) {
		this.ws?.readyState !== this._WS.OPEN && await this.connect(e);
	}
	handleNextMessage() {
		for (; this.messageQueue.size > 0;) {
			let e = this.messageQueue.dequeue();
			try {
				let t = A.parse(e, void 0, { strict: !0 });
				if ("result" in t && t.id != null) this.rpcListeners[t.id] && (this.rpcListeners[t.id].callback(), this.removeRpcListener(t.id));
				else if ("error" in t && t.id != null) this.rpcListeners[t.id] && (this.rpcListeners[t.id].errorCallback(new x(t.error.message)), this.removeRpcListener(t.id));
				else if ("method" in t && !("id" in t)) {
					let e = t.params?.subId;
					if (!e) continue;
					if (this.subListeners[e]?.length > 0) {
						let n = t;
						this.subListeners[e].forEach(({ callback: e }) => {
							try {
								let t = e(n.params?.payload);
								t && typeof t.then == "function" && Promise.resolve(t).catch((e) => {
									this._logger.error("Subscription handler threw", { e });
								});
							} catch (e) {
								this._logger.error("Subscription handler threw", { e });
							}
						});
					}
				}
			} catch (e) {
				this._logger.error("Error doing handleNextMessage", { e });
			}
		}
		this.handlingInterval && (clearInterval(this.handlingInterval), this.handlingInterval = void 0);
	}
	createSubscription(e, t, n) {
		if (this.ws?.readyState !== this._WS.OPEN) throw this._logger.error("Attempted createSubscription, but socket was not open"), new x("Socket is not open");
		let r = (Math.random() + 1).toString(36).substring(7), i = this.rpcId;
		this.addRpcListener(() => {
			this.addSubListener(r, t, n);
		}, n, i);
		try {
			this.sendRequest("subscribe", {
				...e,
				subId: r
			});
		} catch (e) {
			throw this.removeRpcListener(i), e;
		}
		return r;
	}
	cancelSubscription(e, t, n) {
		if (this.removeListener(e, t), this.ws?.readyState !== this._WS.OPEN) {
			this._logger.info("Socket not open, removed listener locally {subId}", { subId: e });
			return;
		}
		let r = this.rpcId;
		this.rpcId++, this.addRpcListener(() => {
			this._logger.info("Unsubscribed {subId}", { subId: e });
		}, n || ((e) => this._logger.info("Unsubscribe failed", { e })), r);
		try {
			this.sendRpcMessage("unsubscribe", { subId: e }, r);
		} catch (e) {
			throw this.removeRpcListener(r), e;
		}
	}
	get activeSubscriptions() {
		return Object.keys(this.subListeners);
	}
	close() {
		let e = new x("WebSocket closed");
		if (this.abandonConnect?.(e), this.ws) {
			try {
				this.ws.close();
			} catch {}
			this.ws = void 0;
		}
		this.connectionPromise = void 0, this.failPendingRpc(e), this.stopMessageHandling(e);
	}
	onClose(e) {
		this.onCloseCallbacks.push(e);
	}
};
// src/mint/ctfListing.ts
async function dc(e, t) {
	let n = /* @__PURE__ */ new Set(), r, i = 0;
	for (let a = 0; a < 100; a += 1) {
		let a = await e(r);
		if (i += a.items.length, a.items.length > 100 || i > 1e4) throw new x("Mint exceeded the CTF listing bound");
		if (a.next_cursor !== null) {
			if (n.has(a.next_cursor)) throw new x("Mint CTF pagination did not advance");
			n.add(a.next_cursor);
		}
		let o = a.items.find(t);
		if (o !== void 0) return o;
		if (a.next_cursor === null) return;
		r = a.next_cursor;
	}
	throw new x("Mint exceeded the CTF pagination bound");
}
// src/mint/Mint.ts
function $(e) {
	return Array.isArray(e) ? "array" : typeof e;
}
var fc = class {
	constructor(e, t) {
		this._lastResponseMetadata = void 0, this._captureResponseMetadata = (e) => {
			this._lastResponseMetadata = e;
		}, this._mintUrl = Xo(e), this._request = t?.customRequest ?? rc, this._authProvider = t?.authProvider, this._logger = t?.logger ?? E, Us(this._logger);
	}
	get mintUrl() {
		return this._mintUrl;
	}
	get lastResponseMetadata() {
		return this._lastResponseMetadata;
	}
	async oidcAuth(e) {
		let t = (await this.getLazyMintInfo()).nuts[21];
		if (!t?.openid_discovery) throw new x("Mint: no NUT-21 openid_discovery");
		return new Es(t.openid_discovery, {
			...e,
			clientId: e?.clientId ?? t.client_id ?? "cashu-client"
		});
	}
	async getInfo(e) {
		let t = await (e ?? this._request)({
			endpoint: J(this._mintUrl, "/v1/info"),
			onResponseMeta: this._captureResponseMetadata,
			logger: this._logger
		});
		return Q.normalizeInfo(t, this._logger);
	}
	async getLazyMintInfo(e) {
		if (this._mintInfo) return this._mintInfo;
		let t = await this.getInfo(e);
		return this._mintInfo = new Q(t, this._logger), this._mintInfo;
	}
	setMintInfo(e) {
		this._mintInfo = e instanceof Q ? e : new Q(e, this._logger);
	}
	async swap(e, t) {
		D(!Array.isArray(e?.inputs), "swap: inputs must be an array of proofs", this._logger);
		let n = e.inputs.some((e) => {
			try {
				return xi(e.secret)[0] === "PAY_TO_UNLOCK";
			} catch {
				return !1;
			}
		}) ? e.inputs : this.stripWalletFields(e.inputs), r = {
			...e,
			inputs: n.map((e) => typeof e.witness == "object" && e.witness !== null ? {
				...e,
				witness: JSON.stringify(e.witness)
			} : e)
		}, i = await this.requestWithAuth("POST", "/v1/swap", { requestBody: r }, t);
		if (!G(i) || !Array.isArray(i?.signatures)) throw this._logger.error("Invalid response from mint...", {
			shape: $(i),
			op: "swap"
		}), new x("Invalid response from mint");
		return this.assertSignatureCount(i.signatures, e.outputs, "swap"), i.signatures = this.normalizeSignatureAmounts(i.signatures), i;
	}
	async createMintQuote(e, t, n) {
		D(!this.isValidMethodString(e), `Invalid mint quote method: ${e}`, this._logger);
		let r = await this.requestWithAuth("POST", `/v1/mint/quote/${e}`, { requestBody: t }, n?.customRequest);
		return this.normalizeMintQuoteResponse(e, r, n?.normalize);
	}
	async createMintQuoteBolt11(e, t) {
		return this.createMintQuote("bolt11", {
			...e,
			amount: k.from(e.amount).toBigInt()
		}, { customRequest: t });
	}
	async createMintQuoteBolt12(e, t) {
		let n = { ...e };
		return e.amount !== void 0 && (n.amount = k.from(e.amount).toBigInt()), this.createMintQuote("bolt12", n, { customRequest: t });
	}
	async createMintQuoteOnchain(e, t) {
		return this.createMintQuote("onchain", e, { customRequest: t });
	}
	async checkMintQuote(e, t, n) {
		D(!this.isValidMethodString(e), `Invalid mint quote method: ${e}`, this._logger);
		let r = await this.requestWithAuth("GET", `/v1/mint/quote/${e}/${t}`, {}, n?.customRequest), i = this.normalizeMintQuoteResponse(e, r, n?.normalize);
		if (i.quote !== t) throw this._logger.error("Invalid response from mint...", { op: `checkMintQuote.${e}` }), new x("Mint quote response is for a different quote");
		return i;
	}
	async checkMintQuoteBolt11(e, t) {
		return this.checkMintQuote("bolt11", e, { customRequest: t });
	}
	async checkMintQuoteBolt12(e, t) {
		return this.checkMintQuote("bolt12", e, { customRequest: t });
	}
	async checkMintQuoteOnchain(e, t) {
		return this.checkMintQuote("onchain", e, { customRequest: t });
	}
	async checkMintQuoteBatch(e, t, n) {
		D(!this.isValidMethodString(e), `Invalid mint quote method: ${e}`, this._logger), D(t.length === 0, "checkMintQuoteBatch: no quote ids provided", this._logger), D(new Set(t).size !== t.length, "checkMintQuoteBatch: duplicate quote ids provided", this._logger);
		let r = await this.requestWithAuth("POST", `/v1/mint/quote/${e}/check`, { requestBody: { quotes: t } }, n?.customRequest);
		if (!Array.isArray(r) || r.length !== t.length) throw this._logger.error("Invalid response from mint...", {
			expectedCount: t.length,
			actualCount: Array.isArray(r) ? r.length : void 0,
			op: `checkMintQuoteBatch.${e}`
		}), new x("Invalid response from mint");
		return r.map((r, i) => {
			if (r.quote !== t[i]) throw this._logger.error("Invalid response from mint...", {
				index: i,
				op: `checkMintQuoteBatch.${e}`
			}), new x("Invalid response from mint");
			return this.normalizeMintQuoteResponse(e, r, n?.normalize);
		});
	}
	async checkMintQuoteBatchBolt11(e, t) {
		return this.checkMintQuoteBatch("bolt11", e, { customRequest: t });
	}
	async checkMintQuoteBatchBolt12(e, t) {
		return this.checkMintQuoteBatch("bolt12", e, { customRequest: t });
	}
	async mintBolt11(e, t) {
		return this.mint("bolt11", e, { customRequest: t });
	}
	async mintBolt12(e, t) {
		return this.mint("bolt12", e, { customRequest: t });
	}
	async mintOnchain(e, t) {
		return this.mint("onchain", e, { customRequest: t });
	}
	async mint(e, t, n) {
		D(!this.isValidMethodString(e), `Invalid mint method: ${e}`, this._logger);
		let r = await this.requestWithAuth("POST", `/v1/mint/${e}`, { requestBody: t }, n?.customRequest);
		if (!G(r) || !Array.isArray(r?.signatures)) throw this._logger.error("Invalid response from mint...", {
			shape: $(r),
			op: `mint.${e}`
		}), new x("Invalid response from mint");
		return this.assertSignatureCount(r.signatures, t.outputs, `mint.${e}`), r.signatures = this.normalizeSignatureAmounts(r.signatures), n?.normalize ? n.normalize(r) : r;
	}
	async mintBatchBolt11(e, t) {
		return this.mintBatch("bolt11", e, { customRequest: t });
	}
	async mintBatchBolt12(e, t) {
		return this.mintBatch("bolt12", e, { customRequest: t });
	}
	async mintBatch(e, t, n) {
		D(!this.isValidMethodString(e), `Invalid mint method: ${e}`, this._logger);
		let r = {
			...t,
			quote_amounts: t.quote_amounts.map((e) => k.from(e).toBigInt())
		}, i = await this.requestWithAuth("POST", `/v1/mint/${e}/batch`, { requestBody: r }, n?.customRequest);
		if (!G(i) || !Array.isArray(i?.signatures)) throw this._logger.error("Invalid response from mint...", {
			shape: $(i),
			op: `mintBatch.${e}`
		}), new x("Invalid response from mint");
		return this.assertSignatureCount(i.signatures, t.outputs, `mintBatch.${e}`), i.signatures = this.normalizeSignatureAmounts(i.signatures), n?.normalize ? n.normalize(i) : i;
	}
	async createMeltQuote(e, t, n) {
		D(!this.isValidMethodString(e), `Invalid melt quote method: ${e}`, this._logger);
		let r = await this.requestWithAuth("POST", `/v1/melt/quote/${e}`, { requestBody: t }, n?.customRequest);
		return this.normalizeMeltQuoteResponse(e, r, n?.normalize);
	}
	async createMeltQuoteBolt11(e, t) {
		let n = await this.createMeltQuote("bolt11", this.normalizeMeltQuoteRequestOptions(e), { customRequest: t });
		return D(n.request !== "" && n.request.toLowerCase() !== e.request.toLowerCase(), "Melt quote is for a different payment request", this._logger), n;
	}
	async createMeltQuoteBolt12(e, t) {
		return this.createMeltQuote("bolt12", this.normalizeMeltQuoteRequestOptions(e), { customRequest: t });
	}
	async createMeltQuoteOnchain(e, t) {
		return this.createMeltQuote("onchain", {
			...e,
			amount: k.from(e.amount).toBigInt()
		}, { customRequest: t });
	}
	async checkMeltQuote(e, t, n) {
		D(!this.isValidMethodString(e), `Invalid melt quote method: ${e}`, this._logger);
		let r = await this.requestWithAuth("GET", `/v1/melt/quote/${e}/${t}`, {}, n?.customRequest), i = this.normalizeMeltQuoteResponse(e, r, n?.normalize);
		if (i.quote !== t) throw this._logger.error("Invalid response from mint...", { op: `checkMeltQuote.${e}` }), new x("Melt quote response is for a different quote");
		return i;
	}
	async checkMeltQuoteBolt11(e, t) {
		return this.checkMeltQuote("bolt11", e, { customRequest: t });
	}
	async checkMeltQuoteBolt12(e, t) {
		return this.checkMeltQuote("bolt12", e, { customRequest: t });
	}
	async checkMeltQuoteOnchain(e, t) {
		return this.checkMeltQuote("onchain", e, { customRequest: t });
	}
	async melt(e, t, n) {
		D(!this.isValidMethodString(e), `Invalid melt method: ${e}`, this._logger), D(!Array.isArray(t?.inputs), "melt: inputs must be an array of proofs", this._logger);
		let r = await this.requestWithAuth("POST", `/v1/melt/${e}`, { requestBody: {
			...t,
			inputs: this.stripWalletFields(t.inputs)
		} }, n?.customRequest), i = this.normalizeMeltQuoteResponse(e, r, n?.normalize, !0);
		return i.quote !== t.quote && (this._logger.warn("Melt response reports a different quote id", {
			op: `melt.${e}`,
			expected: t.quote,
			received: i.quote
		}), i.quote = t.quote), i;
	}
	async meltBolt11(e, t) {
		return this.melt("bolt11", e, t);
	}
	async meltBolt12(e, t) {
		return this.melt("bolt12", e, t);
	}
	async meltOnchain(e, t) {
		return this.melt("onchain", e, t);
	}
	async check(e, t) {
		let n = await this.requestWithAuth("POST", "/v1/checkstate", { requestBody: e }, t);
		if (!G(n) || !Array.isArray(n?.states) || n.states.length > e.Ys.length) throw this._logger.error("Invalid response from mint...", {
			shape: $(n),
			op: "check"
		}), new x("Invalid response from mint");
		this.assertRecordEntries(n.states, "check");
		for (let e of n.states) q(e, "witness");
		return n;
	}
	async getKeys(e, t, n) {
		let r = t || this._mintUrl;
		e && (e = e.replace(/\//g, "_").replace(/\+/g, "-"));
		let i = await (n ?? this._request)({
			endpoint: e ? J(r, "/v1/keys", e) : J(r, "/v1/keys"),
			onResponseMeta: this._captureResponseMetadata,
			logger: this._logger
		});
		if (!G(i) || !Array.isArray(i.keysets)) throw this._logger.error("Invalid response from mint...", {
			shape: $(i),
			op: "getKeys"
		}), new x("Invalid response from mint");
		return this.assertKeysetList(i.keysets, "getKeys"), {
			...i,
			keysets: i.keysets.map((e) => ws(e))
		};
	}
	async getKeySets(e) {
		let t = await (e ?? this._request)({
			endpoint: J(this._mintUrl, "/v1/keysets"),
			onResponseMeta: this._captureResponseMetadata,
			logger: this._logger
		});
		if (!G(t) || !Array.isArray(t.keysets)) throw this._logger.error("Invalid response from mint...", {
			shape: $(t),
			op: "getKeySets"
		}), new x("Invalid response from mint");
		return this.assertKeysetList(t.keysets, "getKeySets"), {
			...t,
			keysets: t.keysets.map((e) => Cs(e))
		};
	}
	async restore(e, t) {
		let n = await (t ?? this._request)({
			endpoint: J(this._mintUrl, "/v1/restore"),
			method: "POST",
			requestBody: e,
			onResponseMeta: this._captureResponseMetadata,
			logger: this._logger
		});
		if (!G(n) || !Array.isArray(n?.outputs) || !Array.isArray(n?.signatures) || n.outputs.length !== n.signatures.length || n.outputs.length > e.outputs.length) throw this._logger.error("Invalid response from mint...", {
			shape: $(n),
			op: "restore"
		}), new x("Invalid response from mint");
		return n.outputs = this.normalizeMessageAmounts(n.outputs), n.signatures = this.normalizeSignatureAmounts(n.signatures), n;
	}
	async getConditionalKeysets(e = {}, t) {
		if (e.condition_id !== void 0 && (typeof e.condition_id != "string" || !/^[0-9a-f]{64}$/.test(e.condition_id))) throw new x("condition_id must be 64 lowercase hexadecimal characters");
		let n = new URLSearchParams();
		e.condition_id !== void 0 && n.set("condition_id", e.condition_id), e.since !== void 0 && n.set("since", String(e.since)), e.limit !== void 0 && n.set("limit", String(e.limit)), e.active !== void 0 && n.set("active", String(e.active)), e.cursor !== void 0 && n.set("cursor", e.cursor);
		let r = n.toString(), i = r ? `/v1/conditional_keysets?${r}` : "/v1/conditional_keysets", a = await this.requestWithAuth("GET", i, {}, t);
		if (!G(a) || !Array.isArray(a.keysets)) throw this._logger.error("Invalid response from mint...", {
			shape: $(a),
			op: "getConditionalKeysets"
		}), new x("Invalid response from mint");
		return {
			next_cursor: this.readCtfNextCursor(a.next_cursor),
			keysets: a.keysets.map((e) => ({
				...e,
				input_fee_ppk: Z(e.input_fee_ppk, "conditional_keyset.input_fee_ppk", void 0),
				final_expiry: Z(e.final_expiry, "conditional_keyset.final_expiry", void 0),
				registered_at: Z(e.registered_at, "conditional_keyset.registered_at", void 0)
			}))
		};
	}
	async getConditions(e = {}, t) {
		let n = new URLSearchParams();
		e.since !== void 0 && n.set("since", String(e.since)), e.limit !== void 0 && n.set("limit", String(e.limit));
		for (let t of e.status ?? []) n.append("status", t);
		e.cursor !== void 0 && n.set("cursor", e.cursor);
		let r = n.toString(), i = r ? `/v1/conditions?${r}` : "/v1/conditions", a = await this.requestWithAuth("GET", i, {}, t);
		if (!G(a) || !Array.isArray(a.conditions)) throw this._logger.error("Invalid response from mint...", {
			shape: $(a),
			op: "getConditions"
		}), new x("Invalid response from mint");
		return {
			...a,
			next_cursor: this.readCtfNextCursor(a.next_cursor)
		};
	}
	readCtfNextCursor(e) {
		if (e === null) return null;
		if (typeof e != "string" || e.length === 0 || e.length > 4096) throw new x("Mint returned an invalid CTF continuation cursor");
		return e;
	}
	async registerCondition(e, t) {
		let n = await this.requestWithAuth("POST", "/v1/conditions", { requestBody: { ...e } }, t);
		if (!G(n) || typeof n.condition_id != "string") throw this._logger.error("Invalid response from mint...", {
			shape: $(n),
			op: "registerCondition"
		}), new x("Invalid response from mint");
		return Array.isArray(n.change) && (n.change = this.normalizeSignatureAmounts(n.change)), n;
	}
	async getCtfCondition(e, t, n) {
		if (!/^[0-9a-fA-F]{64}$/.test(e)) throw new x("conditionId must be a 64-character hex string for CTF condition lookup");
		let r = e.toLowerCase(), i = t ?? this._request, a = n?.signal === void 0 ? t : (e) => i({
			...e,
			signal: n.signal
		}), o = await this.getCtfConditionResponse(r, a, n), s = o, c = this.normalizeCtfCondition(G(s.condition) ? s.condition : o);
		if (!G(c) || c.condition_id?.toLowerCase() !== r || !G(c.keysets)) throw this._logger.error("Invalid response from mint...", {
			shape: $(o),
			op: "getCtfCondition"
		}), new x(`Mint did not return condition ${r}`);
		return c;
	}
	normalizeCtfCondition(e) {
		if (G(e.keysets) || !Array.isArray(e.partitions)) return e;
		let t = {};
		for (let n of e.partitions) if (G(n) && G(n.keysets)) for (let [e, r] of Object.entries(n.keysets)) typeof r == "string" && (t[e] = r);
		return {
			...e,
			keysets: t
		};
	}
	async getCtfConditionResponse(e, t, n) {
		let r = new URLSearchParams();
		if (n?.include_oracle_sigs !== void 0) {
			if (typeof n.include_oracle_sigs != "boolean") throw new x("include_oracle_sigs must be a boolean");
			r.set("include_oracle_sigs", String(n.include_oracle_sigs));
		}
		let i = r.size === 0 ? "" : `?${r.toString()}`;
		try {
			return await this.requestWithAuth("GET", `/v1/conditions/${e}${i}`, {}, t);
		} catch (n) {
			if (!this.isConditionNotFound(n)) throw n;
			let r = await dc(async (e) => {
				let n = await this.getConditions({
					limit: 100,
					cursor: e
				}, t);
				return {
					items: n.conditions,
					next_cursor: n.next_cursor
				};
			}, (t) => t.condition_id?.toLowerCase() === e);
			if (!r) throw n;
			return r;
		}
	}
	isConditionNotFound(e) {
		return !!(e instanceof ce && e.code === 13021 || e instanceof x && /condition not found/i.test(e.message));
	}
	async ctfConvert(e, t) {
		let n = {
			...e,
			outputs: Object.fromEntries(Object.entries(e.outputs).map(([e, t]) => [e, this.toWireBlindedMessages(t)]))
		}, r = await this.requestWithAuth("POST", "/v1/ctf/convert", { requestBody: n }, t);
		if (!G(r) || !G(r.signatures)) throw this._logger.error("Invalid response from mint...", {
			shape: $(r),
			op: "ctfConvert"
		}), new x("Invalid response from mint");
		for (let [e, t] of Object.entries(r.signatures)) {
			if (!Array.isArray(t)) throw this._logger.error("Invalid response from mint...", {
				shape: $(r),
				op: "ctfConvert"
			}), new x(`Mint returned invalid CTF convert signatures for ${e}`);
			r.signatures[e] = this.normalizeSignatureAmounts(t);
		}
		return r;
	}
	async ctfSettle(e, t) {
		let n = await this.requestWithAuth("POST", "/v1/ctf/convert", { requestBody: { ...e } }, t);
		if (!G(n) || !Array.isArray(n.signatures)) throw this._logger.error("Invalid response from mint...", {
			shape: $(n),
			op: "ctfSettle"
		}), new x("Invalid response from mint");
		if (n.signatures.length !== e.participants.length) throw new x("Mint returned the wrong CTF settlement participant count");
		return n.signatures = n.signatures.map((t, n) => {
			if (!Array.isArray(t) || t.length !== e.participants[n].outputs.length) throw new x(`Mint returned the wrong CTF settlement signature count for participant ${n}`);
			let r = this.normalizeSignatureAmounts(t);
			return r.forEach((t, r) => {
				let i = e.participants[n].outputs[r];
				if (t.id !== i.id || !t.amount.equals(i.amount)) throw new x(`Mint returned a mismatched CTF settlement signature for participant ${n}`);
			}), r;
		}), n;
	}
	async redeemOutcome(e, t) {
		let n = {
			...e,
			outputs: this.toWireBlindedMessages(e.outputs)
		}, r = await this.requestWithAuth("POST", "/v1/redeem_outcome", { requestBody: n }, t);
		if (!G(r) || !Array.isArray(r.signatures)) throw this._logger.error("Invalid response from mint...", {
			shape: $(r),
			op: "redeemOutcome"
		}), new x("Invalid response from mint");
		return r.signatures = this.normalizeSignatureAmounts(r.signatures), r;
	}
	async connectWebSocket() {
		try {
			let e = new URL(this._mintUrl);
			e.pathname.endsWith("/") ? e.pathname += "v1/ws" : e.pathname += "/v1/ws", e.protocol = e.protocol === "https:" ? "wss:" : "ws:";
			let t = e.toString();
			this.ws || (this.ws = new uc(t, this._logger)), await this.ws.ensureConnection();
		} catch (e) {
			this._logger.error("Failed to connect to WebSocket...", { e });
			try {
				this.ws?.close();
			} catch {}
			throw this.ws = void 0, new x("Failed to connect to WebSocket...", { cause: e });
		}
	}
	disconnectWebSocket() {
		this.ws && this.ws.close();
	}
	get webSocketConnection() {
		return this.ws;
	}
	async handleClearAuth(e, t, n) {
		if (this._authProvider && (n ?? await this.getLazyMintInfo()).requiresClearAuthToken(e, t)) return this._authProvider.ensureCAT ? this._authProvider.ensureCAT() : this._authProvider.getCAT();
	}
	async handleBlindAuth(e, t, n) {
		if (this._authProvider && (n ?? await this.getLazyMintInfo()).requiresBlindAuthToken(e, t)) return await this._authProvider.getBlindAuthToken({
			method: e,
			path: t
		});
	}
	async requestWithAuth(e, t, n = {}, r) {
		let i = r ?? this._request, a = this._mintInfo;
		this._authProvider && (a = await this.getLazyMintInfo(r));
		let o = await this.handleBlindAuth(e, t, a), s = await this.handleClearAuth(e, t, a), c = {
			...n.headers ?? {},
			...o ? { "Blind-auth": o } : {},
			...s ? { "Clear-auth": s } : {}
		}, l = a?.isSupported(19);
		return i({
			...n,
			endpoint: J(this._mintUrl, t),
			method: e,
			headers: c,
			...o || s || n.requestBody ? { redirect: "error" } : {},
			...l?.supported && l.params ? l.params : {},
			onResponseMeta: this._captureResponseMetadata,
			logger: n.logger ?? this._logger
		});
	}
	normalizeMeltQuoteRequestOptions(e) {
		if (!e.options) return { ...e };
		let t = { ...e.options };
		return e.options.amountless && (t.amountless = { amount_msat: k.from(e.options.amountless.amount_msat).toBigInt() }), "mpp" in e.options && e.options.mpp && (t.mpp = { amount: k.from(e.options.mpp.amount).toBigInt() }), {
			...e,
			options: t
		};
	}
	isValidMethodString(e) {
		return !!(typeof e == "string" && /^[a-z0-9_-]+$/.test(e));
	}
	normalizeSignatureAmounts(e) {
		return this.assertRecordEntries(e, "signatures"), e.map((e) => ({
			...e,
			amount: k.from(e.amount)
		}));
	}
	normalizeMessageAmounts(e) {
		return this.assertRecordEntries(e, "outputs"), e.map((e) => ({
			...e,
			amount: k.from(e.amount)
		}));
	}
	toWireBlindedMessages(e) {
		return e.map((e) => ({
			...e,
			amount: k.from(e.amount).toNumber()
		}));
	}
	stripWalletFields(e) {
		return e.map((e) => {
			let { dleq: t, p2pk_e: n, ...r } = e;
			return r;
		});
	}
	assertRecordEntries(e, t) {
		if (!e.every((e) => K(e))) throw this._logger.error("Invalid response from mint...", {
			entries: e.length,
			op: t
		}), new x("Invalid response from mint");
	}
	assertSignatureCount(e, t, n) {
		if (!(e.length <= t.length)) throw this._logger.error("Invalid response from mint...", {
			signatures: e.length,
			outputs: t.length,
			op: n
		}), new x(`Invalid response from mint: ${e.length} signatures, expected ${t.length}. The operation may already have been applied; if the wallet is seeded, try restoring (NUT-09) to recover.`);
	}
	assertKeysetList(e, t) {
		if (e.length > 1e4) throw this._logger.error("Invalid response from mint...", {
			keysets: e.length,
			op: t
		}), new x("Invalid response from mint");
		this.assertRecordEntries(e, t);
	}
	normalizeMintQuoteResponse(e, t, n) {
		let r = `${e} mint quote`;
		if (!K(t)) throw this._logger.error("Invalid response from mint...", {
			type: $(t),
			op: r
		}), new x("Invalid response from mint");
		let i = { ...t };
		return this.normalizeMintBaseFields(i), e === "bolt11" ? this.normalizeMintQuoteBolt11Fields(i) : e === "bolt12" ? this.normalizeMintQuoteBolt12Fields(i) : e === "onchain" && this.normalizeMintQuoteOnchainFields(i), n ? n(i) : i;
	}
	normalizeMintBaseFields(e) {
		e.amount_paid != null && e.amount_issued != null && (e.amount_paid = k.from(e.amount_paid), e.amount_issued = k.from(e.amount_issued)), e.updated_at = Z(e.updated_at, "mintQuote.updated_at", null);
	}
	deriveMintQuoteState(e, t) {
		return e.isZero() && t.isZero() ? Ds.UNPAID : e.greaterThan(t) ? Ds.PAID : Ds.ISSUED;
	}
	normalizeMintQuoteBolt11Fields(e) {
		e.amount = k.from(e.amount), e.expiry = Z(e.expiry, "mintQuoteBolt11.expiry", null), (typeof e.state != "string" || !Object.values(Ds).includes(e.state)) && e.amount_paid instanceof k && e.amount_issued instanceof k && (e.state = this.deriveMintQuoteState(e.amount_paid, e.amount_issued));
	}
	normalizeMintQuoteBolt12Fields(e) {
		q(e, "amount"), e.amount = e.amount === null ? null : k.from(e.amount), e.expiry = Z(e.expiry, "mintQuoteBolt12.expiry", null), e.amount_paid = k.from(e.amount_paid), e.amount_issued = k.from(e.amount_issued);
	}
	normalizeMintQuoteOnchainFields(e) {
		e.expiry = Z(e.expiry, "mintQuoteOnchain.expiry", null), e.amount_paid = k.from(e.amount_paid), e.amount_issued = k.from(e.amount_issued);
	}
	normalizeMeltQuoteResponse(e, t, n, r = !1) {
		let i = `${e} melt quote`;
		if (!K(t)) throw this._logger.error("Invalid response from mint...", {
			type: $(t),
			op: i
		}), new x("Invalid response from mint");
		let a = { ...t };
		return r && ((a.request == null || a.request === "") && delete a.request, a.fee_reserve ?? delete a.fee_reserve), this.normalizeMeltBaseFields(a, i), e === "bolt11" || e === "bolt12" ? this.normalizeMeltBoltFields(a, e, i, r) : e === "onchain" && this.normalizeMeltOnchainFields(a, r), n ? n(a) : a;
	}
	normalizeMeltBaseFields(e, t) {
		if (e.amount = k.from(e.amount), e.expiry = Z(e.expiry, "meltQuote.expiry", void 0), e.change) {
			if (!Array.isArray(e.change) || e.change.length > 1024) throw this._logger.error("Invalid response from mint...", {
				type: $(e.change),
				op: t
			}), new x("Invalid response from mint");
			e.change = this.normalizeSignatureAmounts(e.change);
		}
		if (!G(e) || typeof e.quote != "string" || !(e.amount instanceof k) || typeof e.unit != "string" || typeof e.state != "string" || typeof e.expiry != "number" || !Object.values(Os).includes(e.state)) throw this._logger.error("Invalid response from mint...", { op: t }), new x("Invalid response from mint");
	}
	normalizeMeltBoltFields(e, t, n, r) {
		let i = (t) => r && e[t] === void 0;
		if (!i("fee_reserve") && e.fee_reserve != null && (e.fee_reserve = k.from(e.fee_reserve)), typeof e.request != "string" && !i("request") || !(e.fee_reserve instanceof k) && !i("fee_reserve")) throw this._logger.error("Invalid response from mint...", { op: n }), new x("Invalid response from mint");
		q(e, "payment_preimage"), t === "bolt11" && typeof e.payment_preimage == "string" && typeof e.request == "string" && (e.payment_preimage = Ss(e.request, e.payment_preimage, this._logger, n));
	}
	normalizeMeltOnchainFields(e, t) {
		if (t && e.fee_options === void 0) q(e, "selected_fee_index", "outpoint");
		else if (!Array.isArray(e.fee_options) || e.fee_options.length === 0 || e.fee_options.length > 1024 || (e.fee_options = e.fee_options.map((e) => {
			let t = e;
			if (!Number.isSafeInteger(t.fee_index)) throw this._logger.error("Invalid response from mint...", { op: "onchain melt quote" }), new x("Invalid response from mint");
			return {
				...t,
				fee_index: t.fee_index,
				fee_reserve: k.from(t.fee_reserve),
				estimated_blocks: t.estimated_blocks
			};
		}), q(e, "selected_fee_index", "outpoint"), typeof e.request != "string" || e.selected_fee_index !== null && !Number.isSafeInteger(e.selected_fee_index) || e.outpoint !== null && typeof e.outpoint != "string")) throw this._logger.error("Invalid response from mint...", { op: "onchain melt quote" }), new x("Invalid response from mint");
	}
}, pc = class e {
	constructor(e, t, n, r, i, a) {
		this._keys = {}, this._id = e, this._unit = t, this._active = n, this._input_fee_ppk = r, this._final_expiry = i, this._conditional = a;
	}
	get id() {
		return this._id;
	}
	get unit() {
		return this._unit;
	}
	get isActive() {
		return this._active;
	}
	get fee() {
		return this._input_fee_ppk ?? 0;
	}
	get expiry() {
		return this._final_expiry;
	}
	get hasKeys() {
		return Object.keys(this._keys).length > 0;
	}
	get conditional() {
		return this._conditional;
	}
	get isConditional() {
		return !!this._conditional;
	}
	get hasHexId() {
		return W(this._id);
	}
	get version() {
		return this.hasHexId ? i(this._id)[0] : -1;
	}
	get keys() {
		return this._keys;
	}
	set keys(e) {
		this._keys = e;
	}
	toMintKeyset() {
		return {
			id: this._id,
			unit: this._unit,
			active: this._active,
			input_fee_ppk: this._input_fee_ppk,
			final_expiry: this._final_expiry,
			conditional: this._conditional
		};
	}
	toMintKeys() {
		return this.hasKeys ? {
			id: this._id,
			unit: this._unit,
			active: this._active,
			input_fee_ppk: this._input_fee_ppk,
			final_expiry: this._final_expiry,
			conditional: this._conditional,
			keys: this._keys
		} : null;
	}
	verify() {
		return this.hasKeys ? this._conditional ? e.verifyConditionalKeysetId(this.toMintKeys(), this._conditional) : e.verifyKeysetId(this.toMintKeys()) : !1;
	}
	static verifyKeysetId(e) {
		try {
			dn(e.keys);
			let t = ct(e.id) && !W(e.id), n = W(e.id) ? i(e.id)[0] : 0;
			return qo(e.keys, {
				input_fee_ppk: e.input_fee_ppk,
				expiry: e.final_expiry,
				unit: e.unit,
				versionByte: n,
				isDeprecatedBase64: t
			}) === e.id;
		} catch {
			return !1;
		}
	}
	static verifyConditionalKeysetId(e, t) {
		try {
			return !e.keys || Object.keys(e.keys).length === 0 || mc(t.conditionId, t.outcomeCollection) !== t.outcomeCollectionId.toLowerCase() ? !1 : fn({
				keys: e.keys,
				input_fee_ppk: e.input_fee_ppk,
				final_expiry: e.final_expiry,
				unit: e.unit,
				conditionId: t.conditionId,
				outcomeCollectionId: t.outcomeCollectionId
			}) === e.id;
		} catch {
			return !1;
		}
	}
	static fromMintApi(t, n) {
		let r = Cs(t), i = n ? ws(n) : void 0, a = new e(r.id, r.unit, r.active, r.input_fee_ppk, r.final_expiry, r.conditional);
		if (i) {
			if (i.id !== r.id) throw new x(`Mismatched keyset ids: meta=${r.id}, keys=${i.id}`);
			if (i.unit !== r.unit) throw new x(`Mismatched keyset units: meta=${r.unit}, keys=${i.unit}`);
			if (i.final_expiry !== void 0 && r.final_expiry !== void 0 && i.final_expiry !== r.final_expiry) throw new x(`Mismatched keyset expiry for id=${r.id}`);
			a.keys = i.keys;
		}
		return a;
	}
};
function mc(t, n) {
	if (!/^[0-9a-fA-F]{64}$/.test(t)) throw new x("conditionId must be a 64-character hex string");
	let a = e(o("Cashu_outcome_collection_id"));
	return M(e(r(a, a, i(t), o(n)))).toHex(!1).slice(2, 66);
}
// src/wallet/KeyChain.ts
var hc = class e {
	assertInitialized() {
		D(Object.keys(this.keysets).length === 0, "KeyChain not initialized", this._logger);
	}
	constructor(e, t, n = E) {
		this.keysets = Object.create(null), this.pendingKeyFetches = /* @__PURE__ */ new Map(), this.generation = 0, this.refreshSeq = 0, this.mint = typeof e == "string" ? new fc(e) : e, this.unit = t, this._logger = n;
	}
	static fromCache(t, n, r, i) {
		let a = new e(t, n, i);
		return a.loadFromCache(r), a;
	}
	static mintToCacheDTO(e, t, n) {
		let r = new Map(n.map((e) => [e.id, e]));
		return {
			keysets: t.map((e) => {
				let t = r.get(e.id), n = { ...e };
				return t && (n.keys = { ...t.keys }), n;
			}),
			mintUrl: e,
			savedAt: Date.now()
		};
	}
	static cacheToMintDTO(e) {
		return {
			keysets: e.keysets.map((e) => ({
				id: e.id,
				unit: e.unit,
				active: e.active,
				input_fee_ppk: e.input_fee_ppk,
				final_expiry: e.final_expiry,
				conditional: e.conditional
			})),
			keys: e.keysets.filter((e) => !!e.keys).map((e) => ({
				id: e.id,
				unit: e.unit,
				active: e.active,
				input_fee_ppk: e.input_fee_ppk,
				final_expiry: e.final_expiry,
				conditional: e.conditional,
				keys: { ...e.keys }
			}))
		};
	}
	async init(e) {
		if (Object.keys(this.keysets).length > 0 && !e) return;
		let t = ++this.refreshSeq, [n, r] = await Promise.all([this.mint.getKeySets(), this.mint.getKeys()]);
		t === this.refreshSeq ? (this.buildKeychain(n.keysets, r.keysets), this.savedAt = Date.now()) : this._logger.debug("Discarding keychain refresh superseded by a later one", { seq: t });
	}
	loadFromCache(t) {
		let n;
		try {
			n = Xo(String(t.mintUrl));
		} catch {
			n = void 0;
		}
		n !== this.mint.mintUrl && this._logger.warn(`KeyChain cache is for a different mint: ${n ?? "unknown"} (expected ${this.mint.mintUrl}). This will become an error in cashu-ts v5.`, {
			cacheMintUrl: t.mintUrl,
			mintUrl: this.mint.mintUrl
		});
		let { keysets: r, keys: i } = e.cacheToMintDTO(t);
		this.buildKeychain(r, i), this.savedAt = t.savedAt;
	}
	buildKeychain(e, t) {
		let n = this.keysets, r = Object.create(null), i = new Map(t.map((e) => [e.id, e]));
		for (let t of e) {
			let e = i.get(t.id), a = e ? pc.fromMintApi(t, e) : pc.fromMintApi(t);
			a.verify() || (a.hasKeys && this._logger.warn("Discarding keys that do not derive their keyset id", { id: a.id }), a.keys = {});
			let o = n[t.id];
			!a.hasKeys && o?.hasKeys && o.unit === a.unit && (a.keys = { ...o.keys }, a.verify() || (this._logger.warn("Dropping carried keys: fresh metadata no longer derives the keyset id", { id: a.id }), a.keys = {})), r[a.id] = a;
		}
		this.keysets = r, this.generation++;
	}
	getKeyset(e) {
		let t = e ? this.keysets[e] : this.getCheapestKeyset();
		return de(t, `Keyset '${e}' not found`, this._logger, { keysetId: e }), t;
	}
	getCheapestKeyset() {
		this.assertInitialized();
		let e = Object.values(this.keysets).filter((e) => !e.isConditional && e.unit === this.unit && e.isActive && e.hasHexId), t = e.filter((e) => e.hasKeys && e.version <= 1);
		if (t.length === 0) {
			let t = e.filter((e) => e.version > 1);
			if (t.length > 0) {
				let e = Math.min(...t.map((e) => e.version));
				ue(`No supported keyset for unit: ${this.unit}. The mint's active keysets are ${Go(e)} or later; this build of cashu-ts supports up to ${Go(1)}. Upgrade to spend on this mint.`, this._logger, {
					unit: this.unit,
					lowestVersionByte: e,
					supported: 1
				});
			}
			ue(`No active keyset found for unit: ${this.unit}`, this._logger, { unit: this.unit });
		}
		let n = 2 ** 53 - 1;
		return t.sort((e, t) => t.version - e.version || e.fee - t.fee || (t.expiry ?? n) - (e.expiry ?? n))[0];
	}
	async ensureKeysetKeys(e) {
		let t = this.keysets[e];
		if (de(t, `Keyset '${e}' not found`, this._logger, { keysetId: e }), Ko(t.id, this._logger), t.hasKeys) return t;
		let n = this.pendingKeyFetches.get(e);
		if (n) return await n;
		let r = (async () => {
			let n = this.generation, r = (await this.mint.getKeys(e)).keysets.find((t) => t.id === e);
			D(!r || !r.keys || Object.keys(r.keys).length === 0, `Mint returned no keys for keyset '${e}'`, this._logger, { keysetId: e });
			let i = t.toMintKeyset(), a = pc.fromMintApi(i, r);
			if (D(!a.verify(), `Keyset verification failed for ID ${e}`, this._logger, { keysetId: e }), this.generation !== n) {
				this._logger.debug("Keychain refreshed during key fetch; returning the live keyset", { id: e });
				let t = this.keysets[e];
				return de(t, `Keyset '${e}' not found`, this._logger, { keysetId: e }), t;
			}
			return this.keysets[e] = a, a;
		})();
		this.pendingKeyFetches.set(e, r);
		try {
			return await r;
		} finally {
			this.pendingKeyFetches.delete(e);
		}
	}
	registerConditionalKeyset(e, t) {
		let n = t ? pc.fromMintApi(e, t) : pc.fromMintApi(e);
		if (n.hasKeys && !n.verify()) throw new x(`Conditional keyset verification failed for ID ${e.id}`);
		return this.keysets[n.id] = n, n;
	}
	async loadConditionalKeyset(e) {
		let t = this.keysets[e];
		if (t?.isConditional && t.hasKeys) return t;
		let n = this.pendingKeyFetches.get(e);
		if (n) return await n;
		let r = (async () => {
			let t = await dc(async (e) => {
				let t = await this.mint.getConditionalKeysets({
					limit: 100,
					cursor: e
				});
				return {
					items: t.keysets,
					next_cursor: t.next_cursor
				};
			}, (t) => t.id === e);
			if (!t) throw new x(`Conditional keyset '${e}' not found`);
			let n = {
				conditionId: t.condition_id,
				outcomeCollection: t.outcome_collection,
				outcomeCollectionId: t.outcome_collection_id,
				registeredAt: t.registered_at
			}, r = {
				id: t.id,
				unit: t.unit,
				active: t.active,
				input_fee_ppk: t.input_fee_ppk,
				final_expiry: t.final_expiry,
				conditional: n
			}, i = (await this.mint.getKeys(e)).keysets.find((t) => t.id === e);
			if (!i || !i.keys || Object.keys(i.keys).length === 0) throw new x(`Mint returned no keys for conditional keyset '${e}'`);
			return this.registerConditionalKeyset(r, {
				...i,
				conditional: n
			});
		})();
		this.pendingKeyFetches.set(e, r);
		try {
			return await r;
		} finally {
			this.pendingKeyFetches.delete(e);
		}
	}
	getConditionalKeyset(e) {
		let t = this.keysets[e];
		if (!t || !t.isConditional) throw new x(`Conditional keyset '${e}' not found`);
		return t;
	}
	hasConditionalKeyset(e) {
		return !!this.keysets[e]?.isConditional;
	}
	getKeysets() {
		this.assertInitialized();
		let e = Object.values(this.keysets).filter((e) => !e.isConditional && e.unit === this.unit);
		return D(e.length === 0, `No keysets found for unit: ${this.unit}`, this._logger, { unit: this.unit }), e;
	}
	isUnitKeyset(e) {
		if (!e) return !1;
		let t = this.keysets[e];
		return t !== void 0 && t.unit === this.unit;
	}
	hasKeyset(e) {
		return !!e && this.keysets[e] !== void 0;
	}
	getAllKeys() {
		return this.assertInitialized(), Object.values(this.keysets).map((e) => e.toMintKeys()).filter((e) => e !== null);
	}
	getAllKeysetIds() {
		return this.assertInitialized(), Object.keys(this.keysets);
	}
	get cache() {
		let t = Object.values(this.keysets), n = t.map((e) => e.toMintKeyset()), r = t.map((e) => e.toMintKeys()).filter((e) => e !== null), i = e.mintToCacheDTO(this.mint.mintUrl, n, r);
		return i.savedAt = this.savedAt, i;
	}
};
// src/wallet/P2PKBuilder.ts
function gc(e) {
	return e instanceof Date ? Math.floor(e.getTime() / 1e3) : Math.floor(e < 0xe8d4a51000 ? e : e / 1e3);
}
var _c = class e {
	constructor() {
		this.lockKeys = [], this.refundKeys = [], this.extraTags = [];
	}
	addMainPubkey(e) {
		let t = Array.isArray(e) ? e : [e];
		return this.lockKeys = Hi([...this.lockKeys, ...t]), this;
	}
	addLockPubkey(e) {
		return this.addMainPubkey(e);
	}
	addRefundPubkey(e) {
		let t = Array.isArray(e) ? e : [e];
		return this.refundKeys = Hi([...this.refundKeys, ...t]), this;
	}
	lockUntil(e) {
		return this.locktime = gc(e), this;
	}
	requireMainSignatures(e) {
		if (!Number.isInteger(e) || e < 1) throw new x(`requiredSignatures (n_sigs) must be a positive integer, got ${e}`);
		return this.nSigs = e, this;
	}
	requireLockSignatures(e) {
		return this.requireMainSignatures(e);
	}
	requireRefundSignatures(e) {
		if (!Number.isInteger(e) || e < 1) throw new x(`requiredRefundSignatures (n_sigs_refund) must be a positive integer, got ${e}`);
		return this.nSigsRefund = e, this;
	}
	addTag(e, t) {
		_n(e);
		let n = t === void 0 ? [] : Array.isArray(t) ? t : [t];
		return this.extraTags.push([e, ...n.map(String)]), this;
	}
	addTags(e) {
		for (let [t, ...n] of e) this.addTag(t, n);
		return this;
	}
	blindKeys() {
		return this._blindKeys = !0, this;
	}
	sigAll() {
		return this.sigFlag = "SIG_ALL", this;
	}
	addHashlock(e) {
		return this.hashlock = e, this;
	}
	toOptions() {
		let e = this.lockKeys, t = this.refundKeys;
		if (e.length === 0 && !this.hashlock) throw new x("At least one lock pubkey is required");
		let n = {
			pubkey: e.length === 1 ? e[0] : e,
			...this.locktime === void 0 ? {} : { locktime: this.locktime },
			...t.length ? { refundKeys: t } : {},
			...this.nSigs !== void 0 && (this.nSigs > 1 || e.length === 0) ? { requiredSignatures: this.nSigs } : {},
			...this.nSigsRefund !== void 0 && (this.nSigsRefund > 1 || t.length === 0) ? { requiredRefundSignatures: this.nSigsRefund } : {},
			...this.extraTags.length ? { additionalTags: this.extraTags.slice() } : {},
			...this._blindKeys ? { blindKeys: !0 } : {},
			...this.sigFlag == "SIG_ALL" ? { sigFlag: "SIG_ALL" } : {},
			...this.hashlock ? { hashlock: this.hashlock } : {}
		};
		return I.createSingleP2PKData(n, 1, "deedbeef"), n;
	}
	static fromOptions(t) {
		let n = new e();
		if (t.refundKeys !== void 0 && !Array.isArray(t.refundKeys)) throw new x("refundKeys must be an array of pubkeys");
		if (t.blindKeys !== void 0 && typeof t.blindKeys != "boolean") throw new x("blindKeys must be a boolean");
		let r = Array.isArray(t.pubkey) ? t.pubkey : [t.pubkey];
		return n.addMainPubkey(r), t.locktime !== void 0 && n.lockUntil(t.locktime), t.refundKeys?.length && n.addRefundPubkey(t.refundKeys), t.requiredSignatures !== void 0 && n.requireMainSignatures(t.requiredSignatures), t.requiredRefundSignatures !== void 0 && n.requireRefundSignatures(t.requiredRefundSignatures), t.additionalTags?.length && n.addTags(t.additionalTags), t.blindKeys && n.blindKeys(), t.sigFlag == "SIG_ALL" && n.sigAll(), t.hashlock && n.addHashlock(t.hashlock), n;
	}
}, vc = _c;
// src/wallet/SelectProofs.ts
function yc(e, t, n, r = !1, i = !1, a = E) {
	let o = X(e), s = k.from(t), c = s.toBigInt(), l = Ee(), u = null, d = null, f = 0n, p = 0n, m = (e) => {
		let t;
		try {
			t = n.getKeyset(e.id).fee;
		} catch (t) {
			let r = `Could not get fee. No keyset found for keyset id: ${e.id}`;
			throw a.error(r, {
				error: t,
				keychain: n.getKeysets()
			}), new x(r, { cause: t });
		}
		return D(!n.isUnitKeyset(e.id), `Proof has unrecognised keyset. '${e.id}' is not a keyset for this wallet unit`, a, { id: e.id }), BigInt(t);
	}, h = (e, t) => e - (r ? (t + 999n) / 1000n : 0n), g = (e) => {
		let t = [...e];
		for (let e = t.length - 1; e > 0; e--) {
			let n = Math.floor(Math.random() * (e + 1));
			[t[e], t[n]] = [t[n], t[e]];
		}
		return t;
	}, _ = (e, t, n) => {
		let r = 0, i = e.length - 1, a = null;
		for (; r <= i;) {
			let o = Math.floor((r + i) / 2), s = e[o].exFee;
			(n ? s <= t : s >= t) ? (a = o, n ? r = o + 1 : i = o - 1) : n ? i = o - 1 : r = o + 1;
		}
		return n ? a : r < e.length ? r : null;
	}, v = (e, t) => {
		let n = t.exFee, r = 0, i = e.length;
		for (; r < i;) {
			let t = Math.floor((r + i) / 2);
			e[t].exFee < n ? r = t + 1 : i = t;
		}
		e.splice(r, 0, t);
	}, y = (e, t) => h(e, t) < c ? null : 1000n * e + t - 1000n * c, b = 0n, ee = 0n, te = /* @__PURE__ */ new Set(), S = o.map((e, t) => {
		D(te.has(e.secret), `Duplicate proof at index ${t}: each proof may appear only once`, a, { index: t }), te.add(e.secret);
		let n = m(e), i = e.amount.toBigInt(), o = r ? i - n / 1000n : i, s = {
			proof: e,
			amountBig: i,
			exFee: o,
			ppkfee: n
		};
		return (!r || o > 0n) && (b += i, ee += n), s;
	}), C = r ? S.filter((e) => e.exFee > 0n) : S;
	if (C.sort((e, t) => e.exFee < t.exFee ? -1 : +(e.exFee > t.exFee)), C.length > 0) {
		let e;
		if (i) {
			let t = _(C, c + 1n, !0);
			e = t === null ? 0 : t + 1;
		} else {
			let t = _(C, c + 1n, !1);
			if (t !== null) {
				let n = C[t].exFee, r = _(C, n, !0);
				de(r, "Unexpected null rightIndex in binary search", a), e = r + 1;
			} else e = C.length;
		}
		for (let t = e; t < C.length; t++) b -= C[t].amountBig, ee -= C[t].ppkfee;
		C = C.slice(0, e);
	}
	let w = h(b, ee);
	if (s.isZero() || c > w) return {
		keep: o,
		send: []
	};
	let ne = c < w ? c : w;
	for (let e = 0; e < 60; e++) {
		let t = [], n = 0n, r = 0n;
		for (let e of g(C)) {
			let a = n + e.amountBig, o = r + e.ppkfee, s = h(a, o);
			if (i && s > c || (t.push(e), n = a, r = o, s >= c)) break;
		}
		let o = new Set(t), s = C.filter((e) => !o.has(e)), m = g(Array.from({ length: t.length }, (e, t) => t)).slice(0, 5e3);
		for (let e of m) {
			let a = h(n, r);
			if (a === c || !i && a >= c && a <= ne) break;
			let o = t[e], l = n - o.amountBig, u = r - o.ppkfee, d = c - h(l, u), f = _(s, d, i);
			if (f !== null) {
				let a = s[f];
				(!i || a.exFee > o.exFee) && (d >= 0n || a.exFee <= o.exFee) && (t[e] = a, n = l + a.amountBig, r = u + a.ppkfee, s.splice(f, 1), v(s, o));
			}
		}
		let b = y(n, r);
		if (b !== null && (d === null || b < d)) {
			a.debug(`selectProofsToSend: best solution found in trial #${e} - amount: ${n}, delta: ${b}`), u = [...t].sort((e, t) => t.exFee < e.exFee ? -1 : +(t.exFee > e.exFee)), d = b, f = n, p = r;
			let i = [...u];
			for (; i.length > 1 && d > 0n;) {
				let e = i.pop(), t = n - e.amountBig, a = r - e.ppkfee, o = y(t, a);
				if (o === null) break;
				o < d && (u = [...i], d = o, f = t, p = a, n = t, r = a);
			}
		}
		if (u && d !== null) {
			let e = h(f, p);
			if (e === c || !i && e >= c && e <= ne) break;
		}
		if (l.elapsed() > 1e3) {
			D(i, "Proof selection took too long. Try again with a smaller proof set.", a), a.warn("Proof selection took too long. Returning best selection so far.");
			break;
		}
	}
	if (u && d !== null) {
		let e = u.map((e) => e.proof), t = new Set(e), n = o.filter((e) => !t.has(e));
		return a.info(`Proof selection took ${l.elapsed()}ms`), {
			keep: n,
			send: e
		};
	}
	return {
		keep: o,
		send: []
	};
}
function bc(e, t, n, r = !1, i = !1, a = E) {
	let o = X(e), s = k.from(t), c = s.toBigInt(), l = (e, t) => e - (r ? (t + 999n) / 1000n : 0n), u = (e) => {
		let t = new Set(e.map((e) => e.secret));
		return {
			keep: o.filter((e) => !t.has(e.secret)),
			send: e
		};
	}, d = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Map();
	for (let [e, t] of o.entries()) {
		D(d.has(t.secret), `Duplicate proof at index ${e}: each proof may appear only once`, a, { index: e }), d.add(t.secret);
		let r = n.getKeyset(t.id);
		D(!n.isUnitKeyset(t.id), `Proof has unrecognised keyset. '${t.id}' is not a keyset for this wallet unit`, a, { id: t.id });
		let i = (r.hasHexId ? parseInt(t.id.slice(0, 2), 16) + 1 : 0) * 2 + +!!r.isActive, o = f.get(i) ?? {
			proofs: [],
			gross: 0n,
			ppk: 0n
		};
		o.proofs.push(t), o.gross += t.amount.toBigInt(), o.ppk += BigInt(r.fee), f.set(i, o);
	}
	let p = [...f.keys()].sort((e, t) => e - t);
	if (s.isZero() || p.length <= 1) return yc(o, s, n, r, i, a);
	let m = [], h = 0n, g = 0n, _ = 0;
	for (; _ < p.length; _++) {
		let e = f.get(p[_]), t = l(h + e.gross, g + e.ppk);
		if (t > c) break;
		for (let t of e.proofs) m.push(t);
		if (h += e.gross, g += e.ppk, t === c) return u(m);
	}
	if (_ < p.length) {
		let e = c - l(h, g), t = f.get(p[_]).proofs, o = p.slice(_ + 1).flatMap((e) => f.get(e).proofs), s = o.length ? [t, t.concat(o)] : [t];
		for (let t of s) {
			let o;
			try {
				o = yc(t, e, n, r, i, a);
			} catch (e) {
				a.debug("selectProofsRotating: biased attempt failed", { error: e });
				continue;
			}
			if (o.send.length === 0) continue;
			let s = h, d = g;
			for (let e of o.send) s += e.amount.toBigInt(), d += BigInt(n.getKeyset(e.id).fee);
			let f = l(s, d);
			if (i ? f === c : f >= c) return u(m.concat(o.send));
		}
	}
	return yc(o, s, n, r, i, a);
}
// src/wallet/SwapPreview.ts
function xc(e) {
	return {
		...e,
		amount: e.amount.toString()
	};
}
function Sc(e) {
	return {
		amount: e.amount.toString(),
		fees: e.fees.toString(),
		keysetId: e.keysetId,
		inputs: e.inputs.map(xc),
		...e.sendOutputs && { sendOutputs: e.sendOutputs.map((e) => I.serialize(e)) },
		...e.keepOutputs && { keepOutputs: e.keepOutputs.map((e) => I.serialize(e)) }
	};
}
function Cc(e) {
	try {
		return {
			amount: k.from(e.amount),
			fees: k.from(e.fees),
			keysetId: e.keysetId,
			inputs: X(e.inputs),
			...e.sendOutputs && { sendOutputs: e.sendOutputs.map((e) => I.deserialize(e)) },
			...e.keepOutputs && { keepOutputs: e.keepOutputs.map((e) => I.deserialize(e)) }
		};
	} catch (e) {
		throw new x(`Invalid SerializedSwapPreview: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
	}
}
// src/model/OutputDataCreator.ts
var wc = class e {
	createP2PKData(t, n, r, i) {
		if (this.createSingleP2PKData === e.prototype.createSingleP2PKData) return I.createP2PKData(t, n, r, i);
		let a = U(n, r.keys, i), o = t.blindKeys && t.sigFlag === "SIG_ALL" ? Jt() : void 0, s = a.map((e) => this.createSingleP2PKData(t, e, r.id, o));
		if (o && new Set(s.map((e) => e.ephemeralE)).size > 1) throw new x("createSingleP2PKData override must reuse the shared eBytes ephemeral key for a SIG_ALL split");
		return s;
	}
	createSingleP2PKData(e, t, n, r) {
		return I.createSingleP2PKData(e, t, n, r);
	}
	createRandomData(e, t, n) {
		return U(e, t.keys, n).map((e) => this.createSingleRandomData(e, t.id));
	}
	createSingleRandomData(e, t) {
		return I.createSingleRandomData(e, t);
	}
	createDeterministicData(t, n, r, i, a) {
		if (this.createSingleDeterministicData === e.prototype.createSingleDeterministicData) return I.createDeterministicData(t, n, r, i, a);
		let o = U(t, i.keys, a), s = r + (o.length - 1);
		if (!Number.isSafeInteger(r) || r < 0 || o.length > 0 && !Number.isSafeInteger(s)) throw new x("Counter must be an integer in the range 0 <= counter <= 2^53 - 1");
		return o.map((e, t) => this.createSingleDeterministicData(e, n, r + t, i.id));
	}
	createSingleDeterministicData(e, t, n, r) {
		return I.createSingleDeterministicData(e, t, n, r);
	}
};
// src/wallet/_internal.ts
function Tc(e) {
	return e <= 1n ? 0 : (e - 1n).toString(2).length;
}
function Ec(e) {
	let t = Object.keys(e).map((e) => k.from(e));
	return t.sort((e, t) => e.compareTo(t)), t;
}
function Dc(e) {
	if (e > 8192) throw new x(`Cannot split amount: optimized split would exceed ${fe} outputs`);
}
function Oc(e, t, n, r) {
	let i = k.from(t), a = [], o = k.zero(), s = e.map((e) => e.amount);
	for (let e of Ec(n)) {
		let t = s.filter((t) => e.equals(t)).length, n = Math.max(r - t, 0);
		for (let t = 0; t < n; ++t) {
			let t = o.add(e);
			if (t.greaterThan(i)) break;
			Dc(a.length + 1), a.push(e), o = t;
		}
	}
	let c = i.subtract(o);
	if (!c.isZero()) {
		let e = U(c, n);
		Dc(a.length + e.length);
		for (let t of e) a.push(t), o = o.add(t);
	}
	return a.sort((e, t) => e.compareTo(t));
}
function kc(e) {
	switch (e.type) {
		case "custom": return JSON.stringify({
			type: "custom",
			outputs: e.data.length,
			amounts: e.data.map((e) => e.blindedMessage.amount.toString())
		});
		case "factory": return JSON.stringify({
			type: "factory",
			denominations: (e.denominations ?? []).map((e) => k.from(e).toString())
		});
		case "deterministic": return JSON.stringify({
			type: "deterministic",
			counter: e.counter,
			denominations: (e.denominations ?? []).map((e) => k.from(e).toString())
		});
		case "p2pk": {
			let t = e.options, n = t.blindKeys ? {
				...t,
				pubkey: Array.isArray(t.pubkey) ? t.pubkey.map(() => "[redacted]") : "[redacted]",
				refundKeys: t.refundKeys?.map(() => "[redacted]")
			} : t;
			return JSON.stringify({
				type: "p2pk",
				options: n,
				denominations: (e.denominations ?? []).map((e) => k.from(e).toString())
			});
		}
		case "random": return JSON.stringify({
			type: "random",
			denominations: (e.denominations ?? []).map((e) => k.from(e).toString())
		});
		default: return "Unknown";
	}
}
// src/wallet/CounterSource.ts
function Ac(e) {
	return e.length === 12 ? e : W(e) ? e.toLowerCase() : e;
}
function jc(e, t) {
	if (!Number.isSafeInteger(t)) throw new x(`Reservation for counter key ${e} would take the cursor to ${t}, outside the safe integer range`);
}
var Mc = class {
	constructor(e) {
		if (this.next = /* @__PURE__ */ new Map(), this.locks = /* @__PURE__ */ new Map(), e) for (let [t, n] of Object.entries(e)) {
			let e = Ac(t);
			jc(e, n), this.next.set(e, Math.max(this.next.get(e) ?? 0, n));
		}
	}
	async withLock(e, t) {
		let n = Ac(e), r = this.locks.get(n) ?? Promise.resolve(), i, a = new Promise((e) => i = e), o = r.then(() => a);
		this.locks.set(n, o);
		try {
			return await r, await t(n);
		} finally {
			i(), this.locks.get(n) === o && this.locks.delete(n);
		}
	}
	async reserve(e, t) {
		if (t < 0) throw new x("reserve called with negative count");
		return this.withLock(e, (e) => {
			let n = this.next.get(e) ?? 0;
			return t === 0 ? {
				start: n,
				count: 0
			} : (jc(e, n + t), this.next.set(e, n + t), {
				start: n,
				count: t
			});
		});
	}
	async reserveAt(e, t, n) {
		if (t < 0 || n < 0) throw new x("reserveAt called with a negative start or count");
		return this.withLock(e, (e) => {
			let r = this.next.get(e) ?? 0;
			if (t < r) throw new x(`Counter ${t} for counter key ${e} was already issued (next is ${r})`);
			return jc(e, t + n), this.next.set(e, t + n), {
				start: t,
				count: n
			};
		});
	}
	async advanceToAtLeast(e, t) {
		await this.withLock(e, (e) => {
			t > (this.next.get(e) ?? 0) && (jc(e, t), this.next.set(e, t));
		});
	}
	async setNext(e, t) {
		await this.withLock(e, (e) => {
			if (t < 0) throw new x("setNext: negative next not allowed");
			jc(e, t), this.next.set(e, t);
		});
	}
	snapshot() {
		return Promise.resolve(Object.fromEntries(this.next.entries()));
	}
};
function Nc(e) {
	return new Mc(e);
}
// src/wallet/WalletCounters.ts
var Pc = class {
	constructor(e) {
		this.src = e;
	}
	async peekNext(e) {
		return (await this.src.reserve(e, 0)).start;
	}
	async advanceToAtLeast(e, t) {
		await this.src.advanceToAtLeast(e, t);
	}
	async setNext(e, t) {
		if (typeof this.src.setNext == "function") await this.src.setNext(e, t);
		else throw new x("CounterSource does not support setNext()");
	}
	async snapshot() {
		if (typeof this.src.snapshot == "function") return await this.src.snapshot();
		throw new x("CounterSource does not support snapshot()");
	}
};
// src/wallet/WalletEvents.ts
function Fc() {}
function Ic(e) {
	let t = /* @__PURE__ */ new WeakSet();
	try {
		return JSON.stringify(e, (e, n) => {
			if (typeof n == "object" && n) {
				if (t.has(n)) return "[Circular]";
				t.add(n);
			}
			return n;
		});
	} catch {
		return Object.prototype.toString.call(e);
	}
}
function Lc(e) {
	return {
		...e,
		...e.amount != null && { amount: k.from(e.amount) },
		...e.amount_paid != null && { amount_paid: k.from(e.amount_paid) },
		...e.amount_issued != null && { amount_issued: k.from(e.amount_issued) }
	};
}
function Rc(e, t) {
	let n = {
		...e,
		...e.amount != null && { amount: k.from(e.amount) },
		...e.fee_reserve != null && { fee_reserve: k.from(e.fee_reserve) },
		...e.change && { change: e.change.map((e) => ({
			...e,
			amount: k.from(e.amount)
		})) }
	};
	return q(n, "payment_preimage"), typeof n.payment_preimage == "string" && typeof n.request == "string" && (n.payment_preimage = Ss(n.request, n.payment_preimage, t, "bolt11 melt quote update")), n;
}
function zc(e) {
	return e instanceof Error ? e : new x(typeof e == "string" ? e : Ic(e), { cause: e });
}
function Bc() {
	let e = /* @__PURE__ */ Error("Aborted");
	return Object.defineProperty(e, "name", { value: "AbortError" }), e;
}
function Vc(e) {
	e && Promise.resolve(e).then((e) => {
		try {
			e();
		} catch {}
	}).catch(() => {});
}
var Hc = class {
	constructor(e) {
		this.wallet = e, this.countersReservedHandlers = /* @__PURE__ */ new Set(), this.keychainUpdatedHandlers = /* @__PURE__ */ new Set();
	}
	withAbort(e, t) {
		if (!e) return t;
		if (e.aborted) return t(), Fc;
		let n = () => t();
		return e.addEventListener("abort", n, { once: !0 }), () => {
			e.removeEventListener("abort", n), t();
		};
	}
	waitUntilPaid(e, t, n, r = "Timeout waiting for paid") {
		return new Promise((i, a) => {
			let o = null, s = null, c = !1, l = (e) => {
				c || (c = !0, Vc(o), s && (clearTimeout(s), s = null), n?.signal && n.signal.removeEventListener("abort", u), e && a(zc(e)));
			}, u = () => l(Bc());
			if (n?.signal) {
				if (n.signal.aborted) return u();
				n.signal.addEventListener("abort", u, { once: !0 });
			}
			n?.timeoutMs && n.timeoutMs > 0 && (s = setTimeout(() => l(new x(r)), n.timeoutMs)), o = e(t, (e) => {
				l(), i(e);
			}, (e) => l(e), { signal: n?.signal }), o.catch((e) => l(e));
		});
	}
	countersReserved(e, t) {
		return this.countersReservedHandlers.add(e), this.withAbort(t?.signal, () => this.countersReservedHandlers.delete(e));
	}
	_emitCountersReserved(e) {
		for (let t of this.countersReservedHandlers) O(t, e, this.wallet.logger, { event: "countersReserved" });
	}
	keychainUpdated(e, t) {
		return this.keychainUpdatedHandlers.add(e), this.withAbort(t?.signal, () => this.keychainUpdatedHandlers.delete(e));
	}
	_emitKeychainUpdated() {
		if (this.keychainUpdatedHandlers.size === 0) return;
		let e = { cache: this.wallet.keyChain.cache };
		for (let t of this.keychainUpdatedHandlers) O(t, e, this.wallet.logger, { event: "keychainUpdated" });
	}
	async mintQuoteUpdates(e, t, n, r) {
		if (r?.signal?.aborted || (await this.wallet.mint.connectWebSocket(), r?.signal?.aborted)) return Fc;
		let i = this.wallet.mint.webSocketConnection;
		if (!i) throw new x("Failed to establish WebSocket connection.");
		let a = Array.from(new Set(e)), o = (e) => {
			let r;
			try {
				r = Lc(e);
			} catch (e) {
				n(zc(e));
				return;
			}
			O(t, r, this.wallet.logger, { event: "bolt11_mint_quote" });
		}, s = i.createSubscription({
			kind: "bolt11_mint_quote",
			filters: a
		}, o, n);
		return this.withAbort(r?.signal, () => i.cancelSubscription(s, o));
	}
	async mintQuotePaid(e, t, n, r) {
		return this.mintQuoteUpdates([e], (e) => {
			e.state === Ds.PAID && t(e);
		}, n, r);
	}
	async meltQuoteUpdates(e, t, n, r) {
		if (r?.signal?.aborted || (await this.wallet.mint.connectWebSocket(), r?.signal?.aborted)) return Fc;
		let i = this.wallet.mint.webSocketConnection;
		if (!i) throw new x("Failed to establish WebSocket connection.");
		let a = Array.from(new Set(e)), o = (e) => {
			let r;
			try {
				r = Rc(e, this.wallet.logger);
			} catch (e) {
				n(zc(e));
				return;
			}
			O(t, r, this.wallet.logger, { event: "bolt11_melt_quote" });
		}, s = i.createSubscription({
			kind: "bolt11_melt_quote",
			filters: a
		}, o, n);
		return this.withAbort(r?.signal, () => i.cancelSubscription(s, o));
	}
	async meltQuotePaid(e, t, n, r) {
		return this.meltQuoteUpdates([e], (e) => {
			e.state === Os.PAID && t(e);
		}, n, r);
	}
	async proofStateUpdates(e, t, n, r) {
		if (r?.signal?.aborted) return Fc;
		for (let t of e) Ko(t.id, this.wallet.logger);
		if (await this.wallet.mint.connectWebSocket(), r?.signal?.aborted) return Fc;
		let i = this.wallet.mint.webSocketConnection;
		if (!i) throw new x("Failed to establish WebSocket connection.");
		let a = new TextEncoder(), o = Object.create(null);
		for (let t of e) {
			let e = M(a.encode(t.secret)).toHex(!0);
			if (o[e]) throw new x("Duplicate proof secret in proofStateUpdates input");
			o[e] = t;
		}
		let s = Object.keys(o), c = (e) => {
			let n = o[e.Y];
			n && O(t, {
				...e,
				proof: n
			}, this.wallet.logger, { event: "proof_state" });
		}, l = i.createSubscription({
			kind: "proof_state",
			filters: s
		}, c, n);
		return this.withAbort(r?.signal, () => i.cancelSubscription(l, c));
	}
	onceMintPaid(e, t) {
		return this.waitUntilPaid(this.mintQuotePaid.bind(this), e, t, "Timeout waiting for mint paid");
	}
	onceAnyMintPaid(e, t) {
		return new Promise((n, r) => {
			let i = Array.from(new Set(e)), a = /* @__PURE__ */ new Map(), o = null, s = null, c = !1, l = !1, u = (e) => {
				if (!l) {
					l = !0;
					for (let e of a.values()) Vc(e);
					a.clear(), o && (clearTimeout(o), o = null), t?.signal && t.signal.removeEventListener("abort", d), e && r(zc(e));
				}
			}, d = () => u(Bc());
			if (t?.signal) {
				if (t.signal.aborted) return d();
				t.signal.addEventListener("abort", d, { once: !0 });
			}
			if (t?.timeoutMs && t.timeoutMs > 0 && (o = setTimeout(() => u(new x("Timeout waiting for any mint paid")), t.timeoutMs)), i.length === 0) return u(new x("No quote ids provided"));
			for (let e of i) {
				let r = this.mintQuotePaid(e, (t) => {
					u(), n({
						id: e,
						quote: t
					});
				}, (n) => {
					if (t?.failOnError) {
						u(n);
						return;
					}
					s = n;
					let r = a.get(e);
					r && (Vc(r), a.delete(e)), c && a.size === 0 && u(s ?? new x("No subscriptions remaining"));
				});
				a.set(e, r), r.catch((n) => {
					if (t?.failOnError) {
						u(n);
						return;
					}
					s = n;
					let r = a.get(e);
					r && (Vc(r), a.delete(e)), c && a.size === 0 && u(s ?? new x("No subscriptions remaining"));
				});
			}
			c = !0;
		});
	}
	onceMeltPaid(e, t) {
		return this.waitUntilPaid(this.meltQuotePaid.bind(this), e, t, "Timeout waiting for melt paid");
	}
	proofStatesStream(e, t) {
		return async function* () {
			let n = [], r = !1, i = null, a = t?.maxBuffer && t.maxBuffer > 0 ? t.maxBuffer : Infinity, o = t?.drop ?? "oldest", s = () => {
				let e = i;
				i = null, e && e();
			}, c = (e) => {
				if (n.length >= a) {
					if (o === "oldest") {
						let r = n.shift();
						if (r !== void 0) try {
							t?.onDrop?.(r);
						} catch {}
						n.push(e);
					} else {
						try {
							t?.onDrop?.(e);
						} catch {}
						return;
					}
				} else n.push(e);
				s();
			}, l = null, u = this.proofStateUpdates(e, c, () => {
				r = !0, s();
			}, { signal: t?.signal });
			u.catch((e) => {
				l = zc(e), r = !0, s();
			});
			let d = () => {
				r = !0, s();
			};
			try {
				for (t?.signal && (t.signal.aborted ? d() : t.signal.addEventListener("abort", d, { once: !0 })); !r || n.length;) {
					for (; n.length;) yield n.shift();
					if (r) break;
					await new Promise((e) => i = e);
				}
				if (l) throw l;
			} finally {
				Vc(u), t?.signal && t.signal.removeEventListener("abort", d);
			}
		}.call(this);
	}
	group() {
		let e = [], t = !1, n = (() => {
			if (!t) for (t = !0; e.length;) Vc(e.pop());
		});
		return n.add = (n) => t ? (Vc(n), n) : (e.push(n), n), Object.defineProperty(n, "cancelled", {
			get: () => t,
			enumerable: !0
		}), n;
	}
}, Uc = class {
	constructor(e) {
		this.wallet = e;
	}
	send(e, t) {
		return new Wc(this.wallet, e, t);
	}
	receive(e) {
		return new Gc(this.wallet, e);
	}
	mintBolt11(e, t) {
		return new Kc(this.wallet, "bolt11", e, t);
	}
	mintBolt12(e, t) {
		return new Kc(this.wallet, "bolt12", e, t);
	}
	mintOnchain(e, t) {
		return new Kc(this.wallet, "onchain", e, t);
	}
	meltBolt11(e, t) {
		return new qc(this.wallet, "bolt11", e, t);
	}
	meltBolt12(e, t) {
		return new qc(this.wallet, "bolt12", e, t);
	}
	meltOnchain(e, t) {
		return new Jc(this.wallet, e, t);
	}
}, Wc = class {
	constructor(e, t, n) {
		this.wallet = e, this.proofs = n, this.config = {}, this.amount = k.from(t);
	}
	asRandom(e) {
		return this.sendOT = {
			type: "random",
			denominations: e
		}, this;
	}
	asDeterministic(e = 0, t) {
		return this.sendOT = {
			type: "deterministic",
			counter: e,
			denominations: t
		}, this;
	}
	asLocked(e, t) {
		let n = e instanceof _c ? e.toOptions() : e;
		return this.sendOT = {
			type: "p2pk",
			options: n,
			denominations: t
		}, this;
	}
	asP2PK(e, t) {
		return this.asLocked(e, t);
	}
	asFactory(e, t) {
		return this.sendOT = {
			type: "factory",
			factory: e,
			denominations: t
		}, this;
	}
	asCustom(e) {
		return this.sendOT = {
			type: "custom",
			data: e
		}, this;
	}
	keepAsRandom(e) {
		return this.keepOT = {
			type: "random",
			denominations: e
		}, this;
	}
	keepAsDeterministic(e = 0, t) {
		return this.keepOT = {
			type: "deterministic",
			counter: e,
			denominations: t
		}, this;
	}
	keepAsLocked(e, t) {
		let n = e instanceof _c ? e.toOptions() : e;
		return this.keepOT = {
			type: "p2pk",
			options: n,
			denominations: t
		}, this;
	}
	keepAsP2PK(e, t) {
		return this.keepAsLocked(e, t);
	}
	keepAsFactory(e, t) {
		return this.keepOT = {
			type: "factory",
			factory: e,
			denominations: t
		}, this;
	}
	keepAsCustom(e) {
		return this.keepOT = {
			type: "custom",
			data: e
		}, this;
	}
	includeFees(e = !0) {
		return this.config.includeFees = e, this;
	}
	keyset(e) {
		return this.config.keysetId = e, this;
	}
	privkey(e) {
		return this.config.privkey = e, this;
	}
	proofsWeHave(e) {
		return this.config.proofsWeHave = e, this;
	}
	onCountersReserved(e) {
		return this.config.onCountersReserved = e, this;
	}
	offlineExactOnly(e = !1) {
		return this.offlineExact = { requireDleq: e }, this;
	}
	offlineCloseMatch(e = !1) {
		return this.offlineClose = { requireDleq: e }, this;
	}
	async prepare() {
		if (this.offlineExact || this.offlineClose) throw new x("Offline selection has nothing to prepare; call run() instead, or drop the offline mode for an online swap.");
		let e = {
			send: this.sendOT ?? this.wallet.defaultOutputType(),
			...this.keepOT ? { keep: this.keepOT } : {}
		};
		return this.wallet.prepareSwapToSend(this.amount, this.proofs, this.config, e);
	}
	async run() {
		if ((this.offlineExact || this.offlineClose) && (this.sendOT || this.keepOT)) throw new x("Offline selection cannot be combined with custom output types. Remove send/keep output configuration, or use an online swap.");
		if (this.offlineExact) return this.config.privkey && (this.proofs = this.wallet.signP2PKProofs(this.proofs, this.config.privkey)), this.wallet.sendOffline(this.amount, this.proofs, {
			includeFees: this.config.includeFees,
			exactMatch: !0,
			requireDleq: this.offlineExact.requireDleq
		});
		if (this.offlineClose) return this.config.privkey && (this.proofs = this.wallet.signP2PKProofs(this.proofs, this.config.privkey)), this.wallet.sendOffline(this.amount, this.proofs, {
			includeFees: this.config.includeFees,
			exactMatch: !1,
			requireDleq: this.offlineClose.requireDleq
		});
		let e = {
			send: this.sendOT ?? this.wallet.defaultOutputType(),
			...this.keepOT ? { keep: this.keepOT } : {}
		};
		return this.wallet.send(this.amount, this.proofs, this.config, e);
	}
}, Gc = class {
	constructor(e, t) {
		this.wallet = e, this.token = t, this.config = {};
	}
	asRandom(e) {
		return this.outputType = {
			type: "random",
			denominations: e
		}, this;
	}
	asDeterministic(e = 0, t) {
		return this.outputType = {
			type: "deterministic",
			counter: e,
			denominations: t
		}, this;
	}
	asLocked(e, t) {
		let n = e instanceof _c ? e.toOptions() : e;
		return this.outputType = {
			type: "p2pk",
			options: n,
			denominations: t
		}, this;
	}
	asP2PK(e, t) {
		return this.asLocked(e, t);
	}
	asFactory(e, t) {
		return this.outputType = {
			type: "factory",
			factory: e,
			denominations: t
		}, this;
	}
	asCustom(e) {
		return this.outputType = {
			type: "custom",
			data: e
		}, this;
	}
	keyset(e) {
		return this.config.keysetId = e, this;
	}
	requireDleq(e = !0) {
		return this.config.requireDleq = e, this;
	}
	privkey(e) {
		return this.config.privkey = e, this;
	}
	proofsWeHave(e) {
		return this.config.proofsWeHave = e, this;
	}
	onCountersReserved(e) {
		return this.config.onCountersReserved = e, this;
	}
	async prepare() {
		return this.wallet.prepareSwapToReceive(this.token, this.config, this.outputType);
	}
	async run() {
		return this.wallet.receive(this.token, this.config, this.outputType);
	}
}, Kc = class {
	constructor(e, t, n, r) {
		this.wallet = e, this.method = t, this.quote = r, this.config = {}, this.amount = k.from(n), this._hasPrivkey;
	}
	asRandom(e) {
		return this.outputType = {
			type: "random",
			denominations: e
		}, this;
	}
	asDeterministic(e = 0, t) {
		return this.outputType = {
			type: "deterministic",
			counter: e,
			denominations: t
		}, this;
	}
	asLocked(e, t) {
		let n = e instanceof _c ? e.toOptions() : e;
		return this.outputType = {
			type: "p2pk",
			options: n,
			denominations: t
		}, this;
	}
	asP2PK(e, t) {
		return this.asLocked(e, t);
	}
	asFactory(e, t) {
		return this.outputType = {
			type: "factory",
			factory: e,
			denominations: t
		}, this;
	}
	asCustom(e) {
		return this.outputType = {
			type: "custom",
			data: e
		}, this;
	}
	keyset(e) {
		return this.config.keysetId = e, this;
	}
	privkey(e) {
		return this.config.privkey = e, this;
	}
	proofsWeHave(e) {
		return this.config.proofsWeHave = e, this;
	}
	onCountersReserved(e) {
		return this.config.onCountersReserved = e, this;
	}
	async prepare() {
		if (this.method === "bolt11") {
			let e = this.quote, t = typeof e == "string" ? await this.wallet.checkMintQuoteBolt11(e) : e;
			if (this.wallet.validateMintQuote(t), t.pubkey && !this.config.privkey) throw new x("privkey is required for locked BOLT11 mint quotes");
			return this.wallet.prepareMint(this.method, this.amount, t, this.config, this.outputType);
		}
		if (this.method === "bolt12") {
			let e = this.quote;
			if (this.wallet.validateMintQuote(e), !this.config.privkey) throw new x("privkey is required for BOLT12 mint quotes");
			return this.wallet.prepareMint(this.method, this.amount, e, this.config, this.outputType);
		}
		let e = this.quote;
		if (this.wallet.validateMintQuote(e), !this.config.privkey) throw new x("privkey is required for onchain mint quotes");
		return this.wallet.prepareMint(this.method, this.amount, e, this.config, this.outputType);
	}
	async run() {
		let e = await this.prepare();
		return this.wallet.completeMint(e);
	}
}, qc = class {
	constructor(e, t, n, r) {
		this.wallet = e, this.method = t, this.quote = n, this.proofs = r, this.config = {};
	}
	asRandom(e) {
		return this.outputType = {
			type: "random",
			denominations: e
		}, this;
	}
	asDeterministic(e = 0, t) {
		return this.outputType = {
			type: "deterministic",
			counter: e,
			denominations: t
		}, this;
	}
	asLocked(e, t) {
		let n = e instanceof _c ? e.toOptions() : e;
		return this.outputType = {
			type: "p2pk",
			options: n,
			denominations: t
		}, this;
	}
	asP2PK(e, t) {
		return this.asLocked(e, t);
	}
	asFactory(e, t) {
		return this.outputType = {
			type: "factory",
			factory: e,
			denominations: t
		}, this;
	}
	asCustom(e) {
		return this.outputType = {
			type: "custom",
			data: e
		}, this;
	}
	keyset(e) {
		return this.config.keysetId = e, this;
	}
	privkey(e) {
		return this.config.privkey = e, this;
	}
	onCountersReserved(e) {
		return this.config.onCountersReserved = e, this;
	}
	async prepare() {
		return await this.wallet.prepareMelt(this.method, this.quote, this.proofs, this.config, this.outputType);
	}
	async run() {
		let e = await this.wallet.prepareMelt(this.method, this.quote, this.proofs, this.config, this.outputType);
		return this.wallet.completeMelt(e, this.config.privkey);
	}
}, Jc = class {
	constructor(e, t, n) {
		this.wallet = e, this.quote = t, this.proofs = n, this.config = {};
	}
	keyset(e) {
		return this.config.keysetId = e, this;
	}
	privkey(e) {
		return this.config.privkey = e, this;
	}
	feeIndex(e) {
		return this.selectedFeeIndex = e, this;
	}
	async run() {
		if (this.selectedFeeIndex === void 0 && this.quote.fee_options.length === 1 && (this.selectedFeeIndex = this.quote.fee_options[0].fee_index), this.selectedFeeIndex === void 0) throw new x("feeIndex is required when an onchain melt quote has multiple fee options");
		return this.wallet.meltProofsOnchain(this.quote, this.proofs, this.selectedFeeIndex, this.config);
	}
}, Yc = "__PENDING__", Xc = 20008, Zc = class e {
	constructor(e, t) {
		this._seed = void 0, this._unit = "sat", this._mintInfo = void 0, this._denominationTarget = 3, this._secretsPolicy = "auto", this._boundKeysetId = Yc, this._pendingRepair = null, this._lastRepairAt = 0, this._explicitBind = !1, this._requireSigDleq = !1, this._strictCachedKeysets = !1, this.ops = new Uc(this), this.on = new Hc(this), this._logger = t?.logger ?? E, this._selectProofs = t?.selectProofs ?? bc, this._outputDataCreator = t?.outputDataCreator ?? new wc(), this.mint = typeof e == "string" ? new fc(e, {
			authProvider: t?.authProvider,
			logger: this._logger
		}) : e, this._unit = t?.unit ?? this._unit, this._boundKeysetId = t?.keysetId ?? this._boundKeysetId, this._explicitBind = t?.keysetId !== void 0, t?.bip39seed && (this.failIf(!(t.bip39seed instanceof Uint8Array), "bip39seed must be a valid Uint8Array", { received: typeof t.bip39seed }), this.failIf(t.bip39seed.length < 16 || t.bip39seed.length > 64, "bip39seed must be 16 to 64 bytes", { length: t.bip39seed.length }), this._seed = t.bip39seed), this._secretsPolicy = t?.secretsPolicy ?? this._secretsPolicy, this._counterSource = t?.counterSource ? t.counterSource : new Mc(t?.counterInit), this.counters = new Pc(this._counterSource), this._keyChain = new hc(this.mint, this._unit, this._logger), this._denominationTarget = t?.denominationTarget ?? this._denominationTarget, this._requireSigDleq = t?.requireSigDleq ?? this._requireSigDleq, this._strictCachedKeysets = t?.strictCachedKeysets ?? this._strictCachedKeysets, this.ctf = t?.enableCtf ? this.createCtfFacade() : void 0;
	}
	createCtfFacade() {
		return {
			prepareConditionalSwap: (e) => this.prepareConditionalSwap(e),
			completeConditionalSwap: (e) => this.completeConditionalSwap(e),
			swapConditional: (e) => this.swapConditional(e),
			redeemOutcomeProofs: (e) => this.redeemOutcomeProofs(e)
		};
	}
	fail(e, t) {
		return ue(e, this._logger, t);
	}
	failIf(e, t, n) {
		return D(e, t, this._logger, n);
	}
	failIfNullish(e, t, n) {
		return de(e, t, this._logger, n);
	}
	requireNut29(e, t, n) {
		let r = this._mintInfo?.isSupported(29);
		if (r === void 0) return;
		let i = r.params?.methods;
		return this.failIf(!r.supported || Array.isArray(i) && !i.includes(e), `${t}: mint does not advertise NUT-29 for ${e}; use ${n} per quote`), r.params;
	}
	requireSupport(e, t) {
		this.failIf(!this.getMintInfo().supportsMintMeltMethod(e, t, this._unit), `Mint does not support ${t} ${e} for unit '${this._unit}'`);
	}
	safeCallback(e, t, n) {
		O(e, t, this._logger, n);
	}
	parseAmount(e, t, n = !1) {
		try {
			let r = k.from(e);
			return n || this.failIf(r.isZero(), `Amount must be positive: ${r.toString()}`, {
				op: t,
				amount: e
			}), r;
		} catch (n) {
			let r = n instanceof Error ? n.message : String(n);
			throw this._logger.error(r, {
				op: t,
				amount: e
			}), new x(r, { cause: n });
		}
	}
	async loadMint(e) {
		let t = [];
		(!this._mintInfo || e) && t.push(this.mint.getInfo().then((e) => (this._mintInfo = new Q(e, this._logger), this.mint.setMintInfo(this._mintInfo), null))), t.push(this._keyChain.init(e)), await Promise.all(t), this.finishInit();
	}
	loadMintFromCache(e, t) {
		this._mintInfo = new Q(e, this._logger), this.mint.setMintInfo(this._mintInfo), this._keyChain.loadFromCache(t), this.finishInit();
	}
	finishInit() {
		let { keysets: e, mintUrl: t, savedAt: n } = this._keyChain.cache;
		if (this._logger.debug("KeyChain loaded", {
			mintUrl: t,
			savedAt: n,
			keysets: e.map((e) => ({
				id: e.id,
				unit: e.unit,
				active: e.active,
				fee: e.input_fee_ppk,
				keys: e.keys ? Object.keys(e.keys).length : 0
			}))
		}), this._boundKeysetId === Yc) try {
			this._boundKeysetId = this._keyChain.getCheapestKeyset().id;
		} catch (e) {
			this._logger.warn("No active keyset available, wallet remains unbound", {
				unit: this._unit,
				err: e.message
			});
		}
		else if (this._explicitBind) {
			let e = this._keyChain.getKeyset(this._boundKeysetId);
			this.failIf(e.unit !== this._unit, "Keyset unit does not match wallet unit", {
				keyset: e.id,
				unit: e.unit,
				walletUnit: this._unit
			}), Ko(e.id, this._logger);
		} else {
			let e = this._keyChain.hasKeyset(this._boundKeysetId) ? this._keyChain.getKeyset(this._boundKeysetId) : void 0;
			try {
				let e = this._keyChain.getCheapestKeyset().id;
				e !== this._boundKeysetId && (this._boundKeysetId = e, this._logger.info("Wallet rebound to cheapest active keyset after refresh", { keysetId: e }));
			} catch (t) {
				e || (this._boundKeysetId = Yc), this._logger.warn("No active keyset available after refresh", {
					unit: this._unit,
					err: t.message
				});
			}
		}
		this.getMintInfo();
	}
	get keyChain() {
		return this._keyChain;
	}
	get unit() {
		return this._unit;
	}
	getMintInfo() {
		return this.failIfNullish(this._mintInfo, "Mint info not initialized; call loadMint or loadMintFromCache first"), this._mintInfo;
	}
	get maxArrayLength() {
		return this._mintInfo?.maxArrayLength ?? 500;
	}
	get keysetId() {
		if (this._boundKeysetId === Yc && this._mintInfo) try {
			this._keyChain.getCheapestKeyset();
		} catch (e) {
			this.fail(`Wallet has no bound keyset: ${e.message}`);
		}
		return this.failIf(this._boundKeysetId === Yc, "Wallet has no bound keyset. The mint may have no active keysets, or wallet was not initialized via loadMint or loadMintFromCache"), this._boundKeysetId;
	}
	getKeyset(e) {
		let t = this._keyChain.getKeyset(e ?? this.keysetId);
		return this.failIf(t.unit !== this._unit, "Keyset unit does not match wallet unit", {
			keyset: t.id,
			unit: t.unit,
			walletUnit: this._unit
		}), Ko(t.id, this._logger), this.failIf(!t.hasKeys, "Keyset has no keys loaded", { keyset: t.id }), t;
	}
	getOutputKeyset(e) {
		let t = this.getKeyset(e);
		return this.failIf(!t.hasHexId, "Legacy keyset cannot be used to create new proofs", { keyset: t.id }), this.failIf(!t.isActive, "Inactive keyset cannot be used to create new proofs", { keyset: t.id }), t;
	}
	async ensureOperableKeysets(e) {
		return this.failIf(!Array.isArray(e), "ensureOperableKeysets: ids must be an array"), this.failIf(!this._mintInfo, "Mint info not initialized; call loadMint or loadMintFromCache first"), this._ensureOperableKeysets(e, { implicit: !1 });
	}
	startRepair(e) {
		if (this._pendingRepair) return this._pendingRepair;
		if (e) {
			if (Date.now() - this._lastRepairAt < 6e4) return null;
			this._lastRepairAt = Date.now();
		}
		return this._pendingRepair = this.loadMint(!0).finally(() => {
			this._pendingRepair = null;
		}), this._pendingRepair;
	}
	async _ensureOperableKeysets(e, t) {
		if (!this._mintInfo) return;
		let n = [...new Set(e.filter((e) => !!e))];
		if (t.implicit && this._strictCachedKeysets) {
			let e = n.filter((e) => !this._keyChain.hasKeyset(e));
			if (e.length > 0) throw new ie(e[0]);
			return;
		}
		let r = n.filter((e) => !this._keyChain.hasKeyset(e)), i = !1;
		if (r.length > 0) {
			let e = this.startRepair(t.implicit);
			if (!e) throw new ie(r[0]);
			try {
				await e;
			} catch (e) {
				throw new ie(r[0], { cause: e });
			}
			i = !0;
			let n = r.filter((e) => !this._keyChain.hasKeyset(e));
			if (n.length > 0) throw t.implicit && this.on._emitKeychainUpdated(), new ie(n[0], { refreshed: !0 });
		}
		let a = t.fetchKeys === !1 ? [] : n.filter((e) => this._keyChain.isUnitKeyset(e) && !this._keyChain.getKeyset(e).hasKeys);
		if (a.length > 0) {
			let e = await Promise.allSettled(a.map((e) => this._keyChain.ensureKeysetKeys(e))), n = e.filter((e) => e.status === "rejected");
			if (n.length < e.length && (i = !0), n.length > 0) throw i && t.implicit && this.on._emitKeychainUpdated(), n.length === 1 ? n[0].reason : new x(`Could not load keys for ${n.length} keysets`, { cause: n.map((e) => e.reason) });
		}
		i && t.implicit && this.on._emitKeychainUpdated();
	}
	async repairStaleSnapshot() {
		if (this._strictCachedKeysets) return !1;
		let e = this.startRepair(!0);
		if (!e) return !1;
		try {
			await e;
		} catch (e) {
			return this._logger.warn("Snapshot refresh after a mint keyset rejection failed", { err: e.message }), !1;
		}
		return this.on._emitKeychainUpdated(), !0;
	}
	async withStaleKeysetRepair(e) {
		try {
			return await e();
		} catch (e) {
			throw !le(e) || !Number.isFinite(e.code) || e.code < 12e3 || e.code >= 13e3 ? e : new oe(await this.repairStaleSnapshot(), { cause: e });
		}
	}
	requireMintableKeyset(e) {
		try {
			this._keyChain.getCheapestKeyset();
		} catch (t) {
			this.fail(`${e}: no active keyset for unit '${this._unit}' — a paid mint quote could not be redeemed. ${t.message}`, { reason: t.message });
		}
	}
	get logger() {
		return this._logger;
	}
	async reserveFor(e, t) {
		return t <= 0 ? {
			start: 0,
			count: 0
		} : this._counterSource.reserve(e, t);
	}
	countersNeeded(e) {
		return e.type !== "deterministic" || e.counter !== 0 ? 0 : (e.denominations ?? []).length;
	}
	async addCountersToOutputTypes(e, ...t) {
		let n = t.filter((e) => e.type === "deterministic" && e.counter > 0 && (e.denominations?.length ?? 0) > 0);
		if (n.length > 1) {
			let t = n.map((e) => ({
				start: e.counter,
				end: e.counter + e.denominations.length
			})).sort((e, t) => e.start - t.start);
			for (let n = 1; n < t.length; n++) this.failIf(t[n].start < t[n - 1].end, "Manual counter ranges overlap", {
				keysetId: e,
				prev: t[n - 1],
				cur: t[n]
			});
		}
		if (n.length > 0) {
			let t = Math.min(...n.map((e) => e.counter)), r = Math.max(...n.map((e) => e.counter + e.denominations.length));
			if (this._counterSource.reserveAt) try {
				await this._counterSource.reserveAt(e, t, r - t);
			} catch {
				this._logger.warn("Manual deterministic counter range was already issued", {
					keysetId: e,
					minManualStart: t,
					maxManualEnd: r
				}), await this._counterSource.advanceToAtLeast(e, r);
			}
			else {
				let { start: n } = await this._counterSource.reserve(e, 0);
				n > t && this._logger.warn("Manual deterministic counter range was already issued", {
					keysetId: e,
					minManualStart: t,
					maxManualEnd: r
				}), await this._counterSource.advanceToAtLeast(e, r);
			}
			this._logger.debug("Counter source advanced to respect manual deterministic counters", {
				keysetId: e,
				maxManualEnd: r
			});
		}
		let r = t.reduce((e, t) => e + this.countersNeeded(t), 0);
		if (r === 0) return { outputTypes: t };
		let i = await this.reserveFor(e, r), a = i.start, o = t.map((e) => {
			if (e.type === "deterministic" && e.counter === 0) {
				let t = e.denominations?.length ?? 0;
				if (t > 0) {
					let n = {
						...e,
						counter: a
					};
					return a += t, n;
				}
			}
			return e;
		}), s = {
			keysetId: e,
			start: i.start,
			count: i.count,
			next: i.start + i.count
		};
		return this.on._emitCountersReserved(s), {
			outputTypes: o,
			used: s
		};
	}
	bindKeyset(e) {
		let t = this._keyChain.getKeyset(e);
		this.failIf(t.unit !== this._unit, "Keyset unit does not match wallet unit", {
			keyset: t.id,
			unit: t.unit,
			walletUnit: this._unit
		}), Ko(t.id, this._logger), this.failIf(!t.hasKeys, "Keyset has no keys loaded", { keyset: t.id }), this._boundKeysetId = t.id, this._explicitBind = !0, this._logger.debug("Wallet bound to keyset", {
			keysetId: t.id,
			unit: t.unit,
			feePPK: t.fee
		});
	}
	withKeyset(t, n) {
		let r = new e(this.mint, {
			keysetId: t,
			bip39seed: this._seed,
			secretsPolicy: this._secretsPolicy,
			outputDataCreator: this._outputDataCreator,
			requireSigDleq: this._requireSigDleq,
			logger: this._logger,
			counterSource: n?.counterSource ?? this._counterSource,
			strictCachedKeysets: this._strictCachedKeysets
		});
		return r.loadMintFromCache(this.getMintInfo().cache, this._keyChain.cache), r;
	}
	defaultOutputType() {
		return this._secretsPolicy === "random" ? { type: "random" } : this._secretsPolicy === "deterministic" ? (this.failIfNullish(this._seed, "Deterministic policy requires a seed"), {
			type: "deterministic",
			counter: 0
		}) : this._seed ? {
			type: "deterministic",
			counter: 0
		} : { type: "random" };
	}
	configureOutputs(e, t, n, r = !1, i = []) {
		let a = this.parseAmount(e, "configureOutputs", !0), o = i.map((e) => ({ amount: k.from(e.amount) }));
		if (n.type === "custom") {
			this.failIf(r, "The custom OutputType does not support automatic fee inclusion");
			let e = this.parseAmount(I.sumOutputAmounts(n.data), "configureOutputs.customTotal", !0);
			this.failIf(!e.equals(a), `Custom output data total (${e.toString()}) does not match amount (${a.toString()})`);
			for (let e of n.data) this.getOutputKeyset(e.blindedMessage.id);
			return n;
		}
		let s = n.denominations ?? [];
		if (s.length === 0 && o.length > 0 && (s = Oc(o, a, t.keys, this._denominationTarget)), s = U(a, t.keys, s), r) {
			let e = this.receiveFeeAmounts(s.length, t);
			a = a.add(k.sum(e)), s = [...s, ...e];
		}
		return {
			...n,
			denominations: s
		};
	}
	receiveFeeAmounts(e, t) {
		let n = this.getFeesForKeyset(e, t.id), r = U(n, t.keys), i = 0;
		for (; this.getFeesForKeyset(e + r.length, t.id).greaterThan(n);) {
			if (i++ > 4096) throw new x(`Fee calculation for keyset ${t.id} did not converge (input_fee_ppk too high for its denominations)`);
			n = n.add(1), r = U(n, t.keys);
		}
		return r;
	}
	preparedTotal(e) {
		if (e.type === "custom") return I.sumOutputAmounts(e.data);
		let t = e.denominations ?? [];
		return k.sum(t);
	}
	createOutputData(e, t, n) {
		let r = this.parseAmount(e, "createOutputData", !0);
		if (n.type != "custom" && n.denominations && n.denominations.length > 0) {
			let e = k.sum(n.denominations);
			this.failIf(!e.equals(r), "Denominations do not sum to the expected amount", {
				splitSum: e.toString(),
				expected: r.toString()
			});
		}
		let i;
		switch (n.type) {
			case "random":
				i = this._outputDataCreator.createRandomData(r, t, n.denominations);
				break;
			case "deterministic":
				this.failIfNullish(this._seed, "Deterministic outputs require a seed configured in the wallet"), i = this._outputDataCreator.createDeterministicData(r, this._seed, n.counter, t, n.denominations);
				break;
			case "p2pk":
				{
					let e = this.getMintInfo();
					this.failIf(!e.isSupported(11).supported, "Mint does not support NUT-11: the lock would be spendable by anyone"), this.failIf(n.options.hashlock !== void 0 && !e.isSupported(14).supported, "Mint does not support NUT-14: the hashlock would be spendable by anyone");
				}
				n.options.locktime !== void 0 && n.options.locktime <= Math.floor(Date.now() / 1e3) && this._logger.warn("Lock locktime is not in the future", { locktime: n.options.locktime }), i = this._outputDataCreator.createP2PKData(n.options, r, t, n.denominations);
				break;
			case "factory":
				i = U(r, t.keys, n.denominations).map((e) => n.factory(e, t));
				break;
			case "custom": {
				i = n.data;
				let e = this.parseAmount(I.sumOutputAmounts(i), "createOutputData.customTotal", !0);
				this.failIf(!e.equals(r), `Custom output data total (${e.toString()}) does not match amount (${r.toString()})`);
				break;
			}
			default: this.fail("Invalid OutputType");
		}
		return i;
	}
	createSwapTransaction(e, t, n = []) {
		e = this._prepareInputsForMint(e);
		let r = [...t, ...n], i = r.map((e, t) => t);
		ra(e) || i.sort((e, t) => r[e].blindedMessage.amount.compareTo(r[t].blindedMessage.amount));
		let a = [...Array.from({ length: t.length }, () => !0), ...Array.from({ length: n.length }, () => !1)], o = i.map((e) => r[e]), s = i.map((e) => a[e]), c = o.map((e) => e.blindedMessage);
		return {
			payload: {
				inputs: e,
				outputs: c
			},
			outputData: o,
			keepVector: s,
			sortedIndices: i
		};
	}
	async receive(e, t, n) {
		let r = await this.prepareSwapToReceive(e, t, n), { keep: i } = await this.completeSwap(r, t?.privkey);
		return i;
	}
	async prepareSwapToReceive(e, t, n) {
		let { keysetId: r, requireDleq: i, proofsWeHave: a, onCountersReserved: o } = t || {};
		n = n ?? this.defaultOutputType();
		let s;
		if (Array.isArray(e)) s = X(e);
		else {
			let t = typeof e == "string" ? this.decodeToken(e) : e, n = Xo(t.mint);
			this.failIf(n !== this.mint.mintUrl, "Token belongs to a different mint", {
				token: n,
				wallet: this.mint.mintUrl
			}), this.failIf(t.unit !== this._unit, "Token is not in wallet unit", {
				token: t.unit,
				wallet: this._unit
			}), s = X(t.proofs);
		}
		await this._ensureOperableKeysets(s.map((e) => e.id), { implicit: !0 }), this.assertProofsInWalletUnit(s);
		let c = this.parseAmount(Y(s), "prepareSwapToReceive", !0);
		this.failIf(c.isZero(), "Token contains no proofs", { proofs: s });
		for (let e of s) {
			let t = this._keyChain.getKeyset(e.id);
			i ? this.failIf(!ns(e, t), "Token contains proofs with invalid or missing DLEQ") : this.failIf(!rs(e, t), "Token contains a proof with an invalid DLEQ");
		}
		let l = this.getOutputKeyset(r), u = this.getFeesForProofs(s), d = c.subtract(u), f = this.configureOutputs(d, l, n, !1, a), p = await this.addCountersToOutputTypes(l.id, f);
		[f] = p.outputTypes, p.used && this.safeCallback(o, p.used, { op: "receive" }), this._logger.debug("receive counter", {
			counter: p.used,
			receiveOT: kc(f)
		});
		let m = this.createOutputData(this.preparedTotal(f), l, f);
		return {
			amount: d,
			fees: u,
			keysetId: l.id,
			inputs: s,
			keepOutputs: m
		};
	}
	sendOffline(e, t, n) {
		let r = this.parseAmount(e, "sendOffline"), i = X(t), { requireDleq: a = !1, includeFees: o = !1, exactMatch: s = !0 } = n || {};
		a && (i = i.filter((e) => e.dleq != null)), this.failIf(Y(i).lessThan(r), "Not enough funds available to send");
		let { keep: c, send: l } = this.selectProofsToSend(i, r, o, s);
		return {
			keep: c,
			send: this._prepareInputsForMint(l, a, !0)
		};
	}
	async send(e, t, n, r) {
		let i = this.parseAmount(e, "send"), { keysetId: a, includeFees: o = !1 } = n || {};
		r = r ?? {
			send: this.defaultOutputType(),
			keep: this.defaultOutputType()
		};
		try {
			let e = this.defaultOutputType().type === "deterministic", n = (e) => !e || e.type === "random" && (!e.denominations || e.denominations.length === 0);
			if (a || e || !n(r.send) || r.keep && !n(r.keep)) {
				let t = [];
				throw a && t.push("keysetId override"), e && t.push("wallet default is deterministic"), n(r.send) || t.push("non-default send output type"), r.keep && !n(r.keep) && t.push("non-default keep output type"), new x(`Options require a swap: ${t.join(", ")}`);
			}
			let { keep: s, send: c } = this.sendOffline(i, t, {
				includeFees: o,
				exactMatch: !0,
				requireDleq: !1
			}), l = o ? this.getFeesForProofs(c) : k.zero();
			if (Y(c).equals(i.add(l))) return this._logger.info("Successful exactMatch offline selection!"), {
				keep: s,
				send: c
			};
		} catch (e) {
			let t = e instanceof Error ? e.message : "Unknown error";
			this._logger.debug("ExactMatch offline selection failed.", { e: t });
		}
		let s = await this.prepareSwapToSend(i, t, n, r);
		return await this.completeSwap(s, n?.privkey);
	}
	async prepareSwapToSend(e, t, n, r) {
		let i = this.parseAmount(e, "prepareSwapToSend"), a = X(t), { keysetId: o, includeFees: s = !1, onCountersReserved: c } = n || {};
		await this._ensureOperableKeysets(a.map((e) => e.id), {
			implicit: !0,
			fetchKeys: !1
		}), r = r ?? {
			send: this.defaultOutputType(),
			keep: this.defaultOutputType()
		};
		let l = this.getOutputKeyset(o), u = this.configureOutputs(i, l, r.send ?? this.defaultOutputType(), s), d = this.preparedTotal(u), { keep: f, send: p } = this.selectProofsToSend(a, d, !0);
		if (p.length === 0) {
			let e = Y(a).toString(), t = this.getFeesForProofs(a).toString();
			this.fail(`Not enough funds available to send: ${e} available, ${d.toString()} required plus up to ${t} input fee`);
		}
		let m = Y(p), h = this.getFeesForProofs(p), g = d.add(h);
		m.lessThan(g) && this.failIf(!0, "Not enough funds available for swap", {
			selectedSum: m.toString(),
			required: g.toString()
		});
		let _ = m.subtract(g), v = this.configureOutputs(_, l, r.keep ?? this.defaultOutputType(), !1, n?.proofsWeHave), y = this.preparedTotal(v), b = await this.addCountersToOutputTypes(l.id, u, v);
		[u, v] = b.outputTypes, b.used && this.safeCallback(c, b.used, { op: "send" }), this._logger.debug("send counters", {
			counter: b.used,
			sendOT: kc(u),
			keepOT: kc(v)
		});
		let ee = this.createOutputData(d, l, u), te = this.createOutputData(y, l, v);
		return {
			amount: i,
			fees: h,
			keysetId: l.id,
			inputs: p,
			sendOutputs: ee,
			keepOutputs: te,
			unselectedProofs: f
		};
	}
	async completeSwap(e, t) {
		let n = e?.keepOutputs ? e.keepOutputs : [], r = e.sendOutputs ? e.sendOutputs : [], i = e.unselectedProofs ? e.unselectedProofs : [];
		t && (e.inputs = this.signP2PKProofs(e.inputs, t, [...n, ...r]));
		let a = this.createSwapTransaction(e.inputs, n, r), { signatures: o } = await this.withStaleKeysetRepair(() => this.mint.swap(a.payload));
		this.failIf(o.length !== a.outputData.length, `Mint returned ${o.length} signatures, expected ${a.outputData.length}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(o, a.outputData), await this._ensureKeysetsForSignatures(o);
		let s = a.outputData.map((e, t) => e.toProof(o[t], this.keysetForSignature(o[t].id))), c = Array(s.length), l = Array(a.keepVector.length);
		a.sortedIndices.forEach((e, t) => {
			l[e] = a.keepVector[t], c[e] = s[t];
		});
		let u = [], d = [];
		return c.forEach((e, t) => {
			l[t] ? u.push(e) : d.push(e);
		}), this._logger.debug("SEND COMPLETED", {
			unselectedProofs: i.map((e) => e.amount.toString()),
			keepProofs: u.map((e) => e.amount.toString()),
			sendProofs: d.map((e) => e.amount.toString())
		}), {
			keep: [...u, ...i],
			send: d
		};
	}
	async prepareConditionalSwap(e) {
		let t = X(e.inputs);
		if (t.length === 0) throw new x("prepareConditionalSwap requires at least one input proof");
		if (e.outputs.length === 0) throw new x("prepareConditionalSwap requires at least one output group");
		let n = e.keysetId ?? t[0].id;
		if (!n) throw new x("prepareConditionalSwap requires a conditional keyset id");
		let r = t.find((e) => e.id !== n);
		if (r) throw new x(`prepareConditionalSwap inputs must use one keyset: expected ${n}, got ${r.id}`);
		let i = await this._keyChain.loadConditionalKeyset(n), a = /* @__PURE__ */ new Set(), o = k.zero(), s = e.outputs.map((e) => {
			if (a.has(e.label)) throw new x(`prepareConditionalSwap output label is duplicated: ${e.label}`);
			if (a.add(e.label), e.kind === "custom") {
				if (e.data.length === 0) throw new x(`prepareConditionalSwap output ${e.label} is empty`);
				let t = I.sumOutputAmounts(e.data);
				if (t.isZero()) throw new x(`prepareConditionalSwap output ${e.label} amount must be positive`);
				return o = o.add(t), {
					label: e.label,
					data: [...e.data]
				};
			}
			let t = k.from(e.amount);
			if (t.isZero()) throw new x(`prepareConditionalSwap output ${e.label} amount must be positive`);
			if (o = o.add(t), e.kind === "p2pk") {
				if (!e.p2pk) throw new x(`prepareConditionalSwap output ${e.label} is missing P2PK options`);
				return {
					label: e.label,
					data: I.createP2PKData(e.p2pk, t, i, e.customSplit)
				};
			}
			return {
				label: e.label,
				data: I.createRandomData(t, i, e.customSplit)
			};
		}), c = k.from(Math.ceil(t.length * i.fee / 1e3)), l = Y(t).subtract(c);
		if (!o.equals(l)) throw new x(`prepareConditionalSwap output total ${o.toString()} does not match input total ${l.toString()} after fees`);
		for (let e of s) {
			let t = e.data.find((e) => e.blindedMessage.id !== n);
			if (t) throw new x(`prepareConditionalSwap output ${e.label} uses keyset ${t.blindedMessage.id}; expected ${n}`);
		}
		return {
			keysetId: n,
			inputs: t,
			outputDataByLabel: Object.fromEntries(s.map((e) => [e.label, e.data]))
		};
	}
	async completeConditionalSwap(e) {
		let t = Object.values(e.outputDataByLabel).flat(), n = t.map((e) => e.blindedMessage), { signatures: r } = await this.mint.swap({
			inputs: e.inputs,
			outputs: n
		});
		this.failIf(r.length !== t.length, `Mint returned ${r.length} signatures, expected ${t.length}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(r, t);
		let i = this._keyChain.getConditionalKeyset(e.keysetId), a = {}, o = 0;
		for (let [t, n] of Object.entries(e.outputDataByLabel)) {
			a[t] = [];
			for (let s of n) {
				let n = r[o];
				if (o += 1, n.id !== e.keysetId) throw new x(`Mint signed conditional swap output with keyset ${n.id}; expected ${e.keysetId}`);
				a[t].push(s.toProof(n, i));
			}
		}
		return a;
	}
	async swapConditional(e) {
		return this.completeConditionalSwap(await this.prepareConditionalSwap(e));
	}
	async redeemOutcomeProofs(e) {
		let t = X(e.inputs), n = [...e.outputs];
		if (t.length === 0) throw new x("redeemOutcomeProofs requires at least one input proof");
		if (n.length === 0) throw new x("redeemOutcomeProofs requires at least one output");
		let r = n[0].blindedMessage.id;
		if (!r) throw new x("redeemOutcomeProofs requires output keyset ids");
		let i = n.find((e) => e.blindedMessage.id !== r);
		if (i) throw new x(`redeemOutcomeProofs outputs must use one keyset: expected ${r}, got ${i.blindedMessage.id}`);
		let { signatures: a } = await this.mint.redeemOutcome({
			inputs: t,
			outputs: n.map((e) => e.blindedMessage)
		});
		this.failIf(a.length !== n.length, `Mint returned ${a.length} signatures, expected ${n.length}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(a, n);
		let o = (await this.mint.getKeys(r)).keysets.find((e) => e.id === r);
		if (!o || Object.keys(o.keys).length === 0) throw new x(`Mint returned no keys for redeem output keyset ${r}`);
		return n.map((e, t) => e.toProof(a[t], o));
	}
	selectProofsToSend(e, t, n = !1, r = !1) {
		let i = this.parseAmount(t, "selectProofsToSend"), { keep: a, send: o } = this._selectProofs(e, i, this._keyChain, n, r);
		return {
			keep: a,
			send: o
		};
	}
	signP2PKProofs(e, t, n, r) {
		let i = X(e);
		if (!ra(i)) return Ji(i, t, this._logger);
		this.failIfNullish(n, "OutputData is required for SIG_ALL proof signing."), ta(i);
		let [a, ...o] = i, s = a, c = [na(i, n, r)];
		for (let e of c) s = Ji([s], t, this._logger, e)[0];
		return [s, ...o];
	}
	getFeesForProofs(e) {
		let t = k.sum(e.map((e) => this.getProofFeePPK(e))).toBigInt();
		return k.from((t + 999n) / 1000n);
	}
	assertProofsInWalletUnit(e) {
		let t = e.find((e) => !this._keyChain.isUnitKeyset(e.id));
		this.failIf(!!t, `Proof has unrecognised keyset. '${t?.id}' is not a ${this._unit} keyset from this mint`, { id: t?.id });
	}
	getProofFeePPK(e) {
		try {
			return this._keyChain.getKeyset(e.id).fee;
		} catch (t) {
			let n = `Could not get fee. No keyset found for keyset id: ${e.id}`;
			throw this._logger.error(n, {
				e: t,
				keychain: this._keyChain.getKeysets()
			}), new x(n, { cause: t });
		}
	}
	getFeesForKeyset(e, t) {
		let n;
		try {
			n = this._keyChain.getKeyset(t).fee;
		} catch (e) {
			let n = `No keyset found with ID ${t}`;
			throw this._logger.error(n, { e }), new x(n, { cause: e });
		}
		return k.from(e).ceilPercent(n, 1e3);
	}
	getFeesToInclude(e, t) {
		let n = this.getKeyset(t?.keysetId), r = this.parseAmount(e, "getFeesToInclude", !0), i = t?.nOutputs ?? U(r, n.keys).length;
		return k.sum(this.receiveFeeAmounts(i, n));
	}
	maxSpendableAfterFees(e, t = 0) {
		let n = Y(e), r = this.getFeesForProofs(e).add(t);
		return r.greaterThanOrEqual(n) ? k.zero() : n.subtract(r);
	}
	_prepareInputsForMint(e, t = !1, n = !1) {
		return e.map((e) => {
			let r = this._normalizeWitness(e), { dleq: i, p2pk_e: a, ...o } = e, s = {
				...o,
				witness: r
			};
			return n && a && (s = {
				...s,
				p2pk_e: a
			}), t && i && (s = {
				...s,
				dleq: i
			}), s;
		});
	}
	_normalizeWitness(e) {
		if (e.witness) {
			try {
				xi(e.secret);
			} catch {
				return;
			}
			return typeof e.witness == "string" ? e.witness : JSON.stringify(e.witness);
		}
	}
	decodeToken(e) {
		return Vo(e, this._keyChain.getAllKeysetIds());
	}
	async batchRestore(e = 300, t, n = 0, r) {
		let i = t ?? this.maxArrayLength, a = Math.ceil(e / i), o = r ?? this.keysetId, s = [], c, l = 0;
		for (; l < a;) {
			let e = await this.restore(n, i, { keysetId: o });
			e.proofs.length > 0 || e.lastCounterWithSignature !== void 0 ? (l = 0, s.push(...e.proofs), c = e.lastCounterWithSignature) : l++, n += i;
		}
		return {
			proofs: s,
			lastCounterWithSignature: c
		};
	}
	async restore(e, t, n) {
		this.failIfNullish(this._seed, "Cashu Wallet must be initialized with a seed to use restore");
		let { keysetId: r } = n || {}, i = r ?? this.keysetId;
		this._strictCachedKeysets || await this._keyChain.ensureKeysetKeys(i);
		let a = this.getKeyset(i), o = Array(t).fill(0), s = this._outputDataCreator.createDeterministicData(0, this._seed, e, a, o), { outputs: c, signatures: l } = await this.mint.restore({ outputs: s.map((e) => e.blindedMessage) });
		await this._ensureKeysetsForSignatures(l);
		let u = {};
		c.forEach((e, t) => u[e.B_] = l[t]);
		let d = [], f;
		for (let t = 0; t < s.length; t++) {
			let n = u[s[t].blindedMessage.B_];
			n && (f = e + t, !n.amount.isZero() && d.push(s[t].toProof(n, this.keysetForSignature(n.id))));
		}
		return {
			proofs: d,
			lastCounterWithSignature: f
		};
	}
	async createMintQuote(e, t, n) {
		if (typeof e != "string" || typeof t == "string") return this.createMintQuoteBolt11(e, t);
		try {
			this._keyChain.getCheapestKeyset();
		} catch (e) {
			this._logger.warn(`createMintQuote: no active keyset for unit '${this._unit}' — a paid mint quote could not be redeemed. This will become an error in cashu-ts v5.`, { reason: e.message });
		}
		let r = {
			...t,
			unit: this._unit
		}, i = await this.mint.createMintQuote(e, r, { normalize: n?.normalize });
		return this.warnQuoteUnit(i, `createMintQuote: ${e}`), {
			...i,
			unit: i.unit || this._unit
		};
	}
	warnQuoteUnit(e, t) {
		typeof e.unit == "string" && e.unit !== "" && e.unit !== this._unit && this._logger.warn(`${t}: the mint quoted unit '${e.unit}' but this wallet uses '${this._unit}'. This will become an error in cashu-ts v5.`, {
			quoted: e.unit,
			wallet: this._unit
		});
	}
	warnQuoteAmount(e, t, n) {
		t !== n && this._logger.warn(`${e}: the mint quoted ${n ?? "no amount"} but ${t ?? "no amount"} was requested. This will become an error in cashu-ts v5.`, {
			expected: t,
			quoted: n
		});
	}
	assertBolt11MintQuoteAmount(e, t) {
		if (this.failIf(!e.amount.equals(t), "Mint quote amount does not match", {
			expected: t.toString(),
			quoted: e.amount.toString()
		}), this._unit !== "sat" && this._unit !== "msat") return;
		let n = null;
		try {
			n = us(e.request);
		} catch {}
		let r = this._unit === "sat" ? t.multiplyBy(1e3) : t, i = n !== null && r.equals(n);
		this.failIf(!i, "Mint quote invoice amount does not match the quote", {
			expected: t.toString(),
			invoiceMsat: n
		});
	}
	async createMintQuoteBolt11(e, t) {
		this.requireSupport("mint", "bolt11"), this.requireMintableKeyset("createMintQuoteBolt11");
		let n = this.parseAmount(e, "createMintQuoteBolt11");
		t && (this.getMintInfo().supportsNut04Description("bolt11", this._unit) || this.fail("Mint does not support description for bolt11"));
		let r = {
			unit: this._unit,
			amount: n,
			description: t
		}, i = await this.mint.createMintQuoteBolt11(r);
		return this.warnQuoteUnit(i, "createMintQuoteBolt11"), this.assertBolt11MintQuoteAmount(i, n), {
			...i,
			unit: i.unit || this._unit
		};
	}
	async createLockedMintQuote(e, t, n) {
		this.requireSupport("mint", "bolt11"), this.requireMintableKeyset("createLockedMintQuote"), this.failIf(typeof t != "string" || t.length === 0, "A pubkey is required to lock the mint quote");
		let r = this.parseAmount(e, "createLockedMintQuote"), { supported: i } = this.getMintInfo().isSupported(20);
		this.failIf(!i, "Mint does not support NUT-20");
		let a = {
			unit: this._unit,
			amount: r,
			description: n,
			pubkey: t
		}, o = await this.mint.createMintQuoteBolt11(a);
		this.warnQuoteUnit(o, "createLockedMintQuote"), this.assertBolt11MintQuoteAmount(o, r), this.failIf(typeof o.pubkey != "string", "Mint returned unlocked mint quote");
		let s = o.pubkey;
		return this.failIf(s.toLowerCase() !== t.toLowerCase(), "Mint quote is not locked to the requested pubkey"), {
			...o,
			pubkey: s,
			unit: o.unit || this._unit
		};
	}
	async createMintQuoteBolt12(e, t) {
		this.requireSupport("mint", "bolt12"), this.requireMintableKeyset("createMintQuoteBolt12"), this.failIf(typeof e != "string" || e.length === 0, "A pubkey is required to lock the mint quote");
		let n = this.getMintInfo();
		t?.description && !n.supportsNut04Description("bolt12", this._unit) && this.fail("Mint does not support description for bolt12");
		let r = t?.amount === void 0 ? void 0 : this.parseAmount(t.amount, "createMintQuoteBolt12"), i = {
			pubkey: e,
			unit: this._unit,
			amount: r,
			description: t?.description
		}, a = await this.mint.createMintQuoteBolt12(i);
		return this.warnQuoteUnit(a, "createMintQuoteBolt12"), this.warnQuoteAmount("createMintQuoteBolt12", r?.toString() ?? null, a.amount?.toString() ?? null), this.failIf(typeof a.pubkey != "string" || a.pubkey.toLowerCase() !== e.toLowerCase(), "Mint quote is not locked to the requested pubkey"), a;
	}
	async createMintQuoteOnchain(e) {
		this.requireSupport("mint", "onchain"), this.requireMintableKeyset("createMintQuoteOnchain"), this.failIf(typeof e != "string" || e.length === 0, "A pubkey is required to lock the mint quote");
		let t = await this.mint.createMintQuoteOnchain({
			unit: this._unit,
			pubkey: e
		});
		return this.warnQuoteUnit(t, "createMintQuoteOnchain"), this.failIf(typeof t.pubkey != "string" || t.pubkey.toLowerCase() !== e.toLowerCase(), "Mint quote is not locked to the requested pubkey"), {
			...t,
			unit: t.unit || this._unit
		};
	}
	async checkMintQuote(e, t, n) {
		if (t === void 0) return this.checkMintQuoteBolt11(e);
		let r = typeof t == "string" ? t : t.quote;
		return this.mint.checkMintQuote(e, r, { normalize: n?.normalize });
	}
	async checkMintQuoteBolt11(e) {
		let t = typeof e == "string" ? e : e.quote, n = await this.mint.checkMintQuoteBolt11(t);
		return this.assertBolt11MintQuoteAmount(n, n.amount), n;
	}
	async checkMintQuoteBolt12(e) {
		return this.mint.checkMintQuoteBolt12(e);
	}
	async checkMintQuoteOnchain(e) {
		return this.mint.checkMintQuoteOnchain(e);
	}
	async checkMintQuoteBatch(e, t, n) {
		this.requireNut29(e, "checkMintQuoteBatch", "checkMintQuote");
		let r = t.map((e) => typeof e == "string" ? e : e.quote);
		return this.mint.checkMintQuoteBatch(e, r, { normalize: n?.normalize });
	}
	async checkMintQuoteBatchBolt11(e) {
		this.requireNut29("bolt11", "checkMintQuoteBatchBolt11", "checkMintQuoteBolt11");
		let t = e.map((e) => typeof e == "string" ? e : e.quote), n = await this.mint.checkMintQuoteBatchBolt11(t);
		for (let e of n) this.assertBolt11MintQuoteAmount(e, e.amount);
		return n;
	}
	async checkMintQuoteBatchBolt12(e) {
		this.requireNut29("bolt12", "checkMintQuoteBatchBolt12", "checkMintQuoteBolt12");
		let t = e.map((e) => typeof e == "string" ? e : e.quote);
		return this.mint.checkMintQuoteBatchBolt12(t);
	}
	validateReturnedSignatures(e, t) {
		let n = this._requireSigDleq && (this._mintInfo?.isSupported(12).supported ?? !1);
		for (let r = 0; r < e.length; r++) {
			this.failIf(e[r] == null, `Mint response is missing a signature at index ${r}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`);
			let i = t[r].blindedMessage.amount.isZero();
			i && e[r].amount.isZero() || (this.failIf(!i && e[r].id !== t[r].blindedMessage.id, `Mint signature keyset id at index ${r} does not match output: expected ${t[r].blindedMessage.id}, got ${e[r].id}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.failIf(!i && !e[r].amount.equals(t[r].blindedMessage.amount), `Mint returned signature with wrong amount at index ${r}: expected ${t[r].blindedMessage.amount.toString()}, got ${e[r].amount.toString()}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.failIf(n && !e[r].dleq, `Mint supports NUT-12, but returned a signature without DLEQ proof at index ${r}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`));
		}
	}
	validateMintQuoteAvailableAmount(e, t, n) {
		if (e !== "bolt12" && e !== "onchain" || !("amount_paid" in t) || !("amount_issued" in t)) return;
		let r = k.from(t.amount_paid), i = k.from(t.amount_issued), a = r.subtract(i);
		this.failIf(n.greaterThan(a), `Mint quote has only ${a.toString()} available to mint; requested ${n.toString()}`, {
			method: e,
			amount_paid: r.toString(),
			amount_issued: i.toString(),
			requestedAmount: n.toString()
		});
	}
	validateMintQuote(e) {
		this.failIf("unit" in e && typeof e.unit == "string" && e.unit !== this.unit, `Quote unit '${e.unit}' does not match wallet unit '${this.unit}'`);
	}
	validateMeltQuote(e) {
		this.failIf("unit" in e && typeof e.unit == "string" && e.unit !== this.unit, `Quote unit '${e.unit}' does not match wallet unit '${this.unit}'`);
	}
	async mintProofs(e, t, n, r, i) {
		if (typeof e != "string") return this.mintProofsBolt11(e, t, n, r);
		let a = await this.prepareMint(e, t, n, r, i);
		return this.completeMint(a);
	}
	async mintProofsBolt11(e, t, n, r) {
		if (this.requireSupport("mint", "bolt11"), typeof t == "string") {
			let i = { quote: t }, a = await this.prepareMint("bolt11", e, i, n, r);
			return this.completeMint(a);
		}
		this.validateMintQuote(t);
		let i = await this.prepareMint("bolt11", e, t, n, r);
		return this.completeMint(i);
	}
	async mintProofsBolt12(e, t, n, r, i) {
		this.requireSupport("mint", "bolt12");
		let a = await this.prepareMint("bolt12", e, t, {
			...r,
			privkey: n
		}, i);
		return this.completeMint(a);
	}
	async mintProofsOnchain(e, t, n, r, i) {
		this.requireSupport("mint", "onchain");
		let a = await this.prepareMint("onchain", e, t, {
			...r,
			privkey: n
		}, i);
		return this.completeMint(a);
	}
	async prepareMint(e, t, n, r, i) {
		this.failIf(typeof n == "string", "prepareMint: expected a quote object, not a string ID. Use mintBolt11() which accepts string quote IDs."), this.validateMintQuote(n);
		let a = this.parseAmount(t, `prepareMint: ${e}`);
		this.validateMintQuoteAvailableAmount(e, n, a), i = i ?? this.defaultOutputType();
		let { privkey: o, keysetId: s, proofsWeHave: c, onCountersReserved: l } = r ?? {}, u = this.getOutputKeyset(s), d = this.configureOutputs(a, u, i, !1, c), f = this.preparedTotal(d), p = await this.addCountersToOutputTypes(u.id, d);
		[d] = p.outputTypes, p.used && this.safeCallback(l, p.used, { op: "mintProofs" }), this._logger.debug("mint counter", {
			counter: p.used,
			mintOT: kc(d)
		});
		let m = this.createOutputData(f, u, d), h = m.map((e) => e.blindedMessage), g = {
			outputs: h,
			quote: n.quote
		};
		"pubkey" in n && n.pubkey && this.failIf(!o, "Can not sign locked quote without private key");
		let _;
		if (o) {
			let e = "pubkey" in n ? n.pubkey : void 0;
			this.failIf(!e && Array.isArray(o), "prepareMint: multiple privkeys supplied for a quote without pubkey");
			let t = e ? an(e, o) : Array.isArray(o) ? o[0] : o;
			this.failIf(!t, "prepareMint: privkey is empty or correct privkey not provided"), g.signature = Na(t, n.quote, h), _ = ja(t, n.quote, h);
		}
		return {
			method: e,
			payload: g,
			outputData: m,
			keysetId: u.id,
			quote: n,
			legacySignature: _
		};
	}
	async withLegacyQuoteSigFallback(e, t, n) {
		try {
			return await t();
		} catch (t) {
			if (e && le(t) && t.code === Xc) return this._logger.warn("Mint rejected the amended NUT-20 quote signature (20008); retrying with the legacy message."), n();
			throw t;
		}
	}
	async completeMint(e) {
		let { payload: t, outputData: n, method: r, legacySignature: i } = e, a = {
			...t,
			outputs: n.map((e) => e.blindedMessage)
		}, { signatures: o } = await this.withStaleKeysetRepair(() => this.withLegacyQuoteSigFallback(i !== void 0, () => this.mint.mint(r, a), () => this.mint.mint(r, {
			...a,
			signature: i
		})));
		return this.failIf(o.length !== n.length, `Mint returned ${o.length} signatures, expected ${n.length}. The mint quote may already be marked issued; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(o, n), await this._ensureKeysetsForSignatures(o), this._logger.debug("MINT COMPLETED", { amounts: n.map((e) => e.blindedMessage.amount.toString()) }), n.map((e, t) => e.toProof(o[t], this.keysetForSignature(o[t].id)));
	}
	async prepareBatchMint(e, t, n, r) {
		this.failIf(t.length === 0, "prepareBatchMint: no entries provided");
		let i = this.requireNut29(e, "prepareBatchMint", "prepareMint"), a = i?.max_batch_size ?? 100;
		if (t.length > a) {
			let e = i?.max_batch_size == null ? "cashu-ts internal cap" : "mint's advertised limit";
			this.failIf(!0, `prepareBatchMint: batch size ${t.length} exceeds ${e} of ${a}`);
		}
		let { privkey: o, keysetId: s, proofsWeHave: c, onCountersReserved: l } = n ?? {};
		for (let e of t) this.failIf(typeof e.quote == "string", "prepareBatchMint: expected a quote object, not a string ID"), this.validateMintQuote(e.quote);
		t.some((e) => "pubkey" in e.quote && e.quote.pubkey) && this.failIf(!o, "Can not sign locked quotes without private key");
		let u = this.getOutputKeyset(s), d = t.map((t) => this.parseAmount(t.amount, `prepareBatchMint: ${e}`)), f = k.sum(d);
		r = r ?? this.defaultOutputType();
		let p = this.configureOutputs(f, u, r, !1, c), m = await this.addCountersToOutputTypes(u.id, p);
		[p] = m.outputTypes, m.used && this.safeCallback(l, m.used, { op: "mintProofs" });
		let h = this.createOutputData(f, u, p), g = h.map((e) => e.blindedMessage), _ = [], v = [], y = !1;
		for (let [e, n] of t.entries()) {
			let t = "pubkey" in n.quote ? n.quote.pubkey : void 0;
			if (t && o) {
				let e = an(t, o);
				_.push(Na(e, n.quote.quote, g)), v.push(ja(e, n.quote.quote, g)), y = !0;
			} else o && !t && this._logger.warn(`prepareBatchMint: privkey supplied but quote #${e + 1} has no pubkey; treating as unlocked`), _.push(null), v.push(null);
		}
		return {
			method: e,
			payload: {
				quotes: t.map((e) => e.quote.quote),
				quote_amounts: d,
				outputs: g,
				...y ? { signatures: _ } : {}
			},
			outputData: h,
			keysetId: u.id,
			quotes: t.map((e) => e.quote),
			...y ? { legacySignatures: v } : {}
		};
	}
	async completeBatchMint(e) {
		let { method: t, payload: n, outputData: r, legacySignatures: i } = e, a = {
			...n,
			outputs: r.map((e) => e.blindedMessage)
		}, { signatures: o } = await this.withStaleKeysetRepair(() => this.withLegacyQuoteSigFallback(i !== void 0, () => this.mint.mintBatch(t, a), () => this.mint.mintBatch(t, {
			...a,
			signatures: i
		})));
		return this.failIf(o.length !== r.length, `Mint returned ${o.length} signatures, expected ${r.length}. The mint quote may already be marked issued; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(o, r), await this._ensureKeysetsForSignatures(o), this._logger.debug("BATCH MINT COMPLETED", {
			quotes: n.quotes.length,
			amounts: r.map((e) => e.blindedMessage.amount.toString())
		}), r.map((e, t) => e.toProof(o[t], this.keysetForSignature(o[t].id)));
	}
	async createMeltQuote(e, t, n) {
		if (t === void 0 || typeof t == "number" || typeof t == "bigint" || typeof t == "object" && "toNumber" in t) return this.createMeltQuoteBolt11(e, t);
		let r = {
			...t,
			unit: this._unit
		}, i = await this.mint.createMeltQuote(e, r, { normalize: n?.normalize });
		return this.warnQuoteUnit(i, `createMeltQuote: ${e}`), {
			...i,
			unit: i.unit || this._unit
		};
	}
	assertBolt11MeltQuoteAmount(e, t) {
		this.meltQuoteExceeds(e, t) && this.fail("Melt quote amount exceeds the invoice amount", {
			quoted: e.amount.toString(),
			invoiceMsat: k.from(t).toString()
		});
	}
	meltQuoteExceeds(e, t) {
		if (this._unit !== "sat" && this._unit !== "msat" || t === null) return !1;
		let n = k.from(t), r = this._unit === "sat" ? n.ceilPercent(1, 1e3) : n;
		return e.amount.greaterThan(r);
	}
	async createMeltQuoteBolt11(e, t) {
		this.requireSupport("melt", "bolt11");
		let n = t === void 0 ? void 0 : this.parseAmount(t, "createMeltQuoteBolt11");
		t !== void 0 && this.failIf(ss(e), "amountMsat supplied but invoice already contains an amount. Leave amountMsat undefined for non-zero invoices.");
		let r = this._mintInfo?.supportsAmountless?.("bolt11", this._unit) ?? !1, i = {
			unit: this._unit,
			request: e,
			...r && n !== void 0 ? { options: { amountless: { amount_msat: n } } } : {}
		}, a = await this.mint.createMeltQuoteBolt11(i), o = null;
		try {
			o = us(e);
		} catch {}
		return o === null && n !== void 0 && (o = n), this.warnQuoteUnit(a, "createMeltQuoteBolt11"), this.assertBolt11MeltQuoteAmount(a, o), {
			...a,
			unit: a.unit || this._unit,
			request: a.request || e
		};
	}
	async createMeltQuoteBolt12(e, t) {
		this.requireSupport("melt", "bolt12");
		let n = t === void 0 ? void 0 : this.parseAmount(t, "createMeltQuoteBolt12"), r = await this.mint.createMeltQuoteBolt12({
			unit: this._unit,
			request: e,
			options: n ? { amountless: { amount_msat: n } } : void 0
		});
		return this.warnQuoteUnit(r, "createMeltQuoteBolt12"), this.meltQuoteExceeds(r, n ?? null) && this.warnQuoteAmount("createMeltQuoteBolt12", `at most ${n.toString()} msat`, r.amount.toString()), r;
	}
	async createMeltQuoteOnchain(e, t) {
		this.requireSupport("melt", "onchain");
		let n = this.parseAmount(t, "createMeltQuoteOnchain"), r = await this.mint.createMeltQuoteOnchain({
			unit: this._unit,
			request: e,
			amount: n
		});
		return this.warnQuoteUnit(r, "createMeltQuoteOnchain"), this.warnQuoteAmount("createMeltQuoteOnchain", n.toString(), r.amount.toString()), {
			...r,
			unit: r.unit || this._unit
		};
	}
	async createMultiPathMeltQuote(e, t) {
		let n = this.parseAmount(t, "createMultiPathMeltQuote"), { supported: r, params: i } = this.getMintInfo().isSupported(15);
		this.failIf(!r, "Mint does not support NUT-15"), this.failIf(!i?.some((e) => e.method === "bolt11" && e.unit === this._unit), `Mint does not support MPP for bolt11 and ${this._unit}`);
		let a = {
			unit: this._unit,
			request: e,
			options: { mpp: { amount: n } }
		}, o = await this.mint.createMeltQuoteBolt11(a);
		return this.warnQuoteUnit(o, "createMultiPathMeltQuote"), this.assertBolt11MeltQuoteAmount(o, n), {
			...o,
			request: e,
			unit: this._unit
		};
	}
	async checkMeltQuote(e, t, n) {
		let r = typeof t == "string" ? t : t.quote;
		return this.mint.checkMeltQuote(e, r, { normalize: n?.normalize });
	}
	async checkMeltQuoteBolt11(e) {
		let t = typeof e == "string" ? e : e.quote, n = await this.mint.checkMeltQuoteBolt11(t);
		if (this._unit === "sat" || this._unit === "msat") {
			let e = null;
			try {
				e = us(n.request);
			} catch {
				this.fail("Melt quote request is not a valid bolt11 invoice", { quote: n.quote });
			}
			this.assertBolt11MeltQuoteAmount(n, e);
		}
		return n;
	}
	async checkMeltQuoteBolt12(e) {
		return this.mint.checkMeltQuoteBolt12(e);
	}
	async checkMeltQuoteOnchain(e) {
		return this.mint.checkMeltQuoteOnchain(e);
	}
	async meltProofs(e, t, n, r, i) {
		if (typeof e != "string") return this.meltProofsBolt11(e, t, n, r);
		let a = await this.prepareMelt(e, t, n, r, i);
		return this.completeMelt(a, r?.privkey);
	}
	async meltProofsBolt11(e, t, n, r) {
		this.requireSupport("melt", "bolt11");
		let i = await this.prepareMelt("bolt11", e, t, n, r);
		return this.completeMelt(i, n?.privkey);
	}
	async meltProofsBolt12(e, t, n, r) {
		this.requireSupport("melt", "bolt12");
		let i = await this.prepareMelt("bolt12", e, t, n, r);
		return this.completeMelt(i, n?.privkey);
	}
	async meltProofsOnchain(e, t, n, r) {
		this.requireSupport("melt", "onchain"), this.validateMeltQuote(e);
		let i = e.fee_options.find((e) => e.fee_index === n);
		this.failIfNullish(i, "feeIndex must match an onchain melt quote fee option", {
			feeIndex: n,
			feeOptions: e.fee_options.map((e) => e.fee_index)
		});
		let a = X(t);
		await this._ensureOperableKeysets(a.map((e) => e.id), {
			implicit: !0,
			fetchKeys: !1
		});
		let o = this.getFeesForProofs(a), s = Y(a), c = e.amount.add(i.fee_reserve).add(o);
		this.failIf(s.lessThan(c), "Not enough proofs to cover amount + fee", {
			sendAmount: s.toString(),
			totalRequired: c.toString(),
			amount: e.amount.toString(),
			fee_reserve: i.fee_reserve.toString(),
			inputFee: o.toString()
		});
		let l = await this.prepareMelt("onchain", e, a, r);
		return await this.completeMelt(l, r?.privkey, { extraPayload: { fee_index: n } });
	}
	async prepareMelt(e, t, n, r, i) {
		this.validateMeltQuote(t), i = i ?? this.defaultOutputType();
		let { keysetId: a, onCountersReserved: o, nut08Change: s = !0 } = r || {};
		try {
			await this._ensureOperableKeysets(n.map((e) => e.id), {
				implicit: !0,
				fetchKeys: !1
			});
		} catch (e) {
			if (this._strictCachedKeysets || !(e instanceof ie)) throw e;
			this._logger.warn("Melt input keyset is not listed by the mint; proceeding anyway", { keyset: e.keysetId });
		}
		let c = this.getKeyset(a), l = X(n), u = Y(l), d = [];
		this.failIf(u.lessThan(t.amount), "Not enough proofs to cover amount + fee reserve", {
			sendAmount: u.toString(),
			quoteAmount: t.amount.toString()
		});
		let f = u.subtract(t.amount);
		if (i.type === "custom") d = i.data;
		else if (s && f.greaterThan(0)) {
			this.failIf(!c.isActive, "Melt change keyset is inactive. Use an active keyset or set nut08Change: false to forfeit it", { keyset: c.id }), c = this.getOutputKeyset(a);
			let e = Math.max(Tc(f.toBigInt()), 1), t = Array(e).fill(0);
			this._logger.debug("Creating NUT-08 blanks for fee reserve", {
				feeReserve: f,
				denominations: t
			});
			let n = {
				...i,
				denominations: t
			}, r = await this.addCountersToOutputTypes(c.id, n);
			[n] = r.outputTypes, r.used && this.safeCallback(o, r.used, { op: "meltProofs" }), this._logger.debug("melt counter", {
				counter: r.used,
				meltOT: kc(n)
			}), d = this.createOutputData(0, c, n);
		}
		return {
			method: e,
			inputs: l,
			outputData: d,
			keysetId: c.id,
			quote: t
		};
	}
	async completeMelt(e, t, n) {
		let r = typeof n == "boolean" ? { preferAsync: n } : n ?? {}, i = e.inputs, a = e.outputData.map((e) => e.blindedMessage), o = e.quote.quote;
		t && (i = this.signP2PKProofs(i, t, e.outputData, o)), i = this._prepareInputsForMint(i);
		let s = r.extraPayload;
		if (s) {
			let e = [
				"quote",
				"inputs",
				"outputs",
				"prefer_async"
			], t = Object.keys(s).filter((t) => e.includes(t));
			this.failIf(t.length > 0, "extraPayload cannot override reserved melt fields", { reserved: t });
		}
		let c = {
			quote: o,
			inputs: i,
			outputs: a,
			...r.preferAsync ? { prefer_async: !0 } : {},
			...s
		}, l = await this.withStaleKeysetRepair(() => this.mint.melt(e.method, c)), u = {
			...e.quote,
			...l
		}, d = l.change ?? [], f;
		try {
			d.length > 0 && await this._ensureOperableKeysets(d.filter((e) => !e.amount.isZero()).map((e) => e.id), { implicit: !0 }), f = this.createMeltChangeProofs(e.outputData, d);
		} catch (t) {
			throw new ae(e.outputData, u, { cause: t });
		}
		let p = f.map((e) => e.amount.toString());
		return r.preferAsync ? this._logger.debug("ASYNC MELT REQUESTED", {
			state: l.state,
			changeAmounts: p
		}) : this._logger.debug("MELT COMPLETED", { changeAmounts: p }), {
			quote: u,
			change: f,
			outputData: f.length > 0 ? [] : e.outputData
		};
	}
	createMeltChangeProofs(e, t) {
		this.failIf(t.length > e.length, `Mint returned ${t.length} signatures, but only ${e.length} blanks were provided. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`);
		let n = t.map((e) => e && {
			...e,
			amount: k.from(e.amount)
		});
		this.validateReturnedSignatures(n, e);
		let r = n.filter((e) => e.amount.isZero()).length;
		r > 0 && this._logger.warn("Mint returned zero-value change signatures, which NUT-08 requires it to omit", {
			mintUrl: this.mint.mintUrl,
			count: r
		});
		let i = [];
		return n.forEach((t, n) => {
			t.amount.isZero() || i.push(e[n].toProof(t, this.keysetForSignature(t.id)));
		}), i;
	}
	_ensureKeysetsForSignatures(e) {
		return this._ensureOperableKeysets(e.map((e) => e?.amount.isZero() ? void 0 : e?.id), { implicit: !0 });
	}
	keysetForSignature(e) {
		try {
			return this.getKeyset(e);
		} catch (t) {
			throw new x(`Cannot reconstruct proof: keyset ${e} is not loaded in this wallet (may be inactive after rotation). If the wallet is seeded, try restoring (NUT-09) to recover.`, { cause: t });
		}
	}
	async checkProofsStates(e) {
		let t = new TextEncoder(), n = e.map((e) => (e.id !== void 0 && Ko(e.id, this._logger), M(t.encode(e.secret)).toHex(!0))), r = this.maxArrayLength, i = [];
		for (let e = 0; e < n.length; e += r) {
			let t = n.slice(e, e + r), { states: a } = await this.mint.check({ Ys: t }), o = {};
			a.forEach((e) => {
				o[e.Y] = e;
			});
			for (let e = 0; e < t.length; e++) {
				let n = o[t[e]];
				this.failIfNullish(n, "Could not find state for proof with Y: " + t[e]), i.push(n);
			}
		}
		return i;
	}
	async verifyMintSignatures(e, t) {
		if (t?.signal?.aborted) throw new w("Operation aborted by caller");
		if (this.failIf(e.length > pe, `Token contains too many proofs: ${e.length}, maximum is ${pe}`), !this._strictCachedKeysets) for (let n of new Set(e.map((e) => e.id))) {
			if (t?.signal?.aborted) throw new w("Operation aborted by caller");
			try {
				await this._keyChain.ensureKeysetKeys(n);
			} catch {}
		}
		return bs(e, (e) => this._keyChain.getKeyset(e), t);
	}
	async groupProofsByState(e) {
		let t = await this.checkProofsStates(e), n = {
			unspent: [],
			pending: [],
			spent: []
		};
		for (let r = 0; r < t.length; r++) {
			let i = e[r];
			switch (t[r].state) {
				case ks.UNSPENT:
					n.unspent.push(i);
					break;
				case ks.PENDING:
					n.pending.push(i);
					break;
				case ks.SPENT: n.spent.push(i);
			}
		}
		return n;
	}
}, Qc, $c = class e {
	constructor(e, t) {
		this.tokenGeneration = 0, this.sessionGeneration = 0, this.tokens = {}, this.pool = [], this.desiredPoolSize = 100, this.maxPerMint = 100, this.mintUrl = e, this.req = t?.request ?? rc, this.logger = t?.logger ?? E;
		let n = Math.max(1, t?.desiredPoolSize ?? this.desiredPoolSize), r = Math.max(1, t?.maxPerMint ?? this.maxPerMint);
		this.desiredPoolSize = Math.min(n, 100), this.maxPerMint = Math.min(r, 100), this.desiredPoolSize !== n && this.logger.warn("AuthManager: desiredPoolSize exceeds internal cap and was clamped", {
			configured: n,
			clampedTo: this.desiredPoolSize
		}), this.maxPerMint !== r && this.logger.warn("AuthManager: maxPerMint exceeds internal cap and was clamped", {
			configured: r,
			clampedTo: this.maxPerMint
		});
	}
	attachOIDC(e) {
		return this.oidc && this.oidcListener && this.oidc.removeTokenListener(this.oidcListener), this.oidc && this.oidc !== e && (this.tokens = {}), this.tokenGeneration++, this.sessionGeneration++, this.oidc = e, this.bindOIDC(), this;
	}
	bindOIDC() {
		let e = this.oidc;
		if (!e) return;
		this.oidcListener && e.removeTokenListener(this.oidcListener);
		let t = (n, r) => {
			this.oidc !== e || r === "refresh" && this.oidcListener !== t ? this.logger.warn("AuthManager: ignoring tokens from an earlier session") : this.updateFromOIDC(n, r);
		};
		this.oidcListener = t, e.addTokenListener(t);
	}
	get poolSize() {
		return this.pool.length;
	}
	get poolTarget() {
		return this.desiredPoolSize;
	}
	get activeAuthKeysetId() {
		try {
			return this.keychain?.getCheapestKeyset().id;
		} catch {
			return;
		}
	}
	get hasCAT() {
		return !!this.tokens.accessToken;
	}
	getCAT() {
		return this.tokens.accessToken;
	}
	setCAT(e) {
		this.tokenGeneration++, this.sessionGeneration++, this.tokens = { accessToken: e }, this.bindOIDC();
	}
	async ensureCAT(e) {
		if (this.validForAtLeast(e) || !this.oidc || !this.tokens.refreshToken) return this.tokens.accessToken;
		if (this.inflightRefresh?.session !== this.sessionGeneration) {
			let e = this.tokenGeneration, t = this.sessionGeneration, n = (async () => {
				try {
					let t = await this.oidc.refresh(this.tokens.refreshToken);
					this.tokenGeneration === e && this.updateFromOIDC(t, "refresh");
				} catch (e) {
					this.logger.warn("AuthManager: CAT refresh failed", { err: e });
				}
			})();
			this.inflightRefresh = {
				session: t,
				promise: n
			};
		}
		let t = this.inflightRefresh;
		try {
			await t.promise;
		} finally {
			this.inflightRefresh === t && (this.inflightRefresh = void 0);
		}
		return this.validForAtLeast(0) ? this.tokens.accessToken : void 0;
	}
	validForAtLeast(t = e.MIN_VALID_SECS) {
		let { accessToken: n, expiresAt: r } = this.tokens;
		return n ? !r || Date.now() + t * 1e3 < r : !1;
	}
	updateFromOIDC(e, t) {
		if (!e.access_token) return;
		this.tokenGeneration++, t === "signin" && this.sessionGeneration++;
		let n = Date.now();
		if (this.tokens.accessToken = e.access_token, this.tokens.refreshToken = e.refresh_token || (t === "refresh" ? this.tokens.refreshToken : void 0), typeof e.expires_in == "number" && e.expires_in > 0) this.tokens.expiresAt = n + e.expires_in * 1e3;
		else {
			let t = this.parseJwtExpSec(e.access_token);
			this.tokens.expiresAt = t ? t * 1e3 : void 0;
		}
		this.bindOIDC(), this.logger.debug("AuthManager: OIDC tokens updated", { expiresAt: this.tokens.expiresAt });
	}
	async ensure(e) {
		if (await this.init(), this.pool.length >= e) return;
		let t = Math.max(this.desiredPoolSize, e), n = this.getBatMaxMint(), r = Math.min(t - this.pool.length, n);
		r <= 0 || await this.topUp(r);
	}
	async getBlindAuthToken({ method: e, path: t }) {
		return this.info && !this.info.requiresBlindAuthToken(e, t) && this.logger.warn("Endpoint is not marked as protected by NUT-22; still issuing BAT", {
			method: e,
			path: t
		}), this.withLock(async () => {
			if (await this.ensure(1), this.pool.length === 0) throw new x("AuthManager: no BATs available and minting failed");
			let n = this.pool.pop();
			return this.logger.debug("AuthManager: BAT requested", {
				method: e,
				path: t,
				remaining: this.pool.length
			}), el(n);
		});
	}
	importPool(e, t = "replace") {
		t === "replace" && (this.pool = []);
		let n = new Map(this.pool.map((e) => [e.secret, e]));
		for (let t of e) t && t.secret && t.C && t.id && (n.has(t.secret) || (this.pool.push(t), n.set(t.secret, t)));
	}
	exportPool() {
		return this.pool.map((e) => ({
			...e,
			dleq: e.dleq ? { ...e.dleq } : void 0
		}));
	}
	parseJwtExpSec(e) {
		if (!e) return;
		let t = e.split(".");
		if (t.length === 3) try {
			let e = Ae(it(t[1])), n = JSON.parse(e), r = typeof n.exp == "number" ? n.exp : Number(n.exp);
			if (Number.isFinite(r) && r > 0) return r;
		} catch {
			this.logger.warn("JWT access token was malformed.");
		}
	}
	async withLock(e) {
		let t = this.lockChain ?? Promise.resolve(), n, r = new Promise((e) => {
			n = e;
		}), i = t.then(() => r);
		this.lockChain = i;
		try {
			return await t, await e();
		} finally {
			n(), this.lockChain === i && (this.lockChain = void 0);
		}
	}
	async init() {
		if (!this.info) {
			let e = await this.req({
				endpoint: J(this.mintUrl, "/v1/info"),
				method: "GET",
				logger: this.logger
			});
			this.info = new Q(e, this.logger);
		}
		if (!this.keychain) {
			let [e, t] = await Promise.all([this.req({
				endpoint: J(this.mintUrl, "/v1/auth/blind/keysets"),
				method: "GET",
				logger: this.logger
			}), this.req({
				endpoint: J(this.mintUrl, "/v1/auth/blind/keys"),
				method: "GET",
				logger: this.logger
			})]);
			if (!Array.isArray(e.keysets) || !Array.isArray(t.keysets)) throw new x("AuthManager: mint returned malformed auth keysets");
			if (e.keysets.length > 1e4 || t.keysets.length > 1e4) throw new x("AuthManager: mint returned more auth keysets than can be processed");
			let n = e.keysets.map((e) => Cs(e)), r = t.keysets.map((e) => ws(e)), i = hc.mintToCacheDTO(this.mintUrl, n, r);
			this.keychain = hc.fromCache(this.mintUrl, "auth", i), this.keychain.getCheapestKeyset();
		}
	}
	getBatMaxMint() {
		if (!this.info) throw new x("AuthManager: mint info not loaded");
		let e = this.info.nuts[22], t = Z(e?.bat_max_mint, "nuts.22.bat_max_mint", this.maxPerMint);
		return Math.max(1, Math.min(this.maxPerMint, t));
	}
	getActiveKeys() {
		if (!this.keychain) throw new x("AuthManager: keyset not loaded for active keyset");
		return this.keychain.getCheapestKeyset();
	}
	async topUp(e) {
		if (!this.info) throw new x("AuthManager: mint info not loaded");
		let t = this.info.requiresClearAuthToken("POST", "/v1/auth/blind/mint"), n = this.sessionGeneration, r;
		if (t) {
			if (r = await this.ensureCAT(), this.sessionGeneration !== n) throw new x("AuthManager: session changed while obtaining BATs");
			if (!r) throw new x("AuthManager: Clear-auth token required for /v1/auth/blind/mint but not available. Authenticate with the mint to obtain a CAT first.");
		}
		let i = this.getActiveKeys(), a = I.createRandomData(e, i), o = { outputs: a.map((e) => e.blindedMessage) }, s = {};
		r && (s["Clear-auth"] = r);
		let c = await this.req({
			endpoint: J(this.mintUrl, "/v1/auth/blind/mint"),
			method: "POST",
			headers: s,
			...r ? { redirect: "error" } : {},
			requestBody: o,
			logger: this.logger
		});
		if (!Array.isArray(c?.signatures) || c.signatures.length !== a.length) throw new x("AuthManager: bad BAT mint response");
		let l = c.signatures.map((e) => ({
			...e,
			amount: k.from(e.amount)
		})), u = a.map((e, t) => e.toProof(l[t], i));
		for (let e of u) if (!ns(e, i)) throw new x("AuthManager: mint returned BAT with invalid DLEQ");
		if (t && this.sessionGeneration !== n) throw new x("AuthManager: session changed while obtaining BATs");
		this.pool.push(...u), this.logger.debug("AuthManager: performed topUp", {
			minted: u.length,
			pool: this.pool.length
		});
	}
};
Qc = $c, Qc.MIN_VALID_SECS = 30;
function el(e) {
	let t = JSON.stringify({
		id: e.id,
		secret: e.secret,
		C: e.C
	});
	return `authA${rt(o(t))}`;
}
// src/auth/createAuthWallet.ts
async function tl(e, t) {
	let n = new $c(e, {
		desiredPoolSize: t?.authPool ?? 10,
		maxPerMint: t?.authPool ?? 10,
		logger: t?.logger
	}), r = new fc(e, {
		authProvider: n,
		logger: t?.logger
	}), i = await r.oidcAuth({
		...t?.oidc,
		logger: t?.logger
	});
	n.attachOIDC(i);
	let a = new Zc(r, {
		authProvider: n,
		logger: t?.logger
	});
	return await a.loadMint(), {
		mint: r,
		auth: n,
		oidc: i,
		wallet: a
	};
}
// src/model/SigAll.ts
var nl = "sigallA";
function rl(e, t, n) {
	return { v0: $t(na(e, t.map((e) => ({ blindedMessage: e })), n), !0) };
}
function il(e) {
	let t = {
		version: e.version,
		type: e.type
	};
	e.quote && (t.quote = e.quote), t.inputs = e.inputs, t.outputs = e.outputs, e.witness && (t.witness = e.witness);
	let n = A.stringify(t) ?? "{}";
	return `${nl}${nt(o(n))}`;
}
function al(e) {
	if (!e.startsWith(nl)) throw new x(`Invalid signing package: must start with "${nl}"`);
	if (e.length - 7 > 1048576) throw new x(`Signing package exceeds ${ye} characters`);
	let t = e.slice(7), n;
	try {
		n = Ae(it(t));
	} catch (e) {
		throw new x(`Failed to parse signing package: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
	}
	let r;
	try {
		r = A.parse(n, void 0, { strict: !0 });
	} catch (e) {
		throw new x(`Failed to parse signing package JSON: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
	}
	if (!r || typeof r != "object") throw new x("Signing package must be a JSON object");
	let i = r, a = i.version;
	if (a !== nl) throw new x(`Invalid signing package version: ${a}`);
	let o = i.type;
	if (o !== "swap" && o !== "melt") throw new x(`Invalid signing package type: ${o}`);
	if (o === "melt" && (typeof i.quote != "string" || i.quote.length === 0)) throw new x("Melt signing package requires a quote");
	if (!Array.isArray(i.inputs)) throw new x("Signing package inputs must be an array");
	for (let e = 0; e < i.inputs.length; e++) {
		let t = i.inputs[e];
		if (!t || typeof t != "object") throw new x(`Invalid input at index ${e}`);
		if (typeof t.secret != "string") throw new x(`Input ${e}: secret must be string`);
		if (typeof t.C != "string") throw new x(`Input ${e}: C must be string`);
	}
	if (!Array.isArray(i.outputs)) throw new x("Signing package outputs must be an array");
	for (let e = 0; e < i.outputs.length; e++) {
		let t = i.outputs[e];
		if (!t || typeof t != "object") throw new x(`Invalid output at index ${e}`);
		if (typeof t.amount != "number" && typeof t.amount != "bigint") throw new x(`Output ${e}: amount must be a number or bigint`);
		if (!t.B_ || typeof t.B_ != "string") throw new x(`Output ${e}: B_ invalid`);
		if (!t.id || typeof t.id != "string") throw new x(`Output ${e}: id invalid`);
		t.amount = k.from(t.amount);
	}
	if (i.witness !== void 0) {
		let e = i.witness;
		if (!e || typeof e != "object" || !Array.isArray(e.signatures) || e.signatures.some((e) => typeof e != "string")) throw new x("Signing package witness.signatures must be a string array");
	}
	return {
		version: nl,
		type: o,
		...o === "melt" ? { quote: i.quote } : {},
		inputs: i.inputs.map((e) => ({
			secret: e.secret,
			C: e.C
		})),
		outputs: i.outputs.map((e) => ({
			amount: e.amount,
			id: e.id,
			B_: e.B_
		})),
		...i.witness ? { witness: { signatures: i.witness.signatures } } : {}
	};
}
var ol = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, sl = /^[0-9a-f]{64}$/i, cl = /^0[23][0-9a-f]{64}$/i;
function ll(e) {
	if (!cl.test(e)) return !1;
	try {
		return N(e), !0;
	} catch {
		return !1;
	}
}
function ul(e, t) {
	if (!sl.test(t)) throw new x("Private key must be 64 hex characters");
	if ((e.witness?.signatures.length ?? 0) >= 64) throw new x("Witness already at the 64-signature limit");
	if (ta(e.inputs), e.inputs.forEach((e, t) => {
		if (!ll(e.C)) throw new x(`Input ${t}: C must be a compressed secp256k1 point`);
	}), e.outputs.forEach((e, t) => {
		if (!ll(e.B_)) throw new x(`Output ${t}: B_ must be a compressed secp256k1 point`);
	}), e.quote !== void 0 && !ol.test(e.quote)) throw new x("Melt quote id must be a UUID");
	Yi(e.inputs[0].secret, t);
}
function dl(e, t) {
	ul(e, t);
	let n = [F(rl(e.inputs, e.outputs, e.quote).v0, t)];
	return {
		...e,
		witness: { signatures: [...e.witness?.signatures || [], ...n] }
	};
}
function fl(e) {
	let t = [...e.keepOutputs || [], ...e.sendOutputs || []];
	return ml("swap", e.inputs, t.map((e) => e.blindedMessage));
}
function pl(e) {
	return ml("melt", e.inputs, e.outputData.map((e) => e.blindedMessage), e.quote.quote);
}
function ml(e, t, n, r) {
	return {
		version: nl,
		type: e,
		...r ? { quote: r } : {},
		inputs: t.map((e) => ({
			secret: e.secret,
			C: e.C
		})),
		outputs: n
	};
}
function hl(e, t) {
	let n = _l(t.inputs, e);
	return {
		...t,
		inputs: n
	};
}
function gl(e, t) {
	let n = _l(t.inputs, e);
	return {
		...t,
		inputs: n
	};
}
function _l(e, t) {
	if (!t.witness?.signatures.length) throw new x("No signatures to merge");
	if (e.length === 0) return e;
	let [n, ...r] = e, i = qi(n.witness), a = i?.signatures ?? [];
	return [{
		...n,
		witness: {
			...i ?? {},
			signatures: [...a, ...t.witness.signatures]
		}
	}, ...r];
}
var vl = {
	computeDigests: rl,
	extractSwapPackage: fl,
	extractMeltPackage: pl,
	serializePackage: il,
	deserializePackage: al,
	signPackage: dl,
	signDigest: F,
	mergeSwapPackage: hl,
	mergeMeltPackage: gl
};
export { k as Amount, T as AmountError, Be as AmountWithUnit, re as AmountWithUnitError, $c as AuthManager, x as CTSError, w as CallerAbortError, fc as CashuMint, fc as Mint, Zc as CashuWallet, Zc as Wallet, ks as CheckStateEnum, Te as ConsoleLogger, S as HttpResponseError, A as JSONInt, hc as KeyChain, pc as Keyset, Kt as LEGACY_KEYSET_ID_LENGTH, _c as LockBuilder, Wo as MAX_SUPPORTED_KEYSET_VERSION_BYTE, qc as MeltBuilder, ae as MeltChangeError, Jc as MeltOnchainBuilder, Os as MeltQuoteState, Kc as MintBuilder, Q as MintInfo, ce as MintOperationError, Ds as MintQuoteState, C as NetworkError, Es as OIDCAuth, I as OutputData, ji as P2BK_DST, vc as P2PKBuilder, Co as PaymentRequest, Pa as PaymentRequestTransportType, se as RateLimitError, Gc as ReceiveBuilder, Wc as SendBuilder, vl as SigAll, Ii as SigFlags, oe as StaleKeysetError, ne as UncancellableReadError, ie as UnknownKeysetError, uc as WSConnection, Pc as WalletCounters, Hc as WalletEvents, Uc as WalletOps, mn as assertCanonicalKeysetId, Gt as assertSecpPoint, Si as assertSecretKind, ta as assertSigAllInputs, Yi as assertSignerAuthorised, Ko as assertSpendableVersion, jo as bigIntStringify, P as blindMessage, us as bolt11AmountMsat, ds as bolt11PaymentHash, fs as bolt11PreimageMatches, Zr as buildCtfRangeRecoveryQuery, na as buildP2PKSigAllMessageV0, $r as classifyCtfSettlementRecovery, An as computeCtfManifestCommitment, kn as computeCtfReceiveCommitment, In as computeCtfSettlementCoordinatorDigest, Fn as computeCtfSettlementRequestDigest, $t as computeMessageDigest, Un as computePayToUnlockRefundDigest, Qt as constructUnblindedSignature, tl as createAuthWallet, Yt as createBlindSignature, Xr as createCtfAuthorizationOutputs, Vr as createCtfAuthorizationOutputsFromCounters, Bn as createCtfPayToUnlockSecret, qr as createCtfRangeManifest, zr as createCtfRangeManifestFromCounters, jn as createCtfSelectionBitmap, va as createDLEQProof, Nc as createEphemeralCounterSource, xa as createHTLCHash, ya as createHTLCsecret, vi as createNewMintKeys, Bi as createP2PKsecret, Xt as createRandomRawBlindedMessage, Jt as createRandomSecretKey, bi as createSecret, jr as createSecretAndBlindingFactorDeriver, $o as decodePaymentRequest, Hi as dedupeP2PKPubkeys, kr as deriveBlindingFactor, fn as deriveConditionalKeysetId, Jr as deriveCtfRangeManifestOutputData, Br as deriveCtfRangeOutputFromCounter, Qr as deriveCtfRangeRecoverySelection, Yr as deriveCtfRangeRefundKey, qo as deriveKeysetId, Mi as deriveP2BKBlindedPubkeys, Pi as deriveP2BKSecretKey, Ni as deriveP2BKSecretKeys, Or as deriveSecret, Ar as deriveSecretAndBlindingFactor, gi as deserializeMintKeys, Qo as deserializeProofs, Cc as deserializeSwapPreview, an as findSigningKey, Ti as getDataField, Vo as getDecodedToken, as as getDecodedTokenBinary, No as getEncodedToken, No as getEncodedTokenV4, is as getEncodedTokenBinary, Ta as getHTLCWitnessPreimage, wo as getKeysetAmounts, qt as getKeysetIdInt, Wi as getP2PKExpectedWitnessPubkeys, Gi as getP2PKSigFlag, Ki as getP2PKWitnessSignatures, _i as getPubKeyFromPrivKey, wi as getSecretData, Ci as getSecretKind, Oi as getTag, B as getTagInt, ki as getTagScalar, Ei as getTags, Ho as getTokenMetadata, on as getValidSigners, Eo as hasCorrespondingKey, Zi as hasP2PKSignedProof, Di as hasTag, ns as hasValidDleq, M as hashToCurve, Ut as hash_e, Oo as hexToNumber, ac as injectWebSocketImpl, ss as invoiceHasAmountInHRP, wa as isHTLCSpendAuthorised, le as isMintOperationError, G as isObj, zi as isP2PKKnownTagKey, ra as isP2PKSigAll, $i as isP2PKSpendAuthorised, K as isRecord, W as isValidHex, J as joinUrls, ea as maybeDeriveP2BKPrivateKeys, sn as meetsSignerThreshold, Vt as mnemonicToSeedSync, Xo as normalizeMintUrl, Ui as normalizeP2PKOptions, X as normalizeProofAmounts, q as nullIfUndefined, ko as numberToHexPadded64, Vn as parseCtfPayToUnlockCondition, Mn as parseCtfSelectionBitmap, ba as parseHTLCSecret, V as parseP2PKSecret, xi as parseSecret, qi as parseWitnessData, Wt as pointFromBytes, N as pointFromHex, ei as recoverCtfRangeProofs, F as schnorrSignDigest, en as schnorrSignMessage, nn as schnorrVerifyDigest, tn as schnorrVerifyMessage, Nn as selectCtfManifestOutputs, Pn as selectCtfRangeAmounts, yc as selectProofsRGLI, bc as selectProofsRotating, hi as serializeMintKeys, Zo as serializeProofs, Sc as serializeSwapPreview, Hs as setGlobalRequestOptions, Ln as signCtfSettlementRequest, ja as signMintQuote, Xi as signP2PKProof, Ji as signP2PKProofs, Wn as signPayToUnlockRefund, Yo as sortProofsById, U as splitAmount, es as stripDleq, Y as sumProofs, Zt as unblindSignature, Hn as validateCtfPoolPolicyTotals, Rn as verifyCtfSettlementCoordinatorSignature, ga as verifyDLEQProof, _a as verifyDLEQProof_reblind, rs as verifyDleqIfPresent, Sa as verifyHTLCHash, Ca as verifyHTLCSpendingConditions, Ma as verifyMintQuoteSignature, bs as verifyMintSignatures, Qi as verifyP2PKSpendingConditions, xs as verifyReceivedProofs, yi as verifyUnblindedSignature, Go as versionName };

//# sourceMappingURL=cashu-ts.es.js.map