import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { checkSearchQuota, logSearch } from "@/lib/quota"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import { SearchBox } from "@/components/search-box"
import { SearchStream } from "@/components/search-stream"
import { ThemeSwitch } from "@/components/theme-switch"
import { AdapterStatusStrip } from "@/components/adapter-status-strip"
import { allCatalogEntries } from "@/lib/mock/catalog"
import { formatPrice, VERTICAL_LABELS } from "@/lib/format"
import type { Vertical } from "@/lib/types"
import { QuotaGate } from "@/components/quota-gate"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

/**
 * Search page — instant shell, streamed results.
 *
 * The hero + search box + filter sidebar render synchronously on the server
 * so the page paints in <100ms. The actual marketplace fan-out is performed
 * by `<SearchStream>`, which opens an NDJSON stream against
 * /api/search/stream and renders results chunk-by-chunk as each adapter
 * completes (Subito/Vinted/eBay land in <1s; Wallapop fills in last,
 * 3-15s via Playwright).
 */
export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp.q ?? "").trim()
  let vertical = ((sp.v as Vertical) ?? "tcg") as Vertical
  // Legacy fallback: if URL has v=pokemon, map to v=tcg
  if ((sp.v as string) === "pokemon") vertical = "tcg"

  const sort =
    (sp.s as "score" | "price-asc" | "price-desc" | "posted-desc" | undefined) ??
    "score"
  const tcgGame = (sp.game as "pokemon" | "mtg" | "onepiece" | undefined) ?? (vertical === "tcg" ? "pokemon" : undefined)
  const gameKind = (sp.kind as "console" | "game" | undefined) ?? undefined
  const gamePlatform = sp.platform ?? undefined
  const shoeSize = sp.size ?? undefined
  const shoeGender = (sp.gender as "uomo" | "donna" | "unisex" | undefined) ?? undefined
  const pokemonSet = sp.set ?? undefined
  const excludeLotteries = sp.exl !== "0"
  const initialPlatforms = sp.p ? (sp.p.split(",") as import("@/lib/types").Platform[]) : undefined

  // Forward exactly the params we know about to the streaming endpoint —
  // skip empty ones so the URL stays stable for caching/dedupe in the client.
  const streamParams = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v.length > 0) streamParams.set(k, v)
  }
  // Default vertical so the endpoint doesn't need to infer.
  if (!streamParams.has("v")) streamParams.set("v", vertical)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  const quota = await checkSearchQuota(userId ?? undefined, user?.email)

  if (q && quota.allowed) {
    // Audit log the search event (including price filters when present)
    const minPriceRaw = sp.min ? parseFloat(sp.min) : null
    const maxPriceRaw = sp.max ? parseFloat(sp.max) : null
    await logSearch({
      userId: userId ?? undefined,
      query: q,
      vertical,
      minPriceCents: minPriceRaw ? Math.round(minPriceRaw * 100) : null,
      maxPriceCents: maxPriceRaw ? Math.round(maxPriceRaw * 100) : null,
      platforms: sp.p ?? null,
    })
  }

  return (
    <>
      <ThemeSwitch theme={vertical} />
      <Nav compact />

      {/* Compact hero with search */}
      <section className="border-b-2 border-ink bg-surface relative">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-4 sm:py-8 grid gap-5">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                Ricerca · {VERTICAL_LABELS[vertical]}
              </div>
              {q ? (
                <h1 className="mt-1 display text-4xl sm:text-5xl font-black tracking-tightest leading-[0.95]">
                  “{q}”
                </h1>
              ) : (
                <h1 className="mt-1 display text-4xl sm:text-5xl font-black tracking-tightest leading-[0.95]">
                  <span className="italic font-light text-ink-muted">Cosa cerchi?</span>
                </h1>
              )}
            </div>
            <Link
              href="/"
              className="font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
            >
              ← indietro
            </Link>
          </div>
          <SearchBox
            initialQuery={q}
            initialVertical={vertical}
            initialTcgGame={tcgGame}
            initialGameKind={gameKind}
            initialGamePlatform={gamePlatform}
            initialShoeSize={shoeSize}
            initialShoeGender={shoeGender}
            initialPokemonSet={pokemonSet}
            initialExcludeLotteries={excludeLotteries}
            initialPlatforms={initialPlatforms}
            size="compact"
          />
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 sm:px-8 py-10 relative z-10">
        {!q ? (
          <EmptyState vertical={vertical} tcgGame={tcgGame} />
        ) : !quota.allowed ? (
          <QuotaGate status={quota} />
        ) : (
          <SearchStream
            query={streamParams.toString()}
            sort={sort}
            statusStrip={<AdapterStatusStrip />}
          />
        )}
      </main>

      <Footer />
    </>
  )
}

function EmptyState({ vertical, tcgGame }: { vertical: Vertical; tcgGame?: string }) {
  const entries = allCatalogEntries(vertical, { tcgGame: tcgGame as any }).slice(0, 6)
  return (
    <div className="max-w-3xl mx-auto py-10">
      <p className="text-lg text-ink-soft">
        Inizia con una keyword. Ecco qualche riferimento che abbiamo già nel catalogo:
      </p>
      <ul className="mt-6 grid sm:grid-cols-2 gap-3">
        {entries.map((e) => (
          <li key={e.query}>
            <Link
              href={`/search?q=${encodeURIComponent(e.query)}&v=${e.vertical}`}
              className="block border-2 border-ink p-4 bg-surface hover:bg-paper-deep transition-colors"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                {e.refSource} · rif {formatPrice(e.refPriceCents)}
              </div>
              <div className="display text-lg font-bold mt-1">{e.productName}</div>
              <div className="mt-2 font-mono text-[11px] text-deal">→ cerca adesso</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
