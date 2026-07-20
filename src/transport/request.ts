import { type Logger, NULL_LOGGER, safeCallback } from '../logger';
import {
  CTSError,
  HttpResponseError,
  NetworkError,
  MintOperationError,
  RateLimitError,
} from '../model/Errors';
import { type Nut19Policy } from '../model/types';
import { JSONInt } from '../utils/JSONInt';

// Generic request function type so callers can do requestInstance<T>(...)
export type RequestFn = <T = unknown>(args: RequestOptions) => Promise<T>;

/**
 * Subset of globalThis used by {@link detectBrowserLike}; loosened for unit tests.
 *
 * @internal
 */
export type GlobalLike = {
  window?: { document?: unknown };
  self?: unknown;
  WorkerGlobalScope?: { new (): unknown };
};

/**
 * True in browser main thread + any Worker scope (classic/module/shared/service via
 * `WorkerGlobalScope`).
 *
 * @internal
 */
export function detectBrowserLike(g: GlobalLike): boolean {
  if (g.window !== undefined && g.window.document !== undefined) return true;
  return (
    g.WorkerGlobalScope !== undefined &&
    g.self !== undefined &&
    g.self instanceof g.WorkerGlobalScope
  );
}

const IS_BROWSER_LIKE = detectBrowserLike(globalThis);

/**
 * Builds the outgoing request headers.
 *
 * @remarks
 * Overrides the default User-Agent in non-browser runtimes (Node, Deno, Bun, React Native) where
 * native HTTP stacks otherwise leak fingerprintable identifiers (undici, NSURLSession, OkHttp).
 * Skipped in browsers + workers because Firefox/WebKit can promote it to a CORS preflight even
 * though the Fetch spec lists it as a forbidden header. Caller-supplied `requestHeaders` always
 * wins.
 * @internal
 */
export function buildRequestHeaders(
  body: string | undefined,
  requestHeaders: Record<string, string> | undefined,
  isBrowserLike: boolean = IS_BROWSER_LIKE,
): Record<string, string> {
  return {
    Accept: 'application/json, text/plain, */*',
    ...(body ? { 'Content-Type': 'application/json' } : undefined),
    ...(isBrowserLike ? undefined : { 'User-Agent': 'Mozilla/5.0' }),
    ...requestHeaders,
  };
}

/**
 * Returns `err.message` when `err` is an Error, otherwise `fallback`.
 *
 * @remarks
 * Real fetch implementations always reject with an Error subclass, but `err` is typed `unknown`
 * inside `catch`, so the fallback protects against pathological polyfills.
 * @internal
 */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export type RequestArgs = {
  endpoint: string;
  requestBody?: Record<string, unknown>;
  headers?: Record<string, string>;
  logger?: Logger;
};

/**
 * Metadata extracted from every HTTP response. When `onResponseMeta` is provided in
 * `RequestOptions`, the callback receives one of these on every response (both successes and
 * errors) before the promise resolves or rejects.
 */
export type ResponseMeta = {
  /**
   * The request endpoint URL. Useful for global callbacks to identify which mint the response came
   * from.
   */
  endpoint: string;
  /**
   * HTTP status code of the response.
   */
  status: number;
  /**
   * Parsed `Retry-After` in ms (via `parseRetryAfter`). Present only when the header exists and is
   * parseable.
   */
  retryAfterMs?: number;
  /**
   * Raw value of the `RateLimit` (or Cloudflare `Ratelimit`) header, if present.
   */
  rateLimit?: string;
  /**
   * Raw value of the `RateLimit-Policy` (or Cloudflare `Ratelimit-Policy`) header, if present.
   */
  rateLimitPolicy?: string;
  /**
   * Full raw response headers.
   */
  headers: Headers;
};

export type ResponseBodyDisposition = 'complete' | 'limit-exceeded' | 'read-failed';

/**
 * Fail-closed accounting metadata emitted exactly once for every HTTP response attempt.
 */
