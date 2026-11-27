/**
 * Minimal MuAPI client (https://api.muapi.ai). Uses the server-wide MUAPI_API_KEY,
 * so every Seedance generation is paid from the app owner's MuAPI balance.
 */

export const MUAPI_BASE_URL = "https://api.muapi.ai/api/v1";

const REQUEST_TIMEOUT_MS = 30_000;

export type MuapiResultStatus = "processing" | "completed" | "failed";

export interface MuapiResult {
  status: MuapiResultStatus;
  videoUrl?: string;
  error?: string;
}

export interface MuapiClient {
  submit: (path: string, body: Record<string, unknown>) => Promise<string>;
  result: (requestId: string) => Promise<MuapiResult>;
  /** USD balance, or null when MuAPI does not say. */
  balanceUsd: () => Promise<number | null>;
}

type FetchLike = typeof fetch;

export function readMuapiApiKey(): string {
  const key = process.env.MUAPI_API_KEY?.trim();
  if (!key) {
    throw new Error("Seedance is not set up on this server (MUAPI_API_KEY is missing).");
  }
  return key;
}

function toNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** Reads a balance from the shapes MuAPI may return ({balance}, {data:{balance}}, {credits}). */
export function parseMuapiBalance(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return toNumber(payload);
  const obj = payload as Record<string, unknown>;
  for (const key of ["balance", "credits", "amount", "available_balance"]) {
    const n = toNumber(obj[key]);
    if (n !== null) return n;
  }
  if (obj.data && typeof obj.data === "object") return parseMuapiBalance(obj.data);
  return null;
}

function describeError(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const detail = obj.message ?? obj.detail ?? obj.error;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return undefined;
}

/** Normalizes a MuAPI prediction payload into processing / completed / failed. */
export function parseMuapiResult(payload: unknown): MuapiResult {
  const root = (payload && typeof payload === "object" ? payload : {}) as Record<string, any>;
  const data: Record<string, any> =
    root.status === undefined && root.data && typeof root.data === "object"
      ? root.data
      : root;
  const status = String(data.status ?? "").toLowerCase();
  const output = data.output;
  const videoUrl: string | undefined =
    (Array.isArray(data.outputs) && typeof data.outputs[0] === "string"
      ? data.outputs[0]
      : undefined) ??
    (typeof output === "string" ? output : undefined) ??
    (output && typeof output === "object"
      ? output.video_url ?? output.url ?? (Array.isArray(output) ? output[0] : undefined)
      : undefined) ??
    (typeof data.video_url === "string" ? data.video_url : undefined);

  if (status === "completed" || status === "succeeded" || status === "success") {
    return videoUrl
      ? { status: "completed", videoUrl }
      : { status: "failed", error: "Seedance finished without a video." };
  }
  if (["failed", "error", "canceled", "cancelled"].includes(status)) {
    return {
      status: "failed",
      error: describeError(data.error) ?? `Seedance generation ${status}.`,
    };
  }
  return { status: "processing" };
}

export function createMuapiClient(
  apiKey: string,
  fetchImpl: FetchLike = fetch,
  onBalance?: (usd: number) => void
): MuapiClient {
  const call = async (url: string, init: RequestInit = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetchImpl(url, {
        ...init,
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });
      const header = res.headers?.get?.("x-account-balance");
      const headerBalance = header != null ? toNumber(header) : null;
      if (headerBalance !== null) onBalance?.(headerBalance);
      return res;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    async submit(path, body) {
      const res = await call(`${MUAPI_BASE_URL}/${path}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const payload = (await res.json().catch(() => ({}))) as Record<string, any>;
      if (!res.ok) {
        const reason = describeError(payload) ?? `HTTP ${res.status}`;
        if (res.status === 402) {
          throw new Error("Seedance is temporarily unavailable. Please try again later.");
        }
        throw new Error(`Seedance request failed: ${reason}`);
      }
      const requestId =
        payload.request_id ?? payload.id ?? payload.data?.request_id ?? payload.data?.id;
      if (typeof requestId !== "string" || !requestId) {
        throw new Error("Seedance did not return a request id.");
      }
      return requestId;
    },
    async result(requestId) {
      const res = await call(
        `${MUAPI_BASE_URL}/predictions/${encodeURIComponent(requestId)}/result`
      );
      if (!res.ok) {
        // 404/5xx while the job is still queued are treated as "not ready yet".
        return { status: "processing" };
      }
      return parseMuapiResult(await res.json().catch(() => ({})));
    },
    async balanceUsd() {
      try {
        const res = await call(`${MUAPI_BASE_URL}/account/balance`);
        if (!res.ok) return null;
        return parseMuapiBalance(await res.json().catch(() => null));
      } catch {
        return null;
      }
    },
  };
}

/** Logs a warning when the owner's MuAPI balance drops under MUAPI_LOW_BALANCE_USD (default $20). */
export function warnOnLowMuapiBalance(usd: number): void {
  const threshold = Number(process.env.MUAPI_LOW_BALANCE_USD ?? 20);
  if (Number.isFinite(threshold) && usd < threshold) {
    console.warn(
      `[muapi] Account balance is $${usd.toFixed(2)}, under the $${threshold} alert level. Top up MuAPI so Seedance keeps working.`
    );
  }
}
