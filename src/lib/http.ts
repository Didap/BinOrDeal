import { env } from "@/lib/env"

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

export interface HttpOptions {
  timeoutMs?: number
  /** Headers that override UA. Use for API keys, Accept overrides. */
  headers?: Record<string, string>
  /** Cookie jar: a cookie string to send. */
  cookie?: string
  /** Signal to cancel. */
  signal?: AbortSignal
  /** Return the raw Response (for cases where you need headers back). */
  raw?: boolean
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
    public body: string,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Server-side fetch wrapper with timeout + UA. No retry by default —
 * marketplace endpoints are fickle; retry-on-5xx is caller's choice per adapter.
 */
export async function http(
  url: string,
  opts: HttpOptions = {},
): Promise<Response> {
  const ctrl = new AbortController()
  const timeoutMs = opts.timeoutMs ?? env.adapter.timeoutMs
  const timeout = setTimeout(() => ctrl.abort(new Error("timeout")), timeoutMs)
  // Bridge caller signal.
  if (opts.signal) {
    opts.signal.addEventListener("abort", () => ctrl.abort(opts.signal!.reason))
  }

  const headers: Record<string, string> = {
    "User-Agent": UA,
    "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
    ...opts.headers,
  }
  if (opts.cookie) headers["Cookie"] = opts.cookie

  try {
    const r = await fetch(url, { headers, signal: ctrl.signal })
    return r
  } finally {
    clearTimeout(timeout)
  }
}

export async function httpJson<T = unknown>(
  url: string,
  opts: HttpOptions = {},
): Promise<T> {
  const r = await http(url, {
    ...opts,
    headers: { Accept: "application/json", ...opts.headers },
  })
  const ct = r.headers.get("content-type") ?? ""
  const text = await r.text()
  if (!r.ok) {
    throw new HttpError(r.status, url, text.slice(0, 500), `HTTP ${r.status}`)
  }
  if (!ct.includes("json")) {
    throw new HttpError(r.status, url, text.slice(0, 500), `expected json, got ${ct}`)
  }
  return JSON.parse(text) as T
}

/**
 * Extract Set-Cookie headers from a Response as a "name=value; ..." Cookie string.
 *
 * Servers (Vinted in particular) often re-issue Set-Cookie with an expired/empty
 * value to clear a stale cookie, then set the new one in a later header on the
 * same response. We dedupe by name, last-one-wins, and drop cookies whose value
 * came through empty (those are deletions).
 */
export function extractCookies(r: Response): string {
  type HeadersWithGetSet = Headers & { getSetCookie?: () => string[] }
  const headers = r.headers as HeadersWithGetSet
  const raw: string[] = headers.getSetCookie?.() ?? []
  if (raw.length === 0) {
    const collapsed = r.headers.get("set-cookie")
    if (collapsed) raw.push(...collapsed.split(/,(?=\s*[A-Za-z0-9_-]+=)/g))
  }
  const byName = new Map<string, string>()
  for (const line of raw) {
    const eq = line.indexOf("=")
    if (eq < 0) continue
    const name = line.slice(0, eq).trim()
    const rest = line.slice(eq + 1)
    const semi = rest.indexOf(";")
    const value = (semi > 0 ? rest.slice(0, semi) : rest).trim()
    if (!value) {
      byName.delete(name)
      continue
    }
    byName.set(name, value)
  }
  return [...byName.entries()].map(([k, v]) => `${k}=${v}`).join("; ")
}
