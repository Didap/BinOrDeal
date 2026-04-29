import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  locale: "es-ES",
  viewport: { width: 1366, height: 900 },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
})
const page = await context.newPage()

const allResponses = []
page.on("response", async (r) => {
  const url = r.url()
  if (url.includes("api.wallapop.com")) {
    console.log(`[${r.status()}] ${url.slice(0, 160)}`)
    // Capture EVERY 200 from /search path — we'll sort out data-bearing one
    if (r.status() === 200 && (url.includes("/search/section") || url.includes("/search/components"))) {
      try {
        allResponses.push({ url, body: await r.json() })
      } catch {}
    }
  }
})

const searchUrl = "https://es.wallapop.com/app/search?keywords=charizard"
console.log("goto:", searchUrl)
try {
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 })
} catch (e) {
  console.log("goto err:", e.message)
}

const start = Date.now()
// Keep listening longer to catch any follow-up API calls
while (Date.now() - start < 15000) {
  await new Promise((r) => setTimeout(r, 500))
}
console.log(`\ncaptured ${allResponses.length} search-like responses`)

if (allResponses.length > 0) {
  // Look specifically at /search/section — that's where real items live
  const section = allResponses.find((r) => r.url.includes("/search/section"))
  if (section) {
    const fs = await import("node:fs")
    fs.writeFileSync("/tmp/wa-section.json", JSON.stringify(section.body, null, 2))
    console.log("=== SECTION response ===")
    console.log("url:", section.url.slice(0, 200))
    console.log("top keys:", Object.keys(section.body || {}))
    if (Array.isArray(section.body?.items)) {
      console.log(`items: ${section.body.items.length}`)
      console.log("first:", JSON.stringify(section.body.items[0], null, 2).slice(0, 2000))
    } else if (Array.isArray(section.body?.data?.items)) {
      console.log(`data.items: ${section.body.data.items.length}`)
      console.log("first:", JSON.stringify(section.body.data.items[0], null, 2).slice(0, 2000))
    } else {
      console.log("raw body (first 2000):", JSON.stringify(section.body, null, 2).slice(0, 2000))
    }
    process.exit(0)
  }
  const withData = allResponses.find((r) => {
    const c = (r.body?.components ?? []).find(
      (x) => (x.type_data?.ads?.length ?? 0) > 0 ||
             (x.type_data?.items?.length ?? 0) > 0 ||
             (x.type_data?.elements?.length ?? 0) > 0,
    )
    return !!c
  }) ?? allResponses[0]
  const b = withData.body
  console.log("chosen url:", withData.url.slice(0, 140))
  const fs = await import("node:fs")
  fs.writeFileSync("/tmp/wa-full.json", JSON.stringify(b, null, 2))
  console.log("dumped full response to /tmp/wa-full.json")
  console.log("top keys:", Object.keys(b || {}))
  // Walk and print every component's structure
  if (Array.isArray(b.components)) {
    for (const [i, c] of b.components.entries()) {
      console.log(`\ncomponent[${i}] type=${c.type}  id=${c.id}`)
      console.log("  type_data keys:", c.type_data ? Object.keys(c.type_data).slice(0, 10) : "null")
      if (c.type_data?.items) {
        console.log("  has items:", c.type_data.items.length)
        console.log("  first:", JSON.stringify(c.type_data.items[0]).slice(0, 800))
      }
      if (c.type_data?.elements) {
        console.log("  has elements:", c.type_data.elements.length)
        console.log("  first element:", JSON.stringify(c.type_data.elements[0]).slice(0, 1200))
      }
      if (c.type_data?.ads) {
        console.log("  has ads:", c.type_data.ads.length)
        console.log("  first ad:", JSON.stringify(c.type_data.ads[0], null, 2).slice(0, 2500))
      }
    }
  }
} else {
  console.log("NO API CALL CAPTURED")
  console.log("current url:", page.url())
  console.log("title:", await page.title())
}

await browser.close()
