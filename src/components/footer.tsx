import Link from "next/link"
import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t-2 border-ink bg-paper-deep">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo size="md" />
          <p className="mt-4 max-w-[32ch] text-sm text-ink-soft leading-relaxed">
            Aggregatore di marketplace europei per collezionisti, con scoring
            automatico <em className="display italic">bin vs deal</em> contro i
            prezzi di riferimento dei cataloghi specializzati.
          </p>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Fatto con caffè in Italia · 2026
          </p>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Prodotto
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/search?v=pokemon&q=charizard">Pokémon</Link></li>
            <li><Link href="/search?v=coins&q=500 lire argento">Monete</Link></li>
            <li><Link href="/#how">Come funziona</Link></li>
            <li><Link href="/#pricing">Prezzi</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Marketplace
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>eBay</li>
            <li>Vinted</li>
            <li>Wallapop</li>
            <li>Subito</li>
            <li>Facebook Marketplace</li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Trasparenza
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/#legal">Approccio legale</Link></li>
            <li><Link href="/#privacy">Privacy</Link></li>
            <li><Link href="/#terms">Termini</Link></li>
            <li><Link href="/#contact">Contatti</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          <span>Bin or Deal SRL · P.IVA in fase di registrazione</span>
          <span>Siamo user-initiated proxy. Niente caching. Niente dati venditori.</span>
        </div>
      </div>
    </footer>
  )
}