export type ResponseBodyMeta = {
  /**
   * Request endpoint URL.
   */
  endpoint: string;
  /**
   * HTTP status code.
   */
  status: number;
  /**
   * Stable opaque identity shared by all retry attempts for one logical request.
   */
  requestId: string;
  /**
   * One-based HTTP attempt number within the logical request.
   */
  attempt: number;
  /**
   * Exact bytes read from fetch after HTTP content decoding, including the chunk that crossed a
   * configured limit. Zero when a declared Content-Length is rejected before reading.
   */
  decodedBodyBytes: number;
  /**
   * Whether the complete response body was read within the configured limit.
   */
  complete: boolean;
  /**
   * Outcome of reading and bounding the response body.
   */
  disposition: ResponseBodyDisposition;
};

export type RequestOptions = RequestArgs &
  Omit<RequestInit, 'body' | 'headers'> &
  Partial<Nut19Policy> & {
    /**
     * Per-request timeout in milliseconds. If a single fetch hangs longer than this, it is aborted
     * and treated as a NetworkError (triggering retry on cached endpoints). Without this, a hung
     * connection can consume the entire TTL retry window.
     */
    requestTimeout?: number;
    /**
     * Maximum decoded HTTP response-body bytes. The response stream is cancelled before JSON
     * parsing when this limit is exceeded.
     */
    responseBodyBytesLimit?: number;
    /**
     * Optional callback invoked on every HTTP response with structured rate-limit metadata. Fires
     * before the promise resolves (on success) or rejects (on error), so consumers always receive
     * metadata even when the request fails.
     */
    onResponseMeta?: (meta: ResponseMeta) => void;
    /**
     * Synchronous, fail-closed accounting hook invoked exactly once for every HTTP response
     * attempt, including failed and over-limit reads, before JSON parsing or request settlement.
     * Returning a Promise or throwing rejects the request and is never retried.
     */
    onResponseBody?: (meta: ResponseBodyMeta) => void;
  };

/**
 * Cashu api error.
 *
 * - Code: Mint error code.
 * - Detail: Error message or mint-specific payload.
 * - Error: HTTP error message (non NUT-00 response)
 */
export type ApiError = {
  code?: number;
  detail?: unknown;
  error?: string;
};

/**
 * Parses a `Retry-After` header value into milliseconds.
 *
 * Supports both forms defined in RFC 9110 §10.2.3:
 *
 * - **delta-seconds**: an integer number of seconds (e.g. `"30"` → 30 000 ms)
 * - **HTTP-date**: an IMF-fixdate string (e.g. `"Sun, 05 Apr 2026 12:00:00 GMT"`)
 *
 * Returns `undefined` when the header is `null`, empty, or unparseable. Negative delays are clamped
 * to `0`.
 */
export function parseRetryAfter(header: string | null): number | undefined {
  if (header === null) return undefined;

  const header_value = header.trim();
  if (header_value === '') return undefined;

  //delta-seconds (non-negative integer)
  if (/^\d+$/.test(header_value)) {
    return Math.max(Number(header_value) * 1000, 0);
  }

  //HTTP-date (must contain at least one letter, e.g. month name / day name)
  if (/[a-zA-Z]/.test(header_value)) {
    const date = new Date(header_value).getTime();
    if (!Number.isNaN(date)) {
      return Math.max(date - Date.now(), 0);
    }
  }

  return undefined;
}

let globalRequestOptions: Partial<RequestOptions> = {};
let requestLogger = NULL_LOGGER;

/**
 * An object containing any custom settings that you want to apply to the global fetch method.
 *
 * @param options See possible options here:
 *   https://developer.mozilla.org/en-US/docs/Web/API/fetch#options.
 */
export function setGlobalRequestOptions(options: Partial<RequestOptions>): void {
  globalRequestOptions = options;
}

/**
 * Allows a logger to be set.
 *
 * @param {Logger} logger The logger instance to use.
 */
export function setRequestLogger(logger: Logger): void {
  requestLogger = logger;
}

const MAX_CACHED_RETRIES = 9; // 10 requests total
const MAX_DELAY = 1000; // 1 sec
const BASE_DELAY = 100; // 100 ms

