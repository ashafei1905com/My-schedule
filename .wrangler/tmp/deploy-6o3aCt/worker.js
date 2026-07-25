var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/base64-arraybuffer/dist/base64-arraybuffer.es5.js
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
for (i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}
var i;
var encode = /* @__PURE__ */ __name(function(arraybuffer) {
  var bytes = new Uint8Array(arraybuffer), i2, len = bytes.length, base64 = "";
  for (i2 = 0; i2 < len; i2 += 3) {
    base64 += chars[bytes[i2] >> 2];
    base64 += chars[(bytes[i2] & 3) << 4 | bytes[i2 + 1] >> 4];
    base64 += chars[(bytes[i2 + 1] & 15) << 2 | bytes[i2 + 2] >> 6];
    base64 += chars[bytes[i2 + 2] & 63];
  }
  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + "=";
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + "==";
  }
  return base64;
}, "encode");
var decode = /* @__PURE__ */ __name(function(base64) {
  var bufferLength = base64.length * 0.75, len = base64.length, i2, p = 0, encoded1, encoded2, encoded3, encoded4;
  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }
  var arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
  for (i2 = 0; i2 < len; i2 += 4) {
    encoded1 = lookup[base64.charCodeAt(i2)];
    encoded2 = lookup[base64.charCodeAt(i2 + 1)];
    encoded3 = lookup[base64.charCodeAt(i2 + 2)];
    encoded4 = lookup[base64.charCodeAt(i2 + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arraybuffer;
}, "decode");

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/base64.js
function decodeBase64Url(str) {
  return decode(str.replace(/-/g, "+").replace(/_/g, "/"));
}
__name(decodeBase64Url, "decodeBase64Url");
function encodeBase64Url(arr) {
  return encode(arr).replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/, "");
}
__name(encodeBase64Url, "encodeBase64Url");
function objectToBase64Url(obj) {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(obj)));
}
__name(objectToBase64Url, "objectToBase64Url");

// node_modules/@block65/webcrypto-web-push/dist/lib/isomorphic-crypto.js
var impl = globalThis.crypto ? globalThis.crypto : await import("node:crypto");
var crypto2 = {
  getRandomValues: /* @__PURE__ */ __name((array) => "webcrypto" in impl ? impl.webcrypto.getRandomValues(array) : impl.getRandomValues(array), "getRandomValues"),
  subtle: "webcrypto" in impl ? impl.webcrypto.subtle : impl.subtle
};
var CryptoKey2 = "webcrypto" in impl ? impl.webcrypto.CryptoKey : globalThis.CryptoKey;

// node_modules/@block65/webcrypto-web-push/dist/lib/client-keys.js
async function deriveClientKeys(sub) {
  const publicBytes = decodeBase64Url(sub.keys.p256dh);
  const publicJwk = {
    kty: "EC",
    crv: "P-256",
    x: encodeBase64Url(publicBytes.slice(1, 33)),
    y: encodeBase64Url(publicBytes.slice(33, 65)),
    ext: true
  };
  return {
    publicBytes: new Uint8Array(publicBytes),
    publicKey: await crypto2.subtle.importKey("jwk", publicJwk, {
      name: "ECDH",
      namedCurve: "P-256"
    }, true, []),
    authSecretBytes: decodeBase64Url(sub.keys.auth)
  };
}
__name(deriveClientKeys, "deriveClientKeys");

// node_modules/@block65/webcrypto-web-push/dist/lib/hkdf.js
function createHMAC(data) {
  if (data.byteLength === 0) {
    return {
      hash: /* @__PURE__ */ __name(() => Promise.resolve(new ArrayBuffer(32)), "hash")
    };
  }
  const keyPromise = crypto2.subtle.importKey("raw", data, {
    name: "HMAC",
    hash: "SHA-256"
  }, true, ["sign"]);
  return {
    hash: /* @__PURE__ */ __name(async (input) => {
      const k = await keyPromise;
      return crypto2.subtle.sign("HMAC", k, input);
    }, "hash")
  };
}
__name(createHMAC, "createHMAC");
async function hkdf(salt, ikm) {
  const prkhPromise = createHMAC(salt).hash(ikm).then((prk) => createHMAC(prk));
  return {
    extract: /* @__PURE__ */ __name(async (info, len) => {
      const input = new Uint8Array([
        ...new Uint8Array(info),
        ...new Uint8Array([1])
      ]);
      const prkh = await prkhPromise;
      const hash = await prkh.hash(input);
      return hash.slice(0, len);
    }, "extract")
  };
}
__name(hkdf, "hkdf");

// node_modules/@block65/webcrypto-web-push/dist/lib/utils.js
function flattenUint8Array(arrays) {
  const flatNumberArray = arrays.reduce((accum, arr) => {
    accum.push(...arr);
    return accum;
  }, []);
  return new Uint8Array(flatNumberArray);
}
__name(flattenUint8Array, "flattenUint8Array");
function be16(val) {
  return (val & 255) << 8 | val >> 8 & 255;
}
__name(be16, "be16");
function arrayChunk(arr, chunkSize) {
  const chunks = [];
  const arrayLength = arr.length;
  let i2 = 0;
  while (i2 < arrayLength) {
    chunks.push(arr.slice(i2, i2 += chunkSize));
  }
  return chunks;
}
__name(arrayChunk, "arrayChunk");
function generateNonce(base, index) {
  const nonce = base.slice(0, 12);
  for (let i2 = 0; i2 < 6; ++i2) {
    nonce[nonce.length - 1 - i2] ^= index / 256 ** i2 & 255;
  }
  return nonce;
}
__name(generateNonce, "generateNonce");
function encodeLength(int) {
  return new Uint8Array([0, int]);
}
__name(encodeLength, "encodeLength");
function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
__name(invariant, "invariant");

// node_modules/@block65/webcrypto-web-push/dist/lib/info.js
function createInfo(clientPublic, serverPublic, type) {
  return new Uint8Array([
    ...new TextEncoder().encode(`Content-Encoding: ${type}\0`),
    ...new TextEncoder().encode("P-256\0"),
    ...encodeLength(clientPublic.byteLength),
    ...clientPublic,
    ...encodeLength(serverPublic.byteLength),
    ...serverPublic
  ]);
}
__name(createInfo, "createInfo");
function createInfo2(type) {
  return new Uint8Array([
    ...new TextEncoder().encode(`Content-Encoding: ${type}\0`)
    // ...new TextEncoder().encode('P-256\0'),
    // ...encodeInt(clientPublic.byteLength),
    // ...clientPublic,
    // ...encodeInt(serverPublic.byteLength),
    // ...serverPublic,
  ]);
}
__name(createInfo2, "createInfo2");

// node_modules/@block65/webcrypto-web-push/dist/lib/jwk-to-bytes.js
function ecJwkToBytes(jwk) {
  invariant(jwk.x, "jwk.x is missing");
  invariant(jwk.y, "jwk.y is missing");
  const xBytes = new Uint8Array(decodeBase64Url(jwk.x));
  const yBytes = new Uint8Array(decodeBase64Url(jwk.y));
  const raw = [4, ...xBytes, ...yBytes];
  return new Uint8Array(raw);
}
__name(ecJwkToBytes, "ecJwkToBytes");

