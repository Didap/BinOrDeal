import type { Browser, BrowserContext } from "playwright"

/**
 * Headless-browser singleton for the Wallapop adapter.
 *
 * Dev: uses the locally-installed Playwright chromium.
 * Prod: this file must run on a host that has chromium available
 *       (Fly.io with mcr.microsoft.com/playwright base image, or similar).
 *       It will NOT work on Vercel serverless functions due to the 250MB
 *       function size limit.
 *
 * We keep a single Browser and open a fresh BrowserContext per query —
 * contexts are cheap (~50ms) and have isolated cookies / localStorage so
 * concurrent searches don't cross-contaminate. The browser itself stays
 * warm across requests.
 */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

let browserPromise: Promise<Browser> | null = null

async function launch(): Promise<Browser> {
  const { chromium } = await import("playwright")
  return chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
    ],
  })
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launch().catch((err) => {
      browserPromise = null
      throw err
    })
  }
  return browserPromise
}

export interface ContextOptions {
  locale?: string
  viewport?: { width: number; height: number }
}

export async function newContext(opts: ContextOptions = {}): Promise<BrowserContext> {
  const browser = await getBrowser()
  return browser.newContext({
    userAgent: UA,
    locale: opts.locale ?? "it-IT",
    viewport: opts.viewport ?? { width: 1366, height: 900 },
    // Light resource blocking applied at context level below via route.
  })
}

/**
 * Attach a route handler that blocks images, fonts, media, analytics trackers
 * — we only care about the JSON response from the API call, so skipping
 * these drops page load from ~6s to ~2.5s.
 */
export async function optimizeContext(context: BrowserContext): Promise<void> {
  await context.route("**/*", (route) => {
    const req = route.request()
    const type = req.resourceType()
    if (type === "image" || type === "font" || type === "media" || type === "stylesheet") {
      return route.abort()
    }
    const url = req.url()
    if (/analytics|tracking|adservice|doubleclick|googletagmanager|amplitude|segment/.test(url)) {
      return route.abort()
    }
    return route.continue()
  })
}

/**
 * Graceful shutdown helper. Safe to call from process exit hooks.
 */
export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return
  try {
    const b = await browserPromise
    await b.close()
  } catch {
    /* best-effort */
  } finally {
    browserPromise = null
  }
}

// Node-side process exit hook (hot-reload friendly — dev server reuses).
if (typeof process !== "undefined" && !process.listenerCount("beforeExit")) {
  process.once("beforeExit", () => {
    void closeBrowser()
  })
}

// Pre-warm Chromium ONLY when explicitly requested via /api/warmup. Doing it
// at module-init was risky: it triggers `await import("playwright")` which on
// slow container disks (small Coolify VPS) can balloon the first cold request
// to /search by tens of seconds. With this gate, the only path that ever
// loads Playwright is an actual Wallapop search call (or a manual warmup
// ping after deploy), keeping the page render hermetic.
if (typeof process !== "undefined" && process.env.PREWARM_BROWSER === "1") {
  void getBrowser().catch((e) => {
    console.warn("[browser] prewarm failed:", e instanceof Error ? e.message : e)
  })
}