class CallerAbortError extends NetworkError {
  constructor(message: string) {
    super(message);
    this.name = 'CallerAbortError';
    Object.setPrototypeOf(this, CallerAbortError.prototype);
  }
}

class ResponseAccountingError extends CTSError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ResponseAccountingError';
    Object.setPrototypeOf(this, ResponseAccountingError.prototype);
  }
}

class ResponseBodyReadError extends CTSError {
  constructor(
    message: string,
    readonly decodedBodyBytes: number,
    readonly disposition: Exclude<ResponseBodyDisposition, 'complete'>,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'ResponseBodyReadError';
    Object.setPrototypeOf(this, ResponseBodyReadError.prototype);
  }
}

type RequestAttemptContext = { requestId: string; attempt: number };
let nextRequestSequence = 0;

function createRequestId(): string {
  nextRequestSequence = (nextRequestSequence % Number.MAX_SAFE_INTEGER) + 1;
  return `cashu-request-${nextRequestSequence}`;
}

/**
 * Returns true if the error warrants a retry on NUT-19 cached endpoints:
 *
 * - NetworkError: network-level failures (DNS, connection refused, AbortError/timeout)
 * - HttpResponseError with 5xx status: server-side transient errors (503, 502, etc.)
 *
 * 4xx errors (including 429 Too Many Requests) are NOT retried — they are bounced back to the
 * caller immediately.
 */
function isRetryableError(e: unknown): boolean {
  if (e instanceof CallerAbortError) return false;
  if (e instanceof NetworkError) return true;
  return e instanceof HttpResponseError && e.status >= 500;
}

function waitWithAbort(delayMs: number, signal?: AbortSignal | null): Promise<void> {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new CallerAbortError('Request aborted by caller'));
      return;
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      reject(new CallerAbortError('Request aborted by caller'));
    };

    signal.addEventListener('abort', onAbort, { once: true });

    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);
  });
}

