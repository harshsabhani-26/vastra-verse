/**
 * Shiprocket – HTTP Client
 *
 * Centralised Axios instance with:
 * - Token-based authentication via /auth/login
 * - Token cached in Upstash Redis (auto-refresh before expiry)
 * - 10-second request timeout
 * - Exponential-backoff retry (3 attempts, 5xx + network errors only)
 * - Typed error wrapper
 *
 * Staging URL: https://apiv2.shiprocket.in/v1/external
 */

import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";
import { cache } from "@/lib/cache";
import { logError, logInfo } from "@/lib/logger";
import { AuthResponseSchema } from "./types";

// ─── Config ─────────────────────────────────────────────────────────────────

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const SHIPROCKET_BASE_URL =
    process.env.SHIPROCKET_BASE_URL ||
    "https://apiv2.shiprocket.in/v1/external";

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 10_000;
const INITIAL_BACKOFF_MS = 1_000;

// Shiprocket tokens are valid for 10 days; cache for 9 days to be safe
const TOKEN_CACHE_KEY = "shiprocket:auth:token";
const TOKEN_CACHE_TTL_SECONDS = 9 * 24 * 60 * 60; // 9 days

// ─── Error Class ────────────────────────────────────────────────────────────

export class ShiprocketClientError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly rawResponse: unknown;

    constructor(
        message: string,
        status = 500,
        code = "SHIPROCKET_ERROR",
        rawResponse?: unknown
    ) {
        super(message);
        this.name = "ShiprocketClientError";
        this.status = status;
        this.code = code;
        this.rawResponse = rawResponse;
    }
}

// ─── Token Management ───────────────────────────────────────────────────────

/**
 * Authenticate with Shiprocket and return a bearer token.
 * Token is cached in Redis for 9 days (Shiprocket tokens last 10 days).
 */
async function getAuthToken(): Promise<string> {
    // 1. Check Redis cache
    const cachedToken = await cache.get<string>(TOKEN_CACHE_KEY);
    if (cachedToken) {
        return cachedToken;
    }

    // 2. Authenticate via login endpoint
    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
        throw new ShiprocketClientError(
            "SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set",
            500,
            "MISSING_CREDENTIALS"
        );
    }

    logInfo("SHIPROCKET", "Authenticating with Shiprocket API");

    try {
        const response = await axios.post(
            `${SHIPROCKET_BASE_URL}/auth/login`,
            {
                email: SHIPROCKET_EMAIL,
                password: SHIPROCKET_PASSWORD,
            },
            { timeout: REQUEST_TIMEOUT_MS }
        );

        const parsed = AuthResponseSchema.parse(response.data);
        const token = parsed.token;

        // 3. Cache token in Redis
        await cache.set(TOKEN_CACHE_KEY, token, TOKEN_CACHE_TTL_SECONDS);

        logInfo("SHIPROCKET", "Authentication successful", {
            email: SHIPROCKET_EMAIL,
            companyId: parsed.company_id,
        });

        return token;
    } catch (err) {
        if (err instanceof ShiprocketClientError) throw err;

        const axiosErr = err as AxiosError;
        const responseData = axiosErr.response?.data as Record<string, unknown> | undefined;
        throw new ShiprocketClientError(
            (responseData?.message as string) || "Authentication failed",
            axiosErr.response?.status || 500,
            "AUTH_FAILED",
            responseData
        );
    }
}

/**
 * Invalidate the cached token (e.g. on 401 response).
 */
async function invalidateToken(): Promise<void> {
    await cache.del(TOKEN_CACHE_KEY);
    logInfo("SHIPROCKET", "Auth token invalidated");
}

// ─── Retry helpers ──────────────────────────────────────────────────────────

function isRetryable(error: AxiosError): boolean {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 && status < 600;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Client Factory ─────────────────────────────────────────────────────────

function createShiprocketClient(token: string): AxiosInstance {
    const client = axios.create({
        baseURL: SHIPROCKET_BASE_URL,
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });

    // ── Request interceptor (logging) ──
    client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            logInfo("SHIPROCKET", `${config.method?.toUpperCase()} ${config.url}`);
            return config;
        },
        (error: AxiosError) => {
            logError("SHIPROCKET", error, { phase: "request_setup" });
            return Promise.reject(error);
        }
    );

    // ── Response interceptor (logging) ──
    client.interceptors.response.use(
        (response: AxiosResponse) => {
            logInfo("SHIPROCKET", `Response ${response.status} from ${response.config.url}`);
            return response;
        },
        (error: AxiosError) => {
            logError("SHIPROCKET", error, {
                status: error.response?.status,
                url: error.config?.url,
            });
            return Promise.reject(error);
        }
    );

    return client;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Execute a GET request against the Shiprocket API with automatic retries.
 */
export async function shiprocketGet<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    return executeWithRetry<T>("GET", url, undefined, config);
}

/**
 * Execute a POST request against the Shiprocket API with automatic retries.
 */
export async function shiprocketPost<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> {
    return executeWithRetry<T>("POST", url, data, config);
}

/**
 * Execute a PATCH request against the Shiprocket API with automatic retries.
 */
export async function shiprocketPatch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> {
    return executeWithRetry<T>("PATCH", url, data, config);
}

// ─── Retry Engine ───────────────────────────────────────────────────────────

async function executeWithRetry<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> {
    let lastError: AxiosError | Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            // Get fresh token for each retry to handle 401 refresh
            const token = await getAuthToken();
            const client = createShiprocketClient(token);

            let response: AxiosResponse<T>;
            switch (method) {
                case "GET":
                    response = await client.get<T>(url, config);
                    break;
                case "POST":
                    response = await client.post<T>(url, data, config);
                    break;
                case "PATCH":
                    response = await client.patch<T>(url, data, config);
                    break;
                default:
                    response = await client.request<T>({ method, url, data, ...config });
            }

            return response.data;
        } catch (err) {
            lastError = err as AxiosError;

            // On 401 Unauthorized, invalidate token and retry
            if (err instanceof AxiosError && err.response?.status === 401 && attempt < MAX_RETRIES - 1) {
                await invalidateToken();
                logInfo("SHIPROCKET", `Token expired, re-authenticating (attempt ${attempt + 1})`);
                continue;
            }

            if (err instanceof AxiosError && isRetryable(err) && attempt < MAX_RETRIES - 1) {
                const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                logInfo("SHIPROCKET", `Retrying request (attempt ${attempt + 1})`, {
                    backoffMs,
                    url,
                });
                await sleep(backoffMs);
                continue;
            }

            break;
        }
    }

    throw handleAxiosError(lastError!);
}

// ─── Error Handler ──────────────────────────────────────────────────────────

function handleAxiosError(error: Error | AxiosError): ShiprocketClientError {
    if (error instanceof AxiosError) {
        const status = error.response?.status || 500;
        const responseData = error.response?.data as Record<string, unknown> | undefined;
        const message =
            (responseData?.message as string) ||
            (responseData?.error as string) ||
            error.message ||
            "Unknown Shiprocket API error";

        const code =
            error.code === "ECONNABORTED"
                ? "TIMEOUT"
                : error.code === "ERR_NETWORK"
                    ? "NETWORK_ERROR"
                    : `HTTP_${status}`;

        return new ShiprocketClientError(message, status, code, responseData);
    }

    return new ShiprocketClientError(
        error.message || "Unknown error",
        500,
        "UNKNOWN"
    );
}
