import { bytesToHex as e, bytesToNumberBE as t, hexToBytes as n, numberToBytesBE as r, randomBytes as i } from "@noble/curves/utils.js";
import { sha256 as a } from "@noble/hashes/sha2.js";
import { bech32 as o, bech32m as s } from "@scure/base";
import { schnorr as c, secp256k1 as l } from "@noble/curves/secp256k1.js";
import { hmac as u } from "@noble/hashes/hmac.js";
import { bytesToHex as d, concatBytes as f, hexToBytes as p, randomBytes as m, utf8ToBytes as h } from "@noble/hashes/utils.js";
import { bls12_381 as g } from "@noble/curves/bls12-381.js";
import { HDKey as _ } from "@scure/bip32";
//#region src/model/Errors.ts
var v = class e extends Error {
	constructor(t, n) {
		super(t), this.name = "CTSError", n?.cause !== void 0 && Object.defineProperty(this, "cause", {
			configurable: !0,
			enumerable: !1,
			value: n.cause,
			writable: !0
		}), Object.setPrototypeOf(this, e.prototype);
	}
}, y = class e extends v {
	constructor(t, n, r) {
		super(t, r), this.status = n, this.name = "HttpResponseError", Object.setPrototypeOf(this, e.prototype);
	}
}, b = class e extends v {
	constructor(t, n) {
		super(t, n), this.name = "NetworkError", Object.setPrototypeOf(this, e.prototype);
	}
}, x = class e extends y {
	constructor(t, n) {
		super(t, 429), this.retryAfterMs = n, this.name = "RateLimitError", Object.setPrototypeOf(this, e.prototype);
	}
}, S = class e extends y {
	constructor(t, n) {
		super(n || "Unknown mint operation error", 400), this.code = t, this.name = "MintOperationError", Object.setPrototypeOf(this, e.prototype);
	}
}, C = {
	error() {},
	warn() {},
	info() {},
	debug() {},
	trace() {},
	log() {}
};
//#endregion
//#region src/logger/helpers.ts
function ee(e, t = C, n) {
	throw t.error(e, n), new v(e);
}
function w(e, t, n = C, r) {
	e && ee(t, n, r);
}
function te(e, t, n = C, r) {
	e ?? ee(t, n, r);
}
function T(e, t, n = C, r) {
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
//#endregion
//#region src/logger/ConsoleLogger.ts
var E = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
	trace: 4
}, ne = class {
	constructor(e = "info") {
		this.minLevel = e;
	}
	should(e) {
		return E[e] <= E[this.minLevel];
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
		return `[${e.toUpperCase()}] ${t}`;
	}
	flattenContext(e) {
		if (!e) return;
		let t = {};
		for (let [n, r] of Object.entries(e)) t[n] = r instanceof Error ? {
			message: r.message,
			stack: r.stack
		} : r;
		return t;
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
function re() {
	let e = Date.now();
	return { elapsed: () => Date.now() - e };
}
//#endregion
//#region src/utils/Bytes.ts
function ie() {
	return globalThis.Buffer;
}
var D = class {
	static fromHex(e) {
		if (e = e.trim(), e.length === 0) return new Uint8Array();
		if (e.length < 2 || e.length & 1) throw new v("Invalid hex string: odd length.");
		if ((e.startsWith("0x") || e.startsWith("0X")) && (e = e.slice(2)), !e.match(/^[0-9a-fA-F]*$/)) throw new v("Invalid hex string: contains non-hex characters");
		let t = e.match(/.{1,2}/g);
		if (!t) throw new v("Invalid hex string");
		return new Uint8Array(t.map((e) => parseInt(e, 16)));
	}
	static toHex(e) {
		return Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("");
	}
	static fromString(e) {
		return e = e.trim(), new TextEncoder().encode(e);
	}
	static toString(e) {
		return new TextDecoder("utf-8").decode(e);
	}
	static concat(...e) {
		let t = e.reduce((e, t) => e + t.length, 0), n = new Uint8Array(t), r = 0;
		for (let t of e) n.set(t, r), r += t.length;
		return n;
	}
	static alloc(e) {
		return new Uint8Array(e);
	}
	static writeBigUint64BE(e) {
		let t = /* @__PURE__ */ new ArrayBuffer(8);
		return new DataView(t).setBigUint64(0, e, !1), new Uint8Array(t);
	}
	static toBase64(e) {
		let t = ie();
		if (t) return t.from(e).toString("base64");
		if (e.length > 32768) {
			let t = "";
			for (let n = 0; n < e.length; n += 32768) {
				let r = e.slice(n, n + 32768);
				t += btoa(String.fromCharCode(...r));
			}
			return t;
		}
		return btoa(String.fromCharCode(...e));
	}
	static fromBase64(e) {
		e = e.trim();
		let t = e.replace(/-/g, "+").replace(/_/g, "/");
		for (; t.length % 4;) t += "=";
		let n = ie();
		return n ? new Uint8Array(n.from(t, "base64")) : new Uint8Array([...atob(t)].map((e) => e.charCodeAt(0)));
	}
	static equals(e, t) {
		if (e.length !== t.length) return !1;
		let n = 0;
		for (let r = 0; r < e.length; r++) n |= e[r] ^ t[r];
		return n === 0;
	}
	static compare(e, t) {
		let n = Math.min(e.length, t.length);
		for (let r = 0; r < n; r++) {
			if (e[r] < t[r]) return -1;
			if (e[r] > t[r]) return 1;
		}
		return e.length - t.length;
	}
	static toBigInt(e) {
		let t = 0n;
		for (let n of e) t = t << 8n | BigInt(n);
		return t;
	}
	static fromBigInt(e) {
		if (e < 0n) throw RangeError("value must be non-negative");
		if (e === 0n) return new Uint8Array([0]);
		let t = e, n = 0;
		for (; t > 0n;) n++, t >>= 8n;
		let r = new Uint8Array(n);
		t = e;
		for (let e = n - 1; e >= 0; e--) r[e] = Number(t & 255n), t >>= 8n;
		return r;
	}
}, O = class e extends v {
	constructor(t) {
		super(t), this.name = "AmountError", Object.setPrototypeOf(this, e.prototype);
	}
}, k = class e {
	constructor(e) {
		this.value = e, Object.freeze(this);
	}
	static from(t) {
		if (t instanceof e) return t;
		if (typeof t == "bigint") {
			if (t < 0n) throw new O(`Amount must be >= 0, got ${t}`);
			return new e(t);
		}
		if (typeof t == "number") {
			if (!Number.isFinite(t) || !Number.isInteger(t)) throw new O(`Invalid number amount: ${t}`);
			if (t < 0) throw new O(`Amount must be >= 0, got ${t}`);
			if (!Number.isSafeInteger(t)) throw new O(`Unsafe integer amount: ${t}. Use bigint or decimal string.`);
			return new e(BigInt(t));
		}
		if (typeof t == "string") {
			if (!/^(0|[1-9]\d*)$/.test(t)) throw new O(`Invalid amount string "${t}". Expected non-negative decimal integer.`);
			return new e(BigInt(t));
		}
		throw new O("Unsupported amount input type");
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
		if (!this.isSafeNumber()) throw new O(`Amount ${this.value} exceeds Number.MAX_SAFE_INTEGER; use toBigInt/toString/toJSON.`);
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
	add(t) {
		let n = e.from(t);
		return new e(this.value + n.value);
	}
	subtract(t) {
		let n = e.from(t), r = this.value - n.value;
		if (r < 0n) throw new O(`Amount underflow: ${this.value} - ${n.value} would be negative`);
		return new e(r);
	}
	multiplyBy(t) {
		let n = e.from(t).value;
		return new e(this.value * n);
	}
	divideBy(t) {
		let n = e.from(t).value;
		if (n <= 0n) throw new O(`Divisor must be > 0, got ${n}`);
		return new e(this.value / n);
	}
	modulo(t) {
		let n = e.from(t).value;
		if (n <= 0n) throw new O(`Divisor must be > 0, got ${n}`);
		return new e(this.value % n);
	}
	ceilPercent(e, t = 100) {
		if (!Number.isInteger(e) || e <= 0) throw new O(`ceilPercent: numerator must be a positive integer, got ${e}`);
		if (!Number.isInteger(t) || t <= 0) throw new O(`ceilPercent: denominator must be a positive integer, got ${t}`);
		return this.multiplyBy(e).add(t - 1).divideBy(t);
	}
	floorPercent(e, t = 100) {
		if (!Number.isInteger(e) || e <= 0) throw new O(`floorPercent: numerator must be a positive integer, got ${e}`);
		if (!Number.isInteger(t) || t <= 0) throw new O(`floorPercent: denominator must be a positive integer, got ${t}`);
		return this.multiplyBy(e).divideBy(t);
	}
	inRange(t, n) {
		let r = e.from(t), i = e.from(n);
		if (r.greaterThan(i)) throw new O(`inRange: min (${r.toString()}) must be <= max (${i.toString()})`);
		return this.greaterThanOrEqual(r) && this.lessThanOrEqual(i);
	}
	clamp(t, n) {
		let r = e.from(t), i = e.from(n);
		if (r.greaterThan(i)) throw new O(`clamp: min (${r.toString()}) must be <= max (${i.toString()})`);
		return e.max(r, e.min(i, this));
	}
	scaledBy(t, n) {
		let r = e.from(t), i = e.from(n);
		if (r.isZero()) return e.zero();
		if (i.isZero()) throw new O("scaledBy: denominator must be > 0");
		return this.multiplyBy(r).multiplyBy(2).add(i).divideBy(i.multiplyBy(2));
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
		return new oe(this, e);
	}
}, ae = class e extends v {
	constructor(t) {
		super(t), this.name = "AmountWithUnitError", Object.setPrototypeOf(this, e.prototype);
	}
}, oe = class e {
	constructor(e, t) {
		if (typeof t != "string" || t.length === 0) throw new ae("unit required");
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
		throw new ae(`Implicit ${e === "number" ? "numeric" : "default"} coercion of AmountWithUnit is unsafe; use .toAmount() then explicit arithmetic, or .toString() for display.`);
	}
	isZero() {
		return this._amount.isZero();
	}
	isSafeNumber() {
		return this._amount.isSafeNumber();
	}
	requireSameUnit(e) {
		if (this.unit !== e.unit) throw new ae(`unit mismatch: ${this.unit} vs ${e.unit}`);
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
			else if (e.unit !== r) throw new ae(`unit mismatch: ${r} vs ${e.unit}`);
			i += e._amount.toBigInt(), a = !0;
		}
		if (r === void 0) throw new ae("cannot infer unit from empty sum");
		return new e(a ? k.from(i) : k.zero(), r);
	}
}, A = Object.freeze({
	parse: pe,
	stringify: _e
}), se;
function ce(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function le() {
	let e = globalThis.BigInt;
	return typeof e == "function" ? e : void 0;
}
function ue(e) {
	if (!se) {
		let t = e(String(2 ** 53 - 1));
		se = {
			max: t,
			min: -t
		};
	}
	return se;
}
var de = class {
	constructor(e, t, n, r) {
		this.src = e, this.strict = t, this.fallbackTo = n, this.bigIntCtor = r, this.i = 0;
	}
	parse() {
		let e = this.parseValue();
		if (this.skipWhitespace(), !this.isEnd()) throw this.syntaxError("Unexpected trailing input");
		return e;
	}
	parseValue() {
		this.skipWhitespace();
		let e = this.peek();
		if (e === "{") return this.parseObject();
		if (e === "[") return this.parseArray();
		if (e === "\"") return this.parseString();
		if (e === "-" || this.isDigit(e)) return this.parseNumber();
		if (e === "t") return this.parseLiteral("true", !0);
		if (e === "f") return this.parseLiteral("false", !1);
		if (e === "n") return this.parseLiteral("null", null);
		throw this.syntaxError(`Unexpected token '${e || "EOF"}'`);
	}
	parseObject() {
		this.expect("{"), this.skipWhitespace();
		let e = {}, t = /* @__PURE__ */ new Set();
		if (this.peek() === "}") return this.expect("}"), e;
		for (; !this.isEnd();) {
			let n = this.parseString();
			if (this.strict && t.has(n)) throw this.syntaxError(`Duplicate key "${n}"`);
			if (t.add(n), this.skipWhitespace(), this.expect(":"), Object.defineProperty(e, n, {
				value: this.parseValue(),
				writable: !0,
				enumerable: !0,
				configurable: !0
			}), this.skipWhitespace(), this.peek() === "}") return this.expect("}"), e;
			this.expect(","), this.skipWhitespace();
		}
		throw this.syntaxError("Unterminated object");
	}
	parseArray() {
		this.expect("["), this.skipWhitespace();
		let e = [];
		if (this.peek() === "]") return this.expect("]"), e;
		for (; !this.isEnd();) {
			if (e.push(this.parseValue()), this.skipWhitespace(), this.peek() === "]") return this.expect("]"), e;
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
				continue;
			}
			if (t < " ") throw this.syntaxError("Invalid control character in string");
			e += t;
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
		if (!(n.indexOf(".") === -1 && n.indexOf("e") === -1 && n.indexOf("E") === -1)) {
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
			case "error": throw new v("BigInt is not available in this runtime");
		}
		let r = this.bigIntCtor(n), { max: i, min: a } = ue(this.bigIntCtor);
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
			if (e === " " || e === "\n" || e === "\r" || e === "	") {
				this.i += 1;
				continue;
			}
			break;
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
function fe(e, t, n) {
	let r = e[t];
	if (Array.isArray(r)) for (let e = 0; e < r.length; e += 1) {
		let t = fe(r, String(e), n);
		t === void 0 ? Reflect.deleteProperty(r, e) : r[e] = t;
	}
	else if (ce(r)) for (let e of Object.keys(r)) {
		let t = fe(r, e, n);
		t === void 0 ? delete r[e] : r[e] = t;
	}
	return n.call(e, t, r);
}
function pe(e, t, n) {
	let r = n?.strict === !0, i = n?.fallbackTo ?? "number";
	if (i !== "number" && i !== "string" && i !== "error") throw new v(`Incorrect value for fallbackTo option, must be "number", "string", "error" or undefined but passed ${String(n?.fallbackTo)}`);
	let a = new de(String(e), r, i, le()).parse();
	return typeof t == "function" ? fe({ "": a }, "", t) : a;
}
function me(e) {
	let t = JSON.stringify(e);
	if (typeof t != "string") throw new v("Failed to stringify string value");
	return t;
}
function he(e) {
	return typeof e == "object" && !!e && "toJSON" in e && typeof e.toJSON == "function";
}
function ge(e) {
	return e instanceof Number || e instanceof String || e instanceof Boolean ? e.valueOf() : e;
}
function _e(e, t, n) {
	let r = "", i = "", a = /* @__PURE__ */ new WeakSet();
	if (typeof n == "number" ? i = " ".repeat(Math.min(10, Math.max(0, Math.floor(n)))) : typeof n == "string" && (i = n), t && typeof t != "function" && !Array.isArray(t)) throw new v("stringify: replacer must be a function or array");
	let o = Array.isArray(t) ? t.map((e) => String(e)) : void 0, s = (e, n) => {
		let c = e[n];
		switch (c instanceof k ? c = c.toBigInt() : he(c) && (c = c.toJSON(n)), typeof t == "function" && (c = t.call(e, n, c)), c = ge(c), typeof c) {
			case "string": return me(c);
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
						n !== void 0 && i.push(`${me(e)}${r ? ": " : ":"}${n}`);
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
//#endregion
//#region src/utils/base64.ts
function ve(e) {
	return D.toBase64(e).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function ye(e) {
	return D.toBase64(e).replace(/\+/g, "-").replace(/\//g, "_");
}
function be(e) {
	return D.fromBase64(e);
}
function xe(e) {
	let t = D.toString(D.fromBase64(Se(e)));
	return A.parse(t);
}
function Se(e) {
	return e.replace(/-/g, "+").replace(/_/g, "/").split("=")[0];
}
function Ce(e) {
	if (typeof e != "string" || e.length === 0 || !/^[A-Za-z0-9\-_]+={0,2}$/.test(e) && !/^[A-Za-z0-9+/]+={0,2}$/.test(e)) return !1;
	let t = e.replace(/-/g, "+").replace(/_/g, "/"), n = (4 - t.length % 4) % 4;
	if (n > 2) return !1;
	let r = t + "=".repeat(n);
	try {
		let e = D.fromBase64(r), n = D.toBase64(e), i = n.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), a = t.replace(/=+$/, "");
		return n.replace(/=+$/, "") === a || i === a;
	} catch {
		return !1;
	}
}
//#endregion
//#region src/utils/bech32m.ts
var we = 1023;
function Te(e) {
	let t = e.lastIndexOf("1");
	if (t < 1 || t === e.length - 1) throw new v("Invalid bech32m string: missing or misplaced separator");
}
function Ee(e, t, n = we) {
	let r = s.toWords(t);
	return s.encode(e, r, n);
}
function De(e, t = we) {
	Te(e);
	let { prefix: n, words: r } = s.decode(e, t);
	return {
		hrp: n,
		data: s.fromWords(r)
	};
}
function Oe(e, t = we) {
	return De(e, t).data;
}
//#endregion
//#region src/utils/cbor.ts
function ke(e) {
	return typeof e == "number" || typeof e == "bigint" || typeof e == "string";
}
function Ae(e) {
	let t = [];
	return je(e, t), new Uint8Array(t);
}
function je(e, t) {
	if (e === null) t.push(246);
	else if (e === void 0) t.push(247);
	else if (typeof e == "boolean") t.push(e ? 245 : 244);
	else if (typeof e == "number") Le(e, t);
	else if (typeof e == "bigint") Ne(e, t);
	else if (typeof e == "string") ze(e, t);
	else if (Array.isArray(e)) Be(e, t);
	else if (e instanceof Uint8Array) Re(e, t);
	else if (typeof e == "object" && e && !Array.isArray(e)) Ve(e, t);
	else throw new v("Unsupported type");
}
function Me(e, t) {
	e < 24 ? t.push(e) : e < 256 ? t.push(24, e) : e < 65536 ? t.push(25, e >>> 8 & 255, e & 255) : e < 4294967296 ? t.push(26, e >>> 24 & 255, e >>> 16 & 255, e >>> 8 & 255, e & 255) : Ne(BigInt(e), t);
}
function Ne(e, t) {
	e >= 0n ? Pe(0, e, t) : Pe(1, -1n - e, t);
}
function Pe(e, t, n) {
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
	} else throw new v("BigInt value out of uint64 range");
}
function Fe(e, t) {
	let n = -1 - e;
	n < 24 ? t.push(32 | n) : n < 256 ? t.push(56, n & 255) : n < 65536 ? t.push(57, n >>> 8 & 255, n & 255) : n < 4294967296 ? t.push(58, n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255) : Ne(BigInt(e), t);
}
function Ie(e, t) {
	let n = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	n.setFloat64(0, e, !1), t.push(251);
	for (let e = 0; e < 8; e++) t.push(n.getUint8(e));
}
function Le(e, t) {
	Number.isInteger(e) ? e >= 0 ? Me(e, t) : Fe(e, t) : Ie(e, t);
}
function Re(e, t) {
	let n = e.length;
	if (n < 24) t.push(64 + n);
	else if (n < 256) t.push(88, n);
	else if (n < 65536) t.push(89, n >> 8 & 255, n & 255);
	else if (n < 4294967296) t.push(90, n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255);
	else throw new v("Byte string too long to encode");
	for (let n = 0; n < e.length; n++) t.push(e[n]);
}
function ze(e, t) {
	let n = new TextEncoder().encode(e), r = n.length;
	if (r < 24) t.push(96 + r);
	else if (r < 256) t.push(120, r);
	else if (r < 65536) t.push(121, r >>> 8 & 255, r & 255);
	else if (r < 4294967296) t.push(122, r >>> 24 & 255, r >>> 16 & 255, r >>> 8 & 255, r & 255);
	else throw new v("String too long to encode");
	for (let e = 0; e < n.length; e++) t.push(n[e]);
}
function Be(e, t) {
	let n = e.length;
	if (n < 24) t.push(128 | n);
	else if (n < 256) t.push(152, n);
	else if (n < 65536) t.push(153, n >>> 8 & 255, n & 255);
	else throw new v("Unsupported array length");
	for (let n of e) je(n, t);
}
function Ve(e, t) {
	let n = Object.keys(e), r = n.length;
	if (r >= 4294967296) throw new v("Object has too many keys to encode");
	r < 24 ? t.push(160 | r) : r < 256 ? t.push(184, r) : r < 65536 ? t.push(185, r >> 8 & 255, r & 255) : t.push(186, r >> 24 & 255, r >> 16 & 255, r >> 8 & 255, r & 255);
	for (let r of n) ze(r, t), je(e[r], t);
}
function He(e) {
	return Ue(new DataView(e.buffer, e.byteOffset, e.byteLength), 0).value;
}
function Ue(e, t) {
	if (t >= e.byteLength) throw new v("Unexpected end of data");
	let n = e.getUint8(t++), r = n >> 5, i = n & 31;
	switch (r) {
		case 0: return Ge(e, t, i);
		case 1: return Ke(e, t, i);
		case 2: return qe(e, t, i);
		case 3: return Je(e, t, i);
		case 4: return Ye(e, t, i);
		case 5: return Xe(e, t, i);
		case 7: return Qe(e, t, i);
		default: throw new v(`Unsupported major type: ${r}`);
	}
}
function j(e, t, n) {
	if (t + n > e.byteLength) throw new v("Unexpected end of data");
}
function We(e, t, n) {
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
	throw new v(`Unsupported length: ${n}`);
}
function Ge(e, t, n) {
	let { value: r, offset: i } = We(e, t, n);
	return {
		value: r,
		offset: i
	};
}
function Ke(e, t, n) {
	let { value: r, offset: i } = We(e, t, n);
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
function qe(e, t, n) {
	let { value: r, offset: i } = We(e, t, n), a = Number(r);
	if (i + a > e.byteLength) throw new v("Byte string length exceeds data length");
	return {
		value: new Uint8Array(e.buffer, e.byteOffset + i, a),
		offset: i + a
	};
}
function Je(e, t, n) {
	let { value: r, offset: i } = We(e, t, n), a = Number(r);
	if (i + a > e.byteLength) throw new v("String length exceeds data length");
	let o = new Uint8Array(e.buffer, e.byteOffset + i, a);
	return {
		value: new TextDecoder().decode(o),
		offset: i + a
	};
}
function Ye(e, t, n) {
	let { value: r, offset: i } = We(e, t, n), a = Number(r), o = [], s = i;
	for (let t = 0; t < a; t++) {
		let t = Ue(e, s);
		o.push(t.value), s = t.offset;
	}
	return {
		value: o,
		offset: s
	};
}
function Xe(e, t, n) {
	let { value: r, offset: i } = We(e, t, n), a = Number(r), o = {}, s = i;
	for (let t = 0; t < a; t++) {
		let t = Ue(e, s);
		if (!ke(t.value)) throw new v("Invalid key type");
		let n = Ue(e, t.offset);
		o[String(t.value)] = n.value, s = n.offset;
	}
	return {
		value: o,
		offset: s
	};
}
function Ze(e) {
	let t = (e & 31744) >> 10, n = e & 1023, r = e & 32768 ? -1 : 1;
	return t === 0 ? r * 2 ** -14 * (n / 1024) : t === 31 ? n ? NaN : r * Infinity : r * 2 ** (t - 15) * (1 + n / 1024);
}
function Qe(e, t, n) {
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
		default: throw new v(`Unknown simple value: ${n}`);
	}
	if (n === 24) return j(e, t, 1), {
		value: e.getUint8(t++),
		offset: t
	};
	if (n === 25) {
		j(e, t, 2);
		let n = Ze(e.getUint16(t, !1));
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
	throw new v(`Unknown simple or float value: ${n}`);
}
//#endregion
//#region src/crypto/core.ts
function $e(t, n = !1) {
	let r = a(new TextEncoder().encode(t));
	return n ? e(r) : r;
}
var et = (t, r) => {
	let i = typeof t == "string" ? n(t) : t, a = typeof r == "string" ? n(r) : r;
	return e(c.sign(i, a));
}, tt = (e, t) => et($e(e), t), nt = (e, t, r, i = !1) => {
	try {
		let i = $e(t), a = r.length === 66 ? r.slice(2) : r;
		return c.verify(n(e), i, n(a));
	} catch (e) {
		if (i) throw e;
	}
	return !1;
};
function rt(t, r) {
	let i = Array.isArray(r) ? r : [r];
	for (let r of i) if (e(l.getPublicKey(n(r), !0)).toLowerCase() === t.toLowerCase()) return r;
	throw new v(`No private key matches quote pubkey ${t}`);
}
function it(e, t, n) {
	return Array.from(new Set(n)).filter((n) => e.some((e) => nt(e, t, n)));
}
var at = (e, t, n, r = 1) => it(e, t, n).length >= r;
//#endregion
//#region src/crypto/CTF.ts
function ot(e) {
	if (st(e.conditionId, "conditionId"), st(e.outcomeCollectionId, "outcomeCollectionId"), !e.unit) throw new v("Cannot compute conditional keyset ID: unit is required.");
	let t = Object.entries(e.keys).sort(([e], [t]) => k.from(e).compareTo(t)).map(([e, t]) => `${e}:${t.toLowerCase()}`).join(",");
	return t += `|unit:${e.unit.toLowerCase()}`, e.input_fee_ppk && (t += `|input_fee_ppk:${e.input_fee_ppk}`), e.final_expiry && (t += `|final_expiry:${e.final_expiry}`), t += `|condition_id:${e.conditionId.toLowerCase()}`, t += `|outcome_collection_id:${e.outcomeCollectionId.toLowerCase()}`, "01" + D.toHex(a(D.fromString(t)));
}
function st(e, t) {
	if (!/^[0-9a-fA-F]{64}$/.test(e)) throw new v(`${t} must be a 64-character hex string`);
}
//#endregion
//#region src/crypto/curve_bls.ts
var ct = "CASHU_BLS12_381_G1_XMD:SHA-256_SSWU_RO_", lt = g.fields.Fr.ORDER, ut = g.G2.Point.BASE, dt = h("Cashu_BLS_Batch_v1"), ft = g.fields.Fr, pt = g.fields.Fp.ORDER;
function M(e) {
	return g.G1.hashToCurve(e, { DST: ct });
}
function mt(e, n, r, i) {
	if (e.length !== n) return;
	let a = new Uint8Array(e);
	a[0] &= 31;
	let o = n / r;
	for (let e = 0; e < r; e++) if (t(a.subarray(e * o, (e + 1) * o)) >= pt) throw new v(`${i} point non-canonical: coordinate >= p`);
}
function ht(e) {
	mt(n(e), 48, 1, "G1");
	let t = g.G1.Point.fromHex(e);
	if (t.is0()) throw new v("G1 point at infinity");
	if (!t.isTorsionFree()) throw new v("G1 point not in prime-order subgroup");
	return t;
}
function gt(e) {
	mt(n(e), 96, 2, "G2");
	let t = g.G2.Point.fromHex(e);
	if (t.is0()) throw new v("G2 point at infinity");
	if (!t.isTorsionFree()) throw new v("G2 point not in prime-order subgroup");
	return t;
}
function _t(e) {
	let t = ft.fromBytes(e);
	/* c8 ignore next 3 — defensive guard; a==0 requires all-zero privKey bytes (impossible in practice). */
	if (t === 0n) throw new v("Mint scalar must be non-zero");
	return ut.multiply(t).toBytes(!0);
}
function vt() {
	return ft.fromBytes(i(32));
}
function yt(e, t) {
	let n = M(e);
	if (t === void 0) t = vt();
	else if (t === 0n) throw new v("Blinding factor r must be non-zero");
	return {
		B_: n.multiply(t),
		r: t,
		secret: e
	};
}
function bt(e, t) {
	if (t === 0n) throw new v("Blinding factor r must be non-zero");
	return e.multiply(ft.inv(t));
}
function xt(e, t, n) {
	let r = bt(e.C_, t);
	return {
		id: e.id,
		secret: n,
		C: r
	};
}
function St(e, t, n) {
	let r = ft.fromBytes(t);
	if (r === 0n) throw new v("Mint scalar must be non-zero");
	return {
		C_: e.multiply(r),
		id: n
	};
}
function Ct(e, t, n) {
	if (t.is0() || e.is0()) return !1;
	let r = M(n), i = g.pairingBatch([{
		g1: t.negate(),
		g2: ut
	}, {
		g1: r,
		g2: e
	}]);
	return g.fields.Fp12.eql(i, g.fields.Fp12.ONE);
}
function wt(e) {
	let n = a.create();
	n.update(dt);
	for (let t of e) n.update(t.C.toBytes(!0)), n.update(t.K2.toBytes(!0)), n.update(r(t.secret.length, 4)), n.update(t.secret);
	let i = n.digest(), o = [];
	for (let n = 0; n < e.length; n++) {
		let e = r(n, 4), s = 0n;
		for (let n = 0; n < 65536; n++) {
			let o = t(a(f(i, e, r(n, 4))));
			if (!(o === 0n || o >= lt)) {
				s = o;
				break;
			}
		}
		/* c8 ignore next */
		if (s === 0n) throw new v("BLS batch weight derivation failed");
		o.push(s);
	}
	return o;
}
function Tt(t) {
	if (t.length === 0) return !0;
	for (let e of t) if (e.C.is0() || e.K2.is0()) return !1;
	let n = ut, r = wt(t), i = t[0].C.multiply(r[0]);
	for (let e = 1; e < t.length; e++) i = i.add(t[e].C.multiply(r[e]));
	let a = /* @__PURE__ */ new Map();
	for (let n = 0; n < t.length; n++) {
		let i = M(t[n].secret).multiply(r[n]), o = e(t[n].K2.toBytes(!0)), s = a.get(o);
		s ? s.sumY = s.sumY.add(i) : a.set(o, {
			K2: t[n].K2,
			sumY: i
		});
	}
	let o = [{
		g1: i.negate(),
		g2: n
	}];
	for (let { K2: e, sumY: t } of a.values()) o.push({
		g1: t,
		g2: e
	});
	let s = g.pairingBatch(o);
	return g.fields.Fp12.eql(s, g.fields.Fp12.ONE);
}
//#endregion
//#region src/crypto/curves.ts
function Et(e) {
	return {
		kind: "secp",
		pt: e
	};
}
function Dt(e) {
	return {
		kind: "blsG1",
		pt: e
	};
}
function Ot(e) {
	if (e.length === 66) return {
		kind: "secp",
		pt: l.Point.fromHex(e)
	};
	if (e.length === 96) return {
		kind: "blsG1",
		pt: ht(e)
	};
	throw new v(`Cannot decode point: unexpected hex length ${e.length}`);
}
function kt(e) {
	return e.pt.toHex(!0);
}
function N(e) {
	return e.length !== 16 && e.length !== 66 || !W(e) ? !1 : e.startsWith("02");
}
function At(e, t = "keyset id") {
	if (!/^(00[0-9a-f]{14}|0[12][0-9a-f]{64})$/.test(e)) throw new v(`${t} must be a canonical NUT-02 keyset id`);
	return e;
}
var jt = (e) => {
	let t;
	return t = /^[a-fA-F0-9]+$/.test(e) ? Pa(e) % BigInt(2 ** 31 - 1) : D.toBigInt(be(e)) % BigInt(2 ** 31 - 1), t;
}, Mt = class {
	constructor(e, t, n) {
		this.amountValue = k.from(e), this.B_ = t, this.id = n;
	}
	get amount() {
		return this.amountValue;
	}
	getSerializedBlindedMessage() {
		return {
			amount: this.amountValue,
			B_: kt(this.B_),
			id: this.id
		};
	}
}, Nt = 1024, Pt = "Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.", Ft = new Set([
	"locktime",
	"pubkeys",
	"n_sigs",
	"refund",
	"n_sigs_refund",
	"sigflag"
]);
function It(e) {
	if (!e || typeof e != "string") throw new v("tag key must be a non empty string");
	if (Ft.has(e)) throw new v(`additionalTags must not use reserved key "${e}"`);
}
var P = class e {
	constructor(e, t, n, r) {
		this.secret = n, this.blindingFactor = t, this.blindedMessage = e, this.ephemeralE = r;
	}
	toProof(e, t) {
		if (e == null) throw new v(`Mint response is missing a signature for one of the outputs. ${Pt}`);
		if (e.id !== this.blindedMessage.id) throw new v(`Mint signature keyset id ${e.id} does not match output ${this.blindedMessage.id}`);
		let n = this.blindedMessage.amount;
		if (!n.isZero() && !e.amount.equals(n)) throw new v(`Mint signature amount ${e.amount.toString()} does not match requested amount ${n.toString()}. ${Pt}`);
		if (N(e.id)) {
			let n, r;
			try {
				let i = t.keys[e.amount.toString()];
				if (!i) throw Error(`Amount ${e.amount.toString()} not in keyset`);
				n = ht(e.C_), r = gt(i);
			} catch (e) {
				throw new v(`Mint returned invalid signature or amount. ${Pt}`, { cause: e });
			}
			let i = xt({
				id: e.id,
				C_: n
			}, this.blindingFactor, this.secret);
			if (!Ct(r, i.C, i.secret)) throw new v("BLS pairing verification failed on mint response");
			let a = {
				id: e.id,
				amount: e.amount,
				C: i.C.toHex(!0),
				secret: new TextDecoder().decode(i.secret)
			};
			return this.ephemeralE && (a.p2pk_e = this.ephemeralE), a;
		}
		let r, i;
		try {
			let n = t.keys[e.amount.toString()];
			if (!n) throw Error(`Amount ${e.amount.toString()} not in keyset`);
			r = R(n), i = R(e.C_);
		} catch (e) {
			throw new v(`Mint returned invalid signature or amount. ${Pt}`, { cause: e });
		}
		let a;
		if (e.dleq && (a = {
			s: p(e.dleq.s),
			e: p(e.dleq.e),
			r: this.blindingFactor
		}), a) {
			let e = Ot(this.blindedMessage.B_);
			if (e.kind === "secp" && !ki(a, e.pt, i, r)) throw new v("DLEQ verification failed on mint response");
		}
		let o = Or({
			id: e.id,
			C_: i
		}, this.blindingFactor, this.secret, r), s = {
			id: e.id,
			amount: e.amount,
			C: o.C.toHex(!0),
			secret: new TextDecoder().decode(o.secret),
			...a && { dleq: {
				s: d(a.s),
				e: d(a.e),
				r: Fa(a.r ?? BigInt(0))
			} }
		};
		return this.ephemeralE && (s.p2pk_e = this.ephemeralE), s;
	}
	static createP2PKData(e, t, n, r) {
		return U(t, n.keys, r).map((t) => this.createSingleP2PKData(e, t, n.id));
	}
	static createSingleP2PKData(t, n, r) {
		let i = k.from(n), a = ti(t), o = Array.isArray(a.pubkey) ? a.pubkey : [a.pubkey], s = a.refundKeys ?? [], c = a.requiredSignatures ?? 1, l = a.requiredRefundSignatures ?? 1, u = a.hashlock, f = typeof u == "string" && u.length > 0, p = f ? u : o[0], h = f ? o : o.slice(1), g = s, _;
		if (t.blindKeys) {
			let { blinded: e, Ehex: t } = Kr([...o, ...s]);
			f ? h = e.slice(0, o.length) : (p = e[0], h = e.slice(1, o.length)), g = e.slice(o.length), _ = t;
		}
		let y = [], b = a.locktime ?? NaN;
		if (Number.isSafeInteger(b) && b >= 0 && y.push(["locktime", String(b)]), h.length > 0 && (y.push(["pubkeys", ...h]), c > 1 && y.push(["n_sigs", String(c)])), g.length > 0 && (y.push(["refund", ...g]), l > 1 && y.push(["n_sigs_refund", String(l)])), a.sigFlag == "SIG_ALL" && y.push(["sigflag", "SIG_ALL"]), a.additionalTags?.length) {
			let e = a.additionalTags.map(([e, ...t]) => (It(e), [e, ...t.map(String)]));
			y.push(...e);
		}
		let x = [f ? "HTLC" : "P2PK", {
			nonce: d(m(32)),
			data: p,
			tags: y
		}], S = JSON.stringify(x), C = [...S].length;
		if (C > 1024) throw new v(`Secret too long (${C} characters), maximum is ${Nt}`);
		let ee = new TextEncoder().encode(S), { r: w, B_: te } = Rt(ee, r);
		return new e(new Mt(i, te, r).getSerializedBlindedMessage(), w, ee, _);
	}
	static createRandomData(e, t, n) {
		return U(e, t.keys, n).map((e) => this.createSingleRandomData(e, t.id));
	}
	static createSingleData(t, n, r, i) {
		let a = k.from(t), o = typeof r == "string" ? new TextEncoder().encode(r) : r, { r: s, B_: c } = Rt(o, n, i);
		return new e(new Mt(a, c, n).getSerializedBlindedMessage(), s, o);
	}
	static createSingleRandomData(t, n) {
		let r = k.from(t), i = d(m(32)), a = new TextEncoder().encode(i), { r: o, B_: s } = Rt(a, n);
		return new e(new Mt(r, s, n).getSerializedBlindedMessage(), o, a);
	}
	static createDeterministicData(e, t, n, r, i) {
		let a = U(e, r.keys, i), o = Gn(t, r.id);
		return a.map((e, t) => Lt(e, r.id, o(n + t)));
	}
	static createSingleDeterministicData(e, t, n, r) {
		return Lt(e, r, Wn(t, r, n));
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
			secret: d(e.secret),
			...e.ephemeralE && { ephemeralE: e.ephemeralE }
		};
	}
	static deserialize(t) {
		try {
			if (!/^(0|[1-9]\d*)$/.test(t.blindingFactor)) throw Error("blindingFactor must be a canonical decimal integer");
			return new e({
				amount: k.from(t.blindedMessage.amount),
				B_: t.blindedMessage.B_,
				id: t.blindedMessage.id
			}, BigInt(t.blindingFactor), p(t.secret), t.ephemeralE);
		} catch (e) {
			throw new v(`Invalid SerializedOutputData: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
		}
	}
};
function Lt(e, t, n) {
	let r = k.from(e), i = d(n.secret), a = new TextEncoder().encode(i), { r: o, B_: s } = Rt(a, t, D.toBigInt(n.blindingFactor));
	return new P(new Mt(r, s, t).getSerializedBlindedMessage(), o, a);
}
function Rt(e, t, n) {
	if (N(t)) {
		let t = yt(e, n);
		return {
			r: t.r,
			B_: Dt(t.B_)
		};
	}
	let r = Er(e, n);
	return {
		r: r.r,
		B_: Et(r.B_)
	};
}
//#endregion
//#region src/crypto/CTFSettlement.ts
var zt = "Cashu/ctf/convert/recv", Bt = "Cashu/ctf/convert/manifest", Vt = "Cashu/ctf/convert/request", Ht = "Cashu/PAY_TO_UNLOCK/refund", Ut = "PAY_TO_UNLOCK", Wt = 18446744073709551615n, F = 340282366920938463463374607431768211455n, Gt = "00".repeat(32), Kt = new Set([
	"offer_keyset",
	"expiry",
	"refund",
	"rate_n",
	"rate_d",
	"min_receive",
	"max_debit"
]);
function qt(e, t) {
	let n = a(D.fromString(e));
	return D.toHex(a(D.concat(n, n, t)));
}
function Jt(e) {
	if (e.length > 4294967295) throw new v("CTF output count exceeds uint32");
	let t = new Uint8Array(4);
	new DataView(t.buffer).setUint32(0, e.length, !0);
	let n = e.map((e) => D.fromString(sn(e)));
	return qt(zt, D.concat(t, ...n));
}
function Yt(e) {
	pn(e);
	let t = e.map((e) => D.fromString(ln(e)));
	return qt(Bt, D.concat(...t));
}
function Xt(e, t) {
	kn(e);
	let n = new Uint8Array(Math.ceil(e / 8)), r = /* @__PURE__ */ new Set();
	for (let i of t) {
		if (!Number.isSafeInteger(i) || i < 0 || i >= e) throw new v("CTF selection index is out of range");
		if (r.has(i)) throw new v("CTF selection contains a duplicate index");
		r.add(i), n[i >> 3] |= 1 << (i & 7);
	}
	return D.toHex(n);
}
function Zt(e, t) {
	kn(t);
	let n = Math.ceil(t / 8) * 2;
	if (e.length !== n) throw new v("CTF selection has an incorrect byte length");
	if (!/^[0-9a-f]*$/.test(e)) throw new v("CTF selection must be lowercase hexadecimal");
	let r = D.fromHex(e);
	return An(r, t), jn(r, t);
}
function Qt(e, t) {
	return pn(e), Zt(t, e.length).map((t) => Mn(e[t]));
}
function $t(e, t, n) {
	pn(e);
	let r = Nn(e, "receive", k.from(t)), i = Nn(e, "change", k.from(n)), a = [...r, ...i].sort((e, t) => e - t), o = Xt(e.length, a);
	return {
		selection: o,
		selectedIndices: a,
		outputs: Qt(e, o),
		receiveTotal: k.from(t),
		changeTotal: k.from(n)
	};
}
function en(e) {
	let t = wn(e.condition_id, "condition_id"), r = wn(e.parent_collection_id ?? Gt, "parent_collection_id");
	Sn(e.participants);
	let i = e.participants.map((e) => D.fromString(un(e)));
	return qt(Vt, D.concat(n(t), n(r), ...i));
}
function tn(e) {
	let t = wn(e.nonce, "nonce"), n = wn(e.data, "data"), r = Tn(e.offerKeyset, "offer_keyset"), i = L(e.expiry, "expiry", Wt).toString(), a = En(e.refund), o = [
		["offer_keyset", r],
		["expiry", i],
		["refund", a]
	];
	return e.poolPolicy && o.push(...bn(vn(e.poolPolicy))), JSON.stringify([Ut, {
		data: n,
		nonce: t,
		tags: o
	}]);
}
function nn(e) {
	let t = hn(e), n = gn(t.tags);
	return {
		nonce: wn(t.nonce, "nonce"),
		data: wn(t.data, "data"),
		offerKeyset: Tn(xn(n, "offer_keyset"), "offer_keyset"),
		expiry: L(xn(n, "expiry"), "expiry", Wt),
		refund: En(xn(n, "refund")),
		mode: _n(n)
	};
}
function rn(e, t, n, r) {
	yn(e);
	for (let [e, i] of [
		["inputTotal", t],
		["receiveTotal", n],
		["changeTotal", r]
	]) if (i < 0n || i > F) throw new v(`${e} must fit u128`);
	if (e.maxDebit > t) throw new v("maxDebit exceeds input total");
	if (r > t) throw new v("change exceeds input total");
	let i = t - r;
	if (Ln(n, e.rateD) < Ln(i, e.rateN)) throw new v("selected rate is below the limit");
	if (n < e.minReceive) throw new v("receive is below minReceive");
	if (i > e.maxDebit) throw new v("debit exceeds maxDebit");
}
function an(e) {
	let t = I({
		inputs: e.inputs.map((e) => dn(e, !1)),
		outputs: e.outputs.map(cn)
	});
	return qt(Ht, D.fromString(t));
}
function on(e, t) {
	let n = Dn(t), r = D.toHex(l.getPublicKey(n, !0).slice(1)), i = an(e);
	return {
		inputs: e.inputs.map((e) => {
			if (nn(e.secret).refund !== r) throw new v("refund private key does not match PAY_TO_UNLOCK condition");
			return {
				...e,
				witness: { signatures: [et(i, n)] }
			};
		}),
		outputs: e.outputs
	};
}
function sn(e) {
	return I(cn(e));
}
function cn(e) {
	return mn(e), {
		B_: e.B_,
		amount: On(e.amount),
		id: e.id
	};
}
function ln(e) {
	return I({
		B_: e.B_,
		amount: e.amount,
		id: e.id,
		index: e.index,
		role: e.role
	});
}
function un(e) {
	Cn(e.inputs);
	let t = {
		inputs: e.inputs.map((e) => dn(e, !0)),
		outputs: e.outputs.map(cn)
	};
	if (e.pool_manifest !== void 0 != (e.pool_selection !== void 0)) throw new v("pool_manifest and pool_selection must appear together");
	if (e.pool_manifest && e.pool_selection !== void 0) {
		if (pn(e.pool_manifest), !Fn(Qt(e.pool_manifest, e.pool_selection), e.outputs)) throw new v("pool selection does not exactly match participant outputs");
		t.pool_manifest = e.pool_manifest.map((e) => ({
			B_: e.B_,
			amount: e.amount,
			id: e.id,
			index: e.index,
			role: e.role
		})), t.pool_selection = e.pool_selection;
	}
	return I(t);
}
function dn(e, t) {
	let n = {
		C: e.C,
		amount: On(e.amount),
		id: e.id,
		secret: e.secret
	};
	return e.dleq && (n.dleq = fn(e.dleq)), e.p2pk_e !== void 0 && (n.p2pk_e = e.p2pk_e), t && e.witness !== void 0 && (n.witness = typeof e.witness == "string" ? e.witness : fn(e.witness)), n;
}
function fn(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) if (r !== void 0) {
		if (typeof r == "string" || typeof r == "boolean" || typeof r == "number") {
			t[n] = r;
			continue;
		}
		if (Array.isArray(r)) {
			t[n] = r.map((e) => String(e));
			continue;
		}
		throw new v(`Unsupported canonical object field ${n}`);
	}
	return t;
}
function I(e) {
	return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string" ? JSON.stringify(e) : Array.isArray(e) ? `[${e.map(I).join(",")}]` : `{${Object.keys(e).sort().map((t) => `${JSON.stringify(t)}:${I(e[t])}`).join(",")}}`;
}
function pn(e) {
	if (e.length < 2) throw new v("CTF manifest requires receive and change entries");
	let t = !1, n = !1, r = /* @__PURE__ */ new Set();
	if (e.forEach((e, i) => {
		if (e.index !== String(i)) throw new v("CTF manifest indices must be contiguous");
		if (e.role === "receive" && n) throw new v("CTF manifest receive entries must precede change entries");
		if (e.role === "receive" && (t = !0), e.role === "change" && (n = !0), e.role !== "receive" && e.role !== "change") throw new v("CTF manifest has an unknown role");
		if (L(e.amount, "pool_manifest.amount", Wt), mn(Mn(e)), r.has(e.B_)) throw new v("CTF manifest has a duplicate blinded message");
		r.add(e.B_);
	}), !t || !n) throw new v("CTF manifest requires receive and change entries");
}
function mn(e) {
	if (On(e.amount), Tn(e.id, "output id"), e.B_ !== e.B_.toLowerCase()) throw new v("blinded message must use canonical lowercase hex");
	try {
		if (kt(Ot(e.B_)) !== e.B_) throw Error("unsupported or noncanonical point");
	} catch (e) {
		throw new v("blinded message contains an invalid point", { cause: e });
	}
}
function hn(e) {
	let t;
	try {
		t = JSON.parse(e);
	} catch (e) {
		throw new v("PAY_TO_UNLOCK condition is malformed", { cause: e });
	}
	if (!Array.isArray(t) || t.length !== 2 || t[0] !== Ut) throw new v("condition kind must be PAY_TO_UNLOCK");
	if (!Rn(t[1]) || !zn(t[1], [
		"nonce",
		"data",
		"tags"
	])) throw new v("PAY_TO_UNLOCK condition fields are malformed");
	if (typeof t[1].nonce != "string" || typeof t[1].data != "string" || !Array.isArray(t[1].tags)) throw new v("PAY_TO_UNLOCK condition values are malformed");
	return {
		nonce: t[1].nonce,
		data: t[1].data,
		tags: t[1].tags
	};
}
function gn(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (!Array.isArray(n) || typeof n[0] != "string") throw new v("each PAY_TO_UNLOCK tag must contain exactly one string value");
		if (!Kt.has(n[0])) throw new v(`unknown PAY_TO_UNLOCK tag ${n[0]}`);
		if (n.length !== 2 || typeof n[1] != "string") throw new v("each PAY_TO_UNLOCK tag must contain exactly one string value");
		if (t.has(n[0])) throw new v(`duplicate PAY_TO_UNLOCK tag ${n[0]}`);
		t.set(n[0], n[1]);
	}
	return t;
}
function _n(e) {
	let t = [
		"rate_n",
		"rate_d",
		"min_receive",
		"max_debit"
	].map((t) => e.get(t));
	if (t.every((e) => e === void 0)) return { kind: "standard" };
	if (t.some((e) => e === void 0)) throw new v("pool mode requires all four pool tags");
	return {
		kind: "pool",
		policy: vn({
			rateN: t[0],
			rateD: t[1],
			minReceive: t[2],
			maxDebit: t[3]
		})
	};
}
function vn(e) {
	let t = {
		rateN: L(e.rateN, "rate_n", F),
		rateD: L(e.rateD, "rate_d", F),
		minReceive: L(e.minReceive, "min_receive", F),
		maxDebit: L(e.maxDebit, "max_debit", F)
	};
	return yn(t), t;
}
function yn(e) {
	for (let t of Object.values(e)) if (t < 0n || t > F) throw new v("pool policy value must fit u128");
	if (e.rateD === 0n) throw new v("rate_d must be positive");
	if (e.minReceive === 0n) throw new v("min_receive must be positive");
	if (In(e.rateN, e.rateD) !== 1n) throw new v("rate_n/rate_d must be a reduced fraction");
}
function bn(e) {
	return [
		["rate_n", e.rateN.toString()],
		["rate_d", e.rateD.toString()],
		["min_receive", e.minReceive.toString()],
		["max_debit", e.maxDebit.toString()]
	];
}
function xn(e, t) {
	let n = e.get(t);
	if (n === void 0) throw new v(`missing PAY_TO_UNLOCK tag ${t}`);
	return n;
}
function Sn(e) {
	if (e.length < 2) throw new v("CTF settlement requires at least two participants");
	let t;
	for (let n of e) {
		Cn(n.inputs);
		let e = n.inputs[0];
		if (!e) throw new v("CTF settlement participant requires an input");
		let r = `${e.id}\u0000${e.secret}`;
		if (t !== void 0 && r <= t) throw new v("CTF settlement participants are not in canonical order");
		t = r;
	}
}
function Cn(e) {
	if (e.length === 0) throw new v("CTF settlement participant requires an input");
	let t;
	for (let n of e) {
		let e = `${n.id}\u0000${n.secret}`;
		if (t !== void 0 && e <= t) throw new v("CTF settlement inputs are not in canonical order");
		t = e;
	}
}
function wn(e, t) {
	if (!/^[0-9a-f]{64}$/.test(e)) throw new v(`${t} must be canonical lowercase 32-byte hex`);
	return e;
}
function Tn(e, t) {
	return At(e, t);
}
function En(e) {
	if (!/^[0-9a-f]{64}$/.test(e)) throw new v("refund must be canonical lowercase x-only public key hex");
	try {
		l.Point.fromHex(`02${e}`);
	} catch (e) {
		throw new v("refund is not a valid x-only public key", { cause: e });
	}
	return e;
}
function Dn(e) {
	if (!/^[0-9a-f]{64}$/.test(e)) throw new v("refund private key must be canonical lowercase 32-byte hex");
	let t = n(e);
	try {
		l.getPublicKey(t, !0);
	} catch (e) {
		throw new v("refund private key is invalid", { cause: e });
	}
	return t;
}
function On(e) {
	let t = k.from(e).toBigInt();
	if (t > Wt) throw new v("amount exceeds u64");
	return t.toString();
}
function L(e, t, n) {
	if (typeof e == "number" && (!Number.isSafeInteger(e) || e < 0)) throw new v(`${t} number must be a non-negative safe integer`);
	let r = typeof e == "string" ? e : String(e);
	if (!/^(0|[1-9]\d*)$/.test(r)) throw new v(`${t} must be a minimal unsigned decimal`);
	let i = BigInt(r);
	if (n !== void 0 && i > n) throw new v(`${t} exceeds its limit`);
	return i;
}
function kn(e) {
	if (!Number.isSafeInteger(e) || e < 1) throw new v("CTF selection entry count must be a positive safe integer");
}
function An(e, t) {
	let n = t & 7;
	if (n === 0) return;
	let r = e[e.length - 1];
	if (r !== void 0 && r >> n !== 0) throw new v("CTF selection unused trailing bits must be zero");
}
function jn(e, t) {
	let n = [];
	for (let r = 0; r < t; r += 1) e[r >> 3] & 1 << (r & 7) && n.push(r);
	return n;
}
function Mn(e) {
	return {
		amount: k.from(e.amount),
		id: e.id,
		B_: e.B_
	};
}
function Nn(e, t, n) {
	let r = e.map((e, t) => ({
		entry: e,
		index: t
	})).filter(({ entry: e }) => e.role === t);
	Pn(r.map(({ entry: e }) => e.amount), t);
	let i = n.toBigInt(), a = [];
	for (let e = r.length - 1; e >= 0; --e) {
		let t = BigInt(r[e].entry.amount);
		t > i || (i -= t, a.push(r[e].index));
	}
	if (i !== 0n) throw new v(`${t} amount exceeds the manifest range`);
	return a;
}
function Pn(e, t) {
	let n = 1n;
	for (let r of e) {
		if (BigInt(r) !== n) throw new v(`${t} manifest is not a canonical binary range`);
		n <<= 1n;
	}
}
function Fn(e, t) {
	return e.length === t.length && e.every((e, n) => e.B_ === t[n].B_ && e.id === t[n].id && k.from(e.amount).equals(t[n].amount));
}
function In(e, t) {
	for (; t !== 0n;) {
		let n = e % t;
		e = t, t = n;
	}
	return e;
}
function Ln(e, t) {
	let n = e * t;
	if (n > F) throw new v("pool policy arithmetic exceeds u128");
	return n;
}
function Rn(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function zn(e, t) {
	let n = Object.keys(e).sort(), r = [...t].sort();
	return n.length === r.length && n.every((e, t) => e === r[t]);
}
//#endregion
//#region src/crypto/NUT13.ts
var Bn = "m/129372'/0'", Vn = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"), Hn = (e, t, n) => Wn(e, t, n).secret, Un = (e, t, n) => Wn(e, t, n).blindingFactor;
function Wn(e, t, n) {
	return Gn(e, t)(n);
}
function Gn(e, t) {
	switch (Kn(t)) {
		case 0: {
			let n = _.fromMasterSeed(e);
			return (e) => qn(n, t, e);
		}
		case 1: return (n) => Jn(e, t, n);
	}
}
function Kn(e) {
	let t = /^[a-fA-F0-9]+$/.test(e);
	if (!t && Ce(e) || t && e.startsWith("00")) return 0;
	if (t && (e.startsWith("01") || e.startsWith("02"))) return 1;
	throw new v(`Unrecognized keyset ID version ${e.slice(0, 2)}`);
}
function qn(e, t, n) {
	let r = `${Bn}/${jt(t)}'/${n}'`, i = e.derive(r), a = i.deriveChild(0).privateKey, o = i.deriveChild(1).privateKey;
	/* c8 ignore next */
	if (a === null || o === null) throw new v("Could not derive private key");
	return {
		secret: a,
		blindingFactor: o
	};
}
function Jn(e, t, n) {
	let r = D.concat(D.fromString("Cashu_KDF_HMAC_SHA256"), D.fromHex(t), D.writeBigUint64BE(BigInt(n)));
	return {
		secret: u(a, e, D.concat(r, D.fromHex("00"))),
		blindingFactor: Yn(e, r, t)
	};
}
function Yn(e, t, n) {
	if (N(n)) {
		for (let n = 0; n < 65536; n++) {
			let i = u(a, e, D.concat(t, D.fromHex("01"), r(n, 4))), o = D.toBigInt(i);
			if (!(o === 0n || o >= lt)) return i;
		}
		/* c8 ignore next */
		throw new v("V3 blinding factor derivation failed");
	}
	let i = u(a, e, D.concat(t, D.fromHex("01"))), o = D.toBigInt(i), s = o >= Vn ? o - Vn : o;
	/* c8 ignore next */
	if (s === 0n) throw new v("Derived invalid blinding scalar r == 0");
	return r(s, 32);
}
//#endregion
//#region src/crypto/CTFRange.ts
var Xn = "Cashu/ctf/range/v1", Zn = 18446744073709551615n;
function Qn(e) {
	if (cr(e.receiveKeyset, "receive"), cr(e.offerKeyset, "offer"), e.receiveKeyset.id === e.offerKeyset.id) throw new v("CTF receive and offer keysets must differ");
	if (!Number.isSafeInteger(e.maxEntries) || e.maxEntries < 2) throw new v("maxEntries must be a safe integer of at least two");
	let t = [...or(e.receiveKeyset, e.maxReceive, "receive"), ...or(e.offerKeyset, e.maxChange, "change")];
	if (t.length > e.maxEntries) throw new v("CTF manifest exceeds maxEntries");
	let n = gr(e.seed, e.operationId, "manifest"), r = t.map((e, t) => ar(n, e, t)), i = r.map(({ entry: e }) => e);
	return {
		entries: r,
		serialized: i,
		commitment: Yt(i)
	};
}
function $n(e, t) {
	let n = gr(e, t, "refund"), r = l.Point.CURVE().n;
	for (let e = 0; e < 65536; e += 1) {
		let t = u(a, n, _r(e)), i = D.toBigInt(t);
		if (!(i === 0n || i >= r)) return {
			privateKey: Fa(i),
			publicKey: D.toHex(l.getPublicKey(t, !0).slice(1))
		};
	}
	throw new v("could not derive a valid CTF refund key");
}
function er(e) {
	if (e.amounts.length === 0) throw new v("CTF authorization requires an amount");
	lr(e.expiry, e.expiryContext);
	let t = gr(e.seed, e.operationId, "authorization");
	return e.amounts.map((n, r) => {
		let i = Wn(t, e.offerKeysetId, r), a = tn({
			nonce: D.toHex(i.secret),
			data: e.commitment,
			offerKeyset: e.offerKeysetId,
			expiry: e.expiry,
			refund: e.refund,
			poolPolicy: e.poolPolicy
		});
		return P.createSingleData(n, e.offerKeysetId, a, D.toBigInt(i.blindingFactor));
	});
}
function tr(e, t) {
	if (t === void 0) return {
		mode: "unknown",
		outputs: e.map(({ outputData: e }) => e.blindedMessage),
		manifestBs: e.map(({ entry: e }) => e.B_)
	};
	let n = Zt(t, e.length).map((t) => e[t].outputData.blindedMessage);
	return {
		mode: "known",
		outputs: n,
		expectedOutputBs: n.map(({ B_: e }) => e)
	};
}
function nr(e, t) {
	if (t.length === 0) throw new v("NUT-09 restored no CTF outputs");
	let n = new Map(e.map(({ entry: e }, t) => [e.B_, t])), r = t.map(({ B_: e }) => {
		let t = n.get(e);
		if (t === void 0) throw new v("NUT-09 returned an output outside the manifest");
		return t;
	});
	return Xt(e.length, r);
}
function rr(e) {
	if (!Number.isSafeInteger(e.now) || !Number.isSafeInteger(e.expiry) || e.now < 0 || e.expiry < 0) throw new v("recovery timestamps must be non-negative safe integers");
	return dr(e.outputRecovery) ? "confirmed" : e.outputRecovery.restoredOutputBs.length > 0 || !pr(e.inputStates, e.expectedInputYs) || !e.inputStates.every(({ state: e }) => e === "UNSPENT") ? "reconciling" : e.now >= e.expiry ? "refundable" : "waiting";
}
function ir(e, t, n, r) {
	if (t.length !== n.length) throw new v("NUT-09 outputs and signatures have different lengths");
	let i = new Map(e.map((e) => [e.entry.B_, e.outputData])), a = /* @__PURE__ */ new Set();
	return t.map((e, t) => {
		if (a.has(e.B_)) throw new v("NUT-09 returned a duplicate output");
		a.add(e.B_);
		let o = i.get(e.B_);
		if (!o) throw new v("NUT-09 returned an output outside the retained manifest");
		if (e.id !== o.blindedMessage.id || !k.from(e.amount).equals(o.blindedMessage.amount)) throw new v("NUT-09 returned mismatched output metadata");
		let s = r(e.id);
		if (!s) throw new v(`NUT-09 recovery keyset ${e.id} is not loaded`);
		return o.toProof(n[t], s);
	});
}
function ar(e, t, n) {
	let r = P.createSingleDeterministicData(t.amount, e, n, t.keysetId);
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
function or(e, t, n) {
	return sr(t).map((t) => {
		if (e.keys[t.toString()] === void 0) throw new v(`${n} keyset does not publish denomination ${t.toString()}`);
		return {
			amount: t,
			keysetId: e.id,
			role: n
		};
	});
}
function sr(e) {
	let t = k.from(e).toBigInt();
	if (t < 1n || t > Zn) throw new v("CTF range maximum must be in [1, u64::MAX]");
	let n = [], r = 0n;
	for (let e = 1n; r < t; e <<= 1n) n.push(k.from(e)), r += e;
	return n;
}
function cr(e, t) {
	if (!e.active) throw new v(`${t} keyset must be active`);
	At(e.id, `${t} keyset id`);
}
function lr(e, t) {
	let n = hr(e, "expiry"), r = hr(t.now, "now"), i = hr(t.maxExpirySeconds, "maxExpirySeconds");
	if (i === 0n) throw new v("maxExpirySeconds must be positive");
	let a = ur(t);
	if (n <= r) throw new v("CTF authorization expiry must be in the future");
	if (r + i > Zn) throw new v("CTF authorization expiry ceiling exceeds u64");
	let o = r + i, s = a.flatMap(({ final_expiry: e }) => e === void 0 ? [] : [hr(e, "final_expiry")]).sort((e, t) => e < t ? -1 : +(e > t));
	if (n >= (s[0] === void 0 || o < s[0] ? o : s[0])) throw new v("CTF authorization expiry must precede the effective keyset expiry ceiling");
}
function ur(e) {
	let t = mr(e.condition.condition_id, "condition_id"), n = new Set([...Object.values(e.condition.keysets), ...(e.condition.partitions ?? []).flatMap((e) => Object.values(e.keysets ?? {}))]);
	if (n.size === 0 || e.conditionalKeysets.length !== n.size) throw new v("complete conditional keyset lifecycle metadata is required");
	let r = /* @__PURE__ */ new Set();
	for (let i of e.conditionalKeysets) {
		if (At(i.id, "conditional keyset id"), i.condition_id !== t || !n.has(i.id)) throw new v("conditional keyset metadata does not match the condition");
		if (r.has(i.id)) throw new v("conditional keyset metadata contains a duplicate keyset");
		r.add(i.id);
	}
	if ([...n].some((e) => !r.has(e))) throw new v("complete conditional keyset lifecycle metadata is required");
	return e.conditionalKeysets;
}
function dr(e) {
	if (!e.queryCompleted || e.restoredOutputBs.length === 0) return !1;
	let t = new Set(e.restoredOutputBs);
	if (t.size !== e.restoredOutputBs.length) return !1;
	if (e.query.mode === "known") {
		let n = new Set(e.query.expectedOutputBs);
		return n.size > 0 && n.size === e.query.expectedOutputBs.length && fr(e.query.outputs, n) && n.size === t.size && [...t].every((e) => n.has(e));
	}
	let n = new Set(e.query.manifestBs);
	return n.size > 0 && n.size === e.query.manifestBs.length && fr(e.query.outputs, n) && [...t].every((e) => n.has(e));
}
function fr(e, t) {
	let n = new Set(e.map(({ B_: e }) => e));
	return e.length === t.size && n.size === t.size && [...n].every((e) => t.has(e));
}
function pr(e, t) {
	if (t.length === 0 || e.length !== t.length) return !1;
	let n = new Set(t);
	if (n.size !== t.length) return !1;
	let r = new Set(e.map(({ Y: e }) => e));
	return r.size === e.length && r.size === n.size && [...r].every((e) => n.has(e));
}
function mr(e, t) {
	if (!/^[0-9a-f]{64}$/.test(e)) throw new v(`${t} must be canonical lowercase 32-byte hex`);
	return e;
}
function hr(e, t) {
	if (typeof e == "number" && (!Number.isSafeInteger(e) || e < 0)) throw new v(`${t} must be a non-negative safe integer`);
	let n = typeof e == "string" ? e : String(e);
	if (!/^(0|[1-9]\d*)$/.test(n)) throw new v(`${t} must be a minimal unsigned integer`);
	let r = BigInt(n);
	if (r > Zn) throw new v(`${t} exceeds u64`);
	return r;
}
function gr(e, t, n) {
	if (e.length === 0) throw new v("wallet seed must not be empty");
	let r = D.fromString(t);
	if (r.length === 0 || r.length > 1024) throw new v("operationId must encode to 1..1024 bytes");
	return u(a, e, D.concat(D.fromString(Xn), _r(r.length), r, D.fromString(n)));
}
function _r(e) {
	let t = new Uint8Array(4);
	return new DataView(t.buffer).setUint32(0, e, !1), t;
}
//#endregion
//#region src/crypto/curve_secp.ts
var vr = h("Secp256k1_HashToCurve_Cashu_");
function yr(t) {
	let n = a(D.concat(vr, t)), r = new Uint32Array(1), i = 2 ** 16;
	for (let t = 0; t < i; t++) {
		let t = new Uint8Array(r.buffer), i = a(D.concat(n, t));
		try {
			return R(e(D.concat(new Uint8Array([2]), i)));
		} catch {
			r[0]++;
		}
	}
	throw new v("No valid point found");
}
function br(e) {
	let t = e.map((e) => e.toHex(!1)).join("");
	return a(new TextEncoder().encode(t));
}
function xr(t) {
	return l.Point.fromHex(e(t));
}
function R(e) {
	return l.Point.fromHex(e);
}
function Sr(e) {
	return l.getPublicKey(e, !0);
}
function Cr() {
	return l.utils.randomSecretKey();
}
function wr(e, t, n) {
	let r = l.Point.Fn.fromBytes(t);
	return {
		C_: e.multiply(r),
		id: n
	};
}
function Tr() {
	let t = e(i(32));
	return Er(new TextEncoder().encode(t));
}
function Er(e, t) {
	let n = yr(e);
	if (t === void 0) t = l.Point.Fn.fromBytes(Cr());
	else if (t === 0n) throw new v("Blinding factor r must be non-zero");
	let r = l.Point.BASE.multiply(t);
	return {
		B_: n.add(r),
		r: t,
		secret: e
	};
}
function Dr(e, t, n) {
	return e.subtract(n.multiply(t));
}
function Or(e, t, n, r) {
	let i = Dr(e.C_, t, r);
	return {
		id: e.id,
		secret: n,
		C: i
	};
}
//#endregion
//#region src/crypto/NUT01.ts
var kr = "m/0'/0'/0'";
function Ar(t) {
	let n = {};
	return Object.keys(t).forEach((r) => {
		n[r] = e(t[r]);
	}), n;
}
function jr(e) {
	let t = {};
	return Object.keys(e).forEach((r) => {
		t[r] = n(e[r]);
	}), t;
}
function Mr(e, t, n) {
	let { expiry: r, input_fee_ppk: i, unit: o = "sat", versionByte: s = 1 } = n || {}, c = 0n, l = {}, u = {}, d;
	for (t && (d = _.fromMasterSeed(t)); c < e;) {
		let e = (2n ** c).toString();
		if (d) {
			let t = s === 2 ? `${kr}/${c}'` : `${kr}/${c}`, n = d.derive(t).privateKey;
			if (n) u[e] = s === 2 ? a(n) : n;
			else throw new v(`Could not derive Private key from: ${t}`);
		} else u[e] = Cr();
		l[e] = s === 2 ? _t(u[e]) : Sr(u[e]), c++;
	}
	return {
		pubKeys: l,
		privKeys: u,
		keysetId: Ka(Ar(l), {
			expiry: r,
			input_fee_ppk: i,
			unit: o,
			versionByte: s
		})
	};
}
function Nr(e, t) {
	if (N(e.id)) {
		let n = g.fields.Fr.fromBytes(t);
		/* c8 ignore next 3 — defensive guard; a==0 requires all-zero privKey bytes (impossible in practice). */
		if (n === 0n) throw new v("Mint scalar must be non-zero");
		return M(e.secret).multiply(n).equals(e.C);
	}
	let n = yr(e.secret), r = l.Point.Fn.fromBytes(t);
	return n.multiply(r).equals(e.C);
}
//#endregion
//#region src/crypto/NUT10.ts
function Pr(t, n, r) {
	let a = [t, {
		nonce: e(i(32)),
		data: n,
		tags: r
	}];
	return JSON.stringify(a);
}
function Fr(e) {
	let t;
	try {
		t = typeof e == "string" ? JSON.parse(e) : e;
	} catch (e) {
		throw new v("Can't parse secret", { cause: e });
	}
	if (!Array.isArray(t) || t.length !== 2 || typeof t[0] != "string" || typeof t[1] != "object" || t[0].trim().length === 0 || t[1] === null) throw new v("Invalid NUT-10 secret");
	let [n, r] = t;
	if (typeof r.nonce != "string" || typeof r.data != "string") throw new v("Invalid NUT-10 secret nonce / data");
	if (r.tags) {
		if (!Array.isArray(r.tags)) throw new v("Invalid NUT-10 secret tags");
		if (r.tags.some((e) => !Array.isArray(e) || e.length === 0 || e.some((e) => typeof e != "string" || !e.length))) throw new v("Invalid NUT-10 tag(s)");
	}
	return [n, {
		nonce: r.nonce,
		data: r.data,
		tags: r.tags
	}];
}
function Ir(e, t) {
	let n = Array.isArray(e) ? e : [e], r = Fr(t), i = r[0];
	if (!n.includes(i)) throw new v(`Invalid secret kind: ${i} Allowed: ${n.join(", ")}`);
	return r;
}
function Lr(e) {
	return Fr(e)[0];
}
function Rr(e) {
	return Fr(e)[1];
}
function zr(e) {
	let { data: t } = Rr(e);
	return t;
}
function Br(e) {
	let { tags: t } = Rr(e);
	return t ?? [];
}
function Vr(e, t) {
	return Br(e).some((e) => e[0] === t);
}
function Hr(e, t) {
	let n = Br(e).find((e) => e[0] === t);
	if (!(!n || n.length <= 1)) return n.slice(1);
}
function Ur(e, t) {
	let n = Hr(e, t);
	return n && n.length > 0 ? n[0] : void 0;
}
function Wr(e, t) {
	let n = Ur(e, t);
	if (n === void 0) return;
	let r = Number.parseInt(n, 10);
	return Number.isFinite(r) ? r : void 0;
}
//#endregion
//#region src/crypto/NUT28.ts
var Gr = h("Cashu_P2BK_v1");
function Kr(e, t) {
	if (!e.length) return {
		blinded: [],
		Ehex: ""
	};
	t = t ?? l.utils.randomSecretKey();
	let n = l.Point.Fn.fromBytes(t), r = l.getPublicKey(t, !0);
	return {
		blinded: e.map((e, t) => {
			let r = R(e), i = Yr(r, n, t), a = r.add(l.Point.BASE.multiply(i));
			if (a.equals(l.Point.ZERO)) throw new v("Blinded key at infinity");
			return a.toHex(!0);
		}),
		Ehex: d(r)
	};
}
function qr(e, t, n) {
	let r = Array.isArray(t) ? t : [t], i = Array.isArray(n) ? n : [n], a = /* @__PURE__ */ new Set(), o = l.Point.fromHex(e);
	for (let e of r) {
		let t = l.Point.Fn.fromBytes(p(e)), n = l.getPublicKey(p(e), !0);
		i.forEach((r, i) => {
			let s = Jr(e, Yr(o, t, i), p(r), n);
			s && a.add(s);
		});
	}
	return Array.from(a);
}
function Jr(e, t, n, r) {
	let i = l.Point.CURVE().n, a = typeof e == "string" ? Pa(e) : e, o = typeof t == "string" ? Pa(t) : t;
	if (a <= 0n || a >= i) throw new v("Invalid private key");
	if (o <= 0n || o >= i) throw new v("Invalid scalar r");
	if (r = r ?? l.Point.BASE.multiply(a).toBytes(!0), r.length !== 33) throw new v("naturalPub must be 33 bytes");
	let s = (a + o) % i, c = (i - a + o) % i;
	if (!n) {
		if (s === 0n) throw new v("Derived secret key is zero");
		return Fa(s);
	}
	if (n.length !== 33) throw new v("blindPubkey must be 33 bytes");
	let u = l.Point.fromHex(d(n)), f = l.Point.BASE.multiply(o), p = u.subtract(f);
	if (p.equals(l.Point.ZERO)) return null;
	let m = p.toBytes(!0).slice(1), h = r.slice(1);
	if (!D.equals(m, h)) return null;
	let g = (p.toBytes(!0)[0] & 1) == (r[0] & 1) ? s : c;
	if (g === 0n) throw new v("Derived secret key is zero");
	return Fa(g);
}
function Yr(e, t, n) {
	let r = e.multiply(t).toBytes(!0).slice(1), i = new Uint8Array([n & 255]), o = D.toBigInt(a(D.concat(Gr, r, i)));
	if ((o === 0n || o >= l.Point.CURVE().n) && (o = D.toBigInt(a(D.concat(Gr, r, i, new Uint8Array([255])))), o === 0n || o >= l.Point.CURVE().n)) throw new v("P2BK: tweak derivation failed");
	return o;
}
//#endregion
//#region src/crypto/NUT11.ts
var Xr = {
	SIG_INPUTS: "SIG_INPUTS",
	SIG_ALL: "SIG_ALL"
}, Zr = new Set(Object.values(Xr)), Qr = new Set([
	"locktime",
	"pubkeys",
	"n_sigs",
	"refund",
	"n_sigs_refund",
	"sigflag"
]);
function $r(e, t) {
	let n = Pr("P2PK", e, t);
	return z(n), n;
}
function z(e) {
	let t = Ir(["P2PK", "HTLC"], e);
	hi(Br(t));
	let n = Ur(t, "sigflag");
	return n !== void 0 && gi(n), t;
}
function ei(e) {
	let t = e.toLowerCase();
	if (t.length === 66 && (t.startsWith("02") || t.startsWith("03"))) return t;
	if (t.length === 64) return `02${t}`;
	throw new v(`Invalid pubkey, expected 33 byte compressed or 32 byte x only, got length ${t.length}`);
}
function B(e) {
	let t = /* @__PURE__ */ new Set(), n = [];
	for (let r of e) {
		let e = ei(r), i = e.slice(-64);
		t.has(i) || (t.add(i), n.push(e));
	}
	return n;
}
function ti(e) {
	let t = B(Array.isArray(e.pubkey) ? e.pubkey : [e.pubkey]), n = B(e.refundKeys ?? []);
	if (t.length === 0) throw new v("P2PK requires at least one pubkey");
	let r = t.length + n.length;
	if (r > 10) throw new v(`Too many pubkeys, ${r} provided, maximum allowed is 10 in total`);
	e.sigFlag !== void 0 && gi(e.sigFlag);
	let i = e.requiredSignatures ?? 1, a = e.requiredRefundSignatures;
	return vi({
		mainKeyCount: t.length,
		refundKeyCount: n.length,
		nSigs: i,
		nSigsRefund: a,
		hasLocktime: e.locktime !== void 0
	}), {
		pubkey: t.length === 1 ? t[0] : t,
		...e.locktime === void 0 ? {} : { locktime: e.locktime },
		...n.length > 0 ? { refundKeys: n } : {},
		...i > 1 ? { requiredSignatures: i } : {},
		...a !== void 0 && a > 1 ? { requiredRefundSignatures: a } : {},
		...e.additionalTags?.length ? { additionalTags: e.additionalTags } : {},
		...e.blindKeys ? { blindKeys: !0 } : {},
		...e.sigFlag === void 0 ? {} : { sigFlag: e.sigFlag },
		...e.hashlock ? { hashlock: e.hashlock } : {}
	};
}
function ni(e) {
	let t = z(e), n = Si(xi(t)), r = yi(t), i = bi(t);
	return n === "ACTIVE" || n === "PERMANENT" ? r : n === "EXPIRED" && i.length ? Array.from(new Set([...r, ...i])) : [];
}
function ri(e) {
	return Ur(z(e), "sigflag") ?? "SIG_INPUTS";
}
function ii(e) {
	return ai(e)?.signatures ?? [];
}
function ai(e) {
	if (!e) return;
	let t;
	try {
		t = typeof e == "string" ? JSON.parse(e) : e;
	} catch (e) {
		console.error("Failed to parse witness string:", e);
		return;
	}
	let n = { signatures: t.signatures ?? [] };
	return typeof t.preimage == "string" && t.preimage.length > 0 && (n.preimage = t.preimage), n;
}
function oi(t, n, r = C, i) {
	let a = (t) => typeof t == "string" ? t : e(t), o = Array.isArray(n) ? n.map(a) : a(n);
	return t.map((e, t) => {
		let n = di(o, e), a = e;
		for (let e of n) try {
			a = si(a, e, i);
		} catch (e) {
			let n = e instanceof Error ? e.message : "Unknown error";
			r.warn(`Proof #${t + 1}: ${n}`);
		}
		return a;
	});
}
function si(t, r, i) {
	let a = z(t.secret);
	i = i ?? t.secret;
	let o = typeof r == "string" ? n(r) : r, s = e(c.getPublicKey(o)), l = ni(a);
	if (!l.length || !l.some((e) => e.includes(s))) throw new v(`Signature not required from [02|03]${s}`);
	if (ii(t.witness).some((e) => nt(e, i, s))) throw new v(`Proof already signed by [02|03]${s}`);
	let u = tt(i, r), d = ai(t.witness), f = {
		...d && d.preimage !== void 0 ? { preimage: d.preimage } : {},
		signatures: [...d?.signatures ?? [], u]
	};
	return {
		...t,
		witness: f
	};
}
function ci(e, t, n) {
	if (!t.witness) return !1;
	if (mi([t]) && !n) throw new v("Cannot verify a SIG_ALL proof without the message to sign");
	return n = n ?? t.secret, ii(t.witness).some((t) => nt(t, n, e));
}
function li(e, t = C, n) {
	if (mi([e]) && !n) throw t.error("Cannot verify a SIG_ALL proof without the message to sign"), new v("Cannot verify a SIG_ALL proof without the message to sign");
	n = n ?? e.secret;
	let r = z(e.secret), i = yi(r), a = bi(r);
	vi({
		mainKeyCount: i.length,
		refundKeyCount: a.length,
		nSigs: Wr(r, "n_sigs"),
		nSigsRefund: Wr(r, "n_sigs_refund"),
		hasLocktime: Number.isFinite(xi(r))
	});
	let o = ii(e.witness), s = xi(r), c = Si(s), l = Ci(r, c, a), u = wi(r, c, a), d = it(o, n, i), f = a.length ? it(o, n, a) : [], p = {
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
function ui(e, t = C, n) {
	return li(e, t, n).success;
}
function di(e, t) {
	let n = Array.isArray(e) ? e : [e], r = t?.p2pk_e;
	if (!r) return Array.from(new Set(n));
	let i = z(t.secret);
	return qr(r, n, [...yi(i), ...bi(i)]);
}
function fi(e) {
	if (e.length === 0) throw new v("No proofs");
	let t = z(e[0].secret);
	if (ri(t) !== "SIG_ALL") throw new v("First proof is not SIG_ALL");
	let n = t[1].data, r = JSON.stringify(t[1].tags ?? []);
	for (let i = 1; i < e.length; i++) {
		let a = z(e[i].secret);
		if (a[0] !== t[0]) throw new v(`Proof #${i + 1} is not ${t[0]}`);
		if (ri(a) !== "SIG_ALL") throw new v(`Proof #${i + 1} is not SIG_ALL`);
		if (a[1].data !== n) throw new v("SIG_ALL inputs must share identical Secret.data");
		if (JSON.stringify(a[1].tags ?? []) !== r) throw new v("SIG_ALL inputs must share identical Secret.tags");
	}
}
function pi(e, t, n) {
	let r = [];
	for (let t of e) r.push(t.secret, t.C);
	for (let e of t) r.push(String(e.blindedMessage.amount), e.blindedMessage.B_);
	return n && r.push(n), r.join("");
}
function mi(e) {
	return e.some((e) => {
		try {
			return ri(e.secret) === "SIG_ALL";
		} catch {
			return !1;
		}
	});
}
function hi(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		let e = n[0];
		if (Qr.has(e)) {
			if (t.has(e)) throw new v(`Duplicate P2PK tag "${e}"`);
			t.add(e);
		}
	}
}
function gi(e) {
	if (!Zr.has(e)) throw new v(`Invalid sigflag "${e}": must be "SIG_INPUTS" or "SIG_ALL"`);
}
function _i(e, t) {
	if (!Number.isInteger(e) || e < 1) throw new v(`${t} must be a positive integer, got ${e}`);
	return e;
}
function vi(e) {
	let { mainKeyCount: t, refundKeyCount: n, nSigs: r, nSigsRefund: i, hasLocktime: a } = e;
	if (r !== void 0 && (_i(r, "requiredSignatures (n_sigs)"), r > t)) throw new v(`requiredSignatures (n_sigs) (${r}) exceeds available pubkeys (${t})`);
	if (i !== void 0) {
		if (_i(i, "requiredRefundSignatures (n_sigs_refund)"), n === 0) throw new v("requiredRefundSignatures (n_sigs_refund) requires refund keys");
		if (i > n) throw new v(`requiredRefundSignatures (n_sigs_refund) (${i}) exceeds available refund keys (${n})`);
	}
	if (n > 0 && !a) throw new v("refund keys require a locktime");
}
function yi(e) {
	let t = Lr(e) === "P2PK" ? zr(e) : "", n = Hr(e, "pubkeys") ?? [], r = (t ? [t, ...n] : n).map((e) => ei(e));
	if (B(r).length !== r.length) throw new v("Duplicate main pubkeys are not allowed");
	return r;
}
function bi(e) {
	let t = (Hr(e, "refund") ?? []).map((e) => ei(e));
	if (B(t).length !== t.length) throw new v("Duplicate refund pubkeys are not allowed");
	return t;
}
function xi(e) {
	let t = Wr(e, "locktime");
	return t === void 0 || !Number.isFinite(t) || t <= 0 ? Infinity : t;
}
function Si(e, t = Math.floor(Date.now() / 1e3)) {
	return Number.isFinite(e) ? t < e ? "ACTIVE" : "EXPIRED" : "PERMANENT";
}
function Ci(e, t, n) {
	return !n.length && t === "EXPIRED" ? 0 : Math.max(Wr(e, "n_sigs") ?? 1, 1);
}
function wi(e, t, n) {
	return n.length && t === "EXPIRED" ? Math.max(Wr(e, "n_sigs_refund") ?? 1, 1) : 0;
}
function Ti(e, t, n) {
	let r = [];
	for (let t of e) r.push(t.secret);
	for (let e of t) r.push(e.blindedMessage.B_);
	return n && r.push(n), r.join("");
}
//#endregion
//#region src/crypto/NUT12.ts
var Ei = h("Cashu_DLEQ_R_v1"), Di = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
function Oi(e, n, r, i) {
	let o = f(Ei, n.toBytes(!1), r.toBytes(!1), i.toBytes(!1));
	for (let n = 0; n < 256; n++) {
		let r = t(u(a, e, f(o, new Uint8Array([n])))), i = r >= Di ? r - Di : r;
		/* c8 ignore next */
		if (i !== 0n) return i;
	}
	/* c8 ignore next */
	throw new v("DLEQ nonce derivation failed");
}
var ki = (e, t, n, r) => {
	let i = l.Point.Fn.fromBytes(e.s), a = l.Point.Fn.fromBytes(e.e), o = l.Point.BASE.multiply(i), s = r.multiply(a), c = t.multiply(i), u = n.multiply(a), d = br([
		o.subtract(s),
		c.subtract(u),
		r,
		n
	]);
	return D.equals(d, e.e);
}, Ai = (e, t, n, r) => {
	if (t.r === void 0) throw new v("verifyDLEQProof_reblind: Undefined blinding factor");
	let i = yr(e), a = n.add(r.multiply(t.r)), o = l.Point.BASE.multiply(t.r);
	return ki(t, i.add(o), a, r);
}, ji = (e, t) => {
	let n = l.Point.Fn.fromBytes(t), i = l.Point.BASE.multiply(n), a = e.multiply(n), o = Oi(t, i, e, a), s = br([
		l.Point.BASE.multiply(o),
		e.multiply(o),
		i,
		a
	]), c = l.Point.Fn.fromBytes(s);
	return {
		s: r(l.Point.Fn.add(o, l.Point.Fn.mul(c, n)), 32),
		e: s
	};
};
//#endregion
//#region src/crypto/NUT14.ts
function Mi(e, t) {
	return Pr("HTLC", e, t);
}
function Ni(e) {
	return Ir("HTLC", e);
}
function Pi(t) {
	let r = t !== void 0;
	if (r && !/^[0-9a-f]{64}$/i.test(t)) throw new v("Preimage must be a 64 character hexadecimal string (32 bytes).");
	let o = r ? n(t) : i(32);
	return {
		hash: e(a(o)),
		preimage: e(o)
	};
}
function Fi(e, t) {
	let { hash: n } = Pi(e);
	return t === n;
}
function Ii(e, t = C, n) {
	let r;
	n = n ?? e.secret;
	let i = Fr(e.secret), a = li(e, t, n);
	if (a.path != "MAIN" || Lr(i) !== "HTLC") return a;
	let o = Ri(e.witness);
	return o ? Fi(o, zr(i)) ? (r = a, t.debug("Spending condition satisfied via hashlock (receiver) pathway", { result: r }), r) : (r = {
		...a,
		success: !1,
		path: "FAILED"
	}, t.debug("Hashlock spend failed, wrong preimage for hash", { result: r }), r) : (r = {
		...a,
		success: !1,
		path: "FAILED"
	}, t.debug("Hashlock spend failed, no preimage found", { result: r }), r);
}
function Li(e, t = C, n) {
	return Ii(e, t, n).success;
}
function Ri(e) {
	if (!e) return;
	let t;
	try {
		t = typeof e == "string" ? JSON.parse(e) : e;
	} catch (e) {
		console.error("Failed to parse HTLC witness string:", e);
		return;
	}
	let n = t.preimage;
	return typeof n == "string" && n.length > 0 ? n : void 0;
}
//#endregion
//#region src/crypto/NUT20.ts
function zi(e, t) {
	let n = e;
	for (let e of t) n += e.B_;
	return a(new TextEncoder().encode(n));
}
function Bi(e, t, n) {
	let r = zi(t, n), i = p(e);
	return d(c.sign(r, i));
}
function Vi(e, t, n, r) {
	let i = p(r), a = p(e);
	if (a.length !== 33) return !1;
	a = a.slice(1);
	let o = zi(t, n);
	return c.verify(i, o, a);
}
//#endregion
//#region src/wallet/types/payment-requests.ts
var Hi = /* @__PURE__ */ function(e) {
	return e.POST = "post", e.NOSTR = "nostr", e;
}({}), Ui = 1, Wi = 2, Gi = 3, Ki = 4, qi = 5, Ji = 6, Yi = 7, Xi = 8, Zi = 1, Qi = 2, $i = 3, ea = 0, ta = 1, na = 1, ra = 2, ia = 3, aa = 0, oa = 1;
function sa(e) {
	let t = ca(e), n = {};
	for (let e of t) switch (e.tag) {
		case Ui:
			n.id = V(e.value);
			break;
		case Wi:
			n.amount = ua(e.value);
			break;
		case Gi:
			e.value.length === 1 && e.value[0] === 0 ? n.unit = "sat" : n.unit = V(e.value);
			break;
		case Ki:
			n.singleUse = da(e.value) === 1;
			break;
		case qi:
			n.mints || (n.mints = []), n.mints.push(V(e.value));
			break;
		case Ji:
			n.description = V(e.value);
			break;
		case Yi:
			n.transports || (n.transports = []), n.transports.push(ma(e.value));
			break;
		case Xi:
			n.nut10 || (n.nut10 = []), n.nut10.push(ha(e.value));
			break;
		default: break;
	}
	return n;
}
function ca(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = la(e.subarray(n));
		t.push(r), n += 3 + r.length;
	}
	return t;
}
function la(e) {
	if (e.length < 3) throw new v("TLV data too short: need at least 3 bytes for tag and length");
	let t = new DataView(e.buffer, e.byteOffset, e.byteLength), n = t.getUint8(0), r = t.getUint16(1, !1);
	if (e.length < 3 + r) throw new v(`TLV data too short: expected ${3 + r} bytes, got ${e.length}`);
	return {
		tag: n,
		length: r,
		value: e.subarray(3, 3 + r)
	};
}
function V(e) {
	return new TextDecoder().decode(e);
}
function ua(e) {
	if (e.length !== 8) throw new v(`Invalid u64: expected 8 bytes, got ${e.length}`);
	return new DataView(e.buffer, e.byteOffset, e.byteLength).getBigUint64(0, !1);
}
function da(e) {
	if (e.length !== 1) throw new v(`Invalid u8: expected 1 byte, got ${e.length}`);
	return e[0];
}
function fa(e) {
	switch (e) {
		case ea: return "nostr";
		case ta: return "post";
		default: throw new v(`Unsupported transport kind: ${e}`);
	}
}
function pa(e) {
	switch (e) {
		case aa: return "P2PK";
		case oa: return "HTLC";
		default: throw new v(`Unsupported NUT-10 kind: ${e}`);
	}
}
function ma(e) {
	let t = ca(e), n, r, i;
	for (let e of t) switch (e.tag) {
		case Zi:
			n = da(e.value);
			break;
		case Qi:
			r = e.value;
			break;
		case $i:
			i || (i = []), i.push(ga(e.value));
			break;
	}
	if (n === void 0) throw new v("Transport missing required kind field");
	if (r === void 0) throw new v("Transport missing required target field");
	let a;
	if (n === ea) {
		let e = i?.filter((e) => e[0] === "r").flatMap((e) => e.slice(1)) ?? [];
		a = Da(r, e), i = i?.filter((e) => e[0] !== "r");
	} else a = V(r);
	let o = i && i.length > 0 ? i : void 0;
	return {
		type: fa(n),
		target: a,
		tags: o
	};
}
function ha(e) {
	let t = ca(e), n, r, i;
	for (let e of t) switch (e.tag) {
		case na:
			n = da(e.value);
			break;
		case ra:
			r = V(e.value);
			break;
		case ia:
			i || (i = []), i.push(ga(e.value));
			break;
	}
	if (n === void 0) throw new v("NUT-10 spending condition missing required kind field");
	if (r === void 0) throw new v("NUT-10 spending condition missing required data field");
	let a = i && i.length > 0 ? i : void 0;
	return {
		kind: pa(n),
		data: r,
		tags: a
	};
}
function ga(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = e[n];
		if (n += 1, e.length - n < r) throw new v(`Tag tuple data too short: expected ${r} bytes, got ${e.length - n}`);
		let i = V(e.subarray(n, n + r));
		t.push(i), n += r;
	}
	return t;
}
function _a(e) {
	let t = [];
	if (e.id && t.push(H(Ui, va(e.id))), e.amount !== void 0 && t.push(H(Wi, ya(e.amount))), e.unit && (e.unit === "sat" ? t.push(H(Gi, new Uint8Array([0]))) : t.push(H(Gi, va(e.unit)))), e.singleUse !== void 0 && t.push(H(Ki, ba(+!!e.singleUse))), e.mints && e.mints.length > 0) for (let n of e.mints) t.push(H(qi, va(n)));
	if (e.description && t.push(H(Ji, va(e.description))), e.transports && e.transports.length > 0) for (let n of e.transports) t.push(H(Yi, Ca(n)));
	if (e.nut10 && e.nut10.length > 0) for (let n of e.nut10) t.push(H(Xi, wa(n)));
	let n = t.reduce((e, t) => e + t.length, 0), r = new Uint8Array(n), i = 0;
	for (let e of t) r.set(e, i), i += e.length;
	return r;
}
function H(e, t) {
	let n = t.length;
	if (n > 65535) throw new v(`TLV value too long: ${n} bytes (max 65535)`);
	let r = new Uint8Array(3 + n);
	return r[0] = e, r[1] = n >> 8 & 255, r[2] = n & 255, r.set(t, 3), r;
}
function va(e) {
	return new TextEncoder().encode(e);
}
function ya(e) {
	let t = /* @__PURE__ */ new ArrayBuffer(8);
	return new DataView(t).setBigUint64(0, e, !1), new Uint8Array(t);
}
function ba(e) {
	return new Uint8Array([e]);
}
function xa(e) {
	switch (e) {
		case Hi.NOSTR: return ea;
		case Hi.POST: return ta;
		default: throw new v(`Unsupported transport type: ${e}`);
	}
}
function Sa(e) {
	switch (e) {
		case "P2PK": return aa;
		case "HTLC": return oa;
		default: throw new v(`Unsupported NUT-10 type: ${e}`);
	}
}
function Ca(e) {
	let t = [], n = xa(e.type);
	t.push(H(Zi, ba(n)));
	let r, i = [];
	if (e.type === Hi.NOSTR) {
		let { pubkey: t, relays: n } = Ea(e.target);
		r = t, i = n.map((e) => ["r", e]);
	} else r = va(e.target);
	t.push(H(Qi, r));
	let a = [...i, ...e.tags || []];
	if (a.length > 0) for (let e of a) t.push(H($i, Ta(e)));
	let o = t.reduce((e, t) => e + t.length, 0), s = new Uint8Array(o), c = 0;
	for (let e of t) s.set(e, c), c += e.length;
	return s;
}
function wa(e) {
	let t = [], n = Sa(e.kind);
	if (t.push(H(na, ba(n))), t.push(H(ra, va(e.data))), e.tags && e.tags.length > 0) for (let n of e.tags) t.push(H(ia, Ta(n)));
	let r = t.reduce((e, t) => e + t.length, 0), i = new Uint8Array(r), a = 0;
	for (let e of t) i.set(e, a), a += e.length;
	return i;
}
function Ta(e) {
	let t = new TextEncoder(), n = [];
	for (let r of e) {
		let e = t.encode(r);
		if (e.length > 255) throw new v(`Tag tuple string too long: ${r} (max 255 bytes)`);
		let i = new Uint8Array(1 + e.length);
		i[0] = e.length, i.set(e, 1), n.push(i);
	}
	let r = n.reduce((e, t) => e + t.length, 0), i = new Uint8Array(r), a = 0;
	for (let e of n) i.set(e, a), a += e.length;
	return i;
}
function Ea(e) {
	let t = o.decode(e, 1024);
	if (t.prefix !== "nprofile") throw new v(`Invalid nprofile: expected prefix 'nprofile', got '${t.prefix}'`);
	let n = o.fromWords(t.words), r = new Uint8Array(n), i, a = [], s = 0;
	for (; s < r.length;) {
		if (s + 2 > r.length) throw new v("Nprofile TLV data too short");
		let e = r[s], t = r[s + 1];
		if (s += 2, s + t > r.length) throw new v(`Nprofile TLV value too short: expected ${t} bytes`);
		let n = r.subarray(s, s + t);
		if (s += t, e === 0) {
			if (n.length !== 32) throw new v(`Invalid pubkey length: expected 32 bytes, got ${n.length}`);
			i = n;
		} else e === 1 && a.push(new TextDecoder().decode(n));
	}
	if (!i) throw new v("Nprofile missing required pubkey");
	return {
		pubkey: i,
		relays: a
	};
}
function Da(e, t) {
	let n = Oa(e, t), r = o.toWords(n);
	return o.encode("nprofile", r, 1024);
}
function Oa(e, t) {
	if (e.length !== 32) throw new v(`Invalid pubkey: expected 32 bytes, got ${e.length}`);
	let n = new TextEncoder(), r = t.map((e) => n.encode(e));
	for (let e = 0; e < r.length; e++) if (r[e].length > 255) throw new v(`Relay URL too long: ${t[e]} (max 255 bytes)`);
	let i = 34 + r.reduce((e, t) => e + 2 + t.length, 0), a = new Uint8Array(i), o = 0;
	a[o++] = 0, a[o++] = 32, a.set(e, o), o += 32;
	for (let e of r) a[o++] = 1, a[o++] = e.length, a.set(e, o), o += e.length;
	return a;
}
//#endregion
//#region src/model/PaymentRequest.ts
var ka = class e {
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
		let e = Ae(this.toRawRequest());
		return "creqA" + D.toBase64(e);
	}
	toEncodedCreqA() {
		return this.toEncodedRequest();
	}
	toEncodedCreqB() {
		return Ee("creqb", _a({
			id: this.id,
			amount: this.amount === void 0 ? void 0 : this.amount.toBigInt(),
			unit: this.unit,
			singleUse: this.singleUse,
			mints: this.mints,
			description: this.description,
			transports: this.transport,
			nut10: this.nut10 ? [{
				kind: this.nut10.kind,
				data: this.nut10.data,
				tags: this.nut10.tags
			}] : void 0
		})).toUpperCase();
	}
	getTransport(e) {
		return this.transport?.find((t) => t.type === e);
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
			let t = sa(Oe(n));
			return new e(t.transports, t.id, t.amount, t.unit, t.mints, t.description, t.singleUse ?? !1, void 0);
		}
		if (!t.startsWith("creq")) throw new v("unsupported pr: invalid prefix");
		if (t[4] !== "A") throw new v("unsupported pr version");
		let r = He(be(t.slice(5)));
		return this.fromRawRequest(r);
	}
};
//#endregion
//#region src/utils/core.ts
function U(e, t, n, r) {
	let i = Na(e, "splitAmount.value", !0), a = n?.map((e) => Na(e, "splitAmount.split", !0));
	if (a) {
		let e = k.sum(a);
		if (i.isZero() && e.isZero()) return a;
		let n = a.filter((e) => !e.isZero()), r = k.sum(n);
		if (r.greaterThan(i)) throw new v(`Split is greater than total amount: ${r.toString()} > ${i.toString()}`);
		if (n.some((e) => !Ma(e, t))) throw new v("Provided amount preferences do not match the amounts of the mint keyset.");
		if (r.equals(i)) return n;
		a = n, i = i.subtract(r);
	} else a = [];
	let o = ja(t, "desc");
	if (o.length === 0) throw new v("Cannot split amount, keyset is inactive or contains no keys");
	for (let e of o) {
		if (e.isZero()) continue;
		let t = i.divideBy(e).toNumber();
		if (a.push(...Array(t).fill(e)), i = i.subtract(e.multiplyBy(t)), i.isZero()) break;
	}
	if (!i.isZero()) throw new v(`Unable to split remaining amount: ${i.toString()}`);
	return r && (a = a.sort((e, t) => r === "desc" ? t.compareTo(e) : e.compareTo(t))), a;
}
function Aa(e, t = "desc") {
	return ja(e, t);
}
function ja(e, t) {
	let n = Object.keys(e).map((e) => k.from(e));
	return n.sort((e, n) => t === "desc" ? n.compareTo(e) : e.compareTo(n)), n;
}
function Ma(e, t) {
	return Na(e, "hasCorrespondingKey.amount", !0).toString() in t;
}
function Na(e, t, n = !1) {
	let r = k.from(e);
	if (!n && r.isZero()) throw new v(`Amount must be positive: ${r.toString()}, op: ${t}`);
	return r;
}
function Pa(e) {
	return e ? BigInt(`0x${e}`) : 0n;
}
function Fa(e) {
	return e.toString(16).padStart(64, "0");
}
function W(e) {
	return /^[a-f0-9]+$/i.test(e);
}
function Ia(e) {
	return Array.isArray(e) ? e.some((e) => !W(e.id)) : !W(e.id);
}
function La(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
function Ra(e) {
	return e.map((e) => {
		let t = { ...e };
		return t.id = t.id.slice(0, 16), t;
	});
}
function za(e, t) {
	let n = J(e.proofs);
	if (Ia(n)) throw new v("Proofs contain a legacy keyset ID and cannot be encoded. Swap them at the mint first.");
	return Ba({
		...e,
		proofs: n
	}, t?.removeDleq);
}
function Ba(e, t) {
	let n = e.proofs;
	if (t && (n = eo(n)), n.forEach((e) => {
		if (e.dleq && e.dleq.r == null) throw new v("Missing blinding factor in included DLEQ proof");
	}), Ia(n)) throw new v("can not encode to v4 token if proofs contain non-hex keyset id");
	return n = Ra(n), "cashuB" + ve(Ae(Va({
		...e,
		proofs: n
	})));
}
function Va(e) {
	let t = {}, r = e.mint;
	for (let n = 0; n < e.proofs.length; n++) {
		let r = e.proofs[n];
		t[r.id] ? t[r.id].push(r) : t[r.id] = [r];
	}
	let i = {
		m: r,
		u: e.unit || "sat",
		t: Object.keys(t).map((e) => ({
			i: n(e),
			p: t[e].map((e) => ({
				a: e.amount.toBigInt(),
				s: e.secret,
				c: n(e.C),
				...e.dleq && { d: {
					e: n(e.dleq.e),
					s: n(e.dleq.s),
					r: n(e.dleq.r ?? "00")
				} },
				...e.p2pk_e && { pe: n(e.p2pk_e) },
				...e.witness && { w: JSON.stringify(e.witness) }
			}))
		}))
	};
	return e.memo && (i.d = e.memo), i;
}
function Ha(t) {
	let n = [];
	t.t.forEach((t) => t.p.forEach((r) => {
		n.push({
			secret: r.s,
			C: e(r.c),
			amount: k.from(r.a),
			id: e(t.i),
			...r.d && { dleq: {
				r: e(r.d.r),
				s: e(r.d.s),
				e: e(r.d.e)
			} },
			...r.pe && { p2pk_e: e(r.pe) },
			...r.w && { witness: r.w }
		});
	}));
	let r = {
		mint: t.m,
		proofs: n,
		unit: t.u || "sat"
	};
	return t.d && (r.memo = t.d), r;
}
function Ua(e, t) {
	let n = Ga(oo(e));
	return n.proofs = to(n.proofs, t), n;
}
function Wa(e) {
	e = oo(e);
	let t = Ga(e);
	return {
		unit: t.unit || "sat",
		mint: t.mint,
		amount: q(t.proofs),
		...t.memo && { memo: t.memo },
		incompleteProofs: t.proofs.map((e) => {
			let { id: t, ...n } = e;
			return n;
		})
	};
}
function Ga(e) {
	let t = e.slice(0, 1), n = e.slice(1);
	if (t === "A") {
		let e = xe(n);
		if (e.token.length > 1) throw new v("Multi entry token are not supported");
		let t = e.token[0], r = t.proofs.map((e) => ({
			...e,
			amount: k.from(e.amount)
		})), i = {
			mint: t.mint,
			proofs: r,
			unit: e.unit || "sat"
		};
		return e.memo && (i.memo = e.memo), i;
	} else if (t === "B") return Ha(He(be(n)));
	throw new v("Token version is not supported");
}
function Ka(e, t) {
	let r = t?.unit ?? "sat", i = t?.expiry, o = t?.versionByte ?? 1, s = t?.input_fee_ppk;
	if (t?.isDeprecatedBase64 ?? !1) {
		let t = Object.entries(e).sort(([e], [t]) => k.from(e).compareTo(t)).map(([, e]) => e).reduce((e, t) => e + t, ""), n = a(D.fromString(t));
		return D.toBase64(n).slice(0, 12);
	}
	switch (o) {
		case 0: {
			let t = a(qa(...Object.entries(e).sort(([e], [t]) => k.from(e).compareTo(t)).map(([, e]) => n(e))));
			return "00" + D.toHex(t).slice(0, 14);
		}
		case 1:
		case 2: {
			if (!r) throw new v(`Cannot compute keyset ID version 0${o}: unit is required.`);
			let t = Object.entries(e).sort(([e], [t]) => k.from(e).compareTo(t)).map(([e, t]) => `${e}:${t.toLowerCase()}`).join(",");
			t += `|unit:${r.toLowerCase()}`, s && (t += `|input_fee_ppk:${s}`), i && (t += `|final_expiry:${i}`);
			let n = a(D.fromString(t)), c = D.toHex(n);
			return (o === 2 ? "02" : "01") + c;
		}
		default: throw new v(`Unrecognized keyset ID version: ${o}`);
	}
}
function qa(...e) {
	let t = e.reduce((e, t) => e + t.length, 0), n = new Uint8Array(t), r = 0;
	for (let t of e) n.set(t, r), r += t.length;
	return n;
}
function Ja(e) {
	return [...e].sort((e, t) => e.id.localeCompare(t.id));
}
function G(e) {
	return typeof e == "object" && !!e;
}
function Ya(e, ...t) {
	for (let n of t) e[n] === void 0 && (e[n] = null);
}
function K(...e) {
	return e.map((e) => e.replace(/(^\/+|\/+$)/g, "")).join("/");
}
function Xa(e) {
	let t;
	try {
		t = new URL(e);
	} catch (t) {
		throw new v(`Invalid mint URL: ${e}`, { cause: t });
	}
	if (t.protocol !== "http:" && t.protocol !== "https:") throw new v(`Invalid mint URL scheme: ${t.protocol}`);
	if (t.username || t.password) throw new v("Mint URL must not contain credentials");
	if (t.search || t.href.includes("?")) throw new v("Mint URL must not contain query parameters");
	if (t.hash || t.href.includes("#")) throw new v("Mint URL must not contain a fragment");
	if (/%[0-9a-f]{2}/i.test(t.pathname)) throw new v("Mint URL path must not contain percent-encoded characters");
	return t.href.replace(/\/+$/, "");
}
function q(e) {
	return k.sum(e.map((e) => e.amount));
}
function J(e) {
	return e.map((e) => ({
		...e,
		amount: k.from(e.amount)
	}));
}
function Za(e) {
	return (Array.isArray(e) ? e : [e]).map((e) => A.stringify(e));
}
function Qa(e) {
	if (!Array.isArray(e)) {
		let t = A.parse(e);
		if (!Array.isArray(t)) throw TypeError("deserializeProofs: expected a JSON array of proofs");
		e = t;
	}
	return J(e.map((e) => typeof e == "string" ? A.parse(e) : e));
}
function $a(e) {
	return ka.fromEncodedRequest(e);
}
function eo(e) {
	return e.map((e) => {
		let { dleq: t, ...n } = e;
		return n;
	});
}
function to(e, t) {
	let r = [...new Set(t.map((e) => e.toLowerCase()))], i = [];
	for (let t of e) {
		let e;
		try {
			e = n(t.id);
		} catch {
			i.push(t);
			continue;
		}
		if (e[0] === 0) i.push(t);
		else {
			if (t.id.length === 66) {
				i.push(t);
				continue;
			}
			if (t.id.length !== 16) throw new v(`Malformed keyset ID (unexpected length): ${t.id}`);
			if (!r.length) throw new v(`Short keyset ID ${t.id} cannot be resolved. Call \`wallet.loadMint()\` (or pass \`KeyChain.getAllKeysetIds()\`) first.`);
			let e = t.id.toLowerCase(), n = r.filter((t) => e === t.slice(0, e.length));
			if (n.length > 1) throw new v(`Short keyset ID ${t.id} is ambiguous.`);
			if (n.length === 0) throw new v(`Couldn't map short keyset ID ${t.id} to any known keysets of the current Mint`);
			t.id = n[0], i.push(t);
		}
	}
	return i;
}
function no(e, t, r) {
	let i = r?.require ?? !1;
	if (!Ma(e.amount, t.keys)) throw new v(`Undefined key for amount ${e.amount.toString()} in keyset ${t.id}`);
	if (N(e.id)) try {
		return Ct(gt(t.keys[e.amount.toString()]), ht(e.C), new TextEncoder().encode(e.secret));
	} catch {
		return !1;
	}
	if (e?.dleq == null) return !i;
	if (!Ma(e.amount, t.keys)) throw new v(`Undefined key for amount ${e.amount.toString()} in keyset ${t.id}`);
	let a = t.keys[e.amount.toString()];
	try {
		let t = {
			e: n(e.dleq.e),
			s: n(e.dleq.s),
			r: Pa(e.dleq.r ?? "00")
		};
		return Ai(new TextEncoder().encode(e.secret), t, R(e.C), R(a));
	} catch {
		return !1;
	}
}
function ro(e, t, n) {
	let r = J(e), i = n?.requireDleq ?? !1, a = i ? "Token contains proofs with invalid or missing DLEQ" : "Token contains a proof with an invalid DLEQ", o = [], s = [];
	for (let e of r) (N(e.id) ? o : s).push(e);
	let c = (e) => ` (keyset ${e.id}, amount ${e.amount.toString()})`;
	for (let e of s) if (!no(e, t(e.id), { require: i })) throw new v(a + c(e));
	if (o.length === 0) return;
	let l = o.map((e) => {
		let n = t(e.id);
		if (!Ma(e.amount, n.keys)) throw new v(`Undefined key for amount ${e.amount.toString()} in keyset ${n.id}`);
		let r, i;
		try {
			r = gt(n.keys[e.amount.toString()]), i = ht(e.C);
		} catch {
			throw new v(a + c(e));
		}
		return {
			K2: r,
			C: i,
			secret: new TextEncoder().encode(e.secret),
			proof: e
		};
	});
	if (l.length === 1) {
		let e = l[0];
		if (!Ct(e.K2, e.C, e.secret)) throw new v(a + c(e.proof));
		return;
	}
	if (!Tt(l)) {
		for (let e of l) if (!Ct(e.K2, e.C, e.secret)) throw new v(a + c(e.proof));
		throw new v(a);
	}
}
function io(e) {
	let t = new TextEncoder(), n = J(e.proofs), r = Ae(Va({
		...e,
		proofs: n
	}));
	return qa(t.encode("craw"), t.encode("B"), r);
}
function ao(e) {
	let t = new TextDecoder(), n = t.decode(e.slice(0, 4)), r = t.decode(new Uint8Array([e[4]]));
	if (n !== "craw" || r !== "B") throw new v("not a valid binary token");
	return Ha(He(e.slice(5)));
}
function oo(e) {
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
function so(e) {
	return /^ln[a-z]{2,}[1-9][0-9]*(?:[mun]|0p)?1/i.test(e);
}
//#endregion
//#region src/utils/normalizeNumbers.ts
function Y(e, t, n) {
	if (e == null) {
		if (arguments.length >= 3) return n;
		throw new v(`Invalid ${t}: missing value`);
	}
	try {
		return k.from(e).toNumber();
	} catch (e) {
		throw new v(`Invalid ${t}: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
	}
}
function co(e) {
	return {
		...e,
		input_fee_ppk: Y(e.input_fee_ppk, "keyset.input_fee_ppk", void 0),
		final_expiry: Y(e.final_expiry, "keyset.final_expiry", void 0)
	};
}
function lo(e) {
	return {
		...e,
		input_fee_ppk: Y(e.input_fee_ppk, "keys.input_fee_ppk", void 0),
		final_expiry: Y(e.final_expiry, "keys.final_expiry", void 0)
	};
}
//#endregion
//#region src/auth/OIDCAuth.ts
var uo = class e {
	static fromMintInfo(t, n) {
		let r = t?.nuts?.["21"];
		if (!r?.openid_discovery) throw new v("OIDCAuth: mint does not advertise NUT-21 openid_discovery");
		let i = n?.clientId ?? r.client_id ?? "cashu-client";
		return new e(r.openid_discovery, {
			...n,
			clientId: i
		});
	}
	constructor(e, t) {
		this.tokenListeners = [], this.discoveryUrl = e, this.logger = t?.logger ?? C, this.clientId = t?.clientId ?? "cashu-client", this.scope = t?.scope ?? "openid", this.onTokens = t?.onTokens;
	}
	setClient(e) {
		this.clientId = e;
	}
	setScope(e) {
		this.scope = e ?? "openid";
	}
	addTokenListener(e) {
		this.tokenListeners.push(e);
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
		if (!e.ok || !n) throw new v("OIDCAuth: invalid discovery document", { cause: r });
		let i = n;
		if (typeof i.token_endpoint != "string" || i.token_endpoint.length === 0) throw new v("OIDCAuth: invalid discovery document, missing token_endpoint");
		return this.config = i, i;
	}
	generatePKCE() {
		let e = ve(i(48));
		return {
			verifier: e,
			challenge: ve(a(D.fromString(e)))
		};
	}
	async buildAuthCodeUrl(e) {
		let t = await this.loadConfig(), n = e.scope ?? this.scope, r = new URLSearchParams({
			response_type: "code",
			client_id: this.clientId,
			redirect_uri: e.redirectUri,
			scope: n,
			code_challenge_method: e.codeChallengeMethod ?? "S256",
			code_challenge: e.codeChallenge
		});
		if (e.state && r.set("state", e.state), !t.authorization_endpoint) throw new v("OIDCAuth: discovery lacks authorization_endpoint");
		return `${t.authorization_endpoint}?${r.toString()}`;
	}
	async exchangeAuthCode(e) {
		let t = await this.loadConfig(), n = this.toForm({
			grant_type: "authorization_code",
			code: e.code,
			redirect_uri: e.redirectUri,
			client_id: this.clientId,
			code_verifier: e.codeVerifier
		}), r = await this.postFormStrict(t.token_endpoint, n);
		return this.handleTokens(r), r;
	}
	async deviceStart() {
		let e = (await this.loadConfig()).device_authorization_endpoint;
		if (!e) throw new v("OIDCAuth: provider lacks device_authorization_endpoint");
		let t = this.toForm({
			client_id: this.clientId,
			scope: this.scope
		});
		return this.postFormStrict(e, t);
	}
	async devicePoll(e, t = 5) {
		let n = await this.loadConfig(), r = Math.max(1, t);
		for (;;) {
			await this.sleep(r * 1e3);
			let t = this.toForm({
				grant_type: "urn:ietf:params:oauth:grant-type:device_code",
				device_code: e,
				client_id: this.clientId
			}), i = await this.postFormLoose(n.token_endpoint, t);
			if (i.access_token) return this.handleTokens(i), i;
			let a = (i.error ?? "").toString();
			if (a !== "authorization_pending") {
				if (a === "slow_down") {
					r = Math.max(r + 5, r * 2);
					continue;
				}
				throw new v(`OIDCAuth: ${i.error_description || a || "device authorization failed"}`);
			}
		}
	}
	async startDeviceAuth(e = 5) {
		let t = await this.deviceStart(), n = Math.max(t.interval ?? 1, e), r = !1, i = async () => {
			let e = await this.loadConfig(), i = Math.max(1, n);
			for (;;) {
				if (r) throw new v("OIDCAuth: device polling cancelled");
				await this.sleep(i * 1e3);
				let n = this.toForm({
					grant_type: "urn:ietf:params:oauth:grant-type:device_code",
					device_code: t.device_code,
					client_id: this.clientId
				}), a = await this.postFormLoose(e.token_endpoint, n);
				if (a.access_token) return this.handleTokens(a), a;
				let o = (a.error ?? "").toString();
				if (o !== "authorization_pending") {
					if (o === "slow_down") {
						i = Math.max(i + 5, i * 2);
						continue;
					}
					throw new v(`OIDCAuth: ${a.error_description || o || "device authorization failed"}`);
				}
			}
		}, a = () => {
			r = !0;
		};
		return {
			...t,
			poll: i,
			cancel: a
		};
	}
	async refresh(e) {
		let t = await this.loadConfig(), n = this.toForm({
			grant_type: "refresh_token",
			refresh_token: e,
			client_id: this.clientId
		}), r = await this.postFormStrict(t.token_endpoint, n);
		return this.handleTokens(r), r;
	}
	async passwordGrant(e, t) {
		let n = await this.loadConfig(), r = this.toForm({
			grant_type: "password",
			client_id: this.clientId,
			username: e,
			password: t,
			scope: this.scope
		}), i = await this.postFormStrict(n.token_endpoint, r);
		return this.handleTokens(i), i;
	}
	handleTokens(e) {
		if (!e.access_token) throw new v(`OIDCAuth: ${e.error_description || e.error || "token response missing access_token"}`);
		queueMicrotask(() => T(this.onTokens, e, this.logger, { where: "OIDCAuth.handleTokens" }));
		for (let t of this.tokenListeners) queueMicrotask(() => T(t, e, this.logger, { where: "OIDCAuth.handleTokens.listener" }));
	}
	toForm(e) {
		let t = (e) => encodeURIComponent(e).replace(/%20/g, "+");
		return Object.entries(e).map(([e, n]) => `${t(e)}=${t(n)}`).join("&");
	}
	async postFormStrict(e, t) {
		try {
			this.logger.debug("OIDCAuth Request", { formBody: t });
			let n = await fetch(e, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json"
				},
				body: t
			}), r = await n.text(), i, a;
			try {
				i = r ? JSON.parse(r) : void 0;
			} catch (e) {
				a = e, this.logger.warn("OIDCAuth: bad JSON (strict)", { err: e });
			}
			if (!n.ok) {
				let e = i ?? {};
				throw new v(`OIDCAuth: ${e.error_description || e.error || `HTTP ${n.status}`}`, { cause: a });
			}
			return this.logger.debug("OIDCAuth Response", { json: i }), i ?? {};
		} catch (e) {
			throw this.logger.error("OIDCAuth: postFormStrict failed", { err: e }), e;
		}
	}
	async postFormLoose(e, t) {
		try {
			this.logger.debug("OIDCAuth Request", { formBody: t });
			let n = await (await fetch(e, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json"
				},
				body: t
			})).text(), r;
			try {
				r = n ? JSON.parse(n) : void 0;
			} catch (e) {
				this.logger.warn("OIDCAuth: bad JSON (loose)", { err: e });
			}
			return this.logger.debug("OIDCAuth Response", { json: r }), r ?? {};
		} catch (e) {
			return this.logger.error("OIDCAuth: postFormLoose network error", { err: e }), {
				error: "network_error",
				error_description: String(e)
			};
		}
	}
	sleep(e) {
		return new Promise((t) => setTimeout(t, e));
	}
}, X = class e {
	constructor(t, n) {
		let r = n ?? C;
		this._mintInfo = e.normalizeInfo(t, r);
		let i = this.toEndpoints(this._mintInfo?.nuts?.[22]?.protected_endpoints);
		this._protected22 = this.buildIndex(i);
		let a = this.toEndpoints(this._mintInfo?.nuts?.[21]?.protected_endpoints);
		this._protected21 = this.buildIndex(a);
	}
	static normalizeInfo(t, n = C) {
		return {
			...t,
			nuts: {
				...t.nuts,
				...t.nuts[4] ? { 4: {
					...t.nuts[4],
					methods: e.normalizeSwapMethods(t.nuts[4].methods)
				} } : {},
				...t.nuts[5] ? { 5: {
					...t.nuts[5],
					methods: e.normalizeSwapMethods(t.nuts[5].methods)
				} } : {},
				...t.nuts[19] ? { 19: e.normalizeNut19(t.nuts[19]) } : {},
				...t.nuts[22] ? { 22: e.normalizeNut22(t.nuts[22], n) } : {},
				...t.nuts[29] ? { 29: e.normalizeNut29(t.nuts[29], n) } : {}
			}
		};
	}
	static normalizeSwapMethods(e) {
		return e.map((e) => {
			let t = { ...e };
			return Ya(t, "min_amount", "max_amount"), t;
		});
	}
	static normalizeNut19(e) {
		return e && {
			...e,
			ttl: Y(e.ttl, "nuts.19.ttl", null)
		};
	}
	static normalizeNut22(e, t) {
		if (!e) return e;
		let n = 100;
		try {
			n = Y(e.bat_max_mint, "nuts.22.bat_max_mint", 100);
		} catch {
			t.warn("MintInfo: nuts.22.bat_max_mint is malformed, defaulting to internal cap", { value: e.bat_max_mint });
		}
		return n > 100 && (t.warn("MintInfo: nuts.22.bat_max_mint exceeds internal cap and was clamped", {
			advertised: n,
			clampedTo: 100
		}), n = 100), {
			...e,
			bat_max_mint: n
		};
	}
	static normalizeNut29(e, t) {
		if (!e) return e;
		let n = 100;
		try {
			n = Y(e.max_batch_size, "nuts.29.max_batch_size", 100);
		} catch {
			t.warn("MintInfo: nuts.29.max_batch_size is malformed, defaulting to internal cap", { value: e.max_batch_size });
		}
		return n > 100 && (t.warn("MintInfo: nuts.29.max_batch_size exceeds internal cap and was clamped", {
			advertised: n,
			clampedTo: 100
		}), n = 100), {
			methods: e.methods,
			max_batch_size: n
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
			default: throw new v("nut is not supported by cashu-ts");
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
		return this._mintInfo.nuts[e]?.supported ? { supported: !0 } : { supported: !1 };
	}
	checkMintMelt(e) {
		let t = this._mintInfo.nuts[e];
		return t && t.methods.length > 0 && !t.disabled ? {
			disabled: !1,
			params: t.methods
		} : {
			disabled: !0,
			params: t?.methods ?? []
		};
	}
	checkNut17() {
		return this._mintInfo.nuts[17] && this._mintInfo.nuts[17].supported.length > 0 ? {
			supported: !0,
			params: this._mintInfo.nuts[17].supported
		} : { supported: !1 };
	}
	checkNut15() {
		return this._mintInfo.nuts[15] && this._mintInfo.nuts[15].methods.length > 0 ? {
			supported: !0,
			params: this._mintInfo.nuts[15].methods
		} : { supported: !1 };
	}
	checkNut19() {
		let e = this._mintInfo.nuts?.[19];
		if (e && (e?.cached_endpoints?.length || 0) > 0) {
			let t = Y(e.ttl, "nuts.19.ttl", null);
			return {
				supported: !0,
				params: {
					ttl: t === null ? Infinity : Math.max(t, 0) * 1e3,
					cached_endpoints: e.cached_endpoints
				}
			};
		}
		return { supported: !1 };
	}
	checkNut29() {
		let e = this._mintInfo.nuts?.[29];
		return e ? {
			supported: !0,
			params: e
		} : { supported: !1 };
	}
	toEndpoints(e) {
		if (!Array.isArray(e)) return [];
		let t = [];
		for (let n of e) if (n && typeof n == "object") {
			let e = n, r = e.method, i = e.path;
			if (typeof r == "string" && typeof i == "string") {
				let e = r.toUpperCase();
				(e === "GET" || e === "POST") && t.push({
					method: e,
					path: i
				});
			}
		}
		return t;
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
			if (e.startsWith("^") && (e = e.slice(1)), e.endsWith("$") && (e = e.slice(0, -1)), e.endsWith(".*")) {
				n[r.method].push(e.slice(0, -2));
				continue;
			}
			if (e.endsWith("*")) {
				n[r.method].push(e.slice(0, -1));
				continue;
			}
			t[r.method].add(e);
		}
		return n.GET.sort((e, t) => t.length - e.length), n.POST.sort((e, t) => t.length - e.length), {
			exact: t,
			prefix: n
		};
	}
	get cache() {
		return this._mintInfo;
	}
	get contact() {
		return this._mintInfo.contact;
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
		return this._mintInfo.nuts;
	}
	get version() {
		return this._mintInfo.version;
	}
	get motd() {
		return this._mintInfo.motd;
	}
	supportsNut04Description(e, t) {
		return this._mintInfo.nuts[4]?.methods.some((n) => n.method === e && (t ? n.unit === t : !0) && (n.options?.description === !0 || n.description === !0));
	}
	supportedMethods(e) {
		let { disabled: t, params: n } = this.isSupported(e === "mint" ? 4 : 5);
		return t ? [] : n;
	}
	supportsMintMeltMethod(e, t, n) {
		let { disabled: r, params: i } = this.isSupported(e === "mint" ? 4 : 5);
		return r ? !1 : i.some((e) => e.method === t && e.unit === n);
	}
	supportsAmountless(e = "bolt11", t = "sat") {
		let n = this._mintInfo?.nuts?.[5]?.methods ?? [];
		return Array.isArray(n) ? n.some((n) => n.method === e && n.unit === t && n.options?.amountless === !0) : !1;
	}
}, fo = {
	UNPAID: "UNPAID",
	PAID: "PAID",
	ISSUED: "ISSUED"
}, po = {
	UNPAID: "UNPAID",
	PENDING: "PENDING",
	PAID: "PAID"
}, mo = {
	UNSPENT: "UNSPENT",
	PENDING: "PENDING",
	SPENT: "SPENT"
};
//#endregion
//#region src/transport/request.ts
function ho(e) {
	return e.window !== void 0 && e.window.document !== void 0 ? !0 : e.WorkerGlobalScope !== void 0 && e.self !== void 0 && e.self instanceof e.WorkerGlobalScope;
}
var go = ho(globalThis);
function _o(e, t, n = go) {
	return {
		Accept: "application/json, text/plain, */*",
		...e ? { "Content-Type": "application/json" } : void 0,
		...n ? void 0 : { "User-Agent": "Mozilla/5.0" },
		...t
	};
}
function vo(e, t) {
	return e instanceof Error ? e.message : t;
}
function yo(e) {
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
var bo = {}, Z = C;
function xo(e) {
	bo = e;
}
function So(e) {
	Z = e;
}
var Co = 9, wo = 1e3, To = 100, Eo = class e extends b {
	constructor(t) {
		super(t), this.name = "CallerAbortError", Object.setPrototypeOf(this, e.prototype);
	}
};
function Do(e) {
	return e instanceof Eo ? !1 : e instanceof b ? !0 : e instanceof y && e.status >= 500;
}
function Oo(e, t) {
	return t ? new Promise((n, r) => {
		if (t.aborted) {
			r(new Eo("Request aborted by caller"));
			return;
		}
		let i = () => {
			clearTimeout(a), t.removeEventListener("abort", i), r(new Eo("Request aborted by caller"));
		};
		t.addEventListener("abort", i, { once: !0 });
		let a = setTimeout(() => {
			t.removeEventListener("abort", i), n();
		}, e);
	}) : new Promise((t) => setTimeout(t, e));
}
function ko(e) {
	try {
		return new URL(e).pathname;
	} catch {
		return e.startsWith("/") ? e.split(/[?#]/, 1)[0] : void 0;
	}
}
function Ao(e, t) {
	return e === t ? !0 : e.endsWith(t);
}
async function jo(e) {
	let { ttl: t, cached_endpoints: n, endpoint: r } = e, i = ko(r), a = e.method?.toUpperCase() ?? "GET";
	if (!(i !== void 0 && n?.some((e) => Ao(i, e.path) && e.method === a) && t)) return await Mo(e);
	let o = 0, s = Date.now(), c = async () => {
		try {
			return await Mo(e);
		} catch (n) {
			if (Do(n)) {
				let r = Date.now() - s;
				if (o < Co && (!t || r < t)) {
					let i = Math.min(2 ** o * To, wo), a = Math.random() * i;
					if (r + a > t) throw Z.error(`Network Error: request abandoned after ${o} retries`, {
						e: n,
						retries: o
					}), n;
					return o++, Z.info(`Network Error: attempting retry ${o} in ${a}ms`, {
						e: n,
						retries: o,
						delay: a
					}), await Oo(a, e.signal), c();
				}
			}
			throw Z.error("Request failed and could not be retried", { e: n }), n;
		}
	};
	return c();
}
async function Mo(e) {
	let { endpoint: t, requestBody: n, headers: r, requestTimeout: i, onResponseMeta: a, cached_endpoints: o, ttl: s, logger: c, ...l } = e, u = n ? A.stringify(n) : void 0, d = _o(u, r), f = e.signal ?? void 0;
	if (f?.aborted) throw new Eo("Request aborted by caller");
	let p = i === void 0 ? void 0 : new AbortController(), m = f, h, g;
	if (p) if (h = setTimeout(() => p.abort(), i), !f) m = p.signal;
	else {
		let e = new AbortController(), t = () => e.abort();
		f.addEventListener("abort", t, { once: !0 }), p.signal.addEventListener("abort", t, { once: !0 }), g = () => {
			f.removeEventListener("abort", t), p.signal.removeEventListener("abort", t);
		}, m = e.signal;
	}
	let _;
	try {
		_ = await fetch(t, {
			body: u,
			headers: d,
			cache: "no-store",
			credentials: "omit",
			referrer: "",
			referrerPolicy: "no-referrer",
			...l,
			signal: m
		});
	} catch (e) {
		let t = !!p?.signal.aborted, n = !!f?.aborted;
		throw t ? new b(`Request timed out after ${i}ms`, { cause: e }) : n ? new Eo(vo(e, "Request aborted by caller")) : e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError") ? new b(e.message, { cause: e }) : new b(vo(e, "Network request failed"), { cause: e });
	} finally {
		clearTimeout(h), g?.();
	}
	let C = yo(_.headers.get("Retry-After"));
	if (a && _.headers && T(a, {
		endpoint: t,
		status: _.status,
		retryAfterMs: C,
		rateLimit: _.headers.get("RateLimit") ?? void 0,
		rateLimitPolicy: _.headers.get("RateLimit-Policy") ?? void 0,
		headers: _.headers
	}, Z, {
		op: "request.onResponseMeta",
		status: _.status,
		endpoint: t
	}), !_.ok) {
		let e, t;
		try {
			e = No(await _.text());
		} catch (n) {
			t = n, e = { error: "bad response" };
		}
		if (_.status === 429) throw new x("429 Too Many Requests", C);
		if (_.status === 400 && "code" in e && typeof e.code == "number" && "detail" in e && typeof e.detail == "string") throw new S(e.code, e.detail);
		let n = "HTTP request failed";
		throw "error" in e && typeof e.error == "string" ? n = e.error : "detail" in e && typeof e.detail == "string" && (n = e.detail), new y(n, _.status, { cause: t });
	}
	try {
		let e = await _.text();
		if (!e) throw new v("Empty response body");
		return A.parse(e);
	} catch (e) {
		throw Z.error("Failed to parse HTTP response", { err: e }), new y("bad response", _.status, { cause: e });
	}
}
function No(e) {
	if (!e) return { detail: "bad response" };
	let t;
	try {
		t = A.parse(e);
	} catch {
		return { detail: e };
	}
	return typeof t == "object" && t && ("detail" in t || "code" in t || "error" in t) ? t : { detail: t };
}
async function Po(e) {
	let t = e.onResponseMeta, n = bo.onResponseMeta, r = {
		...e,
		...bo
	};
	return t && (r.onResponseMeta = t), t && n && t !== n && (r.onResponseMeta = (r) => {
		T(t, r, Z, {
			op: "request.onResponseMeta",
			scope: "per-request",
			endpoint: e.endpoint
		}), T(n, r, Z, {
			op: "request.onResponseMeta",
			scope: "global",
			endpoint: e.endpoint
		});
	}), await jo(r);
}
//#endregion
//#region src/transport/ws.ts
var Fo;
typeof WebSocket < "u" && (Fo = WebSocket);
function Io(e) {
	Fo = e;
}
function Lo() {
	if (Fo === void 0) throw new v("WebSocket implementation not initialized");
	return Fo;
}
//#endregion
//#region src/transport/WSConnection.ts
var Ro = class {
	constructor(e) {
		this.next = null, this.value = e;
	}
}, zo = class {
	constructor() {
		this._first = null, this._last = null, this.size = 0;
	}
	enqueue(e) {
		let t = new Ro(e);
		return this._last ? this._last.next = t : this._first = t, this._last = t, this.size++, !0;
	}
	dequeue() {
		if (!this._first) return null;
		let e = this._first;
		return this._first = e.next, this._first || (this._last = null), this.size--, e.value;
	}
}, Bo = class {
	constructor(e, t) {
		this.subListeners = {}, this.rpcListeners = {}, this.rpcId = 0, this.onCloseCallbacks = [], this._WS = Lo(), this.url = new URL(e), this.messageQueue = new zo(), this._logger = t ?? C;
	}
	setLogger(e) {
		this._logger = e;
	}
	connect(e = 1e4) {
		return this.connectionPromise || (this.connectionPromise = new Promise((t, n) => {
			let r = !1, i = !1, a = null, o = (e) => {
				i || (i = !0, a && clearTimeout(a), e());
			}, s = () => {
				if (this.ws) {
					try {
						this.ws.onopen = null, this.ws.onerror = null, this.ws.onmessage = null, this.ws.onclose = null;
					} catch {}
					try {
						this.ws.close();
					} catch {}
					this.ws = void 0, this.stopMessageHandling();
				}
			}, c = (e) => {
				this.connectionPromise = void 0, s();
				let t = e instanceof Error ? e : new v(String(e), { cause: e });
				this.failPendingRpc(t), o(() => n(t));
			};
			try {
				this.ws = new this._WS(this.url.toString());
			} catch (e) {
				c(e);
				return;
			}
			a = setTimeout(() => {
				c(new v(`WebSocket connect timeout after ${e}ms`));
			}, e), this.ws.onopen = () => {
				r = !0, o(t);
			}, this.ws.onerror = (e) => {
				if (!r) {
					c(new v("Failed to open WebSocket"));
					return;
				}
				this._logger.error("WebSocket error after open", { ev: e });
			}, this.ws.onmessage = (e) => {
				this.messageQueue.enqueue(e.data), this.handlingInterval || (this.handlingInterval = setInterval(this.handleNextMessage.bind(this), 0));
			}, this.ws.onclose = (e) => {
				if (this.connectionPromise = void 0, !r) {
					let t = e?.reason ? `, ${e.reason}` : "";
					c(new v(`WebSocket closed before open (code ${e?.code ?? 0}${t})`));
					return;
				}
				this.stopMessageHandling();
				let t = e?.reason ? `, ${e.reason}` : "", n = e?.code ?? 0;
				!(typeof e.wasClean != "boolean" || e.wasClean) || n !== 1e3 && n !== 1001 ? this.failPendingRpc(new v(`WebSocket closed (code ${n}${t})`)) : this.rpcListeners = {}, this.onCloseCallbacks.forEach((t) => t(e));
			};
		})), this.connectionPromise;
	}
	sendRequest(e, t) {
		if (this.ws?.readyState !== this._WS.OPEN) {
			if (e === "unsubscribe") return;
			throw this._logger.error("Attempted sendRequest, but socket was not open"), new v("Socket not open");
		}
		let n = this.rpcId;
		this.rpcId++, this.sendRpcMessage(e, t, n);
	}
	addSubListener(e, t) {
		(this.subListeners[e] = this.subListeners[e] || []).push(t);
	}
	stopMessageHandling() {
		for (this.handlingInterval && (clearInterval(this.handlingInterval), this.handlingInterval = void 0); this.messageQueue.size > 0;) this.messageQueue.dequeue();
	}
	failPendingRpc(e) {
		let t = this.rpcListeners;
		this.rpcListeners = {};
		for (let n of Object.keys(t)) try {
			t[n].errorCallback(e);
		} catch {}
	}
	sendRpcMessage(e, t, n) {
		if (this.ws?.readyState !== this._WS.OPEN) throw new v("Socket not open");
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
			this.ws = void 0, this.stopMessageHandling();
			let t = e instanceof Error ? e : new v(String(e), { cause: e });
			throw this.failPendingRpc(t), t;
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
		if (this.subListeners[e]) {
			if (this.subListeners[e].length === 1) {
				delete this.subListeners[e];
				return;
			}
			this.subListeners[e] = this.subListeners[e].filter((e) => e !== t);
		}
	}
	async ensureConnection(e) {
		this.ws?.readyState !== this._WS.OPEN && await this.connect(e);
	}
	handleNextMessage() {
		if (this.messageQueue.size === 0) {
			this.handlingInterval && (clearInterval(this.handlingInterval), this.handlingInterval = void 0);
			return;
		}
		let e = this.messageQueue.dequeue();
		try {
			let t = JSON.parse(e);
			if ("result" in t && t.id != null) this.rpcListeners[t.id] && (this.rpcListeners[t.id].callback(), this.removeRpcListener(t.id));
			else if ("error" in t && t.id != null) this.rpcListeners[t.id] && (this.rpcListeners[t.id].errorCallback(new v(t.error.message)), this.removeRpcListener(t.id));
			else if ("method" in t && !("id" in t)) {
				let e = t.params?.subId;
				if (!e) return;
				if (this.subListeners[e]?.length > 0) {
					let n = t;
					this.subListeners[e].forEach((e) => {
						try {
							e(n.params?.payload);
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
	createSubscription(e, t, n) {
		if (this.ws?.readyState !== this._WS.OPEN) throw this._logger.error("Attempted createSubscription, but socket was not open"), new v("Socket is not open");
		let r = (Math.random() + 1).toString(36).substring(7), i = this.rpcId;
		this.addRpcListener(() => {
			this.addSubListener(r, t);
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
		}, n || ((e) => this._logger.error("Unsubscribe failed", { e })), r);
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
		if (this.ws) {
			try {
				this.ws.close();
			} catch {}
			this.ws = void 0;
		}
		this.connectionPromise = void 0, this.stopMessageHandling();
	}
	onClose(e) {
		this.onCloseCallbacks.push(e);
	}
}, Vo = class {
	constructor(e, t) {
		this._lastResponseMetadata = void 0, this._captureResponseMetadata = (e) => {
			this._lastResponseMetadata = e;
		}, this._mintUrl = Xa(e), this._request = t?.customRequest ?? Po, this._authProvider = t?.authProvider, this._logger = t?.logger ?? C, So(this._logger);
	}
	get mintUrl() {
		return this._mintUrl;
	}
	get lastResponseMetadata() {
		return this._lastResponseMetadata;
	}
	async oidcAuth(e) {
		let t = (await this.getLazyMintInfo()).nuts[21];
		if (!t?.openid_discovery) throw new v("Mint: no NUT-21 openid_discovery");
		return new uo(t.openid_discovery, {
			...e,
			clientId: e?.clientId ?? t.client_id ?? "cashu-client"
		});
	}
	async getInfo(e) {
		let t = await (e ?? this._request)({
			endpoint: K(this._mintUrl, "/v1/info"),
			onResponseMeta: this._captureResponseMetadata
		});
		return X.normalizeInfo(t);
	}
	async getLazyMintInfo(e) {
		if (this._mintInfo) return this._mintInfo;
		let t = await this.getInfo(e);
		return this._mintInfo = new X(t, this._logger), this._mintInfo;
	}
	setMintInfo(e) {
		this._mintInfo = e instanceof X ? e : new X(e, this._logger);
	}
	async swap(e, t) {
		let n = await this.requestWithAuth("POST", "/v1/swap", { requestBody: e }, t);
		if (!G(n) || !Array.isArray(n?.signatures)) throw this._logger.error("Invalid response from mint...", {
			data: n,
			op: "swap"
		}), new v("Invalid response from mint");
		return n.signatures = this.normalizeSignatureAmounts(n.signatures), n;
	}
	async createMintQuote(e, t, n) {
		w(!this.isValidMethodString(e), `Invalid mint quote method: ${e}`, this._logger);
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
		w(!this.isValidMethodString(e), `Invalid mint quote method: ${e}`, this._logger);
		let r = await this.requestWithAuth("GET", `/v1/mint/quote/${e}/${t}`, {}, n?.customRequest);
		return this.normalizeMintQuoteResponse(e, r, n?.normalize);
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
		w(!this.isValidMethodString(e), `Invalid mint method: ${e}`, this._logger);
		let r = await this.requestWithAuth("POST", `/v1/mint/${e}`, { requestBody: t }, n?.customRequest);
		if (!G(r) || !Array.isArray(r?.signatures)) throw this._logger.error("Invalid response from mint...", {
			data: r,
			op: `mint.${e}`
		}), new v("Invalid response from mint");
		return r.signatures = this.normalizeSignatureAmounts(r.signatures), n?.normalize ? n.normalize(r) : r;
	}
	async mintBatchBolt11(e, t) {
		return this.mintBatch("bolt11", e, { customRequest: t });
	}
	async mintBatchBolt12(e, t) {
		return this.mintBatch("bolt12", e, { customRequest: t });
	}
	async mintBatch(e, t, n) {
		w(!this.isValidMethodString(e), `Invalid mint method: ${e}`, this._logger);
		let r = {
			...t,
			quote_amounts: t.quote_amounts.map((e) => k.from(e).toBigInt())
		}, i = await this.requestWithAuth("POST", `/v1/mint/${e}/batch`, { requestBody: r }, n?.customRequest);
		if (!G(i) || !Array.isArray(i?.signatures)) throw this._logger.error("Invalid response from mint...", {
			data: i,
			op: `mintBatch.${e}`
		}), new v("Invalid response from mint");
		return i.signatures = this.normalizeSignatureAmounts(i.signatures), n?.normalize ? n.normalize(i) : i;
	}
	async createMeltQuote(e, t, n) {
		w(!this.isValidMethodString(e), `Invalid melt quote method: ${e}`, this._logger);
		let r = await this.requestWithAuth("POST", `/v1/melt/quote/${e}`, { requestBody: t }, n?.customRequest);
		return this.normalizeMeltQuoteResponse(e, r, n?.normalize);
	}
	async createMeltQuoteBolt11(e, t) {
		return this.createMeltQuote("bolt11", this.normalizeMeltQuoteRequestOptions(e), { customRequest: t });
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
		w(!this.isValidMethodString(e), `Invalid melt quote method: ${e}`, this._logger);
		let r = await this.requestWithAuth("GET", `/v1/melt/quote/${e}/${t}`, {}, n?.customRequest);
		return this.normalizeMeltQuoteResponse(e, r, n?.normalize);
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
		w(!this.isValidMethodString(e), `Invalid melt method: ${e}`, this._logger);
		let r = await this.requestWithAuth("POST", `/v1/melt/${e}`, { requestBody: t }, n?.customRequest);
		return this.normalizeMeltQuoteResponse(e, r, n?.normalize);
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
		if (!G(n) || !Array.isArray(n?.states)) throw this._logger.error("Invalid response from mint...", {
			data: n,
			op: "check"
		}), new v("Invalid response from mint");
		for (let e of n.states) Ya(e, "witness");
		return n;
	}
	async getKeys(e, t, n) {
		let r = t || this._mintUrl;
		e && (e = e.replace(/\//g, "_").replace(/\+/g, "-"));
		let i = await (n ?? this._request)({
			endpoint: e ? K(r, "/v1/keys", e) : K(r, "/v1/keys"),
			onResponseMeta: this._captureResponseMetadata
		});
		if (!G(i) || !Array.isArray(i.keysets)) throw this._logger.error("Invalid response from mint...", {
			data: i,
			op: "getKeys"
		}), new v("Invalid response from mint");
		return {
			...i,
			keysets: i.keysets.map((e) => lo(e))
		};
	}
	async getKeySets(e) {
		let t = await (e ?? this._request)({
			endpoint: K(this._mintUrl, "/v1/keysets"),
			onResponseMeta: this._captureResponseMetadata
		});
		if (!G(t) || !Array.isArray(t.keysets)) throw this._logger.error("Invalid response from mint...", {
			data: t,
			op: "getKeySets"
		}), new v("Invalid response from mint");
		return {
			...t,
			keysets: t.keysets.map((e) => co(e))
		};
	}
	async restore(e, t) {
		let n = await (t ?? this._request)({
			endpoint: K(this._mintUrl, "/v1/restore"),
			method: "POST",
			requestBody: e,
			onResponseMeta: this._captureResponseMetadata
		});
		if (!G(n) || !Array.isArray(n?.outputs) || !Array.isArray(n?.signatures)) throw this._logger.error("Invalid response from mint...", {
			data: n,
			op: "restore"
		}), new v("Invalid response from mint");
		return n.outputs = this.normalizeMessageAmounts(n.outputs), n.signatures = this.normalizeSignatureAmounts(n.signatures), n;
	}
	async getConditionalKeysets(e = {}, t) {
		let n = new URLSearchParams();
		e.since !== void 0 && n.set("since", String(e.since)), e.limit !== void 0 && n.set("limit", String(e.limit)), e.active !== void 0 && n.set("active", String(e.active));
		let r = n.toString(), i = r ? `/v1/conditional_keysets?${r}` : "/v1/conditional_keysets", a = await this.requestWithAuth("GET", i, {}, t);
		if (!G(a) || !Array.isArray(a.keysets)) throw this._logger.error("Invalid response from mint...", {
			data: a,
			op: "getConditionalKeysets"
		}), new v("Invalid response from mint");
		return { keysets: a.keysets.map((e) => ({
			...e,
			input_fee_ppk: Y(e.input_fee_ppk, "conditional_keyset.input_fee_ppk", void 0),
			final_expiry: Y(e.final_expiry, "conditional_keyset.final_expiry", void 0),
			registered_at: Y(e.registered_at, "conditional_keyset.registered_at", void 0)
		})) };
	}
	async getConditions(e = {}, t) {
		let n = new URLSearchParams();
		e.since !== void 0 && n.set("since", String(e.since)), e.limit !== void 0 && n.set("limit", String(e.limit));
		for (let t of e.status ?? []) n.append("status", t);
		let r = n.toString(), i = r ? `/v1/conditions?${r}` : "/v1/conditions", a = await this.requestWithAuth("GET", i, {}, t);
		if (!G(a) || !Array.isArray(a.conditions)) throw this._logger.error("Invalid response from mint...", {
			data: a,
			op: "getConditions"
		}), new v("Invalid response from mint");
		return a;
	}
	async registerCondition(e, t) {
		let n = await this.requestWithAuth("POST", "/v1/conditions", { requestBody: e }, t);
		if (!G(n) || typeof n.condition_id != "string") throw this._logger.error("Invalid response from mint...", {
			data: n,
			op: "registerCondition"
		}), new v("Invalid response from mint");
		return Array.isArray(n.change) && (n.change = this.normalizeSignatureAmounts(n.change)), n;
	}
	async getCtfCondition(e, t) {
		if (!/^[0-9a-fA-F]{64}$/.test(e)) throw new v("conditionId must be a 64-character hex string for CTF condition lookup");
		let n = e.toLowerCase(), r = await this.getCtfConditionResponse(n, t), i = r, a = this.normalizeCtfCondition(G(i.condition) ? i.condition : r);
		if (!G(a) || a.condition_id?.toLowerCase() !== n || !G(a.keysets)) throw this._logger.error("Invalid response from mint...", {
			data: r,
			op: "getCtfCondition"
		}), new v(`Mint did not return condition ${n}`);
		return a;
	}
	normalizeCtfCondition(e) {
		if (G(e.keysets) || !Array.isArray(e.partitions)) return e;
		let t = {};
		for (let n of e.partitions) if (!(!G(n) || !G(n.keysets))) for (let [e, r] of Object.entries(n.keysets)) typeof r == "string" && (t[e] = r);
		return {
			...e,
			keysets: t
		};
	}
	async getCtfConditionResponse(e, t) {
		try {
			return await this.requestWithAuth("GET", `/v1/conditions/${e}`, {}, t);
		} catch (n) {
			if (!this.isConditionNotFound(n)) throw n;
			let r = await this.requestWithAuth("GET", "/v1/conditions", {}, t), i = (Array.isArray(r) ? r : G(r) && Array.isArray(r.conditions) ? r.conditions : []).find((t) => t.condition_id?.toLowerCase() === e);
			if (!i) throw n;
			return i;
		}
	}
	isConditionNotFound(e) {
		return !!(e instanceof S && e.code === 13021 || e instanceof v && /condition not found/i.test(e.message));
	}
	async ctfConvert(e, t) {
		let n = {
			...e,
			outputs: Object.fromEntries(Object.entries(e.outputs).map(([e, t]) => [e, this.toWireBlindedMessages(t)]))
		}, r = await this.requestWithAuth("POST", "/v1/ctf/convert", { requestBody: n }, t);
		if (!G(r) || !G(r.signatures)) throw this._logger.error("Invalid response from mint...", {
			data: r,
			op: "ctfConvert"
		}), new v("Invalid response from mint");
		for (let [e, t] of Object.entries(r.signatures)) {
			if (!Array.isArray(t)) throw this._logger.error("Invalid response from mint...", {
				data: r,
				op: "ctfConvert"
			}), new v(`Mint returned invalid CTF convert signatures for ${e}`);
			r.signatures[e] = this.normalizeSignatureAmounts(t);
		}
		return r;
	}
	async ctfSettle(e, t) {
		let n = await this.requestWithAuth("POST", "/v1/ctf/convert", { requestBody: e }, t);
		if (!G(n) || !Array.isArray(n.signatures)) throw this._logger.error("Invalid response from mint...", {
			data: n,
			op: "ctfSettle"
		}), new v("Invalid response from mint");
		if (n.signatures.length !== e.participants.length) throw new v("Mint returned the wrong CTF settlement participant count");
		return n.signatures = n.signatures.map((t, n) => {
			if (!Array.isArray(t) || t.length !== e.participants[n].outputs.length) throw new v(`Mint returned the wrong CTF settlement signature count for participant ${n}`);
			let r = this.normalizeSignatureAmounts(t);
			return r.forEach((t, r) => {
				let i = e.participants[n].outputs[r];
				if (t.id !== i.id || !t.amount.equals(i.amount)) throw new v(`Mint returned a mismatched CTF settlement signature for participant ${n}`);
			}), r;
		}), n;
	}
	async redeemOutcome(e, t) {
		let n = {
			...e,
			outputs: this.toWireBlindedMessages(e.outputs)
		}, r = await this.requestWithAuth("POST", "/v1/redeem_outcome", { requestBody: n }, t);
		if (!G(r) || !Array.isArray(r.signatures)) throw this._logger.error("Invalid response from mint...", {
			data: r,
			op: "redeemOutcome"
		}), new v("Invalid response from mint");
		return r.signatures = this.normalizeSignatureAmounts(r.signatures), r;
	}
	async connectWebSocket() {
		try {
			let e = new URL(this._mintUrl);
			e.pathname.endsWith("/") ? e.pathname += "v1/ws" : e.pathname += "/v1/ws", e.protocol = e.protocol === "https:" ? "wss:" : "ws:";
			let t = e.toString();
			this.ws || (this.ws = new Bo(t, this._logger)), await this.ws.ensureConnection();
		} catch (e) {
			this._logger.error("Failed to connect to WebSocket...", { e });
			try {
				this.ws?.close();
			} catch {}
			throw this.ws = void 0, new v("Failed to connect to WebSocket...", { cause: e });
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
			endpoint: K(this._mintUrl, t),
			method: e,
			headers: c,
			...l?.supported && l.params ? l.params : {},
			onResponseMeta: this._captureResponseMetadata
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
		return e.map((e) => ({
			...e,
			amount: k.from(e.amount)
		}));
	}
	normalizeMessageAmounts(e) {
		return e.map((e) => ({
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
	normalizeMintQuoteResponse(e, t, n) {
		let r = { ...t };
		return e === "bolt11" ? this.normalizeMintQuoteBolt11Fields(r) : e === "bolt12" ? this.normalizeMintQuoteBolt12Fields(r) : e === "onchain" && this.normalizeMintQuoteOnchainFields(r), n ? n(r) : r;
	}
	normalizeMintQuoteBolt11Fields(e) {
		e.amount = k.from(e.amount), e.expiry = Y(e.expiry, "mintQuoteBolt11.expiry", null);
	}
	normalizeMintQuoteBolt12Fields(e) {
		Ya(e, "amount"), e.amount = e.amount === null ? null : k.from(e.amount), e.expiry = Y(e.expiry, "mintQuoteBolt12.expiry", null), e.amount_paid = k.from(e.amount_paid), e.amount_issued = k.from(e.amount_issued);
	}
	normalizeMintQuoteOnchainFields(e) {
		e.expiry = Y(e.expiry, "mintQuoteOnchain.expiry", null), e.amount_paid = k.from(e.amount_paid), e.amount_issued = k.from(e.amount_issued);
	}
	normalizeMeltQuoteResponse(e, t, n) {
		let r = `${e} melt quote`, i = { ...t };
		return this.normalizeMeltBaseFields(i, r), e === "bolt11" || e === "bolt12" ? this.normalizeMeltBoltFields(i, r) : e === "onchain" && this.normalizeMeltOnchainFields(i), n ? n(i) : i;
	}
	normalizeMeltBaseFields(e, t) {
		if (e.amount = k.from(e.amount), e.expiry = Y(e.expiry, "meltQuote.expiry", void 0), e.change && (e.change = this.normalizeSignatureAmounts(e.change)), !G(e) || typeof e.quote != "string" || !(e.amount instanceof k) || typeof e.unit != "string" || typeof e.state != "string" || typeof e.expiry != "number" || !Object.values(po).includes(e.state)) throw this._logger.error("Invalid response from mint...", {
			data: e,
			op: t
		}), new v("Invalid response from mint");
	}
	normalizeMeltBoltFields(e, t) {
		if (e.fee_reserve = k.from(e.fee_reserve), typeof e.request != "string" || !(e.fee_reserve instanceof k)) throw this._logger.error("Invalid response from mint...", {
			data: e,
			op: t
		}), new v("Invalid response from mint");
		Ya(e, "payment_preimage");
	}
	normalizeMeltOnchainFields(e) {
		if (!Array.isArray(e.fee_options) || e.fee_options.length === 0 || (e.fee_options = e.fee_options.map((t) => {
			let n = t;
			if (!Number.isSafeInteger(n.fee_index)) throw this._logger.error("Invalid response from mint...", {
				data: e,
				op: "onchain melt quote"
			}), Error("Invalid response from mint");
			return {
				...n,
				fee_index: n.fee_index,
				fee_reserve: k.from(n.fee_reserve),
				estimated_blocks: n.estimated_blocks
			};
		}), Ya(e, "selected_fee_index", "outpoint"), typeof e.request != "string" || e.selected_fee_index !== null && !Number.isSafeInteger(e.selected_fee_index) || e.outpoint !== null && typeof e.outpoint != "string")) throw this._logger.error("Invalid response from mint...", {
			data: e,
			op: "onchain melt quote"
		}), Error("Invalid response from mint");
	}
}, Q = class e {
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
			if (!e.keys || Object.keys(e.keys).length === 0) return !1;
			let t = Ce(e.id) && !W(e.id), r = W(e.id) ? n(e.id)[0] : 0;
			return Ka(e.keys, {
				input_fee_ppk: e.input_fee_ppk,
				expiry: e.final_expiry,
				unit: e.unit,
				versionByte: r,
				isDeprecatedBase64: t
			}) === e.id;
		} catch {
			return !1;
		}
	}
	static verifyConditionalKeysetId(e, t) {
		try {
			return !e.keys || Object.keys(e.keys).length === 0 ? !1 : ot({
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
		let r = co(t), i = n ? lo(n) : void 0, a = new e(r.id, r.unit, r.active, r.input_fee_ppk, r.final_expiry, r.conditional);
		if (i) {
			if (i.id !== r.id) throw new v(`Mismatched keyset ids: meta=${r.id}, keys=${i.id}`);
			if (i.unit !== r.unit) throw new v(`Mismatched keyset units: meta=${r.unit}, keys=${i.unit}`);
			if (i.final_expiry !== void 0 && r.final_expiry !== void 0 && i.final_expiry !== r.final_expiry) throw new v(`Mismatched keyset expiry for id=${r.id}`);
			a.keys = i.keys;
		}
		return a;
	}
}, Ho = class e {
	assertInitialized() {
		if (Object.keys(this.keysets).length === 0) throw new v("KeyChain not initialized");
	}
	constructor(e, t) {
		this.keysets = {}, this.pendingKeyFetches = /* @__PURE__ */ new Map(), this.mint = typeof e == "string" ? new Vo(e) : e, this.unit = t;
	}
	static fromCache(t, n, r) {
		let i = new e(t, n);
		return i.loadFromCache(r), i;
	}
	static mintToCacheDTO(e, t, n) {
		let r = new Map(n.map((e) => [e.id, e]));
		return {
			keysets: t.map((e) => {
				let t = r.get(e.id), n = { ...e };
				return t && (n.keys = t.keys), n;
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
				keys: e.keys
			}))
		};
	}
	async init(e) {
		if (Object.keys(this.keysets).length > 0 && !e) return;
		let [t, n] = await Promise.all([this.mint.getKeySets(), this.mint.getKeys()]);
		this.buildKeychain(t.keysets, n.keysets);
	}
	loadFromCache(t) {
		let { keysets: n, keys: r } = e.cacheToMintDTO(t);
		this.buildKeychain(n, r);
	}
	buildKeychain(e, t) {
		this.keysets = {};
		let n = new Map(t.map((e) => [e.id, e]));
		for (let t of e) {
			let e = n.get(t.id), r = e ? Q.fromMintApi(t, e) : Q.fromMintApi(t);
			r.verify() || (r.keys = {}), this.keysets[r.id] = r;
		}
	}
	getKeyset(e) {
		let t = e ? this.keysets[e] : this.getCheapestKeyset();
		if (!t) throw new v(`Keyset '${e}' not found`);
		return t;
	}
	getCheapestKeyset() {
		if (Object.keys(this.keysets).length === 0) throw new v("KeyChain not initialized");
		let e = Object.values(this.keysets).filter((e) => !e.isConditional && e.unit === this.unit && e.isActive && e.hasHexId && e.hasKeys);
		if (e.length === 0) throw new v(`No active keyset found for unit: ${this.unit}`);
		return e.sort((e, t) => e.fee - t.fee)[0];
	}
	async ensureKeysetKeys(e) {
		let t = this.keysets[e];
		if (!t) throw new v(`Keyset '${e}' not found`);
		if (t.hasKeys) return t;
		let n = this.pendingKeyFetches.get(e);
		if (n) return await n;
		let r = (async () => {
			let n = (await this.mint.getKeys(e)).keysets.find((t) => t.id === e);
			if (!n || !n.keys || Object.keys(n.keys).length === 0) throw new v(`Mint returned no keys for keyset '${e}'`);
			let r = t.toMintKeyset(), i = Q.fromMintApi(r, n);
			if (!i.verify()) throw new v(`Keyset verification failed for ID ${e}`);
			return this.keysets[e] = i, i;
		})();
		this.pendingKeyFetches.set(e, r);
		try {
			return await r;
		} finally {
			this.pendingKeyFetches.delete(e);
		}
	}
	registerConditionalKeyset(e, t) {
		let n = t ? Q.fromMintApi(e, t) : Q.fromMintApi(e);
		if (n.hasKeys && !n.verify()) throw new v(`Conditional keyset verification failed for ID ${e.id}`);
		return this.keysets[n.id] = n, n;
	}
	async loadConditionalKeyset(e) {
		let t = this.keysets[e];
		if (t?.isConditional && t.hasKeys) return t;
		let n = this.pendingKeyFetches.get(e);
		if (n) return await n;
		let r = (async () => {
			let t = (await this.mint.getConditionalKeysets()).keysets.find((t) => t.id === e);
			if (!t) throw new v(`Conditional keyset '${e}' not found`);
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
			if (!i || !i.keys || Object.keys(i.keys).length === 0) throw new v(`Mint returned no keys for conditional keyset '${e}'`);
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
		if (!t || !t.isConditional) throw new v(`Conditional keyset '${e}' not found`);
		return t;
	}
	hasConditionalKeyset(e) {
		return !!this.keysets[e]?.isConditional;
	}
	getKeysets() {
		this.assertInitialized();
		let e = Object.values(this.keysets).filter((e) => !e.isConditional && e.unit === this.unit);
		if (e.length === 0) throw new v(`No keysets found for unit: ${this.unit}`);
		return e;
	}
	getAllKeys() {
		return this.assertInitialized(), Object.values(this.keysets).map((e) => e.toMintKeys()).filter((e) => e !== null);
	}
	getAllKeysetIds() {
		return this.assertInitialized(), Object.keys(this.keysets);
	}
	get cache() {
		let t = Object.values(this.keysets), n = t.map((e) => e.toMintKeyset()), r = t.map((e) => e.toMintKeys()).filter((e) => e !== null);
		return e.mintToCacheDTO(this.mint.mintUrl, n, r);
	}
};
//#endregion
//#region src/wallet/P2PKBuilder.ts
function Uo(e) {
	return e instanceof Date ? Math.floor(e.getTime() / 1e3) : Math.floor(e < 0xe8d4a51000 ? e : e / 1e3);
}
var Wo = class e {
	constructor() {
		this.lockKeys = [], this.refundKeys = [], this.extraTags = [];
	}
	addLockPubkey(e) {
		let t = Array.isArray(e) ? e : [e];
		return this.lockKeys = B([...this.lockKeys, ...t]), this;
	}
	addRefundPubkey(e) {
		let t = Array.isArray(e) ? e : [e];
		return this.refundKeys = B([...this.refundKeys, ...t]), this;
	}
	lockUntil(e) {
		return this.locktime = Uo(e), this;
	}
	requireLockSignatures(e) {
		if (!Number.isInteger(e) || e < 1) throw new v(`requiredSignatures (n_sigs) must be a positive integer, got ${e}`);
		return this.nSigs = e, this;
	}
	requireRefundSignatures(e) {
		if (!Number.isInteger(e) || e < 1) throw new v(`requiredRefundSignatures (n_sigs_refund) must be a positive integer, got ${e}`);
		return this.nSigsRefund = e, this;
	}
	addTag(e, t) {
		It(e);
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
		if (e.length === 0) throw new v("At least one lock pubkey is required");
		let n = {
			pubkey: e.length === 1 ? e[0] : e,
			...this.locktime === void 0 ? {} : { locktime: this.locktime },
			...t.length ? { refundKeys: t } : {},
			...this.nSigs && this.nSigs > 1 ? { requiredSignatures: this.nSigs } : {},
			...this.nSigsRefund && this.nSigsRefund > 1 ? { requiredRefundSignatures: this.nSigsRefund } : {},
			...this.extraTags.length ? { additionalTags: this.extraTags.slice() } : {},
			...this._blindKeys ? { blindKeys: !0 } : {},
			...this.sigFlag == "SIG_ALL" ? { sigFlag: "SIG_ALL" } : {},
			...this.hashlock ? { hashlock: this.hashlock } : {}
		};
		return P.createSingleP2PKData(n, 1, "deedbeef"), n;
	}
	static fromOptions(t) {
		let n = new e(), r = Array.isArray(t.pubkey) ? t.pubkey : [t.pubkey];
		return n.addLockPubkey(r), t.locktime !== void 0 && n.lockUntil(t.locktime), t.refundKeys?.length && n.addRefundPubkey(t.refundKeys), t.requiredSignatures !== void 0 && n.requireLockSignatures(t.requiredSignatures), t.requiredRefundSignatures !== void 0 && n.requireRefundSignatures(t.requiredRefundSignatures), t.additionalTags?.length && n.addTags(t.additionalTags), t.blindKeys && n.blindKeys(), t.sigFlag == "SIG_ALL" && n.sigAll(), t.hashlock && n.addHashlock(t.hashlock), n;
	}
};
//#endregion
//#region src/wallet/SelectProofs.ts
function Go(e, t, n, r = !1, i = !1, a = C) {
	let o = J(e), s = k.from(t), c = s.toNumber(), l = re(), u = null, d = Infinity, f = 0, p = 0, m = (e) => {
		try {
			return n.getKeyset(e.id).fee;
		} catch (t) {
			let r = `Could not get fee. No keyset found for keyset id: ${e.id}`;
			throw a.error(r, {
				error: t,
				keychain: n.getKeysets()
			}), new v(r, { cause: t });
		}
	}, h = (e, t) => e - (r ? Math.ceil(t / 1e3) : 0), g = (e) => {
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
	}, y = (e, t) => {
		let n = t.exFee, r = 0, i = e.length;
		for (; r < i;) {
			let t = Math.floor((r + i) / 2);
			e[t].exFee < n ? r = t + 1 : i = t;
		}
		e.splice(r, 0, t);
	}, b = (e, t) => h(e, t) < c ? Infinity : e + t / 1e3 - c, x = 0, S = 0, T = o.map((e) => {
		e.amount.greaterThan(2 ** 53 - 1) && ee("selectProofsRGLI does not support proof amounts > Number.MAX_SAFE_INTEGER. Provide a custom SelectProofs implementation for msat-scale wallets.", a);
		let t = m(e), n = e.amount.toNumber(), i = r ? n - t / 1e3 : n, o = {
			proof: e,
			amountNum: n,
			exFee: i,
			ppkfee: t
		};
		return (!r || i > 0) && (x += n, S += t), o;
	}), E = r ? T.filter((e) => e.exFee > 0) : T;
	if (E.sort((e, t) => e.exFee - t.exFee), E.length > 0) {
		let e;
		if (i) {
			let t = _(E, c, !0);
			e = t === null ? 0 : t + 1;
		} else {
			let t = _(E, c, !1);
			if (t !== null) {
				let n = E[t].exFee, r = _(E, n, !0);
				te(r, "Unexpected null rightIndex in binary search", a), e = r + 1;
			} else e = E.length;
		}
		for (let t = e; t < E.length; t++) x -= E[t].amountNum, S -= E[t].ppkfee;
		E = E.slice(0, e);
	}
	let ne = h(x, S);
	if (s.isZero() || c > ne) return {
		keep: o,
		send: []
	};
	let ie = Math.min(Math.ceil(c * 1), c + 0, ne);
	for (let e = 0; e < 60; e++) {
		let t = [], n = 0, r = 0;
		for (let e of g(E)) {
			let a = n + e.amountNum, o = r + e.ppkfee, s = h(a, o);
			if (i && s > c || (t.push(e), n = a, r = o, s >= c)) break;
		}
		let o = new Set(t), s = E.filter((e) => !o.has(e)), m = g(Array.from({ length: t.length }, (e, t) => t)).slice(0, 5e3);
		for (let e of m) {
			let a = h(n, r);
			if (a === c || !i && a >= c && a <= ie) break;
			let o = t[e], l = n - o.amountNum, u = r - o.ppkfee, d = c - h(l, u), f = _(s, d, i);
			if (f !== null) {
				let a = s[f];
				(!i || a.exFee > o.exFee) && (d >= 0 || a.exFee <= o.exFee) && (t[e] = a, n = l + a.amountNum, r = u + a.ppkfee, s.splice(f, 1), y(s, o));
			}
		}
		let v = b(n, r);
		if (v < d) {
			a.debug(`selectProofsToSend: best solution found in trial #${e} - amount: ${n}, delta: ${v}`), u = [...t].sort((e, t) => t.exFee - e.exFee), d = v, f = n, p = r;
			let i = [...u];
			for (; i.length > 1 && d > 0;) {
				let e = i.pop(), t = n - e.amountNum, a = r - e.ppkfee, o = b(t, a);
				if (o == Infinity) break;
				o < d && (u = [...i], d = o, f = t, p = a, n = t, r = a);
			}
		}
		if (u && d < Infinity) {
			let e = h(f, p);
			if (e === c || !i && e >= c && e <= ie) break;
		}
		if (l.elapsed() > 1e3) {
			w(i, "Proof selection took too long. Try again with a smaller proof set.", a), a.warn("Proof selection took too long. Returning best selection so far.");
			break;
		}
	}
	if (u && d < Infinity) {
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
//#endregion
//#region src/model/OutputDataCreator.ts
var Ko = class e {
	createP2PKData(e, t, n, r) {
		return U(t, n.keys, r).map((t) => this.createSingleP2PKData(e, t, n.id));
	}
	createSingleP2PKData(e, t, n) {
		return P.createSingleP2PKData(e, t, n);
	}
	createRandomData(e, t, n) {
		return U(e, t.keys, n).map((e) => this.createSingleRandomData(e, t.id));
	}
	createSingleRandomData(e, t) {
		return P.createSingleRandomData(e, t);
	}
	createDeterministicData(t, n, r, i, a) {
		return this.createSingleDeterministicData === e.prototype.createSingleDeterministicData ? P.createDeterministicData(t, n, r, i, a) : U(t, i.keys, a).map((e, t) => this.createSingleDeterministicData(e, n, r + t, i.id));
	}
	createSingleDeterministicData(e, t, n, r) {
		return P.createSingleDeterministicData(e, t, n, r);
	}
};
//#endregion
//#region src/wallet/_internal.ts
function qo(e) {
	let t = Object.keys(e).map((e) => k.from(e));
	return t.sort((e, t) => e.compareTo(t)), t;
}
function Jo(e, t, n, r) {
	let i = k.from(t), a = [], o = k.zero(), s = e.map((e) => e.amount);
	for (let e of qo(n)) {
		let t = s.filter((t) => e.equals(t)).length, n = Math.max(r - t, 0);
		for (let t = 0; t < n; ++t) {
			let t = o.add(e);
			if (t.greaterThan(i)) break;
			a.push(e), o = t;
		}
	}
	let c = i.subtract(o);
	if (!c.isZero()) for (let e of U(c, n)) a.push(e), o = o.add(e);
	return a.sort((e, t) => e.compareTo(t));
}
function Yo(e) {
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
		case "p2pk": return JSON.stringify({
			type: "p2pk",
			options: e.options,
			denominations: (e.denominations ?? []).map((e) => k.from(e).toString())
		});
		case "random": return JSON.stringify({
			type: "random",
			denominations: (e.denominations ?? []).map((e) => k.from(e).toString())
		});
		default: return "Unknown";
	}
}
//#endregion
//#region src/wallet/CounterSource.ts
var Xo = class {
	constructor(e) {
		if (this.next = /* @__PURE__ */ new Map(), this.locks = /* @__PURE__ */ new Map(), e) for (let [t, n] of Object.entries(e)) this.next.set(t, n);
	}
	async withLock(e, t) {
		let n = this.locks.get(e) ?? Promise.resolve(), r, i = new Promise((e) => r = e), a = n.then(() => i);
		this.locks.set(e, a);
		try {
			return await n, await t();
		} finally {
			r(), this.locks.get(e) === a && this.locks.delete(e);
		}
	}
	async reserve(e, t) {
		if (t < 0) throw new v("reserve called with negative count");
		return this.withLock(e, () => {
			let n = this.next.get(e) ?? 0;
			return t === 0 ? {
				start: n,
				count: 0
			} : (this.next.set(e, n + t), {
				start: n,
				count: t
			});
		});
	}
	async advanceToAtLeast(e, t) {
		await this.withLock(e, () => {
			t > (this.next.get(e) ?? 0) && this.next.set(e, t);
		});
	}
	async setNext(e, t) {
		await this.withLock(e, () => {
			if (t < 0) throw new v("setNext: negative next not allowed");
			this.next.set(e, t);
		});
	}
	snapshot() {
		return Promise.resolve(Object.fromEntries(this.next.entries()));
	}
};
function Zo(e) {
	return new Xo(e);
}
//#endregion
//#region src/wallet/WalletCounters.ts
var Qo = class {
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
		if (typeof this.src.setNext == "function") {
			await this.src.setNext(e, t);
			return;
		}
		throw new v("CounterSource does not support setNext()");
	}
	async snapshot() {
		if (typeof this.src.snapshot == "function") return await this.src.snapshot();
		throw new v("CounterSource does not support snapshot()");
	}
};
//#endregion
//#region src/wallet/WalletEvents.ts
function $o(e) {
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
function es(e) {
	return e instanceof Error ? e : new v(typeof e == "string" ? e : $o(e), { cause: e });
}
function ts() {
	let e = /* @__PURE__ */ Error("Aborted");
	return Object.defineProperty(e, "name", { value: "AbortError" }), e;
}
function $(e) {
	e && Promise.resolve(e).then((e) => {
		try {
			e();
		} catch {}
	}).catch(() => {});
}
var ns = class {
	constructor(e) {
		this.wallet = e, this.countersReservedHandlers = /* @__PURE__ */ new Set();
	}
	withAbort(e, t) {
		if (!e) return t;
		if (e.aborted) return t(), () => {};
		let n = () => t();
		return e.addEventListener("abort", n, { once: !0 }), () => {
			e.removeEventListener("abort", n), t();
		};
	}
	waitUntilPaid(e, t, n, r = "Timeout waiting for paid") {
		return new Promise((i, a) => {
			let o = null, s = null, c = !1, l = (e) => {
				c || (c = !0, $(o), s && (clearTimeout(s), s = null), n?.signal && n.signal.removeEventListener("abort", u), e && a(es(e)));
			}, u = () => l(ts());
			if (n?.signal) {
				if (n.signal.aborted) return u();
				n.signal.addEventListener("abort", u, { once: !0 });
			}
			n?.timeoutMs && n.timeoutMs > 0 && (s = setTimeout(() => l(new v(r)), n.timeoutMs)), o = e(t, (e) => {
				l(), i(e);
			}, (e) => l(e), { signal: n?.signal }), o.catch((e) => l(e));
		});
	}
	countersReserved(e, t) {
		return this.countersReservedHandlers.add(e), this.withAbort(t?.signal, () => this.countersReservedHandlers.delete(e));
	}
	_emitCountersReserved(e) {
		for (let t of this.countersReservedHandlers) T(t, e, this.wallet.logger, { event: "countersReserved" });
	}
	async mintQuoteUpdates(e, t, n, r) {
		await this.wallet.mint.connectWebSocket();
		let i = this.wallet.mint.webSocketConnection;
		if (!i) throw new v("Failed to establish WebSocket connection.");
		let a = Array.from(new Set(e)), o = i.createSubscription({
			kind: "bolt11_mint_quote",
			filters: a
		}, t, n);
		return this.withAbort(r?.signal, () => i.cancelSubscription(o, t));
	}
	async mintQuotePaid(e, t, n, r) {
		return this.mintQuoteUpdates([e], (e) => {
			e.state === fo.PAID && t(e);
		}, n, r);
	}
	async meltQuoteUpdates(e, t, n, r) {
		await this.wallet.mint.connectWebSocket();
		let i = this.wallet.mint.webSocketConnection;
		if (!i) throw new v("Failed to establish WebSocket connection.");
		let a = Array.from(new Set(e)), o = i.createSubscription({
			kind: "bolt11_melt_quote",
			filters: a
		}, t, n);
		return this.withAbort(r?.signal, () => i.cancelSubscription(o, t));
	}
	async meltQuotePaid(e, t, n, r) {
		return this.meltQuoteUpdates([e], (e) => {
			e.state === po.PAID && t(e);
		}, n, r);
	}
	async proofStateUpdates(e, t, n, r) {
		await this.wallet.mint.connectWebSocket();
		let i = this.wallet.mint.webSocketConnection;
		if (!i) throw new v("Failed to establish WebSocket connection.");
		let a = new TextEncoder(), o = Object.create(null);
		for (let t of e) {
			let e = N(t.id) ? M(a.encode(t.secret)).toHex(!0) : yr(a.encode(t.secret)).toHex(!0);
			if (o[e]) throw new v("Duplicate proof secret in proofStateUpdates input");
			o[e] = t;
		}
		let s = Object.keys(o), c = (e) => {
			let n = o[e.Y];
			n && t({
				...e,
				proof: n
			});
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
					for (let e of a.values()) $(e);
					a.clear(), o && (clearTimeout(o), o = null), t?.signal && t.signal.removeEventListener("abort", d), e && r(es(e));
				}
			}, d = () => u(ts());
			if (t?.signal) {
				if (t.signal.aborted) return d();
				t.signal.addEventListener("abort", d, { once: !0 });
			}
			if (t?.timeoutMs && t.timeoutMs > 0 && (o = setTimeout(() => u(new v("Timeout waiting for any mint paid")), t.timeoutMs)), i.length === 0) return u(new v("No quote ids provided"));
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
					r && ($(r), a.delete(e)), c && a.size === 0 && u(s ?? new v("No subscriptions remaining"));
				});
				a.set(e, r), r.catch((n) => {
					if (t?.failOnError) {
						u(n);
						return;
					}
					s = n;
					let r = a.get(e);
					r && ($(r), a.delete(e)), c && a.size === 0 && u(s ?? new v("No subscriptions remaining"));
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
				if (n.length >= a) if (o === "oldest") {
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
				else n.push(e);
				s();
			}, l = null, u = this.proofStateUpdates(e, c, (e) => {
				l = e, r = !0, s();
			}, { signal: t?.signal });
			u.catch((e) => {
				l = es(e), r = !0, s();
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
				$(u), t?.signal && t.signal.removeEventListener("abort", d);
			}
		}.call(this);
	}
	group() {
		let e = [], t = !1, n = (() => {
			if (!t) for (t = !0; e.length;) $(e.pop());
		});
		return n.add = (n) => t ? ($(n), n) : (e.push(n), n), Object.defineProperty(n, "cancelled", {
			get: () => t,
			enumerable: !0
		}), n;
	}
}, rs = class {
	constructor(e) {
		this.wallet = e;
	}
	send(e, t) {
		return new is(this.wallet, e, t);
	}
	receive(e) {
		return new as(this.wallet, e);
	}
	mintBolt11(e, t) {
		return new os(this.wallet, "bolt11", e, t);
	}
	mintBolt12(e, t) {
		return new os(this.wallet, "bolt12", e, t);
	}
	mintOnchain(e, t) {
		return new os(this.wallet, "onchain", e, t);
	}
	meltBolt11(e, t) {
		return new ss(this.wallet, "bolt11", e, t);
	}
	meltBolt12(e, t) {
		return new ss(this.wallet, "bolt12", e, t);
	}
	meltOnchain(e, t) {
		return new cs(this.wallet, e, t);
	}
}, is = class {
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
	asP2PK(e, t) {
		return this.sendOT = {
			type: "p2pk",
			options: e,
			denominations: t
		}, this;
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
	keepAsP2PK(e, t) {
		return this.keepOT = {
			type: "p2pk",
			options: e,
			denominations: t
		}, this;
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
		let e = {
			send: this.sendOT ?? this.wallet.defaultOutputType(),
			...this.keepOT ? { keep: this.keepOT } : {}
		};
		return this.wallet.prepareSwapToSend(this.amount, this.proofs, this.config, e);
	}
	async run() {
		if ((this.offlineExact || this.offlineClose) && (this.sendOT || this.keepOT)) throw new v("Offline selection cannot be combined with custom output types. Remove send/keep output configuration, or use an online swap.");
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
}, as = class {
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
	asP2PK(e, t) {
		return this.outputType = {
			type: "p2pk",
			options: e,
			denominations: t
		}, this;
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
}, os = class {
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
	asP2PK(e, t) {
		return this.outputType = {
			type: "p2pk",
			options: e,
			denominations: t
		}, this;
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
			if (this.wallet.validateMintQuote(t), t.pubkey && !this.config.privkey) throw new v("privkey is required for locked BOLT11 mint quotes");
			return this.wallet.prepareMint(this.method, this.amount, t, this.config, this.outputType);
		}
		if (this.method === "bolt12") {
			let e = this.quote;
			if (this.wallet.validateMintQuote(e), !this.config.privkey) throw Error("privkey is required for BOLT12 mint quotes");
			return this.wallet.prepareMint(this.method, this.amount, e, this.config, this.outputType);
		}
		let e = this.quote;
		if (this.wallet.validateMintQuote(e), !this.config.privkey) throw new v("privkey is required for onchain mint quotes");
		return this.wallet.prepareMint(this.method, this.amount, e, this.config, this.outputType);
	}
	async run() {
		let e = await this.prepare();
		return this.wallet.completeMint(e);
	}
}, ss = class {
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
	asP2PK(e, t) {
		return this.outputType = {
			type: "p2pk",
			options: e,
			denominations: t
		}, this;
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
}, cs = class {
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
		if (this.selectedFeeIndex === void 0 && this.quote.fee_options.length === 1 && (this.selectedFeeIndex = this.quote.fee_options[0].fee_index), this.selectedFeeIndex === void 0) throw Error("feeIndex is required when an onchain melt quote has multiple fee options");
		return this.wallet.meltProofsOnchain(this.quote, this.proofs, this.selectedFeeIndex, this.config);
	}
}, ls = "__PENDING__", us = class e {
	constructor(e, t) {
		this._seed = void 0, this._unit = "sat", this._mintInfo = void 0, this._denominationTarget = 3, this._secretsPolicy = "auto", this._boundKeysetId = ls, this._requireSigDleq = !1, this.ops = new rs(this), this.on = new ns(this), this._logger = t?.logger ?? C, this._selectProofs = t?.selectProofs ?? Go, this._outputDataCreator = t?.outputDataCreator ?? new Ko(), this.mint = typeof e == "string" ? new Vo(e, {
			authProvider: t?.authProvider,
			logger: this._logger
		}) : e, this._unit = t?.unit ?? this._unit, this._boundKeysetId = t?.keysetId ?? this._boundKeysetId, t?.bip39seed && (this.failIf(!(t.bip39seed instanceof Uint8Array), "bip39seed must be a valid Uint8Array", { bip39seed: t.bip39seed }), this._seed = t.bip39seed), this._secretsPolicy = t?.secretsPolicy ?? this._secretsPolicy, t?.counterSource ? this._counterSource = t.counterSource : this._counterSource = new Xo(t?.counterInit), this.counters = new Qo(this._counterSource), this._keyChain = new Ho(this.mint, this._unit), this._denominationTarget = t?.denominationTarget ?? this._denominationTarget, this._requireSigDleq = t?.requireSigDleq ?? this._requireSigDleq, this.ctf = t?.enableCtf ? this.createCtfFacade() : void 0;
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
		return ee(e, this._logger, t);
	}
	failIf(e, t, n) {
		return w(e, t, this._logger, n);
	}
	failIfNullish(e, t, n) {
		return te(e, t, this._logger, n);
	}
	requireSupport(e, t) {
		this.failIf(!this.getMintInfo().supportsMintMeltMethod(e, t, this._unit), `Mint does not support ${t} ${e} for unit '${this._unit}'`);
	}
	safeCallback(e, t, n) {
		T(e, t, this._logger, n);
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
			}), new v(r, { cause: n });
		}
	}
	async loadMint(e) {
		let t = [];
		(!this._mintInfo || e) && t.push(this.mint.getInfo().then((e) => (this._mintInfo = new X(e, this._logger), this.mint.setMintInfo(this._mintInfo), null))), t.push(this._keyChain.init(e)), await Promise.all(t), this.finishInit();
	}
	loadMintFromCache(e, t) {
		this._mintInfo = new X(e, this._logger), this.mint.setMintInfo(this._mintInfo), this._keyChain.loadFromCache(t), this.finishInit();
	}
	finishInit() {
		if (this._logger.debug("KeyChain", { keychain: this._keyChain.cache }), this._boundKeysetId === ls) try {
			this._boundKeysetId = this._keyChain.getCheapestKeyset().id;
		} catch (e) {
			this._logger.warn("No active keyset available, wallet remains unbound", {
				unit: this._unit,
				err: e.message
			});
		}
		else {
			let e = this._keyChain.getKeyset(this._boundKeysetId);
			this.failIf(e.unit !== this._unit, "Keyset unit does not match wallet unit", {
				keyset: e.id,
				unit: e.unit,
				walletUnit: this._unit
			});
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
	get keysetId() {
		return this.failIf(this._boundKeysetId === ls, "Wallet has no bound keyset. The mint may have no active keysets, or wallet was not initialized via loadMint or loadMintFromCache"), this._boundKeysetId;
	}
	getKeyset(e) {
		let t = this._keyChain.getKeyset(e ?? this.keysetId);
		return this.failIf(t.unit !== this._unit, "Keyset unit does not match wallet unit", {
			keyset: t.id,
			unit: t.unit,
			walletUnit: this._unit
		}), this.failIf(!t.hasKeys, "Keyset has no keys loaded", { keyset: t.id }), t;
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
			let t = Math.max(...n.map((e) => e.counter + e.denominations.length));
			await this._counterSource.advanceToAtLeast(e, t), this._logger.debug("Counter source advanced to respect manual deterministic counters", {
				keysetId: e,
				maxManualEnd: t
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
		}), this.failIf(!t.hasKeys, "Keyset has no keys loaded", { keyset: t.id }), this._boundKeysetId = t.id, this._logger.debug("Wallet bound to keyset", {
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
			counterSource: n?.counterSource ?? this._counterSource
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
			let e = this.parseAmount(P.sumOutputAmounts(n.data), "configureOutputs.customTotal", !0);
			return this.failIf(!e.equals(a), `Custom output data total (${e.toString()}) does not match amount (${a.toString()})`), n;
		}
		let s = n.denominations ?? [];
		if (s.length === 0 && o.length > 0 && (s = Jo(o, a, t.keys, this._denominationTarget)), s = U(a, t.keys, s), r) {
			let e = this.getFeesForKeyset(s.length, t.id), n = U(e, t.keys);
			for (; this.getFeesForKeyset(s.length + n.length, t.id).greaterThan(e);) e = e.add(1), n = U(e, t.keys);
			a = a.add(e), s = [...s, ...n];
		}
		return {
			...n,
			denominations: s
		};
	}
	preparedTotal(e) {
		if (e.type === "custom") return P.sumOutputAmounts(e.data);
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
				i = this._outputDataCreator.createP2PKData(n.options, r, t, n.denominations);
				break;
			case "factory":
				i = U(r, t.keys, n.denominations).map((e) => n.factory(e, t));
				break;
			case "custom": {
				i = n.data;
				let e = this.parseAmount(P.sumOutputAmounts(i), "createOutputData.customTotal", !0);
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
		mi(e) || i.sort((e, t) => r[e].blindedMessage.amount.compareTo(r[t].blindedMessage.amount));
		let a = [...Array.from({ length: t.length }, () => !0), ...Array.from({ length: n.length }, () => !1)], o = i.map((e) => r[e]), s = i.map((e) => a[e]), c = o.map((e) => e.blindedMessage);
		return this._logger.debug("createSwapTransaction:", {
			indices: i,
			sortedKeepVector: s
		}), {
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
		if (Array.isArray(e)) s = J(e);
		else {
			let t = typeof e == "string" ? this.decodeToken(e) : e, n = Xa(t.mint);
			this.failIf(n !== this.mint.mintUrl, "Token belongs to a different mint", {
				token: n,
				wallet: this.mint.mintUrl
			}), this.failIf(t.unit !== this._unit, "Token is not in wallet unit", {
				token: t.unit,
				wallet: this._unit
			}), s = J(t.proofs);
		}
		let c = this._keyChain.getKeysets().map((e) => e.id), l = s.find((e) => !e.id || !c.includes(e.id));
		this.failIf(!!l, `Proof has unrecognised keyset. '${l?.id}' is not a ${this._unit} keyset from this mint`, {
			id: l?.id,
			knownIds: c
		});
		let u = this.parseAmount(q(s), "prepareSwapToReceive", !0);
		this.failIf(u.isZero(), "Token contains no proofs", { proofs: s }), ro(s, (e) => this._keyChain.getKeyset(e), { requireDleq: i });
		let d = this.getKeyset(r), f = this.getFeesForProofs(s), p = u.subtract(f), m = this.configureOutputs(p, d, n, !1, a), h = await this.addCountersToOutputTypes(d.id, m);
		[m] = h.outputTypes, h.used && this.safeCallback(o, h.used, { op: "receive" }), this._logger.debug("receive counter", {
			counter: h.used,
			receiveOT: Yo(m)
		});
		let g = this.createOutputData(this.preparedTotal(m), d, m);
		return {
			amount: p,
			fees: f,
			keysetId: d.id,
			inputs: s,
			keepOutputs: g
		};
	}
	sendOffline(e, t, n) {
		let r = this.parseAmount(e, "sendOffline"), i = J(t), { requireDleq: a = !1, includeFees: o = !1, exactMatch: s = !0 } = n || {};
		a && (i = i.filter((e) => N(e.id) || e.dleq != null)), this.failIf(q(i).lessThan(r), "Not enough funds available to send");
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
				throw a && t.push("keysetId override"), e && t.push("wallet default is deterministic"), n(r.send) || t.push("non-default send output type"), r.keep && !n(r.keep) && t.push("non-default keep output type"), new v(`Options require a swap: ${t.join(", ")}`);
			}
			let { keep: s, send: c } = this.sendOffline(i, t, {
				includeFees: o,
				exactMatch: !0,
				requireDleq: !1
			}), l = o ? this.getFeesForProofs(c) : k.zero();
			if (q(c).equals(i.add(l))) return this._logger.info("Successful exactMatch offline selection!"), {
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
		let i = this.parseAmount(e, "prepareSwapToSend"), a = J(t), { keysetId: o, includeFees: s = !1, onCountersReserved: c } = n || {};
		r = r ?? {
			send: this.defaultOutputType(),
			keep: this.defaultOutputType()
		};
		let l = this.getKeyset(o), u = this.configureOutputs(i, l, r.send ?? this.defaultOutputType(), s), d = this.preparedTotal(u), { keep: f, send: p } = this.selectProofsToSend(a, d, !0);
		if (p.length === 0) throw new v("Not enough funds available to send");
		let m = q(p), h = this.getFeesForProofs(p), g = d.add(h);
		m.lessThan(g) && this.failIf(!0, "Not enough funds available for swap", {
			selectedSum: m.toString(),
			required: g.toString()
		});
		let _ = m.subtract(g), y = this.configureOutputs(_, l, r.keep ?? this.defaultOutputType(), !1, n?.proofsWeHave), b = this.preparedTotal(y), x = await this.addCountersToOutputTypes(l.id, u, y);
		[u, y] = x.outputTypes, x.used && this.safeCallback(c, x.used, { op: "send" }), this._logger.debug("send counters", {
			counter: x.used,
			sendOT: Yo(u),
			keepOT: Yo(y)
		});
		let S = this.createOutputData(d, l, u), C = this.createOutputData(b, l, y);
		return {
			amount: i,
			fees: h,
			keysetId: l.id,
			inputs: p,
			sendOutputs: S,
			keepOutputs: C,
			unselectedProofs: f
		};
	}
	async completeSwap(e, t) {
		let n = e?.keepOutputs ? e.keepOutputs : [], r = e.sendOutputs ? e.sendOutputs : [], i = e.unselectedProofs ? e.unselectedProofs : [];
		t && (e.inputs = this.signP2PKProofs(e.inputs, t, [...n, ...r]));
		let a = this.createSwapTransaction(e.inputs, n, r), { signatures: o } = await this.mint.swap(a.payload);
		this.failIf(o.length !== a.outputData.length, `Mint returned ${o.length} signatures, expected ${a.outputData.length}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(o, a.outputData);
		let s = this.getKeyset(e.keysetId), c = a.outputData.map((e, t) => e.toProof(o[t], s)), l = Array(c.length), u = Array(a.keepVector.length);
		a.sortedIndices.forEach((e, t) => {
			u[e] = a.keepVector[t], l[e] = c[t];
		});
		let d = [], f = [];
		return l.forEach((e, t) => {
			u[t] ? d.push(e) : f.push(e);
		}), this._logger.debug("SEND COMPLETED", {
			unselectedProofs: i.map((e) => e.amount.toString()),
			keepProofs: d.map((e) => e.amount.toString()),
			sendProofs: f.map((e) => e.amount.toString())
		}), {
			keep: [...d, ...i],
			send: f
		};
	}
	async prepareConditionalSwap(e) {
		let t = J(e.inputs);
		if (t.length === 0) throw new v("prepareConditionalSwap requires at least one input proof");
		if (e.outputs.length === 0) throw new v("prepareConditionalSwap requires at least one output group");
		let n = e.keysetId ?? t[0].id;
		if (!n) throw new v("prepareConditionalSwap requires a conditional keyset id");
		let r = t.find((e) => e.id !== n);
		if (r) throw new v(`prepareConditionalSwap inputs must use one keyset: expected ${n}, got ${r.id}`);
		let i = await this._keyChain.loadConditionalKeyset(n), a = /* @__PURE__ */ new Set(), o = k.zero(), s = e.outputs.map((e) => {
			if (a.has(e.label)) throw new v(`prepareConditionalSwap output label is duplicated: ${e.label}`);
			a.add(e.label);
			let t = k.from(e.amount);
			if (t.isZero()) throw new v(`prepareConditionalSwap output ${e.label} amount must be positive`);
			if (o = o.add(t), e.kind === "p2pk") {
				if (!e.p2pk) throw new v(`prepareConditionalSwap output ${e.label} is missing P2PK options`);
				return {
					label: e.label,
					data: P.createP2PKData(e.p2pk, t, i, e.customSplit)
				};
			}
			return {
				label: e.label,
				data: P.createRandomData(t, i, e.customSplit)
			};
		}), c = k.from(Math.ceil(t.length * i.fee / 1e3)), l = q(t).subtract(c);
		if (!o.equals(l)) throw new v(`prepareConditionalSwap output total ${o.toString()} does not match input total ${l.toString()} after fees`);
		for (let e of s) {
			let t = e.data.find((e) => e.blindedMessage.id !== n);
			if (t) throw new v(`prepareConditionalSwap output ${e.label} uses keyset ${t.blindedMessage.id}; expected ${n}`);
		}
		return {
			keysetId: n,
			inputs: t,
			outputDataByLabel: Object.fromEntries(s.map((e) => [e.label, e.data]))
		};
	}
	async completeConditionalSwap(e) {
		let t = Object.values(e.outputDataByLabel).flat(), n = t.map((e) => ({
			...e.blindedMessage,
			amount: e.blindedMessage.amount.toNumber()
		})), { signatures: r } = await this.mint.swap({
			inputs: e.inputs,
			outputs: n
		});
		this.failIf(r.length !== t.length, `Mint returned ${r.length} signatures, expected ${t.length}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(r, t);
		let i = this._keyChain.getConditionalKeyset(e.keysetId), a = {}, o = 0;
		for (let [t, n] of Object.entries(e.outputDataByLabel)) {
			a[t] = [];
			for (let s of n) {
				let n = r[o];
				if (o += 1, n.id !== e.keysetId) throw new v(`Mint signed conditional swap output with keyset ${n.id}; expected ${e.keysetId}`);
				a[t].push(s.toProof(n, i));
			}
		}
		return a;
	}
	async swapConditional(e) {
		return this.completeConditionalSwap(await this.prepareConditionalSwap(e));
	}
	async redeemOutcomeProofs(e) {
		let t = J(e.inputs), n = [...e.outputs];
		if (t.length === 0) throw new v("redeemOutcomeProofs requires at least one input proof");
		if (n.length === 0) throw new v("redeemOutcomeProofs requires at least one output");
		let r = n[0].blindedMessage.id;
		if (!r) throw new v("redeemOutcomeProofs requires output keyset ids");
		let i = n.find((e) => e.blindedMessage.id !== r);
		if (i) throw new v(`redeemOutcomeProofs outputs must use one keyset: expected ${r}, got ${i.blindedMessage.id}`);
		let { signatures: a } = await this.mint.redeemOutcome({
			inputs: t,
			outputs: n.map((e) => e.blindedMessage)
		});
		this.failIf(a.length !== n.length, `Mint returned ${a.length} signatures, expected ${n.length}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(a, n);
		let o = (await this.mint.getKeys(r)).keysets.find((e) => e.id === r);
		if (!o || Object.keys(o.keys).length === 0) throw new v(`Mint returned no keys for redeem output keyset ${r}`);
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
		let i = J(e);
		if (!mi(i)) return oi(i, t, this._logger);
		this.failIfNullish(n, "OutputData is required for SIG_ALL proof signing."), fi(i);
		let [a, ...o] = i, s = a, c = [Ti(i, n, r), pi(i, n, r)];
		for (let e of c) s = oi([s], t, this._logger, e)[0];
		return [s, ...o];
	}
	getFeesForProofs(e) {
		let t = k.sum(e.map((e) => this.getProofFeePPK(e))).toBigInt();
		return k.from((t + 999n) / 1000n);
	}
	getProofFeePPK(e) {
		try {
			return this._keyChain.getKeyset(e.id).fee;
		} catch (t) {
			let n = `Could not get fee. No keyset found for keyset id: ${e.id}`;
			throw this._logger.error(n, {
				e: t,
				keychain: this._keyChain.getKeysets()
			}), new v(n, { cause: t });
		}
	}
	getFeesForKeyset(e, t) {
		try {
			let n = this._keyChain.getKeyset(t).fee;
			return k.from(Math.floor(Math.max((e * n + 999) / 1e3, 0)));
		} catch (e) {
			let n = `No keyset found with ID ${t}`;
			throw this._logger.error(n, { e }), new v(n, { cause: e });
		}
	}
	maxSpendableAfterFees(e, t = 0) {
		let n = q(e), r = this.getFeesForProofs(e).add(t);
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
				Fr(e.secret);
			} catch {
				return;
			}
			return typeof e.witness == "string" ? e.witness : JSON.stringify(e.witness);
		}
	}
	decodeToken(e) {
		return Ua(e, this._keyChain.getAllKeysetIds());
	}
	async batchRestore(e = 300, t = 300, n = 0, r) {
		let i = Math.ceil(e / t), a = [], o, s = 0;
		for (; s < i;) {
			let e = await this.restore(n, t, { keysetId: r });
			e.proofs.length > 0 ? (s = 0, a.push(...e.proofs), o = e.lastCounterWithSignature) : s++, n += t;
		}
		return {
			proofs: a,
			lastCounterWithSignature: o
		};
	}
	async restore(e, t, n) {
		this.failIfNullish(this._seed, "Cashu Wallet must be initialized with a seed to use restore");
		let { keysetId: r } = n || {};
		await this._keyChain.ensureKeysetKeys(r ?? this.keysetId);
		let i = this.getKeyset(r), a = Array(t).fill(0), o = this._outputDataCreator.createDeterministicData(0, this._seed, e, i, a), { outputs: s, signatures: c } = await this.mint.restore({ outputs: o.map((e) => e.blindedMessage) }), l = {};
		s.forEach((e, t) => l[e.B_] = c[t]);
		let u = [], d;
		for (let t = 0; t < o.length; t++) {
			let n = l[o[t].blindedMessage.B_];
			n && (d = e + t, o[t].blindedMessage.amount = n.amount, u.push(o[t].toProof(n, i)));
		}
		return {
			proofs: u,
			lastCounterWithSignature: d
		};
	}
	async createMintQuote(e, t, n) {
		if (typeof e != "string" || typeof t == "string") return this.createMintQuoteBolt11(e, t);
		let r = {
			...t,
			unit: this._unit
		}, i = await this.mint.createMintQuote(e, r, { normalize: n?.normalize });
		return {
			...i,
			unit: i.unit || this._unit
		};
	}
	async createMintQuoteBolt11(e, t) {
		this.requireSupport("mint", "bolt11");
		let n = this.parseAmount(e, "createMintQuoteBolt11");
		t && (this.getMintInfo().supportsNut04Description("bolt11", this._unit) || this.fail("Mint does not support description for bolt11"));
		let r = {
			unit: this._unit,
			amount: n,
			description: t
		}, i = await this.mint.createMintQuoteBolt11(r);
		return {
			...i,
			unit: i.unit || this._unit
		};
	}
	async createLockedMintQuote(e, t, n) {
		this.requireSupport("mint", "bolt11");
		let r = this.parseAmount(e, "createLockedMintQuote"), { supported: i } = this.getMintInfo().isSupported(20);
		this.failIf(!i, "Mint does not support NUT-20");
		let a = {
			unit: this._unit,
			amount: r,
			description: n,
			pubkey: t
		}, o = await this.mint.createMintQuoteBolt11(a);
		this.failIf(typeof o.pubkey != "string", "Mint returned unlocked mint quote");
		let s = o.pubkey;
		return {
			...o,
			pubkey: s,
			unit: o.unit || this._unit
		};
	}
	async createMintQuoteBolt12(e, t) {
		this.requireSupport("mint", "bolt12");
		let n = this.getMintInfo();
		t?.description && !n.supportsNut04Description("bolt12", this._unit) && this.fail("Mint does not support description for bolt12");
		let r = t?.amount === void 0 ? void 0 : this.parseAmount(t.amount, "createMintQuoteBolt12"), i = {
			pubkey: e,
			unit: this._unit,
			amount: r,
			description: t?.description
		};
		return this.mint.createMintQuoteBolt12(i);
	}
	async createMintQuoteOnchain(e) {
		this.requireSupport("mint", "onchain");
		let t = await this.mint.createMintQuoteOnchain({
			unit: this._unit,
			pubkey: e
		});
		return {
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
		let t = typeof e == "string" ? e : e.quote;
		return this.mint.checkMintQuoteBolt11(t);
	}
	async checkMintQuoteBolt12(e) {
		return this.mint.checkMintQuoteBolt12(e);
	}
	async checkMintQuoteOnchain(e) {
		return this.mint.checkMintQuoteOnchain(e);
	}
	validateReturnedSignatures(e, t) {
		let n = this._requireSigDleq && (this._mintInfo?.isSupported(12).supported ?? !1);
		for (let r = 0; r < e.length; r++) {
			this.failIf(e[r] == null, `Mint response is missing a signature at index ${r}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.failIf(e[r].id !== t[r].blindedMessage.id, `Mint signature keyset id at index ${r} does not match output: expected ${t[r].blindedMessage.id}, got ${e[r].id}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.failIf(!t[r].blindedMessage.amount.isZero() && !e[r].amount.equals(t[r].blindedMessage.amount), `Mint returned signature with wrong amount at index ${r}: expected ${t[r].blindedMessage.amount.toString()}, got ${e[r].amount.toString()}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`);
			let i = N(e[r].id);
			this.failIf(n && !i && !e[r].dleq, `Mint supports NUT-12, but returned a signature without DLEQ proof at index ${r}. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`);
		}
	}
	validateMintQuoteAvailableAmount(e, t, n) {
		if (e !== "bolt12" && e !== "onchain" || !("amount_paid" in t) || !("amount_issued" in t)) return;
		let r = k.from(t.amount_paid), i = k.from(t.amount_issued), a = r.subtract(i);
		this.failIf(n.greaterThan(a), `Mint quote ${t.quote} has only ${a.toString()} available to mint; requested ${n.toString()}`, {
			method: e,
			amount_paid: r.toString(),
			amount_issued: i.toString(),
			requestedAmount: n.toString()
		});
	}
	validateMintQuote(e) {
		this.failIf("unit" in e && typeof e.unit == "string" && e.unit !== this.unit, `Quote unit '${e.unit}' does not match wallet unit '${this.unit}'`), this.failIf("expiry" in e && typeof e.expiry == "number" && e.expiry > 0 && e.expiry < Math.floor(Date.now() / 1e3), `Mint quote ${e.quote} has expired`);
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
		let { privkey: o, keysetId: s, proofsWeHave: c, onCountersReserved: l } = r ?? {}, u = this.getKeyset(s), d = this.configureOutputs(a, u, i, !1, c), f = this.preparedTotal(d), p = await this.addCountersToOutputTypes(u.id, d);
		[d] = p.outputTypes, p.used && this.safeCallback(l, p.used, { op: "mintProofs" }), this._logger.debug("mint counter", {
			counter: p.used,
			mintOT: Yo(d)
		});
		let m = this.createOutputData(f, u, d), h = m.map((e) => e.blindedMessage), g = {
			outputs: h,
			quote: n.quote
		};
		if ("pubkey" in n && n.pubkey && this.failIf(!o, "Can not sign locked quote without private key"), o) {
			let e = "pubkey" in n ? n.pubkey : void 0;
			this.failIf(!e && Array.isArray(o), `prepareMint: multiple privkeys supplied for quote '${n.quote}' without pubkey`);
			let t = e ? rt(e, o) : Array.isArray(o) ? o[0] : o;
			this.failIf(!t, "prepareMint: privkey is empty or correct privkey not provided"), g.signature = Bi(t, n.quote, h);
		}
		return {
			method: e,
			payload: g,
			outputData: m,
			keysetId: u.id,
			quote: n
		};
	}
	async completeMint(e) {
		let { payload: t, outputData: n, keysetId: r, method: i } = e, { signatures: a } = await this.mint.mint(i, t);
		this.failIf(a.length !== n.length, `Mint returned ${a.length} signatures, expected ${n.length}. The mint quote may already be marked issued; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(a, n);
		let o = this.getKeyset(r);
		return this._logger.debug("MINT COMPLETED", { amounts: n.map((e) => e.blindedMessage.amount.toString()) }), n.map((e, t) => e.toProof(a[t], o));
	}
	async prepareBatchMint(e, t, n, r) {
		this.failIf(t.length === 0, "prepareBatchMint: no entries provided");
		let i = this._mintInfo?.isSupported(29), a = i?.supported ? i.params : void 0, o = a?.max_batch_size ?? 100;
		if (t.length > o) {
			let e = a?.max_batch_size == null ? "cashu-ts internal cap" : "mint's advertised limit";
			this.failIf(!0, `prepareBatchMint: batch size ${t.length} exceeds ${e} of ${o}`);
		}
		a?.methods?.length && (a.methods.includes(e) || this._logger.warn(`prepareBatchMint: method '${e}' is not in mint's advertised NUT-29 methods`));
		let { privkey: s, keysetId: c, proofsWeHave: l, onCountersReserved: u } = n ?? {};
		for (let e of t) this.failIf(typeof e.quote == "string", "prepareBatchMint: expected a quote object, not a string ID"), this.validateMintQuote(e.quote);
		t.some((e) => "pubkey" in e.quote && e.quote.pubkey) && this.failIf(!s, "Can not sign locked quotes without private key");
		let d = this.getKeyset(c), f = t.map((t) => this.parseAmount(t.amount, `prepareBatchMint: ${e}`)), p = k.sum(f);
		r = r ?? this.defaultOutputType();
		let m = this.configureOutputs(p, d, r, !1, l), h = await this.addCountersToOutputTypes(d.id, m);
		[m] = h.outputTypes, h.used && this.safeCallback(u, h.used, { op: "mintProofs" });
		let g = this.createOutputData(p, d, m), _ = g.map((e) => e.blindedMessage), v = [], y = !1;
		for (let e of t) {
			let t = "pubkey" in e.quote ? e.quote.pubkey : void 0;
			if (t && s) {
				let n = rt(t, s);
				v.push(Bi(n, e.quote.quote, _)), y = !0;
			} else s && !t && this._logger.warn(`prepareBatchMint: privkey supplied but quote '${e.quote.quote}' has no pubkey — treating as unlocked`), v.push(null);
		}
		return {
			method: e,
			payload: {
				quotes: t.map((e) => e.quote.quote),
				quote_amounts: f,
				outputs: _,
				...y ? { signatures: v } : {}
			},
			outputData: g,
			keysetId: d.id,
			quotes: t.map((e) => e.quote)
		};
	}
	async completeBatchMint(e) {
		let { method: t, payload: n, outputData: r, keysetId: i } = e, { signatures: a } = await this.mint.mintBatch(t, n);
		this.failIf(a.length !== r.length, `Mint returned ${a.length} signatures, expected ${r.length}. The mint quote may already be marked issued; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(a, r);
		let o = this.getKeyset(i);
		return this._logger.debug("BATCH MINT COMPLETED", {
			quotes: n.quotes.length,
			amounts: r.map((e) => e.blindedMessage.amount.toString())
		}), r.map((e, t) => e.toProof(a[t], o));
	}
	async createMeltQuote(e, t, n) {
		if (t === void 0 || typeof t == "number" || typeof t == "bigint" || typeof t == "object" && "toNumber" in t) return this.createMeltQuoteBolt11(e, t);
		let r = {
			...t,
			unit: this._unit
		}, i = await this.mint.createMeltQuote(e, r, { normalize: n?.normalize });
		return {
			...i,
			unit: i.unit || this._unit
		};
	}
	async createMeltQuoteBolt11(e, t) {
		this.requireSupport("melt", "bolt11");
		let n = t === void 0 ? void 0 : this.parseAmount(t, "createMeltQuoteBolt11");
		t !== void 0 && this.failIf(so(e), "amountMsat supplied but invoice already contains an amount. Leave amountMsat undefined for non-zero invoices.");
		let r = this._mintInfo?.supportsAmountless?.("bolt11", this._unit) ?? !1, i = {
			unit: this._unit,
			request: e,
			...r && n !== void 0 ? { options: { amountless: { amount_msat: n } } } : {}
		}, a = await this.mint.createMeltQuoteBolt11(i);
		return {
			...a,
			unit: a.unit || this._unit,
			request: a.request || e
		};
	}
	async createMeltQuoteBolt12(e, t) {
		this.requireSupport("melt", "bolt12");
		let n = t === void 0 ? void 0 : this.parseAmount(t, "createMeltQuoteBolt12");
		return this.mint.createMeltQuoteBolt12({
			unit: this._unit,
			request: e,
			options: n ? { amountless: { amount_msat: n } } : void 0
		});
	}
	async createMeltQuoteOnchain(e, t) {
		this.requireSupport("melt", "onchain");
		let n = this.parseAmount(t, "createMeltQuoteOnchain"), r = await this.mint.createMeltQuoteOnchain({
			unit: this._unit,
			request: e,
			amount: n
		});
		return {
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
		};
		return {
			...await this.mint.createMeltQuoteBolt11(a),
			request: e,
			unit: this._unit
		};
	}
	async checkMeltQuote(e, t, n) {
		let r = typeof t == "string" ? t : t.quote;
		return this.mint.checkMeltQuote(e, r, { normalize: n?.normalize });
	}
	async checkMeltQuoteBolt11(e) {
		let t = typeof e == "string" ? e : e.quote;
		return this.mint.checkMeltQuoteBolt11(t);
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
		let a = J(t), o = this.getFeesForProofs(a), s = q(a), c = e.amount.add(i.fee_reserve).add(o);
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
		let { keysetId: a, onCountersReserved: o, nut08Change: s = !0 } = r || {}, c = this.getKeyset(a), l = J(n), u = q(l), d = [];
		this.failIf(u.lessThan(t.amount), "Not enough proofs to cover amount + fee reserve", {
			sendAmount: u.toString(),
			quoteAmount: t.amount.toString()
		});
		let f = u.subtract(t.amount);
		if (i.type === "custom") d = i.data;
		else if (s && f.greaterThan(0)) {
			let e = Math.ceil(Math.log2(f.toNumberUnsafe())) || 1;
			e < 0 && (e = 0);
			let t = e ? Array(e).fill(0) : [];
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
				meltOT: Yo(n)
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
		let s = {
			quote: o,
			inputs: i,
			outputs: a,
			...r.preferAsync ? { prefer_async: !0 } : {},
			...r.extraPayload
		}, c = await this.mint.melt(e.method, s), l = this.createMeltChangeProofs(e.outputData, c.change ?? []);
		return r.preferAsync ? this._logger.debug("ASYNC MELT REQUESTED", c) : this._logger.debug("MELT COMPLETED", { changeAmounts: l.map((e) => e.amount.toString()) }), {
			quote: {
				...e.quote,
				...c
			},
			change: l,
			outputData: l.length > 0 ? [] : e.outputData
		};
	}
	createMeltChangeProofs(e, t) {
		return this.failIf(t.length > e.length, `Mint returned ${t.length} signatures, but only ${e.length} blanks were provided. Inputs may already be spent; if the wallet is seeded, try restoring (NUT-09) to recover.`), this.validateReturnedSignatures(t, e), t.map((t, n) => {
			let r;
			try {
				r = this.getKeyset(t.id);
			} catch (e) {
				throw new v(`Cannot reconstruct melt change: keyset ${t.id} is not loaded in this wallet (may be inactive after rotation). If the wallet is seeded, try restoring (NUT-09) to recover.`, { cause: e });
			}
			return e[n].toProof(t, r);
		});
	}
	async checkProofsStates(e) {
		let t = new TextEncoder(), n = e.map((e) => N(e.id) ? M(t.encode(e.secret)).toHex(!0) : yr(t.encode(e.secret)).toHex(!0)), r = [];
		for (let e = 0; e < n.length; e += 100) {
			let t = n.slice(e, e + 100), { states: i } = await this.mint.check({ Ys: t }), a = {};
			i.forEach((e) => {
				a[e.Y] = e;
			});
			for (let e = 0; e < t.length; e++) {
				let n = a[t[e]];
				this.failIfNullish(n, "Could not find state for proof with Y: " + t[e]), r.push(n);
			}
		}
		return r;
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
				case mo.UNSPENT:
					n.unspent.push(i);
					break;
				case mo.PENDING:
					n.pending.push(i);
					break;
				case mo.SPENT:
					n.spent.push(i);
					break;
			}
		}
		return n;
	}
}, ds, fs = class e {
	constructor(e, t) {
		this.tokens = {}, this.pool = [], this.desiredPoolSize = 100, this.maxPerMint = 100, this.mintUrl = e, this.req = t?.request ?? Po, this.logger = t?.logger ?? C;
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
		return this.oidc = e, this.oidc.addTokenListener((e) => this.updateFromOIDC(e)), this;
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
		this.tokens.accessToken = e, e || (this.tokens.refreshToken = void 0, this.tokens.expiresAt = void 0);
	}
	async ensureCAT(e) {
		return this.validForAtLeast(e) || !this.oidc || !this.tokens.refreshToken ? this.tokens.accessToken : (this.inflightRefresh || (this.inflightRefresh = (async () => {
			try {
				let e = await this.oidc.refresh(this.tokens.refreshToken);
				this.updateFromOIDC(e);
			} catch (e) {
				this.logger.warn("AuthManager: CAT refresh failed", { err: e });
			} finally {
				this.inflightRefresh = void 0;
			}
		})()), await this.inflightRefresh, this.validForAtLeast(0) ? this.tokens.accessToken : void 0);
	}
	validForAtLeast(t = e.MIN_VALID_SECS) {
		let { accessToken: n, expiresAt: r } = this.tokens;
		return n ? r ? Date.now() + t * 1e3 < r : !0 : !1;
	}
	updateFromOIDC(e) {
		if (!e.access_token) return;
		let t = Date.now();
		if (this.tokens.accessToken = e.access_token, e.refresh_token && (this.tokens.refreshToken = e.refresh_token), typeof e.expires_in == "number" && e.expires_in > 0) this.tokens.expiresAt = t + e.expires_in * 1e3;
		else {
			let t = this.parseJwtExpSec(e.access_token);
			this.tokens.expiresAt = t ? t * 1e3 : void 0;
		}
		this.logger.debug("AuthManager: OIDC tokens updated", { expiresAt: this.tokens.expiresAt });
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
			if (await this.ensure(1), this.pool.length === 0) throw new v("AuthManager: no BATs available and minting failed");
			let n = this.pool.pop();
			return this.logger.debug("AuthManager: BAT requested", {
				method: e,
				path: t,
				remaining: this.pool.length
			}), ps(n);
		});
	}
	importPool(e, t = "replace") {
		t === "replace" && (this.pool = []);
		let n = new Map(this.pool.map((e) => [e.secret, e]));
		for (let t of e) !t || !t.secret || !t.C || !t.id || n.has(t.secret) || (this.pool.push(t), n.set(t.secret, t));
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
			let e = D.toString(D.fromBase64(t[1])), n = JSON.parse(e), r = typeof n.exp == "number" ? n.exp : Number(n.exp);
			if (Number.isFinite(r) && r > 0) return r;
		} catch {
			this.logger.warn("JWT access token was malformed.", { token: e });
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
				endpoint: K(this.mintUrl, "/v1/info"),
				method: "GET"
			});
			this.info = new X(e, this.logger);
		}
		if (!this.keychain) {
			let [e, t] = await Promise.all([this.req({
				endpoint: K(this.mintUrl, "/v1/auth/blind/keysets"),
				method: "GET"
			}), this.req({
				endpoint: K(this.mintUrl, "/v1/auth/blind/keys"),
				method: "GET"
			})]), n = e.keysets.map((e) => co(e)), r = t.keysets.map((e) => lo(e)), i = Ho.mintToCacheDTO(this.mintUrl, n, r);
			this.keychain = Ho.fromCache(this.mintUrl, "auth", i), this.keychain.getCheapestKeyset();
		}
	}
	getBatMaxMint() {
		if (!this.info) throw new v("AuthManager: mint info not loaded");
		let e = this.info.nuts[22], t = Y(e?.bat_max_mint, "nuts.22.bat_max_mint", this.maxPerMint);
		return Math.max(1, Math.min(this.maxPerMint, t));
	}
	getActiveKeys() {
		if (!this.keychain) throw new v("AuthManager: keyset not loaded for active keyset");
		return this.keychain.getCheapestKeyset();
	}
	async topUp(e) {
		if (!this.info) throw new v("AuthManager: mint info not loaded");
		let t = this.info.requiresClearAuthToken("POST", "/v1/auth/blind/mint"), n;
		if (t && (n = await this.ensureCAT(), !n)) throw new v("AuthManager: Clear-auth token required for /v1/auth/blind/mint but not available. Authenticate with the mint to obtain a CAT first.");
		let r = this.getActiveKeys(), i = P.createRandomData(e, r), a = { outputs: i.map((e) => e.blindedMessage) }, o = {};
		n && (o["Clear-auth"] = n);
		let s = await this.req({
			endpoint: K(this.mintUrl, "/v1/auth/blind/mint"),
			method: "POST",
			headers: o,
			requestBody: a
		});
		if (!Array.isArray(s?.signatures) || s.signatures.length !== i.length) throw new v("AuthManager: bad BAT mint response");
		let c = s.signatures.map((e) => ({
			...e,
			amount: k.from(e.amount)
		})), l = i.map((e, t) => e.toProof(c[t], r));
		try {
			ro(l, () => r, { requireDleq: !0 });
		} catch (e) {
			throw new v("AuthManager: mint returned BAT that failed verification", { cause: e });
		}
		this.pool.push(...l), this.logger.debug("AuthManager: performed topUp", {
			minted: l.length,
			pool: this.pool.length
		});
	}
};
ds = fs, ds.MIN_VALID_SECS = 30;
function ps(e) {
	let t = JSON.stringify({
		id: e.id,
		secret: e.secret,
		C: e.C
	});
	return `authA${ye(D.fromString(t))}`;
}
//#endregion
//#region src/auth/createAuthWallet.ts
async function ms(e, t) {
	let n = new fs(e, {
		desiredPoolSize: t?.authPool ?? 10,
		maxPerMint: t?.authPool ?? 10,
		logger: t?.logger
	}), r = new Vo(e, {
		authProvider: n,
		logger: t?.logger
	}), i = await r.oidcAuth({
		...t?.oidc,
		logger: t?.logger,
		onTokens: (e) => n.setCAT(e.access_token)
	});
	n.attachOIDC(i);
	let a = new us(r, {
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
//#endregion
//#region src/model/SigAll.ts
var hs = "sigallA";
function gs(e, t, n) {
	let r = t.map((e) => ({ blindedMessage: e })), i = Ti(e, r, n), a = pi(e, r, n);
	return {
		legacy: $e(i, !0),
		current: $e(a, !0)
	};
}
function _s(e) {
	let t = {
		version: e.version,
		type: e.type
	};
	e.quote && (t.quote = e.quote), t.inputs = e.inputs, t.outputs = e.outputs, e.digests && (t.digests = e.digests), e.witness && (t.witness = e.witness);
	let n = A.stringify(t) ?? "{}";
	return `${hs}${ve(D.fromString(n))}`;
}
function vs(e, t) {
	if (!e.startsWith(hs)) throw new v(`Invalid signing package: must start with "${hs}"`);
	let n = e.slice(7), r;
	try {
		r = D.toString(D.fromBase64(n));
	} catch (e) {
		throw new v(`Failed to parse signing package: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
	}
	let i;
	try {
		i = A.parse(r);
	} catch (e) {
		throw new v(`Failed to parse signing package JSON: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
	}
	if (!i || typeof i != "object") throw new v("Signing package must be a JSON object");
	let a = i, o = a.version;
	if (o !== hs) throw new v(`Invalid signing package version: ${o}`);
	let s = a.type;
	if (s !== "swap" && s !== "melt") throw new v(`Invalid signing package type: ${s}`);
	if (!Array.isArray(a.inputs)) throw new v("Signing package inputs must be an array");
	for (let e = 0; e < a.inputs.length; e++) {
		let t = a.inputs[e];
		if (!t || typeof t != "object") throw new v(`Invalid input at index ${e}`);
		if (typeof t.secret != "string") throw new v(`Input ${e}: secret must be string`);
		if (typeof t.C != "string") throw new v(`Input ${e}: C must be string`);
	}
	if (!Array.isArray(a.outputs)) throw new v("Signing package outputs must be an array");
	for (let e = 0; e < a.outputs.length; e++) {
		let t = a.outputs[e];
		if (!t || typeof t != "object") throw new v(`Invalid output at index ${e}`);
		if (typeof t.amount != "number" && typeof t.amount != "bigint") throw new v(`Output ${e}: amount must be a number or bigint`);
		if (!t.B_ || typeof t.B_ != "string") throw new v(`Output ${e}: B_ invalid`);
		if (!t.id || typeof t.id != "string") throw new v(`Output ${e}: id invalid`);
		t.amount = k.from(t.amount);
	}
	let c = a.digests;
	if (!c || typeof c.current != "string" || c.current.length === 0) throw new v("Signing package digests.current is required");
	if (t?.validateDigest) {
		let e = gs(a.inputs, a.outputs, a.quote);
		if (e.current !== c.current) throw new v("Digest validation failed: current digest mismatch");
		if (c.legacy && e.legacy !== c.legacy) throw new v("Digest validation failed: legacy digest mismatch");
	}
	return a;
}
function ys(e, t) {
	let n = [];
	if (!e.digests?.current) throw new v("digests.current is required to sign package");
	if (n.push(et(e.digests.current, t)), e.digests.legacy && n.push(et(e.digests.legacy, t)), n.length === 0) throw new v("No signatures produced during signing");
	return {
		...e,
		witness: { signatures: [...e.witness?.signatures || [], ...n] }
	};
}
function bs(e) {
	let t = [...e.keepOutputs || [], ...e.sendOutputs || []];
	return Ss("swap", e.inputs, t.map((e) => e.blindedMessage));
}
function xs(e) {
	return Ss("melt", e.inputs, e.outputData.map((e) => e.blindedMessage), e.quote.quote);
}
function Ss(e, t, n, r) {
	let i = gs(t, n, r), a = $e(pi(t, n.map((e) => ({ blindedMessage: e })), r), !0);
	if (i.current !== a) throw new v("SIG_ALL digest computation mismatch - current digest does not match expected value");
	return {
		version: hs,
		type: e,
		...r ? { quote: r } : {},
		inputs: t.map((e) => ({
			secret: e.secret,
			C: e.C
		})),
		outputs: n,
		digests: i
	};
}
function Cs(e, t) {
	let n = Ts(t.inputs, e);
	return {
		...t,
		inputs: n
	};
}
function ws(e, t) {
	let n = Ts(t.inputs, e);
	return {
		...t,
		inputs: n
	};
}
function Ts(e, t) {
	if (!t.witness?.signatures.length) throw new v("No signatures to merge");
	if (e.length === 0) return e;
	let [n, ...r] = e, i = ai(n.witness), a = i?.signatures ?? [];
	return [{
		...n,
		witness: {
			...i ?? {},
			signatures: [...a, ...t.witness.signatures]
		}
	}, ...r];
}
var Es = {
	computeDigests: gs,
	extractSwapPackage: bs,
	extractMeltPackage: xs,
	serializePackage: _s,
	deserializePackage: vs,
	signPackage: ys,
	signDigest: et,
	mergeSwapPackage: Cs,
	mergeMeltPackage: ws
};
//#endregion
export { k as Amount, O as AmountError, oe as AmountWithUnit, ae as AmountWithUnitError, fs as AuthManager, lt as BLS_FR_ORDER, ut as BLS_G2_GENERATOR, ct as BLS_HASH_TO_CURVE_DST, v as CTSError, Vo as CashuMint, Vo as Mint, us as CashuWallet, us as Wallet, mo as CheckStateEnum, ne as ConsoleLogger, y as HttpResponseError, A as JSONInt, Ho as KeyChain, Q as Keyset, ss as MeltBuilder, cs as MeltOnchainBuilder, po as MeltQuoteState, os as MintBuilder, X as MintInfo, S as MintOperationError, fo as MintQuoteState, b as NetworkError, uo as OIDCAuth, P as OutputData, Gr as P2BK_DST, Wo as P2PKBuilder, ka as PaymentRequest, Hi as PaymentRequestTransportType, x as RateLimitError, as as ReceiveBuilder, is as SendBuilder, Es as SigAll, Xr as SigFlags, Bo as WSConnection, Qo as WalletCounters, ns as WalletEvents, rs as WalletOps, Dt as asBlsG1Point, Et as asSecpPoint, At as assertCanonicalKeysetId, Ir as assertSecretKind, fi as assertSigAllInputs, Tt as batchVerifyUnblindedSignatureBls, La as bigIntStringify, Er as blindMessage, yt as blindMessageBls, tr as buildCtfRangeRecoveryQuery, Ti as buildLegacyP2PKSigAllMessage, pi as buildP2PKSigAllMessage, rr as classifyCtfSettlementRecovery, Yt as computeCtfManifestCommitment, Jt as computeCtfReceiveCommitment, en as computeCtfSettlementRequestDigest, $e as computeMessageDigest, an as computePayToUnlockRefundDigest, Or as constructUnblindedSignature, xt as constructUnblindedSignatureBls, ms as createAuthWallet, wr as createBlindSignature, St as createBlindSignatureBls, er as createCtfAuthorizationOutputs, tn as createCtfPayToUnlockSecret, Qn as createCtfRangeManifest, Xt as createCtfSelectionBitmap, ji as createDLEQProof, Zo as createEphemeralCounterSource, Pi as createHTLCHash, Mi as createHTLCsecret, Mr as createNewMintKeys, $r as createP2PKsecret, Tr as createRandomRawBlindedMessage, Cr as createRandomSecretKey, Pr as createSecret, Gn as createSecretAndBlindingFactorDeriver, $a as decodePaymentRequest, B as dedupeP2PKPubkeys, wt as deriveBatchWeights, Un as deriveBlindingFactor, ot as deriveConditionalKeysetId, nr as deriveCtfRangeRecoverySelection, $n as deriveCtfRangeRefundKey, Ka as deriveKeysetId, Kr as deriveP2BKBlindedPubkeys, Jr as deriveP2BKSecretKey, qr as deriveP2BKSecretKeys, Hn as deriveSecret, Wn as deriveSecretAndBlindingFactor, jr as deserializeMintKeys, Qa as deserializeProofs, rt as findSigningKey, zr as getDataField, Ua as getDecodedToken, ao as getDecodedTokenBinary, za as getEncodedToken, za as getEncodedTokenV4, io as getEncodedTokenBinary, _t as getG2PubKeyFromPrivKey, Ri as getHTLCWitnessPreimage, Aa as getKeysetAmounts, jt as getKeysetIdInt, ni as getP2PKExpectedWitnessPubkeys, ri as getP2PKSigFlag, ii as getP2PKWitnessSignatures, Sr as getPubKeyFromPrivKey, Rr as getSecretData, Lr as getSecretKind, Hr as getTag, Wr as getTagInt, Ur as getTagScalar, Br as getTags, Wa as getTokenMetadata, it as getValidSigners, Ma as hasCorrespondingKey, ci as hasP2PKSignedProof, Vr as hasTag, no as hasValidDleq, yr as hashToCurve, M as hashToCurveBls, br as hash_e, Pa as hexToNumber, Io as injectWebSocketImpl, so as invoiceHasAmountInHRP, N as isBlsKeyset, Li as isHTLCSpendAuthorised, G as isObj, mi as isP2PKSigAll, ui as isP2PKSpendAuthorised, W as isValidHex, K as joinUrls, di as maybeDeriveP2BKPrivateKeys, at as meetsSignerThreshold, ti as normalizeP2PKOptions, J as normalizeProofAmounts, Xa as normalizeUrl, Ya as nullIfUndefined, Fa as numberToHexPadded64, nn as parseCtfPayToUnlockCondition, Zt as parseCtfSelectionBitmap, Ni as parseHTLCSecret, z as parseP2PKSecret, Fr as parseSecret, ai as parseWitnessData, xr as pointFromBytes, R as pointFromHex, Ot as pointFromHexAuto, ht as pointFromHexG1, gt as pointFromHexG2, kt as pointToHex, ir as recoverCtfRangeProofs, et as schnorrSignDigest, tt as schnorrSignMessage, nt as schnorrVerifyMessage, Qt as selectCtfManifestOutputs, $t as selectCtfRangeAmounts, Go as selectProofsRGLI, Ar as serializeMintKeys, Za as serializeProofs, xo as setGlobalRequestOptions, Bi as signMintQuote, si as signP2PKProof, oi as signP2PKProofs, on as signPayToUnlockRefund, Ja as sortProofsById, U as splitAmount, eo as stripDleq, q as sumProofs, Dr as unblindSignature, bt as unblindSignatureBls, rn as validateCtfPoolPolicyTotals, ki as verifyDLEQProof, Ai as verifyDLEQProof_reblind, Fi as verifyHTLCHash, Ii as verifyHTLCSpendingConditions, Vi as verifyMintQuoteSignature, li as verifyP2PKSpendingConditions, ro as verifyProofsForReceive, Nr as verifyUnblindedSignature, Ct as verifyUnblindedSignatureBls };

//# sourceMappingURL=cashu-ts.es.js.map