function getEndpointPathnameSafe(endpoint: string): string | undefined {
  try {
    return new URL(endpoint).pathname;
  } catch {
    if (endpoint.startsWith('/')) {
      return endpoint.split(/[?#]/, 1)[0];
    }
    return undefined;
  }
}

function endpointPathMatchesCachedPath(endpointPath: string, cachedPath: string): boolean {
  if (endpointPath === cachedPath) return true;
  return endpointPath.endsWith(cachedPath);
}

/**
 * Internal function that handles retry logic for NUT-19 cached endpoints. Non-cached endpoints are
 * executed directly without retries.
 */
async function requestWithRetry(options: RequestOptions): Promise<unknown> {
  const { ttl, cached_endpoints, endpoint } = options;
  const endpointPathname = getEndpointPathnameSafe(endpoint);
  const requestMethod = options.method?.toUpperCase() ?? 'GET';

  // there should be at least one cached_endpoint, also ttl is already mapped null->Infinity
  const isCachable =
    endpointPathname !== undefined &&
    cached_endpoints?.some(
      (cached_endpoint) =>
        endpointPathMatchesCachedPath(endpointPathname, cached_endpoint.path) &&
        cached_endpoint.method === requestMethod,
    ) &&
    !!ttl;

  const requestId = createRequestId();
  let attempt = 0;
  const requestAttempt = (): Promise<unknown> =>
    _request(options, { requestId, attempt: ++attempt });

  if (!isCachable) return await requestAttempt();

  let retries = 0;
  const startTime = Date.now();

  const retry = async (): Promise<unknown> => {
    try {
      return await requestAttempt();
    } catch (e) {
      if (isRetryableError(e)) {
        const totalElapsedTime = Date.now() - startTime;
        const shouldRetry = retries < MAX_CACHED_RETRIES && (!ttl || totalElapsedTime < ttl);

        if (shouldRetry) {
          const cappedDelay = Math.min(2 ** retries * BASE_DELAY, MAX_DELAY);

          const delay = Math.random() * cappedDelay;

          if (totalElapsedTime + delay > ttl) {
            requestLogger.error(`Network Error: request abandoned after ${retries} retries`, {
              e,
              retries,
            });
            throw e;
          }
          retries++;
          requestLogger.info(`Network Error: attempting retry ${retries} in ${delay}ms`, {
            e,
            retries,
            delay,
          });

          await waitWithAbort(delay, options.signal);
          return retry();
        }
      }
      requestLogger.error(`Request failed and could not be retried`, { e });
      throw e;
    }
  };
  return retry();
}

/**
 * Anti-fingerprinting: sets fetch RequestInit and privacy-hardened request headers to prevent a
 * mint from tracking clients via browser-managed state (ETags, cookies, referrer).
 *
 * **Mobile (React Native / native HTTP clients):** Mobile runtimes use platform HTTP stacks
 * (NSURLSession on iOS, OkHttp on Android) that manage their own caches independently. Mobile
 * consumers MUST disable HTTP caching at the native layer or provide a `customRequest`
 * implementation (via the Mint constructor) that uses a cache-disabled HTTP client.
 */
async function _request(
  options: RequestOptions,
  attemptContext: RequestAttemptContext,
): Promise<unknown> {
  const {
    endpoint,
    requestBody,
    headers: requestHeaders,
    requestTimeout,
    responseBodyBytesLimit,
    onResponseMeta,
    onResponseBody,
    // consumed by requestWithRetry, excluded from raw fetch options
    cached_endpoints,
    ttl,
    logger,
    ...fetchOptions
  } = options;

  // Intentionally unused vars (extracted from fetchOptions)
  void cached_endpoints;
  void ttl;
  void logger;

  const body = requestBody ? JSONInt.stringify(requestBody) : undefined;
  const headers = buildRequestHeaders(body, requestHeaders);
  const callerSignal = options.signal ?? undefined;
  if (callerSignal?.aborted) {
    throw new CallerAbortError('Request aborted by caller');
  }

  // Construct an AbortController based on timeout, user signal, or both!
  const timeoutController = requestTimeout !== undefined ? new AbortController() : undefined;
  let signal: AbortSignal | undefined = callerSignal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let cleanupAbortListeners: (() => void) | undefined;

  if (timeoutController) {
    timeoutId = setTimeout(() => timeoutController.abort(), requestTimeout);

    if (!callerSignal) {
      signal = timeoutController.signal;
    } else {
      const combinedController = new AbortController();
      const forwardAbort = () => combinedController.abort();
      callerSignal.addEventListener('abort', forwardAbort, { once: true });
      timeoutController.signal.addEventListener('abort', forwardAbort, { once: true });
      cleanupAbortListeners = () => {
        callerSignal.removeEventListener('abort', forwardAbort);
        timeoutController.signal.removeEventListener('abort', forwardAbort);
      };
      signal = combinedController.signal;
    }
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      body,
      headers,
      // Anti-fingerprinting fetch options.
      cache: 'no-store', // prevent cache tracking (eg ETag)
      credentials: 'omit', // prevent cookie-based tracking
      referrer: '', // prevent leaking the embedding page URL
      referrerPolicy: 'no-referrer', // belt-and-braces for referrer across all contexts
      ...fetchOptions, // allows override of above options
      signal, // not overridable (includes caller signal)
    });
  } catch (err) {
    clearTimeout(timeoutId);
    cleanupAbortListeners?.();
    throw normalizeRequestFailure(err, timeoutController, callerSignal, requestTimeout);
  }

  try {
    return await handleResponse(response, {
      endpoint,
      onResponseMeta,
      onResponseBody,
      responseBodyBytesLimit,
      callerSignal,
      timeoutController,
      requestTimeout,
      attemptContext,
    });
  } catch (err) {
    if (err instanceof ResponseAccountingError) throw err;
    if (timeoutController?.signal.aborted || callerSignal?.aborted) {
      throw normalizeRequestFailure(err, timeoutController, callerSignal, requestTimeout);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    cleanupAbortListeners?.();
  }
}

function normalizeRequestFailure(
  err: unknown,
  timeoutController: AbortController | undefined,
  callerSignal: AbortSignal | undefined,
  requestTimeout: number | undefined,
): Error {
  if (timeoutController?.signal.aborted) {
    return new NetworkError(`Request timed out after ${requestTimeout}ms`, { cause: err });
  }
  if (callerSignal?.aborted) {
    return new CallerAbortError(errorMessage(err, 'Request aborted by caller'));
  }
  if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
    return new NetworkError(err.message, { cause: err });
  }
  return new NetworkError(errorMessage(err, 'Network request failed'), { cause: err });
}

