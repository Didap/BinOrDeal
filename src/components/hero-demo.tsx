import { ListingCard } from "@/components/listing-card"
import { ScoreBadge } from "@/components/score-badge"
import { formatPrice } from "@/lib/format"
import type { SearchResult, ScoredListing } from "@/lib/types"

export function HeroDemo() {
  // Use static mock data for the hero demo to avoid slow live searches on every home page visit.
  // The delay was primarily caused by the Wallapop adapter (Playwright) which takes ~5-10s.
  const result: SearchResult = {
    query: "charizard",
    vertical: "tcg",
    listings: [
      {
        id: "mock-1",
        title: "Charizard Base Set Unlimited - Near Mint",
        priceCents: 28500,
        currency: "EUR",
        platform: "vinted",
        url: "#",
        thumbnail: "https://images.pokemontcg.io/base1/4_hires.png",
        postedAt: new Date().toISOString(),
        country: "IT",
        condition: "near-mint",
        provenance: "fallback",
        score: {
          tier: "deal",
          delta: 0.22,
          percent: 22,
          ref: 36500,
          refSource: "cardmarket",
        }
      },
      {
        id: "mock-2",
        title: "Charizard 4/102 Base Set Holo Rare",
        priceCents: 34000,
        currency: "EUR",
        platform: "ebay",
        url: "#",
        thumbnail: "https://images.pokemontcg.io/base1/4_hires.png",
        postedAt: new Date().toISOString(),
        country: "EU",
        condition: "excellent",
        provenance: "fallback",
        score: {
          tier: "fair",
          delta: 0.07,
          percent: 7,
          ref: 36500,
          refSource: "cardmarket",
        }
      },
      {
        id: "mock-3",
        title: "Charizard Set Base Ita 4/102",
        priceCents: 41000,
        currency: "EUR",
        platform: "subito",
        url: "#",
        thumbnail: "https://images.pokemontcg.io/base1/4_hires.png",
        postedAt: new Date().toISOString(),
        country: "IT",
        condition: "good",
        provenance: "fallback",
        score: {
          tier: "bin",
          delta: -0.12,
          percent: -12,
          ref: 36500,
          refSource: "cardmarket",
        }
      }
    ] as ScoredListing[],
    ref: {
      vertical: "tcg",
      query: "charizard",
      refPriceCents: 36500,
      refSource: "cardmarket",
      productName: "Charizard (Base Set #4)",
      productId: "pkmn-base-4"
    },
    refCandidates: [],
    fetchedAt: new Date().toISOString(),
    tallies: { deal: 1, fair: 1, bin: 1 }
  };

  const best = result.listings
  const ref = result.ref

  return (
    <section className="relative">
      {/* Panel header */}
      <div className="flex items-end justify-between mb-3 gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-ink-muted">
            Demo — query:
          </div>
          <div className="display text-2xl sm:text-3xl font-bold mt-1">
            “charizard base set”
          </div>
        </div>
        {ref && (
          <div className="border-2 border-ink bg-surface px-4 py-2.5 max-w-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Prezzo di riferimento · {ref.refSource}
            </div>
            <div className="font-mono tabular text-lg font-bold mt-0.5">
              {formatPrice(ref.refPriceCents)}
            </div>
            <div className="font-mono text-[10px] text-ink-soft truncate mt-0.5">
              {ref.productName}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {best.map((l: ScoredListing, i: number) => (
          <ListingCard key={l.id} listing={l} index={i} variant="compact" />
        ))}
      </div>

      {/* Caption */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        <span>
          {result.tallies.deal} deal · {result.tallies.fair} fair · {result.tallies.bin} bin
          <span className="normal-case tracking-normal"> / </span>
          {result.listings.length} annunci aggregati
        </span>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-deal pulse-dot" />
          Scoring in tempo reale
        </div>
      </div>

      {/* Inline legend */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <LegendCard tier="deal" desc="Sotto il mercato di oltre il 18%. Comprare." />
        <LegendCard tier="fair" desc="Nella forchetta ±15%. Valutare condizione." />
        <LegendCard tier="bin" desc="Sopra il mercato. Ignorare o contrattare." />
      </div>
    </section>
  )
}

function LegendCard({
  tier,
  desc,
}: {
  tier: "deal" | "fair" | "bin"
  desc: string
}) {
  return (
    <div className="bg-surface border-2 border-ink p-4 flex items-start gap-3">
      <ScoreBadge
        score={{
          tier,
          delta: tier === "deal" ? 0.24 : tier === "fair" ? 0.04 : -0.18,
          percent: tier === "deal" ? 24 : tier === "fair" ? 4 : -18,
          ref: 100,
          refSource: "cardmarket",
        }}
        size="sm"
      />
      <p className="text-sm text-ink-soft leading-snug">{desc}</p>
    </div>
  )
}
