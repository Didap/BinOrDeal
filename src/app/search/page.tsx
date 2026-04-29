import Link from "next/link"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import { SearchBox } from "@/components/search-box"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ListingCard } from "@/components/listing-card"
import { ScoreBadge } from "@/components/score-badge"
import { AdapterStatusStrip } from "@/components/adapter-status-strip"
import { ThemeSwitch } from "@/components/theme-switch"
import { RefMatch } from "@/components/ref-match"
import { runSearch } from "@/lib/search"
import { allCatalogEntries } from "@/lib/mock/catalog"
import { formatPrice, VERTICAL_LABELS } from "@/lib/format"
import type { Platform, ScoreTier, Vertical } from "@/lib/types"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp.q ?? "").trim()
  const vertical = ((sp.v as Vertical) ?? "pokemon") as Vertical
  const platforms = (sp.p?.split(",").filter(Boolean) ?? undefined) as Platform[] | undefined
  const tiers = (sp.t?.split(",").filter(Boolean) ?? undefined) as ScoreTier[] | undefined
  const sort = (sp.s as "score" | "price-asc" | "price-desc" | "posted-desc" | undefined) ?? "score"
  const minPriceCents = sp.min ? Math.round(Number(sp.min) * 100) : undefined
  const maxPriceCents = sp.max ? Math.round(Number(sp.max) * 100) : undefined
  const gameKind = (sp.kind as "console" | "game" | undefined) ?? undefined
  const gamePlatform = sp.platform ?? undefined
  const shoeSize = sp.size ?? undefined
  const shoeGender = (sp.gender as "uomo" | "donna" | "unisex" | undefined) ?? undefined
  const pokemonSet = sp.set ?? undefined
  const refOverride = sp.ref ?? undefined

  return (
    <>
      <ThemeSwitch theme={vertical} />
      <Nav compact />

      {/* Compact hero with search */}
      <section className="border-b-2 border-ink bg-surface relative">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-8 grid gap-5">
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
            initialGameKind={gameKind}
            initialGamePlatform={gamePlatform}
            initialShoeSize={shoeSize}
            initialShoeGender={shoeGender}
            initialPokemonSet={pokemonSet}
            size="compact"
          />
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 sm:px-8 py-10 relative z-10">
        {q ? (
          <SearchResults
            q={q}
            vertical={vertical}
            platforms={platforms}
            tiers={tiers}
            sort={sort}
            minPriceCents={minPriceCents}
            maxPriceCents={maxPriceCents}
            gameKind={gameKind}
            gamePlatform={gamePlatform}
            shoeSize={shoeSize}
            shoeGender={shoeGender}
            pokemonSet={pokemonSet}
            refOverride={refOverride}
          />
        ) : (
          <EmptyState vertical={vertical} />
        )}
      </main>

      <Footer />
    </>
  )
}

async function SearchResults({
  q, vertical, platforms, tiers, sort, minPriceCents, maxPriceCents,
  gameKind, gamePlatform, shoeSize, shoeGender, pokemonSet, refOverride,
}: {
  q: string
  vertical: Vertical
  platforms?: Platform[]
  tiers?: ScoreTier[]
  sort: "score" | "price-asc" | "price-desc" | "posted-desc"
  minPriceCents?: number
  maxPriceCents?: number
  gameKind?: "console" | "game"
  gamePlatform?: string
  shoeSize?: string
  shoeGender?: "uomo" | "donna" | "unisex"
  pokemonSet?: string
  refOverride?: string
}) {
  const result = await runSearch({
    q, vertical, platforms, tiers, sort, minPriceCents, maxPriceCents,
    gameKind, gamePlatform, shoeSize, shoeGender, pokemonSet, refOverride,
  })

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <FilterSidebar tallies={result.tallies} />

      <section className="space-y-8">
        <AdapterStatusStrip />
        <RefMatch matched={result.ref} candidates={result.refCandidates} />

        {/* Summary tallies */}
        <div className="flex items-center gap-3 flex-wrap">
          <TallyPill tier="deal" count={result.tallies.deal} total={result.listings.length} />
          <TallyPill tier="fair" count={result.tallies.fair} total={result.listings.length} />
          <TallyPill tier="bin" count={result.tallies.bin} total={result.listings.length} />
          <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            {result.listings.length} annunci aggregati ·{" "}
            <span className="normal-case tracking-normal">
              fetched {new Date(result.fetchedAt).toLocaleTimeString("it-IT")}
            </span>
          </span>
        </div>

        {/* Results */}
        {result.listings.length === 0 ? (
          <div className="border-2 border-ink border-dashed p-10 text-center">
            <div className="display text-2xl font-bold">Nessun match con i filtri attuali.</div>
            <p className="mt-2 text-ink-muted">Prova ad allargare il prezzo o a riattivare più marketplace.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {result.listings.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function TallyPill({ tier, count, total }: { tier: "deal" | "fair" | "bin"; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="inline-flex items-center gap-2">
      <ScoreBadge
        size="sm"
        score={{
          tier,
          delta: 0,
          percent: 0,
          ref: 0,
          refSource: "cardmarket",
        }}
      />
      <span className="font-mono tabular text-sm font-bold">{count}</span>
      <span className="font-mono text-[11px] text-ink-muted">{pct}%</span>
    </div>
  )
}

function EmptyState({ vertical }: { vertical: Vertical }) {
  const entries = allCatalogEntries(vertical).slice(0, 6)
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