// node_modules/@block65/webcrypto-web-push/dist/lib/local-keys.js
async function generateLocalKeys() {
  const keyPair = await crypto2.subtle.generateKey({
    name: "ECDH",
    namedCurve: "P-256"
  }, true, ["deriveBits"]);
  const publicJwk = await crypto2.subtle.exportKey("jwk", keyPair.publicKey);
  const privateJwk = await crypto2.subtle.exportKey("jwk", keyPair.privateKey);
  return {
    publicKey: await crypto2.subtle.importKey("jwk", publicJwk, { name: "ECDH", namedCurve: "P-256" }, true, []),
    privateKey: keyPair.privateKey,
    publicJwk,
    privateJwk
  };
}
__name(generateLocalKeys, "generateLocalKeys");

// node_modules/@block65/webcrypto-web-push/dist/lib/salt.js
async function getSalt() {
  return crypto2.getRandomValues(new Uint8Array(16));
}
__name(getSalt, "getSalt");

// node_modules/@block65/webcrypto-web-push/dist/lib/encrypt.js
async function encryptNotification(subscription, plaintext) {
  const clientKeys = await deriveClientKeys(subscription);
  const salt = await getSalt();
  const localKeys = await generateLocalKeys();
  const localPublicKeyBytes = ecJwkToBytes(localKeys.publicJwk);
  const sharedSecret = await crypto2.subtle.deriveBits({
    name: "ECDH",
    // namedCurve: 'P-256',
    public: clientKeys.publicKey
  }, localKeys.privateKey, 256);
  const cekInfo = createInfo(clientKeys.publicBytes, localPublicKeyBytes, "aesgcm");
  const nonceInfo = createInfo(clientKeys.publicBytes, localPublicKeyBytes, "nonce");
  const keyInfo = createInfo2("auth");
  const ikmHkdf = await hkdf(clientKeys.authSecretBytes, sharedSecret);
  const ikm = await ikmHkdf.extract(keyInfo, 32);
  const messageHkdf = await hkdf(salt, ikm);
  const cekBytes = await messageHkdf.extract(cekInfo, 16);
  const nonceBytes = await messageHkdf.extract(nonceInfo, 12);
  const cekCryptoKey = await crypto2.subtle.importKey("raw", cekBytes, {
    name: "AES-GCM",
    length: 128
  }, false, ["encrypt"]);
  const cipherChunks = await Promise.all(arrayChunk(plaintext, 4095).map(async (chunk, idx) => {
    const padSize = 0;
    const x = new Uint16Array([be16(padSize)]);
    const padded = new Uint8Array([
      ...new Uint8Array(x.buffer, x.byteOffset, x.byteLength),
      ...chunk
    ]);
    const encrypted = await crypto2.subtle.encrypt({
      name: "AES-GCM",
      iv: generateNonce(new Uint8Array(nonceBytes), idx)
    }, cekCryptoKey, padded);
    return new Uint8Array(encrypted);
  }));
  return {
    ciphertext: flattenUint8Array(cipherChunks),
    salt,
    localPublicKeyBytes
  };
}
__name(encryptNotification, "encryptNotification");

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/jwt-algorithms.js
var algorithms = {
  ES256: { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } },
  ES384: { name: "ECDSA", namedCurve: "P-384", hash: { name: "SHA-384" } },
  ES512: { name: "ECDSA", namedCurve: "P-521", hash: { name: "SHA-512" } },
  HS256: { name: "HMAC", hash: { name: "SHA-256" } },
  HS384: { name: "HMAC", hash: { name: "SHA-384" } },
  HS512: { name: "HMAC", hash: { name: "SHA-512" } },
  RS256: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
  RS384: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-384" } },
  RS512: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } }
};

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/sign.js
async function sign(payload, key, options) {
  if (payload === null || typeof payload !== "object") {
    throw new Error("payload must be an object");
  }
  if (!(key instanceof CryptoKey2)) {
    throw new Error("key must be a CryptoKey");
  }
  if (typeof options.algorithm !== "string") {
    throw new Error("options.algorithm must be a string");
  }
  const headerStr = objectToBase64Url({
    typ: "JWT",
    alg: options.algorithm,
    ...options.kid && { kid: options.kid }
  });
  const payloadStr = objectToBase64Url({
    iat: Math.floor(Date.now() / 1e3),
    ...payload
  });
  const dataStr = `${headerStr}.${payloadStr}`;
  const signature = await crypto2.subtle.sign(algorithms[options.algorithm], key, new TextEncoder().encode(dataStr));
  return `${dataStr}.${encodeBase64Url(signature)}`;
}
__name(sign, "sign");

