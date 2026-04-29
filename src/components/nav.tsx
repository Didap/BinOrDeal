import Link from "next/link"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/cn"

interface Props {
  className?: string
  compact?: boolean
}

export function Nav({ className, compact }: Props) {
  return (
    <header
      className={cn(
        "relative z-20 border-b-2 border-ink bg-paper/85 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 flex items-center justify-between h-[68px]">
        <Link href="/" aria-label="Bin or Deal — home" className="inline-flex items-baseline gap-3">
          <Logo size={compact ? "sm" : "md"} />
          <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            EU · marketplace aggregator
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 font-mono text-[11px] uppercase tracking-widest">
          <Link href="/search?v=pokemon&q=charizard" className="hover:text-deal transition-colors">
            Pokémon
          </Link>
          <Link href="/search?v=coins&q=500 lire argento" className="hover:text-deal transition-colors">
            Monete
          </Link>
          <Link href="/search?v=games&q=playstation 5" className="hover:text-deal transition-colors">
            Console & Games
          </Link>
          <Link href="/search?v=shoes&q=jordan 1" className="hover:text-deal transition-colors">
            Scarpe
          </Link>
          <Link href="/#how" className="hover:text-deal transition-colors">
            Come funziona
          </Link>
          <Link
            href="/#pricing"
            className="bg-ink text-paper px-3 py-2 hover:bg-deal-deep transition-colors"
          >
            Pro · €4.99/m
          </Link>
        </nav>
      </div>
    </header>
  )
}