async function handleResponse(
  response: Response,
  options: Pick<
    RequestOptions,
    'endpoint' | 'onResponseMeta' | 'onResponseBody' | 'responseBodyBytesLimit'
  > & {
    callerSignal: AbortSignal | undefined;
    timeoutController: AbortController | undefined;
    requestTimeout: number | undefined;
    attemptContext: RequestAttemptContext;
  },
): Promise<unknown> {
  const retryAfterMs = parseRetryAfter(response.headers.get('Retry-After'));
  notifyResponseMeta(response, options.endpoint, retryAfterMs, options.onResponseMeta);

  let body: DecodedResponseBody;
  try {
    body = await readResponseText(response, options.responseBodyBytesLimit);
    notifyResponseBodyMeta(response, options, {
      decodedBodyBytes: body.decodedBodyBytes,
      complete: true,
      disposition: 'complete',
    });
  } catch (err) {
    if (err instanceof ResponseAccountingError) throw err;
    const readError = normalizeResponseBodyReadError(err);
    notifyResponseBodyMeta(response, options, {
      decodedBodyBytes: readError.decodedBodyBytes,
      complete: false,
      disposition: readError.disposition,
    });
    throwIfResponseAborted(options);
    if (!response.ok) {
      return throwHttpResponseError(
        response,
        retryAfterMs,
        undefined,
        readError.cause ?? readError,
      );
    }
    requestLogger.error('Failed to parse HTTP response', { err: readError });
    throw new HttpResponseError('bad response', response.status, { cause: readError });
  }
  throwIfResponseAborted(options);

  if (!response.ok) return throwHttpResponseError(response, retryAfterMs, body.text);
  return parseSuccessResponse(response, body.text);
}

function notifyResponseMeta(
  response: Response,
  endpoint: string,
  retryAfterMs: number | undefined,
  onResponseMeta: ((meta: ResponseMeta) => void) | undefined,
): void {
  if (!onResponseMeta || !response.headers) return;
  safeCallback(
    onResponseMeta,
    {
      endpoint,
      status: response.status,
      retryAfterMs,
      rateLimit: response.headers.get('RateLimit') ?? undefined,
      rateLimitPolicy: response.headers.get('RateLimit-Policy') ?? undefined,
      headers: response.headers,
    },
    requestLogger,
    { op: 'request.onResponseMeta', status: response.status, endpoint },
  );
}

function notifyResponseBodyMeta(
  response: Response,
  options: Pick<RequestOptions, 'endpoint' | 'onResponseBody'> & {
    attemptContext: RequestAttemptContext;
  },
  outcome: Pick<ResponseBodyMeta, 'decodedBodyBytes' | 'complete' | 'disposition'>,
): void {
  options.onResponseBody?.({
    endpoint: options.endpoint,
    status: response.status,
    requestId: options.attemptContext.requestId,
    attempt: options.attemptContext.attempt,
    ...outcome,
  });
}

function throwIfResponseAborted(options: {
  callerSignal: AbortSignal | undefined;
  timeoutController: AbortController | undefined;
  requestTimeout: number | undefined;
}): void {
  if (options.timeoutController?.signal.aborted) {
    throw new NetworkError(`Request timed out after ${options.requestTimeout}ms`);
  }
  if (options.callerSignal?.aborted) throw new CallerAbortError('Request aborted by caller');
}