// node_modules/@block65/custom-error/dist/lib/custom-error.js
var Status;
(function(Status2) {
  Status2[Status2["OK"] = 0] = "OK";
  Status2[Status2["CANCELLED"] = 1] = "CANCELLED";
  Status2[Status2["UNKNOWN"] = 2] = "UNKNOWN";
  Status2[Status2["INVALID_ARGUMENT"] = 3] = "INVALID_ARGUMENT";
  Status2[Status2["DEADLINE_EXCEEDED"] = 4] = "DEADLINE_EXCEEDED";
  Status2[Status2["NOT_FOUND"] = 5] = "NOT_FOUND";
  Status2[Status2["ALREADY_EXISTS"] = 6] = "ALREADY_EXISTS";
  Status2[Status2["PERMISSION_DENIED"] = 7] = "PERMISSION_DENIED";
  Status2[Status2["RESOURCE_EXHAUSTED"] = 8] = "RESOURCE_EXHAUSTED";
  Status2[Status2["FAILED_PRECONDITION"] = 9] = "FAILED_PRECONDITION";
  Status2[Status2["ABORTED"] = 10] = "ABORTED";
  Status2[Status2["OUT_OF_RANGE"] = 11] = "OUT_OF_RANGE";
  Status2[Status2["UNIMPLEMENTED"] = 12] = "UNIMPLEMENTED";
  Status2[Status2["INTERNAL"] = 13] = "INTERNAL";
  Status2[Status2["UNAVAILABLE"] = 14] = "UNAVAILABLE";
  Status2[Status2["DATA_LOSS"] = 15] = "DATA_LOSS";
  Status2[Status2["UNAUTHENTICATED"] = 16] = "UNAUTHENTICATED";
})(Status || (Status = {}));
var CUSTOM_ERROR_SYM = /* @__PURE__ */ Symbol.for("CustomError");
var defaultHttpMapping = /* @__PURE__ */ new Map([
  [Status.OK, 200],
  [Status.INVALID_ARGUMENT, 400],
  [Status.FAILED_PRECONDITION, 400],
  [Status.OUT_OF_RANGE, 400],
  [Status.UNAUTHENTICATED, 401],
  [Status.PERMISSION_DENIED, 403],
  [Status.NOT_FOUND, 404],
  [Status.ABORTED, 409],
  [Status.ALREADY_EXISTS, 409],
  [Status.RESOURCE_EXHAUSTED, 403],
  [Status.CANCELLED, 499],
  [Status.DATA_LOSS, 500],
  [Status.UNKNOWN, 500],
  [Status.INTERNAL, 500],
  [Status.UNIMPLEMENTED, 501],
  // [Code.LOCAL_OUTAGE,  502],
  [Status.UNAVAILABLE, 503],
  [Status.DEADLINE_EXCEEDED, 504]
]);
function withNullProto(obj) {
  return Object.assign(/* @__PURE__ */ Object.create(null), obj);
}
__name(withNullProto, "withNullProto");
var CustomError = class _CustomError extends Error {
  static {
    __name(this, "CustomError");
  }
  /**
   * The previous error that occurred, useful if "wrapping" an error to hide
   * sensitive details
   * @type {Error | CustomError | unknown}
   */
  cause;
  /**
   * Further error details suitable for end user consumption
   * @type {ErrorDetail[]}
   */
  details;
  /**
   * Status code suitable to coarsely determine the reason for error
   * @type {Status}
   */
  code = Status.UNKNOWN;
  /**
   * Contains arbitrary debug data for developer troubleshooting
   * @type {DebugData}
   * @private
   */
  debugData;
  /**
   *
   * @param {string} message Developer facing message, in English.
   * @param {Error | CustomError | unknown} cause
   */
  constructor(message, cause) {
    super(message, { cause });
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
  static isCustomError(value) {
    return !!value && typeof value === "object" && CUSTOM_ERROR_SYM in value;
  }
  debug(data) {
    if (arguments.length > 0) {
      this.debugData = withNullProto({
        ...this.debugData,
        ...data
      });
      return this;
    }
    return this.debugData;
  }
  /**
   * Human readable representation of the error code
   * @return {keyof typeof Status}
   */
  get status() {
    return Status[this.code];
  }
  /**
   * Adds further error details suitable for end user consumption
   * @param {ErrorDetail} details
   * @return {this}
   */
  addDetail(...details) {
    this.details = (this.details || []).concat(details);
    return this;
  }
  /**
   * A "safe" serialised version of the error designed for end user consumption
   * @return {CustomErrorSerialized}
   */
  serialize() {
    const localised = this.details?.find((detail) => "locale" in detail);
    return withNullProto({
      message: this.message,
      ...localised?.message && {
        message: localised.message
      },
      code: this.code,
      status: this.status,
      ...this.details && { details: this.details }
    });
  }
  /**
   * JSON representation of the error object.
   *
   * Use {serialize} instead if you need to send this error over the wire
   *
   * @return {object}
   */
  toJSON() {
    const debug = this.debug();
    return withNullProto({
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      ...this.details && { details: this.details },
      ...this.cause instanceof Error && {
        cause: "toJSON" in this.cause && typeof this.cause.toJSON === "function" ? this.cause.toJSON() : {
          message: this.cause.message,
          name: "Error"
        }
      },
      ...this.stack && { stack: this.stack },
      ...debug && { debug }
    });
  }
  /**
   * "Hydrates" a previously serialised error object
   * @param {CustomErrorSerialized} params
   * @return {CustomError}
   */
  static fromJSON(params) {
    const { code = Status.UNKNOWN, message, details = [] } = params;
    const err = new _CustomError(message || (Status[params.code] || params.code || "Error").toString()).debug({ params });
    err.code = code;
    if (details) {
      err.addDetail(...details);
    }
    return err;
  }
  /**
   * An automatically determined HTTP status code
   * @return {number}
   */
  static suggestHttpResponseCode(err) {
    const code = _CustomError.isCustomError(err) ? err.code : Status.UNKNOWN;
    return defaultHttpMapping.get(code) || 500;
  }
};
Object.defineProperty(CustomError.prototype, CUSTOM_ERROR_SYM, {
  value: true,
  enumerable: false,
  writable: false
});
Object.defineProperty(CustomError.prototype, "status", {
  enumerable: true
});

// node_modules/@block65/webcrypto-web-push/dist/lib/vapid.js
async function vapidHeaders(subscription, vapid) {
  invariant(vapid.subject, "Vapid subject is empty");
  invariant(vapid.privateKey, "Vapid private key is empty");
  invariant(vapid.publicKey, "Vapid public key is empty");
  const vapidPublicKeyBytes = decodeBase64Url(vapid.publicKey);
  const publicKey = await crypto2.subtle.importKey("jwk", {
    kty: "EC",
    crv: "P-256",
    x: encodeBase64Url(vapidPublicKeyBytes.slice(1, 33)),
    y: encodeBase64Url(vapidPublicKeyBytes.slice(33, 65)),
    d: vapid.privateKey
  }, {
    name: "ECDSA",
    namedCurve: "P-256"
  }, false, ["sign"]);
  const jwt = await sign({
    aud: new URL(subscription.endpoint).origin,
    exp: Math.floor(Date.now() / 1e3) + 12 * 60 * 60,
    sub: vapid.subject
  }, publicKey, {
    algorithm: "ES256"
  });
  return {
    headers: {
      authorization: `WebPush ${jwt}`,
      "crypto-key": `p256ecdsa=${vapid.publicKey}`
    }
    // publicJwk,
  };
}
__name(vapidHeaders, "vapidHeaders");

// node_modules/@block65/webcrypto-web-push/dist/lib/payload.js
async function buildPushPayload(message, subscription, vapid) {
  const { headers } = await vapidHeaders(subscription, vapid);
  const encrypted = await encryptNotification(subscription, new TextEncoder().encode(
    // if its a primitive, convert to string, otherwise stringify
    typeof message.data === "string" || typeof message.data === "number" ? message.data.toString() : JSON.stringify(message.data)
  ));
  return {
    headers: {
      ...headers,
      "crypto-key": `dh=${encodeBase64Url(encrypted.localPublicKeyBytes)};${headers["crypto-key"]}`,
      encryption: `salt=${encodeBase64Url(encrypted.salt)}`,
      ttl: (message.options?.ttl || 60).toString(),
      ...message.options?.urgency && {
        urgency: message.options.urgency
      },
      ...message.options?.topic && {
        topic: message.options.topic
      },
      "content-encoding": "aesgcm",
      "content-length": encrypted.ciphertext.byteLength.toString(),
      "content-type": "application/octet-stream"
    },
    method: "post",
    body: encrypted.ciphertext
  };
}
__name(buildPushPayload, "buildPushPayload");

// worker.js
var ALLOWED_ORIGIN = "https://ashafei1905com.github.io";
var MODEL = "openai/gpt-oss-120b";
var MAX_TOKENS = 1200;
var worker_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    const url = new URL(request.url);
    if (url.pathname === "/api/save-subscription") {
      return handleSaveSubscription(request, env);
    }
    if (url.pathname === "/api/nutrition") {
      return handleNutritionLookup(request, env);
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }
    const origin = request.headers.get("Origin") || "";
    if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
      return json({ error: "Origin not allowed" }, 403);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const { messages, system } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages array required" }, 400);
    }
    const trimmedMessages = messages.slice(-20);
    const groqMessages = system ? [{ role: "system", content: system }, ...trimmedMessages] : trimmedMessages;
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          max_completion_tokens: MAX_TOKENS,
          messages: groqMessages,
          // gpt-oss-120b is a reasoning model — by default Groq INCLUDES its internal
          // reasoning trace in the response (include_reasoning defaults to true).
          // Every caller in this app (aiParseIntent's JSON parsing, flExtractMealInfo,
          // flComputeMacro, aiResolveRelativeMove, etc.) does a plain JSON.parse on
          // data.text expecting ONLY the final JSON object — a prepended reasoning
          // trace would break every one of them with a parse error. Explicitly
          // disabling it here is required, not optional, for this model swap to work
          // at all. reasoning_effort:'low' also keeps latency/token usage close to
          // what the old non-reasoning model felt like, since this app needs fast
          // conversational replies, not deep multi-step reasoning.
          include_reasoning: false,
          reasoning_effort: "low"
        })
      });
      const data = await groqRes.json();
      if (!groqRes.ok) {
        return json({ error: data?.error?.message || "Groq API error" }, groqRes.status);
      }
      const text = data?.choices?.[0]?.message?.content || "";
      return json({ text });
    } catch (e) {
      return json({ error: "Upstream request failed: " + e.message }, 502);
    }
  },
  // Cron Trigger entry point — configured via [triggers] crons = ["* * * * *"] in
  // wrangler.toml. Cloudflare invokes this every minute regardless of whether any
  // client has the app open at all; this is the actual fix for the iOS-background
  // problem, since delivery no longer depends on a phone's browser process existing.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(dispatchDueReminders(env));
  }
};
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
__name(corsHeaders, "corsHeaders");
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
__name(json, "json");
function kuwaitNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(/* @__PURE__ */ new Date());
  const o = {};
  parts.forEach((p) => {
    if (p.type !== "literal") o[p.type] = p.value;
  });
  return { date: `${o.year}-${o.month}-${o.day}`, time: `${o.hour}:${o.minute}` };
}
__name(kuwaitNowParts, "kuwaitNowParts");
var _fbTokenCache = { token: null, expiresAt: 0 };
function base64url(bytes) {
  let str = typeof bytes === "string" ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64url, "base64url");
