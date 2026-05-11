import Image from "next/image"
import { cn } from "@/lib/cn"
import type { ScoredListing } from "@/lib/types"
import {
  formatPrice,
  formatRelative,
  PLATFORM_LABELS,
  CONDITION_LABELS,
} from "@/lib/format"
import { ScoreBadge } from "@/components/score-badge"

interface Props {
  listing: ScoredListing
  index?: number
  variant?: "full" | "compact"
}

export function ListingCard({ listing, index, variant = "full" }: Props) {
  const { score } = listing
  const tierColor = {
    deal: "border-l-deal",
    fair: "border-l-fair",
    bin: "border-l-bin",
    unknown: "border-l-line-strong",
  }[score.tier]

  const platformLabel = PLATFORM_LABELS[listing.platform] ?? listing.platform
  const effectivePrice =
    listing.priceCents + (listing.shippingCents ?? 0)
  // "unknown" tier covers three distinct cases via `score.flag`:
  //   - "lottery"     → raffle / mystery box (pokémon only): the displayed
  //                     price is the ticket cost. Show a distinct red chip.
  //   - "placeholder" → seller listed €0/€1 as dummy. Show "(?)" italic mark.
  //   - "too-cheap"   → real price but suspiciously low; keep price visible,
  //                     score badge already signals doubt.
  // Cards rendered in non-pokemon verticals will never carry "lottery".
  const isLottery = score.flag === "lottery"
  const priceIsPlaceholder =
    !isLottery && score.tier === "unknown" && listing.priceCents <= 100

  return (
    <article
      className={cn(
        "group relative bg-surface border-2 border-ink border-l-[6px]",
        tierColor,
        "transition-all hover:shadow-[6px_6px_0_rgba(21,18,13,0.1)] hover:-translate-y-[1px]",
        "rise",
      )}
      style={index != null ? { animationDelay: `${Math.min(index * 40, 600)}ms` } : undefined}
    >
      {/* Row number (editorial) */}
      {index != null && (
        <div
          aria-hidden
          className="absolute -left-[1.4rem] top-2 font-mono text-[10px] tabular text-ink-muted hidden lg:block"
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      )}

      <div className="flex gap-0">
        {/* thumbnail */}
        <div
          className={cn(
            "relative shrink-0 bg-ink/5 border-r-2 border-ink",
            variant === "full" ? "w-28 sm:w-32" : "w-20",
          )}
        >
          {listing.thumbnail ? (
            <Image
              src={listing.thumbnail}
              alt=""
              width={160}
              height={220}
              unoptimized
              className="w-full h-full object-cover aspect-[4/5]"
            />
          ) : (
            <div className="w-full aspect-[4/5] grid place-items-center text-ink-faint">
              —
            </div>
          )}
          {/* Platform stamp bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 bg-ink text-paper font-mono text-[10px] uppercase tracking-wider text-center py-0.5">
            {platformLabel}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={cn(
                "display font-bold leading-[1.08] tracking-tightest line-clamp-2",
                variant === "full" ? "text-lg sm:text-xl" : "text-base",
              )}
            >
              {listing.title}
            </h3>
            <ScoreBadge score={score} variant="ticker" size={variant === "full" ? "md" : "sm"} />
          </div>

          {/* meta strip */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
            {listing.provenance === "fallback" ? (
              <span className="inline-flex items-center gap-1 bg-fair/20 text-fair border border-fair/40 px-1.5 py-0.5 leading-none">
                <span aria-hidden>◆</span> campione
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-deal-deep">
                <span aria-hidden className="size-1 rounded-full bg-deal pulse-dot" /> live
              </span>
            )}
            <span>{listing.city ?? listing.country}</span>
            <span aria-hidden>·</span>
            <span>{CONDITION_LABELS[listing.condition]}</span>
            <span aria-hidden>·</span>
            <span>{formatRelative(listing.postedAt)}</span>
          </div>

          {/* price row */}
          <div className="mt-auto pt-4 flex items-end justify-between gap-4">
            <div>
              {isLottery ? (
                <div
                  className="inline-flex items-center gap-2 bg-bin/15 border-2 border-bin text-bin px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest font-bold"
                  title="Lotteria — il prezzo è il costo del ticket, non della carta"
                >
                  <span aria-hidden>⚠</span>
                  prezzo fake · lotteria
                </div>
              ) : priceIsPlaceholder ? (
                <div
                  className="display italic text-2xl sm:text-3xl font-black text-ink-muted leading-none"
                  style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
                  title="Prezzo fittizio — da verificare sull'annuncio"
                >
                  (?)
                </div>
              ) : (
                <div className="font-mono tabular text-2xl sm:text-3xl font-bold text-ink leading-none">
                  {formatPrice(listing.priceCents, listing.currency)}
                </div>
              )}
              {isLottery ? (
                <div className="mt-1 font-mono text-[11px] text-ink-muted max-w-[34ch] leading-snug">
                  l'annuncio è un'estrazione: clicca per le condizioni
                </div>
              ) : priceIsPlaceholder ? (
                <div className="mt-1 font-mono text-[11px] text-ink-muted max-w-[32ch] leading-snug">
                  prezzo non indicato dal venditore — clicca per vedere
                </div>
              ) : listing.shippingCents ? (
                <div className="mt-1 font-mono text-[11px] tabular text-ink-muted">
                  + {formatPrice(listing.shippingCents, listing.currency)} sped.
                  {" = "}
                  <span className="text-ink-soft">{formatPrice(effectivePrice, listing.currency)}</span>
                </div>
              ) : (
                <div className="mt-1 font-mono text-[11px] tabular text-deal">spedizione inclusa</div>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                rif. {score.refSource}
              </div>
              <div className="font-mono tabular text-sm text-ink-soft line-through decoration-ink-muted">
                {formatPrice(score.ref)}
              </div>
            </div>
          </div>

          {/* action row */}
          <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              {score.note ?? `prezzo di mercato ${score.refSource}`}
            </span>
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] uppercase tracking-widest text-ink hover:text-deal transition-colors inline-flex items-center gap-1 before:absolute before:inset-0"
            >
              Vedi annuncio
              <span className="hidden xs:inline">su {platformLabel}</span>
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