function throwHttpResponseError(
  response: Response,
  retryAfterMs: number | undefined,
  bodyText: string | undefined,
  errorDataCause?: unknown,
): never {
  const errorData: ApiError =
    bodyText === undefined ? { error: 'bad response' } : parseErrorBody(bodyText);
  if (response.status === 429) throw new RateLimitError('429 Too Many Requests', retryAfterMs);
  if (
    response.status === 400 &&
    typeof errorData.code === 'number' &&
    typeof errorData.detail === 'string'
  ) {
    throw new MintOperationError(errorData.code, errorData.detail);
  }
  const message =
    typeof errorData.error === 'string'
      ? errorData.error
      : typeof errorData.detail === 'string'
        ? errorData.detail
        : 'HTTP request failed';
  throw new HttpResponseError(message, response.status, { cause: errorDataCause });
}

function parseSuccessResponse(response: Response, bodyText: string): unknown {
  try {
    if (!bodyText) throw new CTSError('Empty response body');
    return JSONInt.parse(bodyText);
  } catch (err) {
    requestLogger.error('Failed to parse HTTP response', { err });
    throw new HttpResponseError('bad response', response.status, { cause: err });
  }
}

type DecodedResponseBody = { text: string; decodedBodyBytes: number };

function normalizeResponseBodyReadError(err: unknown): ResponseBodyReadError {
  if (err instanceof ResponseBodyReadError) return err;
  return new ResponseBodyReadError('Failed to read response body', 0, 'read-failed', {
    cause: err,
  });
}

async function readResponseText(
  response: Response,
  maximumBytes?: number,
): Promise<DecodedResponseBody> {
  if (maximumBytes !== undefined && (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1)) {
    throw new ResponseBodyReadError('Response body byte limit is invalid', 0, 'read-failed');
  }
  const contentLength = response.headers.get('Content-Length');
  if (
    maximumBytes !== undefined &&
    contentLength !== null &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > maximumBytes
  ) {
    void response.body?.cancel().catch(() => undefined);
    throw new ResponseBodyReadError(
      'Response body exceeds configured byte limit',
      0,
      'limit-exceeded',
    );
  }
  if (!response.body) {
    let text: string;
    try {
      text = await response.text();
    } catch (err) {
      throw new ResponseBodyReadError('Failed to read response body', 0, 'read-failed', {
        cause: err,
      });
    }
    const decodedBodyBytes = new TextEncoder().encode(text).byteLength;
    if (maximumBytes !== undefined && decodedBodyBytes > maximumBytes) {
      throw new ResponseBodyReadError(
        'Response body exceeds configured byte limit',
        decodedBodyBytes,
        'limit-exceeded',
      );
    }
    return { text, decodedBodyBytes };
  }
  return readResponseStream(response.body, maximumBytes);
}

async function readResponseStream(
  body: NonNullable<Response['body']>,
  maximumBytes?: number,
): Promise<DecodedResponseBody> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (maximumBytes !== undefined && totalBytes > maximumBytes) {
        void reader.cancel().catch(() => undefined);
        throw new ResponseBodyReadError(
          'Response body exceeds configured byte limit',
          totalBytes,
          'limit-exceeded',
        );
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return { text: chunks.join(''), decodedBodyBytes: totalBytes };
  } catch (err) {
    if (err instanceof ResponseBodyReadError) throw err;
    throw new ResponseBodyReadError('Failed to read response body', totalBytes, 'read-failed', {
      cause: err,
    });
  } finally {
    reader.releaseLock();
  }
}

/**
 * Try extract a normalized error message.
 */
function parseErrorBody(errorText: string): ApiError {
  if (!errorText) return { detail: 'bad response' };
  let parsed: unknown;
  try {
    parsed = JSONInt.parse(errorText);
  } catch {
    return { detail: errorText };
  }
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    ('detail' in parsed || 'code' in parsed || 'error' in parsed)
  ) {
    return parsed as ApiError;
  }
  return { detail: parsed };
}

/**
 * Performs HTTP request with exponential backoff retry for NUT-19 cached endpoints. Retries occur
 * for network errors and 5xx responses on endpoints specified in cached_endpoints. 4xx errors
 * (including 429 Too Many Requests) are not retried. Nut19Policy for a given endpoint should be
 * provided as Nut19Policy object fetched from MintInfo. Regular requests are made for non-cached
 * endpoints without retry logic.
 */
