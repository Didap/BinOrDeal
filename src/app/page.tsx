import Link from "next/link"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import { SearchBox } from "@/components/search-box"
import { DealTicker } from "@/components/ticker"
import { HeroDemo } from "@/components/hero-demo"
import { Sparkline } from "@/components/sparkline"
import { UpgradeButton } from "@/components/upgrade-button"

const SUGGESTIONS = [
  "charizard base set",
  "black lotus alpha",
  "shanks manga",
  "jordan 1 chicago",
  "playstation 5 pro",
  "2 euro grecia 2004",
]

export default function HomePage() {
  return (
    <>
      <Nav />
      <DealTicker />

      <main className="relative z-10 overflow-x-hidden">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 pt-16 pb-8 sm:pt-24 sm:pb-14 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-start">
            <div className="rise">
              {/* Top eyebrow */}
              <div className="flex items-center gap-3 mb-6 overflow-hidden">
                <span className="h-[2px] w-8 bg-ink shrink-0" aria-hidden />
                <span className="font-mono text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-widest text-ink-soft truncate">
                  EU marketplace aggregator · 2026
                </span>
              </div>

              <h1 className="display text-[clamp(48px,15vw,148px)] leading-[0.88] tracking-tightest font-black">
                <span className="text-bin">Bin.</span>
                <br />
                <span
                  className="italic font-light text-ink"
                  style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
                >
                  or
                </span>{" "}
                <span className="text-deal">Deal?</span>
              </h1>

              <p className="mt-6 max-w-[60ch] text-lg sm:text-xl text-ink-soft leading-snug">
                La domanda che ogni collezionista si fa davanti a un annuncio su
                La domanda che ogni collezionista si fa davanti a un annuncio su
                Vinted, eBay, Subito, Wallapop, Facebook.{" "}
                <span className="marker">Risponde il prodotto,</span> non il tuo
                stomaco. Scoring automatico contro Cardmarket e Numista —{" "}
                <em className="display italic">ogni euro ha un verdetto</em>.
              </p>

              {/* Search */}
              <div className="mt-10 rise" style={{ animationDelay: "300ms" }}>
                <SearchBox initialQuery="" suggestions={SUGGESTIONS} />
              </div>

              {/* Stats strip */}
              <div className="mt-16 grid grid-cols-2 xs:grid-cols-3 gap-y-10 gap-x-6 border-t-2 border-ink pt-6">
                <Stat n="5" label="Marketplace" sub="aggregati in parallelo" />
                <Stat n="6" label="Verticali" sub="TCG · Monete · Scarpe · Games" />
                <div className="col-span-2 xs:col-span-1">
                  <Stat n="30k+" label="Catalog Ref" sub="prezzi di riferimento" />
                </div>
              </div>
            </div>

            {/* Right column: live demo */}
            <div className="relative rise" style={{ animationDelay: "200ms" }}>
              <div className="sticky top-6">
                <HeroDemo />
              </div>
            </div>
          </div>

        </section>

        {/* CATEGORIES */}
        <section className="bg-paper-deep border-y-2 border-ink">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-20">
            <div className="flex items-baseline justify-between gap-4 flex-wrap mb-10">
              <h2 className="display text-4xl sm:text-5xl font-black tracking-tightest">
                Scegli la verticale.<br />
                <span className="italic font-light text-ink-muted">Valore garantito.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CategoryCard
                title="Carte Collezionabili"
                desc="Pokémon, Magic, One Piece. Scoring live contro Cardmarket."
                v="tcg"
                icon="🃏"
                tags={["Pokémon", "MTG", "One Piece"]}
              />
              <CategoryCard
                title="Scarpe & Sneakers"
                desc="Jordan, Dunk, Yeezy. Prezzi reference da StockX (Last Sale)."
                v="shoes"
                icon="👟"
                tags={["Jordan", "Nike", "Adidas"]}
              />
              <CategoryCard
                title="Console & Games"
                desc="Retro-gaming e modern. Prezzi PriceCharting & StockX."
                v="games"
                icon="🎮"
                tags={["Retro", "PS5", "Nintendo"]}
              />
              <CategoryCard
                title="Numismatica"
                desc="Monete rare e argento. Reference Numista + Spot price."
                v="coins"
                icon="🪙"
                tags={["Euro", "Lire", "Argento"]}
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="relative">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-20">
            <div className="flex items-baseline justify-between gap-4 flex-wrap mb-10">
              <h2 className="display text-4xl sm:text-5xl font-black tracking-tightest">
                Tre passaggi.<br />
                <span className="italic font-light text-ink-muted">Poi solo verdi.</span>
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                § Come funziona
              </span>
            </div>

            <div className="grid gap-0 md:grid-cols-3 border-2 border-ink">
              <Step
                n="01"
                title="Fan-out parallelo"
                body="Tu digiti una keyword. Noi interroghiamo in parallelo eBay, Vinted, Wallapop, Subito — solo quando lo chiedi, mai in crawling."
                chart={[8, 9, 11, 10, 12, 13, 12]}
              />
              <Step
                n="02"
                title="Prezzo di riferimento"
                body="In parallelo leggiamo il price guide di Cardmarket (per le carte) o Numista (per le monete). Ogni listing ottiene un benchmark onesto."
                chart={[6, 7, 7, 8, 8, 8, 9]}
                divider
              />
              <Step
                n="03"
                title="Scoring bin/fair/deal"
                body="Confronto, condition-adjusted, con shipping opzionale. Il risultato: ordinato per score, non per sponsorizzazioni. Tu leggi solo il verde."
                chart={[3, 5, 8, 10, 13, 17, 22]}
                divider
              />
            </div>
          </div>
        </section>

        {/* MARKETPLACE strip */}
        <section className="border-y-2 border-ink bg-surface">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-14 grid md:grid-cols-[1fr_2fr] gap-10 items-start">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Aggregatore
              </div>
              <h3 className="mt-2 display text-3xl sm:text-4xl font-bold tracking-tightest leading-[1]">
                Quattro mercati,<br />
                <span className="italic">un solo verdetto.</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MarketCard name="eBay" tag="Browse API ufficiale + EPN" status="live-ready" />
              <MarketCard name="Vinted" tag="Endpoint JSON · session proxy" status="user-initiated" />
              <MarketCard name="Wallapop" tag="JSON pubblico · geo-filter" status="user-initiated" />
              <MarketCard name="Subito" tag="Hades JSON · device-id" status="user-initiated" />
            </div>
          </div>
        </section>

        {/* MOAT — deal scoring explained */}
        <section className="relative">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-24 grid lg:grid-cols-[1fr_1fr] gap-14 items-center">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                § Il moat
              </div>
              <h2 className="mt-3 display text-4xl sm:text-5xl font-black tracking-tightest leading-[0.95]">
                Non siamo un meta-search.<br />
                <span className="italic font-light">
                  Siamo un deal evaluator.
                </span>
              </h2>
              <p className="mt-6 max-w-[50ch] text-lg text-ink-soft leading-snug">
                I cataloghi specializzati — Cardmarket per le carte, Numista per
                le monete — sono il reference price pubblicamente riconosciuto.
                Noi confrontiamo ogni annuncio contro quel dato, con
                aggiustamenti per condizione. <em>Chi copia deve replicare questo.</em>
              </p>

              <ul className="mt-8 space-y-3 text-sm">
                <Bullet>
                  <strong>Threshold tunable per categoria.</strong> Le monete
                  argento seguono lo spot, le carte vintage seguono le aste Goldin.
                </Bullet>
                <Bullet>
                  <strong>Condition-adjusted.</strong> Near-mint ≠ played.
                  Il ref price si muove con la condizione dichiarata.
                </Bullet>
                <Bullet>
                  <strong>Shipping opzionale nel calcolo.</strong> Tu scegli
                  se valutare il prezzo effettivo o solo il delta venditore.
                </Bullet>
              </ul>
            </div>

            {/* The scoring formula displayed as editorial math */}
            <div className="relative bg-paper-deep border-2 border-ink p-8 sm:p-10">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-6">
                La formula
              </div>
              <div className="font-mono tabular text-xl xs:text-2xl sm:text-3xl leading-relaxed overflow-x-auto pb-2">
                <span className="text-ink-muted">score = </span>
                <span className="inline-block align-middle">
                  <span className="block border-b-2 border-ink px-2">
                    ref − listing
                  </span>
                  <span className="block px-2 pt-1 text-center">ref</span>
                </span>
              </div>
              <div className="mt-8 space-y-2 font-mono text-sm">
                <ScoreLine label="score ≥ 0.18" tier="deal" verdict="DEAL" />
                <ScoreLine label="−0.08 &lt; score &lt; 0.18" tier="fair" verdict="FAIR" />
                <ScoreLine label="score ≤ −0.08" tier="bin" verdict="BIN" />
              </div>
              <p className="mt-6 text-xs text-ink-muted leading-relaxed border-t border-line pt-4">
                Soglie default. Su /search puoi tararle per categoria e includere
                la spedizione nel calcolo. Il ref si adatta alla condizione.
              </p>
            </div>
          </div>
        </section>

        {/* LEGAL */}
        <section id="legal" className="bg-ink text-paper">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-20 grid lg:grid-cols-[1fr_2fr] gap-10">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-paper/60">
                § Approccio legale
              </div>
              <h2 className="mt-3 display text-4xl sm:text-5xl font-black tracking-tightest leading-[0.95]">
                Hybrid<br />
                <span className="italic font-light text-paper/70">defensive.</span>
              </h2>
              <p className="mt-6 text-sm text-paper/80 leading-relaxed max-w-[36ch]">
                L'EU ci protegge quando lavoriamo su dati pubblicamente accessibili
                e non persistiamo i listing. Noi prendiamo quella protezione e
                ci costruiamo sopra.
              </p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-6 text-sm leading-relaxed">
              <LegalItem title="Zero caching persistente">
                Redis TTL 2-5 min, solo su azione utente. Niente DB di annunci.
              </LegalItem>
              <LegalItem title="User-initiated only">
                Ogni chiamata parte da un'azione esplicita dell'utente autenticato.
                Niente crawling automatico.
              </LegalItem>
              <LegalItem title="Rate limit auto-imposti">
                1 richiesta ogni 10s per utente, per piattaforma. Buona fede
                documentabile.
              </LegalItem>
              <LegalItem title="Niente dati venditori">
                Solo dati di listing. Nessun nome, foto, telefono. GDPR low-risk.
              </LegalItem>
              <LegalItem title="Fallback roadmap">
                V2 = browser extension (call client-side, server fuori dal flow).
                V3 = mobile app nativa.
              </LegalItem>
              <LegalItem title="Partnership-first">
                Richiesta formale a Vinted/Wallapop/Subito prima del lancio pubblico.
              </LegalItem>
            </ul>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="relative">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-24">
            <div className="flex items-baseline justify-between gap-4 flex-wrap mb-12">
              <h2 className="display text-4xl sm:text-5xl font-black tracking-tightest">
                Due piani.<br />
                <span className="italic font-light text-ink-muted">Il resto è affiliate.</span>
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                § Prezzi
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <PriceCard
                name="Free"
                price="€0"
                cadence="per sempre"
                features={[
                  "10 ricerche al giorno (con account)",
                  "3 ricerche anonime per sessione",
                  "Alert email ogni 60 min",
                  "Scoring su tutti i verticali",
                ]}
              />
              <PriceCard
                name="Pro"
                price="€4.99"
                cadence="al mese"
                featured
                features={[
                  "Ricerche illimitate (no quota)",
                  "Priorità sui rate limit marketplace",
                  "Alert ogni 15 min · email + Telegram",
                  "Filtri avanzati (condizione, seller rating, paese)",
                  "Export CSV · share link",
                ]}
              />
            </div>

            <p className="mt-10 max-w-[60ch] text-sm text-ink-muted leading-relaxed border-t border-line pt-6">
              Breakeven ≈ 200 utenti Pro. Copre infra Neon + Upstash + Clerk + Stripe,
              domini, Sentry. Zero VC — product-led dal giorno 1.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t-2 border-ink">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-20 text-center">
            <h2 className="display text-5xl sm:text-7xl font-black tracking-tightest leading-[0.9]">
              Smetti di scorrere<br />
              <span className="italic font-light">200 annunci.</span>
            </h2>
            <p className="mt-6 text-lg text-ink-soft max-w-[42ch] mx-auto">
              Guardi i 5 verdi. Clicchi. Finito.
            </p>
            <div className="mt-10 max-w-[640px] mx-auto">
              <SearchBox suggestions={SUGGESTIONS} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

function Stat({ n, label, sub }: { n: string; label: string; sub: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <div className="display tabular text-4xl xs:text-5xl font-black leading-none">{n}</div>
      <div className="mt-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-ink-muted leading-tight">
        {label}
      </div>
      <div className="mt-1 text-[10px] sm:text-[11px] text-ink-soft leading-snug max-w-[18ch] sm:max-w-[22ch]">{sub}</div>
    </div>
  )
}

function Step({
  n,
  title,
  body,
  chart,
  divider,
}: {
  n: string
  title: string
  body: string
  chart: number[]
  divider?: boolean
}) {
  return (
    <div className={`p-6 sm:p-8 relative ${divider ? "md:border-l-2 md:border-ink border-t-2 md:border-t-0" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono tabular text-[11px] uppercase tracking-widest text-ink-muted">
          Step {n}
        </span>
        <div className="h-8 w-24 text-deal">
          <Sparkline values={chart} stroke="currentColor" fill="rgba(44,138,68,0.12)" />
        </div>
      </div>
      <h3 className="mt-4 display text-2xl sm:text-3xl font-bold tracking-tightest leading-tight">
        {title}
      </h3>
      <p className="mt-3 text-sm text-ink-soft leading-relaxed">{body}</p>
    </div>
  )
}

function MarketCard({ name, tag, status }: { name: string; tag: string; status: string }) {
  return (
    <div className="bg-paper border-2 border-ink p-4">
      <div className="display text-2xl font-black tracking-tightest">{name}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted leading-relaxed">
        {tag}
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest">
        <span className="size-1.5 rounded-full bg-deal pulse-dot" />
        {status}
      </div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="mt-2 size-1.5 rounded-full bg-ink shrink-0" />
      <span className="text-ink-soft leading-relaxed">{children}</span>
    </li>
  )
}

function ScoreLine({ label, tier, verdict }: { label: string; tier: "deal" | "fair" | "bin"; verdict: string }) {
  const color = tier === "deal" ? "text-deal" : tier === "fair" ? "text-fair" : "text-bin"
  return (
    <div className="flex items-center justify-between border-b border-line-strong pb-2">
      <span className="text-ink-soft" dangerouslySetInnerHTML={{ __html: label }} />
      <span className={`font-bold ${color}`}>→ {verdict}</span>
    </div>
  )
}

function LegalItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li>
      <div className="display italic text-paper font-bold text-lg">{title}</div>
      <div className="mt-1 text-paper/70">{children}</div>
    </li>
  )
}

function PriceCard({
  name,
  price,
  cadence,
  features,
  featured,
}: {
  name: string
  price: string
  cadence: string
  features: string[]
  featured?: boolean
}) {
  return (
    <div
      className={`border-2 border-ink p-8 relative ${featured ? "bg-ink text-paper" : "bg-surface text-ink"}`}
    >
      {featured && (
        <span className="absolute -top-3 left-6 bg-deal text-paper font-mono text-[10px] uppercase tracking-widest px-2 py-1">
          Raccomandato
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h3 className="display text-3xl font-black tracking-tightest">{name}</h3>
        <div className="text-right">
          <div className="display tabular text-4xl font-black">{price}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-70">
            {cadence}
          </div>
        </div>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden>→</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {featured ? (
        <div className="mt-8">
          <UpgradeButton />
        </div>
      ) : (
        <Link
          href="/login"
          className={`mt-8 block text-center w-full py-3 font-mono uppercase tracking-widest text-sm border-2 ${featured ? "bg-deal border-deal text-paper hover:bg-deal-deep" : "border-ink hover:bg-ink hover:text-paper"} transition-colors`}
        >
          {featured ? "Diventa Pro →" : "Inizia gratis"}
        </Link>
      )}
    </div>
  )
}

function CategoryCard({
  title,
  desc,
  v,
  icon,
  tags,
}: {
  title: string
  desc: string
  v: string
  icon: string
  tags: string[]
}) {
  return (
    <Link
      href={`/search?v=${v}`}
      className="group bg-paper border-2 border-ink p-6 hover:bg-ink hover:text-paper transition-all relative overflow-hidden"
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">
        {icon}
      </div>
      <h3 className="display text-2xl font-black tracking-tightest leading-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm opacity-70 leading-snug">
        {desc}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="font-mono text-[9px] uppercase tracking-wider border border-current px-1.5 py-0.5 opacity-60"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="absolute bottom-4 right-4 translate-x-8 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all font-mono text-[10px] uppercase">
        Esplora →
      </div>
    </Link>
  )
}