async function importServiceAccountKey(pem) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\\n/g, "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(body)) {
    throw new Error("FIREBASE_PRIVATE_KEY does not decode as valid base64 after cleanup \u2014 re-check the secret was pasted correctly (the full PEM body between BEGIN/END PRIVATE KEY, either as real newlines or a single unbroken line)");
  }
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
__name(importServiceAccountKey, "importServiceAccountKey");
async function getFirestoreAccessToken(env) {
  const now = Math.floor(Date.now() / 1e3);
  if (_fbTokenCache.token && _fbTokenCache.expiresAt - now > 60) {
    return _fbTokenCache.token;
  }
  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase service account secrets not configured (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)");
  }
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };
  const encHeader = base64url(JSON.stringify(header));
  const encClaims = base64url(JSON.stringify(claims));
  const signingInput = `${encHeader}.${encClaims}`;
  const key = await importServiceAccountKey(env.FIREBASE_PRIVATE_KEY);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${base64url(sig)}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => "");
    throw new Error(`Firebase OAuth token exchange failed: ${tokenRes.status} ${errText}`);
  }
  const tokenData = await tokenRes.json();
  _fbTokenCache = { token: tokenData.access_token, expiresAt: now + (tokenData.expires_in || 3600) };
  return _fbTokenCache.token;
}
__name(getFirestoreAccessToken, "getFirestoreAccessToken");
function toFirestoreValue(v) {
  if (v === null || v === void 0) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === "object") {
    const fields = {};
    for (const k of Object.keys(v)) fields[k] = toFirestoreValue(v[k]);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}