export default async function request<T>(options: RequestOptions): Promise<T> {
  const perRequest = options.onResponseMeta;
  const globalMeta = globalRequestOptions.onResponseMeta;
  const perRequestBody = options.onResponseBody;
  const globalBody = globalRequestOptions.onResponseBody;
  const merged: RequestOptions = { ...options, ...globalRequestOptions };
  merged.requestTimeout = minimumPositiveBound(
    options.requestTimeout,
    globalRequestOptions.requestTimeout,
  );
  merged.responseBodyBytesLimit = minimumDefinedBound(
    options.responseBodyBytesLimit,
    globalRequestOptions.responseBodyBytesLimit,
  );
  merged.signal = options.signal ?? globalRequestOptions.signal;

  // Default: per-request callback only
  if (perRequest) merged.onResponseMeta = perRequest;

  // Both set: wrap in safeCallback so a throw in one doesn't prevent the other from firing.
  if (perRequest && globalMeta && perRequest !== globalMeta) {
    merged.onResponseMeta = (meta) => {
      safeCallback(perRequest, meta, requestLogger, {
        op: 'request.onResponseMeta',
        scope: 'per-request',
        endpoint: options.endpoint,
      });
      safeCallback(globalMeta, meta, requestLogger, {
        op: 'request.onResponseMeta',
        scope: 'global',
        endpoint: options.endpoint,
      });
    };
  }

  merged.onResponseBody = composeResponseBodyAccountingHooks(perRequestBody, globalBody);

  const data = await requestWithRetry(merged);
  return data as T;
}

type ResponseBodyAccountingHook = (meta: ResponseBodyMeta) => void;
const responseBodyAccountingHookMembers = new WeakMap<
  ResponseBodyAccountingHook,
  readonly ResponseBodyAccountingHook[]
>();

/**
 * @internal Composes synchronous accounting hooks while preserving the first failure.
 */
export function composeResponseBodyAccountingHooks(
  ...hooks: Array<ResponseBodyAccountingHook | undefined>
): ResponseBodyAccountingHook | undefined {
  const flattenedHooks = hooks.flatMap((hook) =>
    hook ? (responseBodyAccountingHookMembers.get(hook) ?? [hook]) : [],
  );
  const uniqueHooks = [...new Set(flattenedHooks)];
  if (uniqueHooks.length === 0) return undefined;
  const composed = (meta: ResponseBodyMeta): void =>
    invokeResponseBodyAccountingHooks(uniqueHooks, meta);
  responseBodyAccountingHookMembers.set(composed, uniqueHooks);
  return composed;
}

function invokeResponseBodyAccountingHooks(
  hooks: readonly ResponseBodyAccountingHook[],
  meta: ResponseBodyMeta,
): void {
  let firstFailure: unknown;
  for (const hook of hooks) {
    try {
      const result = hook(meta);
      if (
        (typeof result === 'object' && result !== null && 'then' in result) ||
        (typeof result === 'function' && 'then' in result)
      ) {
        void Promise.resolve(result).catch(() => undefined);
        firstFailure ??= new CTSError('Response body accounting callback must be synchronous');
      }
    } catch (err) {
      firstFailure ??= err;
    }
  }
  if (firstFailure !== undefined) {
    const message =
      firstFailure instanceof CTSError && firstFailure.message.includes('must be synchronous')
        ? firstFailure.message
        : 'Response body accounting callback failed';
    throw new ResponseAccountingError(message, { cause: firstFailure });
  }
}

function minimumPositiveBound(
  first: number | undefined,
  second: number | undefined,
): number | undefined {
  const bounds = [first, second].filter(
    (value): value is number => typeof value === 'number' && value > 0,
  );
  return bounds.length === 0 ? undefined : Math.min(...bounds);
}

function minimumDefinedBound(
  first: number | undefined,
  second: number | undefined,
): number | undefined {
  if (first === undefined) return second;
  if (second === undefined) return first;
  return Math.min(first, second);
}