__name(toFirestoreValue, "toFirestoreValue");
function fromFirestoreValue(v) {
  if (!v) return null;
  if ("nullValue" in v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in v) {
    const out = {};
    const fields = v.mapValue.fields || {};
    for (const k of Object.keys(fields)) out[k] = fromFirestoreValue(fields[k]);
    return out;
  }
  return null;
}
__name(fromFirestoreValue, "fromFirestoreValue");
var FIRESTORE_BASE = /* @__PURE__ */ __name((env) => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`, "FIRESTORE_BASE");
async function firestoreGetFood(env, docId) {
  const token = await getFirestoreAccessToken(env);
  const res = await fetch(`${FIRESTORE_BASE(env)}/foods/${encodeURIComponent(docId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Firestore get failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  const fields = data.fields || {};
  const out = {};
  for (const k of Object.keys(fields)) out[k] = fromFirestoreValue(fields[k]);
  return out;
}
__name(firestoreGetFood, "firestoreGetFood");
async function firestoreSetFood(env, docId, fieldsObj) {
  try {
    const token = await getFirestoreAccessToken(env);
    const fields = {};
    for (const k of Object.keys(fieldsObj)) fields[k] = toFirestoreValue(fieldsObj[k]);
    const res = await fetch(`${FIRESTORE_BASE(env)}/foods/${encodeURIComponent(docId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("firestoreSetFood failed", res.status, errText);
    }
  } catch (e) {
    console.error("firestoreSetFood threw", e);
  }
}
__name(firestoreSetFood, "firestoreSetFood");
function normalizeFoodKey(raw) {
  if (!raw) return "";
  return String(raw).replace(/[\u064B-\u0652]/g, "").replace(/[إأآ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().replace(/\s+/g, " ").toLowerCase();
}
__name(normalizeFoodKey, "normalizeFoodKey");
var TIER3_SYSTEM_PROMPT = `You are a precise nutrition estimator. You will receive a food description, possibly in Arabic (including Egyptian/Gulf/Levantine dialect or regional dish names), possibly with a quantity and unit.

Respond with ONLY a raw JSON object, nothing else \u2014 no markdown fences, no explanation outside the JSON:
{"canonicalName":"<the food's common name, in English, for internal cataloging>","macroPer100g":{"p":<protein grams per 100g, number>,"c":<carb grams per 100g, number>,"f":<fat grams per 100g, number>,"b":<fiber grams per 100g, number>,"k":<calories per 100g, number>},"estimatedGrams":<your best-estimate total gram weight of the described portion, number>}

Rules:
- macroPer100g must be a per-100g baseline for this food, NOT scaled to the described portion \u2014 estimatedGrams is what scaling happens against, separately, by the caller.
- Use standard nutritional values for the identified food. For regional/traditional dishes (e.g. \u0643\u0634\u0631\u064A, \u0645\u0644\u0648\u062E\u064A\u0629, \u0645\u0646\u062F\u064A, \u0645\u0633\u062E\u0646), estimate based on typical home/restaurant preparation and standard ingredient ratios.
- estimatedGrams should reflect the quantity/unit given in the description if present (e.g. "150 \u062C\u0631\u0627\u0645" -> 150), or a normal single-adult serving if no quantity was given.
- k (calories) must be consistent with p*4 + c*4 + f*9 approximately (per 100g).
- Never fabricate a food that doesn't match the description \u2014 if the description is genuinely unidentifiable, respond with {"error":"<short explanation>"} instead.`;
async function tier3EstimateMacro(env, query) {
  if (!env.GROQ_API_KEY) {
    return { ok: false, error: "GROQ_API_KEY not configured" };
  }
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 400,
        include_reasoning: false,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: TIER3_SYSTEM_PROMPT },
          { role: "user", content: query }
        ]
      })
    });
    const data = await groqRes.json();
    if (!groqRes.ok) {
      return { ok: false, error: data?.error?.message || "Groq API error" };
    }
    let raw = (data?.choices?.[0]?.message?.content || "").trim().replace(/^```json\s*|```$/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, error: "unparseable LLM response" };
    }
    if (parsed.error) return { ok: false, error: parsed.error };
    const m = parsed.macroPer100g;
    const isFiniteNonNeg = /* @__PURE__ */ __name((n) => typeof n === "number" && Number.isFinite(n) && n >= 0, "isFiniteNonNeg");
    const gramsOk = isFiniteNonNeg(parsed.estimatedGrams) && parsed.estimatedGrams > 0 && parsed.estimatedGrams < 1500;
    const macroOk = m && isFiniteNonNeg(m.p) && isFiniteNonNeg(m.c) && isFiniteNonNeg(m.f) && (m.b === void 0 || isFiniteNonNeg(m.b)) && isFiniteNonNeg(m.k);
    if (!gramsOk || !macroOk) {
      console.error("tier3 estimate failed validation", parsed);
      return { ok: false, error: "implausible LLM macro estimate" };
    }
    const kcalFromMacros = m.p * 4 + m.c * 4 + m.f * 9;
    const kcalPlausible = m.k === 0 || kcalFromMacros > 0 && Math.abs(m.k - kcalFromMacros) / Math.max(m.k, kcalFromMacros) < 0.5;
    if (!kcalPlausible) {
      console.error("tier3 estimate failed kcal cross-check", parsed);
      return { ok: false, error: "implausible LLM macro estimate (kcal mismatch)" };
    }
    return {
      ok: true,
      canonicalName: parsed.canonicalName || query,
      macroPer100g: { p: m.p, c: m.c, f: m.f, b: m.b || 0, k: m.k },
      estimatedGrams: parsed.estimatedGrams
    };
  } catch (e) {
    console.error("tier3EstimateMacro threw", e);
    return { ok: false, error: "Groq request failed: " + e.message };
  }
}
__name(tier3EstimateMacro, "tier3EstimateMacro");
var USDA_NUTRIENT_IDS = { protein: 1003, fat: 1004, carbs: 1005, fiber: 1079, energy: 1008 };
var USDA_DATATYPE_PRIORITY = ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"];
function usdaNormalizeForScore(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}
__name(usdaNormalizeForScore, "usdaNormalizeForScore");
function usdaRelevanceScore(query, description) {
  const qTokens = new Set(usdaNormalizeForScore(query).filter((w) => w.length >= 3));
  const dTokens = new Set(usdaNormalizeForScore(description));
  if (!qTokens.size) return 0;
  let overlap = 0;
  for (const t of qTokens) if (dTokens.has(t)) overlap++;
  return overlap / qTokens.size;
}
__name(usdaRelevanceScore, "usdaRelevanceScore");
var USDA_RELEVANCE_MIN_SCORE = 0.34;
function usdaPickBestResult(foods, query) {
  if (!Array.isArray(foods) || !foods.length) return null;
  const scored = foods.map((f) => ({ food: f, score: usdaRelevanceScore(query, f.description) })).filter((x) => x.score >= USDA_RELEVANCE_MIN_SCORE);
  if (!scored.length) return null;
  for (const dt of USDA_DATATYPE_PRIORITY) {
    const match = scored.find((x) => x.food.dataType === dt);
    if (match) return match.food;
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0].food;
}
__name(usdaPickBestResult, "usdaPickBestResult");
function usdaExtractPer100g(food) {
  const arr = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
  const get = /* @__PURE__ */ __name((nutrientId) => {
    const entry = arr.find((n) => n.nutrientId === nutrientId || n.nutrientNumber === String(nutrientId));
    return entry && typeof entry.value === "number" ? entry.value : null;
  }, "get");
  const p = get(USDA_NUTRIENT_IDS.protein);
  const c = get(USDA_NUTRIENT_IDS.carbs);
  const f = get(USDA_NUTRIENT_IDS.fat);
  const b = get(USDA_NUTRIENT_IDS.fiber);
  const k = get(USDA_NUTRIENT_IDS.energy);
  return { p, c, f, b, k };
}
__name(usdaExtractPer100g, "usdaExtractPer100g");
async function usdaSearchRaw(env, query) {
  const apiKey = env.USDA_API_KEY || "DEMO_KEY";
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("usda search http error", res.status, errText);
    return null;
  }
  const data = await res.json();
  const best = usdaPickBestResult(data.foods, query);
  if (!best) return null;
  const per100g = usdaExtractPer100g(best);
  const isNum = /* @__PURE__ */ __name((n) => typeof n === "number" && Number.isFinite(n), "isNum");
  if (!isNum(per100g.p) || !isNum(per100g.c) || !isNum(per100g.f) || !isNum(per100g.k)) return null;
  return { name: best.description || query, per100g };
}
__name(usdaSearchRaw, "usdaSearchRaw");
var COMPOSITE_DISH_HINTS = [
  "\u0643\u0634\u0631\u064A",
  "koshary",
  "kushari",
  "kosheri",
  "\u0643\u0628\u0633\u0629",
  "kabsa",
  "kabseh",
  "\u0645\u0646\u062F\u064A",
  "mandi",
  "\u0645\u0644\u0648\u062E\u064A\u0629",
  "molokhia",
  "molokheya",
  "\u0641\u062A\u0629",
  "fatta",
  "fattah",
  "\u0628\u064A\u062A\u0632\u0627",
  "pizza",
  "\u0633\u0627\u0646\u062F\u0648\u062A\u0634",
  "sandwich",
  "\u0633\u0627\u0646\u062F\u0648\u064A\u062A\u0634",
  "\u0628\u0631\u062C\u0631",
  "burger"
];
var EXCLUSION_RE = /بدون|من غير|without\b|\bno\s+\w/i;
function needsDecomposition(query) {
  const low = query.toLowerCase();
  if (EXCLUSION_RE.test(low)) return true;
  return COMPOSITE_DISH_HINTS.some((hint) => low.includes(hint));
}
__name(needsDecomposition, "needsDecomposition");
async function decomposeDish(env, query) {
  if (!env.GROQ_API_KEY) return null;
  const sys = `You decompose a food description into its raw component ingredients with estimated gram weights, for a nutrition lookup pipeline that will fetch REAL macro data per ingredient from the USDA database \u2014 you are a parser, NOT a nutrition estimator, so never include any macro/calorie numbers yourself.

The description may be Arabic (including dialect/regional dish names) and may include exclusions ("\u0628\u062F\u0648\u0646", "\u0645\u0646 \u063A\u064A\u0631", "without", "no X") that must be OMITTED from your ingredient list entirely.

Respond with ONLY a raw JSON object, nothing else \u2014 no markdown fences, no explanation:
{"dishNameAr":"<the dish's name in Arabic, for display>","ingredients":[{"food":"<standardized English ingredient name, USDA-searchable, e.g. 'cooked white rice'>","grams":<number>}]}

Rules:
- Use standard/typical ingredient ratios for the named dish's usual home or restaurant preparation.
- Every ingredient name must be a plain, generic, USDA-searchable English food term \u2014 no brand names, no dish names, no compound descriptions.
- Grams must be realistic component weights for a single serving (a full dish typically decomposes into 3-6 components each well under 500g).
- Honor every exclusion in the original description by leaving that ingredient out entirely \u2014 do not substitute it with something else unless the user's phrasing implies a substitution.
- If the description doesn't actually name an identifiable composite dish, respond with {"error":"<short explanation>"} instead.`;
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 500,
        messages: [{ role: "system", content: sys }, { role: "user", content: query }]
      })
    });
    const data = await groqRes.json();
    if (!groqRes.ok) {
      console.error("decomposeDish groq error", data?.error?.message);
      return null;
    }
    let raw = (data?.choices?.[0]?.message?.content || "").trim().replace(/^```json\s*|```$/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (parsed.error) {
      console.error("decomposeDish declined", parsed.error);
      return null;
    }
    if (!Array.isArray(parsed.ingredients) || !parsed.ingredients.length) return null;
    const isFiniteNonNeg = /* @__PURE__ */ __name((n) => typeof n === "number" && Number.isFinite(n) && n >= 0, "isFiniteNonNeg");
    const clean = parsed.ingredients.filter((it) => it && typeof it.food === "string" && it.food.trim() && isFiniteNonNeg(it.grams) && it.grams > 0 && it.grams < 1500);
    if (!clean.length) return null;
    return { dishNameAr: parsed.dishNameAr || query, ingredients: clean };
  } catch (e) {
    console.error("decomposeDish threw", e);
    return null;
  }
}
__name(decomposeDish, "decomposeDish");
async function translateToArabic(env, englishName) {
  if (!env.GROQ_API_KEY) return null;
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 30,
        messages: [
          { role: "system", content: "Translate the given food name into short, natural Arabic. Respond with ONLY the Arabic translation, nothing else \u2014 no quotes, no explanation." },
          { role: "user", content: englishName }
        ]
      })
    });
    const data = await groqRes.json();
    if (!groqRes.ok) return null;
    const ar = (data?.choices?.[0]?.message?.content || "").trim();
    return ar || null;
  } catch (e) {
    console.error("translateToArabic threw", e);
    return null;
  }
}
__name(translateToArabic, "translateToArabic");
async function usdaNormalizeAndRetry(env, originalQuery) {
  if (!env.GROQ_API_KEY) return null;
  const sys = `You convert a food description (possibly Arabic, possibly informal/dialect, possibly with a quantity) into a short, standardized ENGLISH search query suitable for the USDA FoodData Central database. Respond with ONLY the search string, nothing else \u2014 no quotes, no explanation, no markdown. Keep any quantity/unit if present (e.g. "150 \u062C\u0631\u0627\u0645 \u062F\u062C\u0627\u062C \u0645\u0634\u0648\u064A" -> "150g grilled chicken breast"). If the description names a regional/home-cooked dish that has no direct USDA equivalent (e.g. \u0643\u0634\u0631\u064A), respond with the closest generic USDA-searchable component or dish name in English rather than inventing one.`;
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 60,
        messages: [{ role: "system", content: sys }, { role: "user", content: originalQuery }]
      })
    });
    const data = await groqRes.json();
    if (!groqRes.ok) {
      console.error("usda normalize groq error", data?.error?.message);
      return null;
    }
    const normalized = (data?.choices?.[0]?.message?.content || "").trim();
    if (!normalized) return null;
    return await usdaSearchRaw(env, normalized);
  } catch (e) {
    console.error("usdaNormalizeAndRetry threw", e);
    return null;
  }
}
__name(usdaNormalizeAndRetry, "usdaNormalizeAndRetry");
async function usdaLookupFood(env, query, requestedGrams) {
  if (needsDecomposition(query)) {
    const decomposed = await decomposeDish(env, query);
    if (decomposed) {
      const total = { p: 0, c: 0, f: 0, b: 0, k: 0 };
      let anyIngredientMatched = false;
      for (const ing of decomposed.ingredients) {
        const ingResult = await usdaSearchRaw(env, ing.food) || await usdaNormalizeAndRetry(env, ing.food);
        if (!ingResult) {
          console.error("decomposition ingredient had no USDA match, skipping", ing.food);
          continue;
        }
        const scale2 = ing.grams / 100;
        total.p += ingResult.per100g.p * scale2;
        total.c += ingResult.per100g.c * scale2;
        total.f += ingResult.per100g.f * scale2;
        total.b += (ingResult.per100g.b || 0) * scale2;
        total.k += ingResult.per100g.k * scale2;
        anyIngredientMatched = true;
      }
      if (anyIngredientMatched) {
        const totalGrams = decomposed.ingredients.reduce((s, i2) => s + i2.grams, 0);
        return {
          name: decomposed.dishNameAr,
          // already Arabic — decomposeDish asked Groq for dishNameAr directly, no separate translation call needed
          name_ar: decomposed.dishNameAr,
          protein_g: total.p,
          carbohydrates_total_g: total.c,
          fat_total_g: total.f,
          fiber_g: total.b,
          calories: total.k,
          serving_size_g: totalGrams
        };
      }
    }
  }
  let result = await usdaSearchRaw(env, query);
  if (!result) {
    result = await usdaNormalizeAndRetry(env, query);
  }
  if (!result) return null;
  let nameAr = null;
  if (/[\u0600-\u06FF]/.test(query)) {
    nameAr = await translateToArabic(env, result.name);
  }
  const grams = typeof requestedGrams === "number" && requestedGrams > 0 ? requestedGrams : 100;
  const scale = grams / 100;
  return {
    name: result.name,
    name_ar: nameAr,
    protein_g: result.per100g.p * scale,
    carbohydrates_total_g: result.per100g.c * scale,
    fat_total_g: result.per100g.f * scale,
    fiber_g: (result.per100g.b || 0) * scale,
    calories: result.per100g.k * scale,
    serving_size_g: grams
  };
}
__name(usdaLookupFood, "usdaLookupFood");
async function handleNutritionLookup(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const origin = request.headers.get("Origin") || "";
  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return json({ error: "Origin not allowed" }, 403);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  let queries, cacheKeys, cacheGrams;
  if (Array.isArray(body.items) && body.items.length) {
    queries = body.items.map((it) => `${it.qty} ${it.unit} ${it.food}`.trim());
    cacheKeys = body.items.map((it) => normalizeFoodKey(it.food));
    cacheGrams = body.items.map((it) => {
      const unit = String(it.unit || "").trim().toLowerCase();
      const qty = parseFloat(it.qty);
      if (!Number.isFinite(qty) || qty <= 0) return null;
      if (unit === "g" || unit === "gram" || unit === "grams" || unit === "\u062C\u0645" || unit === "\u062C\u0631\u0627\u0645") return qty;
      return null;
    });
  } else if (body.query && String(body.query).trim()) {
    queries = [String(body.query).trim()];
    cacheKeys = [normalizeFoodKey(body.query)];
    cacheGrams = [null];
  } else {
    return json({ error: "items or query required" }, 400);
  }
  try {
    const macro = { p: 0, c: 0, f: 0, b: 0, k: 0 };
    const items = [];
    let anyMatched = false;
    const tier3Candidates = [];
    for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];
      const cacheKey = cacheKeys[qi];
      const grams = cacheGrams[qi];
      if (cacheKey && grams) {
        try {
          const cached = await firestoreGetFood(env, cacheKey);
          if (cached && cached.macroPer100g) {
            const m = cached.macroPer100g;
            const isNum = /* @__PURE__ */ __name((n) => typeof n === "number" && Number.isFinite(n), "isNum");
            if (isNum(m.p) && isNum(m.c) && isNum(m.f) && isNum(m.k)) {
              const scale = grams / 100;
              const sp = m.p * scale, sc = m.c * scale, sf = m.f * scale, sb = (m.b || 0) * scale, sk = m.k * scale;
              macro.p += sp;
              macro.c += sc;
              macro.f += sf;
              macro.b += sb;
              macro.k += sk;
              items.push({
                name: cached.canonicalName || q,
                name_ar: cached.canonicalNameAr || null,
                qty: grams,
                unit: "g",
                kcal: Math.round(sk),
                protein: Math.round(sp * 10) / 10,
                carbs: Math.round(sc * 10) / 10,
                fat: Math.round(sf * 10) / 10,
                fiber: Math.round(sb * 10) / 10,
                rejected: false,
                source: cached.source || "cache"
              });
              anyMatched = true;
              firestoreSetFood(env, cacheKey, { usageCount: (cached.usageCount || 0) + 1, updatedAt: Date.now() }).catch((e) => console.error("usageCount bump failed", e));
              continue;
            }
          }
        } catch (e) {
          console.error("foods cache lookup failed, falling through to API Ninjas", e);
        }
      }
      const cacheGramsForQi = cacheGrams[qi];
      let foods;
      try {
        const usdaFood = await usdaLookupFood(env, q, cacheGramsForQi);
        foods = usdaFood ? [usdaFood] : null;
      } catch (e) {
        console.error("usda lookup threw", e);
        foods = null;
      }
      if (!foods || !foods.length) {
        tier3Candidates.push({ qi, q, cacheKey });
        continue;
      }
      let hadValidMatch = false;
      for (const food of foods) {
        const isFiniteNonNeg = /* @__PURE__ */ __name((n) => typeof n === "number" && Number.isFinite(n) && n >= 0, "isFiniteNonNeg");
        const p = food.protein_g, c = food.carbohydrates_total_g, f = food.fat_total_g, b = food.fiber_g, k = food.calories, servingG = food.serving_size_g;
        const fieldsValid = isFiniteNonNeg(p) && isFiniteNonNeg(c) && isFiniteNonNeg(f) && (b === void 0 || isFiniteNonNeg(b)) && isFiniteNonNeg(k) && (servingG === void 0 || isFiniteNonNeg(servingG) && servingG < 1500);
        const kcalFromMacros = p * 4 + c * 4 + f * 9;
        const kcalPlausible = k === 0 || kcalFromMacros > 0 && Math.abs(k - kcalFromMacros) / Math.max(k, kcalFromMacros) < 0.5;
        if (!fieldsValid || !kcalPlausible) {
          console.error("nutrition item failed validation, skipping", { query: q, food });
          items.push({
            name: food.name || q,
            qty: servingG,
            unit: "g",
            kcal: null,
            rejected: true,
            rejectReason: !fieldsValid ? "implausible_serving_or_field" : "kcal_macro_mismatch"
          });
          continue;
        }
        hadValidMatch = true;
        macro.p += p;
        macro.c += c;
        macro.f += f;
        macro.b += b || 0;
        macro.k += k;
        items.push({
          name: food.name,
          name_ar: food.name_ar || null,
          qty: servingG,
          unit: "g",
          kcal: Math.round(k),
          protein: Math.round(p * 10) / 10,
          carbs: Math.round(c * 10) / 10,
          fat: Math.round(f * 10) / 10,
          fiber: Math.round((b || 0) * 10) / 10,
          rejected: false
        });
        anyMatched = true;
        if (cacheKey && servingG > 0) {
          const scale = 100 / servingG;
          firestoreSetFood(env, cacheKey, {
            canonicalName: food.name || q,
            canonicalNameAr: food.name_ar || null,
            normalizedKey: cacheKey,
            macroPer100g: {
              p: Math.round(p * scale * 10) / 10,
              c: Math.round(c * scale * 10) / 10,
              f: Math.round(f * scale * 10) / 10,
              b: Math.round((b || 0) * scale * 10) / 10,
              k: Math.round(k * scale * 10) / 10
            },
            source: "external_api_cache",
            confidence: "medium",
            usageCount: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }).catch((e) => console.error("write-back cache failed", e));
        }
      }
      if (!hadValidMatch) {
        tier3Candidates.push({ qi, q, cacheKey });
      }
    }
    for (const cand of tier3Candidates) {
      const est = await tier3EstimateMacro(env, cand.q);
      if (!est.ok) {
        console.error("tier3 miss for", cand.q, est.error);
        continue;
      }
      const scale = est.estimatedGrams / 100;
      const sp = est.macroPer100g.p * scale, sc = est.macroPer100g.c * scale, sf = est.macroPer100g.f * scale, sb = est.macroPer100g.b * scale, sk = est.macroPer100g.k * scale;
      macro.p += sp;
      macro.c += sc;
      macro.f += sf;
      macro.b += sb;
      macro.k += sk;
      items.push({
        name: est.canonicalName,
        qty: Math.round(est.estimatedGrams),
        unit: "g",
        kcal: Math.round(sk),
        protein: Math.round(sp * 10) / 10,
        carbs: Math.round(sc * 10) / 10,
        fat: Math.round(sf * 10) / 10,
        fiber: Math.round(sb * 10) / 10,
        rejected: false,
        source: "ai_estimate",
        estimated: true
        // client can show the existing "تقريبي" badge off this flag
      });
      anyMatched = true;
      if (cand.cacheKey) {
        firestoreSetFood(env, cand.cacheKey, {
          canonicalName: est.canonicalName,
          normalizedKey: cand.cacheKey,
          macroPer100g: {
            p: Math.round(est.macroPer100g.p * 10) / 10,
            c: Math.round(est.macroPer100g.c * 10) / 10,
            f: Math.round(est.macroPer100g.f * 10) / 10,
            b: Math.round(est.macroPer100g.b * 10) / 10,
            k: Math.round(est.macroPer100g.k * 10) / 10
          },
          source: "ai_estimate",
          confidence: "low",
          usageCount: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }).catch((e) => console.error("tier3 write-back cache failed", e));
      }
    }
    if (!anyMatched) {
      return json({ error: "No matching foods found" }, 404);
    }
    const anyRejected = items.some((it) => it.rejected);
    const r1 = /* @__PURE__ */ __name((n) => Math.round(n * 10) / 10, "r1");
    return json({
      macro: { p: r1(macro.p), c: r1(macro.c), f: r1(macro.f), b: r1(macro.b), k: r1(macro.k) },
      items,
      anyRejected
    });
  } catch (e) {
    console.error("nutrition lookup request failed", e);
    return json({ error: "Upstream nutrition request failed: " + e.message }, 502);
  }
}
__name(handleNutritionLookup, "handleNutritionLookup");
async function handleSaveSubscription(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const origin = request.headers.get("Origin") || "";
  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return json({ error: "Origin not allowed" }, 403);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const { uid, subscription, reminders } = body;
  if (!uid || typeof uid !== "string") return json({ error: "uid required" }, 400);
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return json({ error: "valid subscription required" }, 400);
  }
  if (!Array.isArray(reminders)) return json({ error: "reminders array required" }, 400);
  const now = Date.now();
  try {
    await env.DB.prepare(
      `INSERT INTO push_subscriptions (user_uid, endpoint, p256dh, auth, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_uid=excluded.user_uid, p256dh=excluded.p256dh, auth=excluded.auth`
    ).bind(uid, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, now).run();
    const dates = [...new Set(reminders.map((r) => r.date))];
    for (const d of dates) {
      await env.DB.prepare(
        `DELETE FROM scheduled_reminders WHERE user_uid = ? AND fire_date = ? AND fired = 0`
      ).bind(uid, d).run();
    }
    if (reminders.length) {
      const stmt = env.DB.prepare(
        `INSERT INTO scheduled_reminders
           (user_uid, task_id, task_name, reminder_type, fire_date, fire_time, fired, created_at)
         SELECT ?, ?, ?, ?, ?, ?, 0, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM scheduled_reminders
           WHERE user_uid = ? AND task_id = ? AND reminder_type = ? AND fire_date = ?
         )`
      );
      const batch = reminders.map(
        (r) => stmt.bind(
          uid,
          r.taskId,
          r.taskName,
          r.type,
          r.date,
          r.time,
          now,
          uid,
          r.taskId,
          r.type,
          r.date
        )
      );
      await env.DB.batch(batch);
    }
    return json({ ok: true, saved: reminders.length });
  } catch (e) {
    console.error("save-subscription failed", e);
    return json({ error: "Database write failed: " + e.message }, 500);
  }
}
__name(handleSaveSubscription, "handleSaveSubscription");
async function dispatchDueReminders(env) {
  const { date, time } = kuwaitNowParts();
  const [nowH, nowM] = time.split(":").map(Number);
  let lookbackH = nowH, lookbackM = nowM - 30;
  if (lookbackM < 0) {
    lookbackM += 60;
    lookbackH -= 1;
  }
  if (lookbackH < 0) {
    lookbackH = 0;
    lookbackM = 0;
  }
  const lookbackTime = `${String(lookbackH).padStart(2, "0")}:${String(lookbackM).padStart(2, "0")}`;
  let due;
  try {
    due = await env.DB.prepare(
      `SELECT * FROM scheduled_reminders
       WHERE fire_date = ? AND fire_time <= ? AND fire_time >= ? AND fired = 0`
    ).bind(date, time, lookbackTime).all();
  } catch (e) {
    console.error("cron: due-reminder query failed", e);
    return;
  }
  const rows = due.results || [];
  if (!rows.length) return;
  const byUser = {};
  for (const r of rows) {
    if (!byUser[r.user_uid]) byUser[r.user_uid] = [];
    byUser[r.user_uid].push(r);
  }
  const vapid = {
    subject: env.VAPID_SUBJECT || "mailto:example@example.com",
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY
  };
  const REMINDER_LABEL = {
    lead: { title: "\u23F3 \u0628\u0639\u062F 30 \u062F\u0642\u064A\u0642\u0629", bodyFn: /* @__PURE__ */ __name((n) => `${n} \u0647\u062A\u0628\u062F\u0623 \u0628\u0639\u062F \u0646\u0635 \u0633\u0627\u0639\u0629`, "bodyFn") },
    start: { title: "\u23F0 \u062D\u0627\u0646 \u0627\u0644\u0648\u0642\u062A", bodyFn: /* @__PURE__ */ __name((n) => `${n} \u2014 \u062F\u0644\u0648\u0642\u062A\u064A`, "bodyFn") },
    ending: { title: "\u231B \u0628\u0627\u0642\u064A \u0663\u0660 \u062F\u0642\u064A\u0642\u0629", bodyFn: /* @__PURE__ */ __name((n) => `${n} \u2014 \u0647\u062A\u062E\u0644\u0635 \u0648\u0642\u062A\u0647\u0627 \u0642\u0631\u064A\u0628`, "bodyFn") }
  };
  for (const uid of Object.keys(byUser)) {
    let subRow;
    try {
      subRow = await env.DB.prepare(
        `SELECT * FROM push_subscriptions WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(uid).first();
    } catch (e) {
      console.error("cron: subscription lookup failed for", uid, e);
      continue;
    }
    if (!subRow) continue;
    const subscription = {
      endpoint: subRow.endpoint,
      keys: { p256dh: subRow.p256dh, auth: subRow.auth }
    };
    for (const reminder of byUser[uid]) {
      const label = REMINDER_LABEL[reminder.reminder_type] || REMINDER_LABEL.start;
      const payload = {
        title: label.title,
        body: label.bodyFn(reminder.task_name),
        tag: `${reminder.task_id}-${reminder.reminder_type}`
      };
      try {
        const { headers, method, body } = await buildPushPayload(
          {
            data: payload,
            options: {
              ttl: 3600,
              // Explicit high urgency, per the original request — this is the correct
              // place for that header, unlike the earlier client-only setTimeout
              // architecture where there was no push request to attach it to at all.
              urgency: "high",
              topic: reminder.task_id
            }
          },
          subscription,
          {
            subject: vapid.subject,
            publicKey: vapid.publicKey,
            privateKey: vapid.privateKey
          }
        );
        const pushRes = await fetch(subscription.endpoint, { method, headers, body });
        if (pushRes.status === 404 || pushRes.status === 410) {
          await env.DB.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).bind(subRow.endpoint).run();
        }
      } catch (e) {
        console.error("cron: push send failed for", reminder.task_id, e);
      }
      try {
        await env.DB.prepare(`UPDATE scheduled_reminders SET fired = 1 WHERE id = ?`).bind(reminder.id).run();
      } catch (e) {
        console.error("cron: failed to mark reminder fired", reminder.id, e);
      }
    }
  }
}
__name(dispatchDueReminders, "dispatchDueReminders");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
