"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/cn"
import type { Vertical } from "@/lib/types"
import { VERTICAL_LABELS } from "@/lib/format"
import { GAME_PLATFORMS, ERA_LABELS, type GameKind } from "@/lib/games"
import { EU_SIZES, type ShoeGender } from "@/lib/shoes"
import { POKEMON_SETS, POKEMON_ERA_LABELS } from "@/lib/pokemon"
import { suggestPokemonCards, type PokemonCardListing } from "@/lib/pokemon-catalog"
import { formatPrice } from "@/lib/format"

interface Props {
  initialQuery?: string
  initialVertical?: Vertical
  initialGameKind?: GameKind
  initialGamePlatform?: string
  initialShoeSize?: string
  initialShoeGender?: ShoeGender
  initialPokemonSet?: string
  size?: "hero" | "compact"
  placeholder?: string
  suggestions?: string[]
}

export function SearchBox({
  initialQuery = "",
  initialVertical = "pokemon",
  initialGameKind = "console",
  initialGamePlatform,
  initialShoeSize,
  initialShoeGender,
  initialPokemonSet,
  size = "hero",
  placeholder,
  suggestions = [],
}: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)
  const [vertical, setVertical] = useState<Vertical>(initialVertical)
  const [focused, setFocused] = useState(false)
  const [gameKind, setGameKind] = useState<GameKind>(initialGameKind)
  const [gamePlatform, setGamePlatform] = useState<string>(initialGamePlatform ?? "any")
  const [shoeSize, setShoeSize] = useState<string>(initialShoeSize ?? "any")
  const [shoeGender, setShoeGender] = useState<ShoeGender | "any">(initialShoeGender ?? "any")
  const [pokemonSet, setPokemonSet] = useState<string>(initialPokemonSet ?? "any")

  const defaultPlaceholder =
    vertical === "pokemon"
      ? "charizard base set, pikachu, eevee gold star…"
      : vertical === "coins"
        ? "2 euro grecia 2004, 500 lire argento…"
        : vertical === "games"
          ? gameKind === "console"
            ? "playstation 5 pro, switch 2, steam deck oled…"
            : "zelda tears of the kingdom, elden ring, ocarina of time…"
          : "jordan 1, dunk low panda, yeezy 350…"

  function go(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) return
    const params = new URLSearchParams({ q: trimmed, v: vertical })
    if (vertical === "games") {
      params.set("kind", gameKind)
      if (gameKind === "game" && gamePlatform && gamePlatform !== "any") {
        params.set("platform", gamePlatform)
      }
    }
    if (vertical === "shoes") {
      if (shoeSize && shoeSize !== "any") params.set("size", shoeSize)
      if (shoeGender && shoeGender !== "any") params.set("gender", shoeGender)
    }
    if (vertical === "pokemon") {
      if (pokemonSet && pokemonSet !== "any") params.set("set", pokemonSet)
    }
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="w-full space-y-2">
    <form
      onSubmit={go}
      className={cn(
        "group relative flex w-full items-stretch",
        "bg-surface border-2 border-ink",
        size === "hero" && "rounded-[4px]",
        size === "compact" && "rounded-[3px]",
      )}
    >
      {/* vertical selector */}
      <div
        className={cn(
          "relative flex items-center border-r-2 border-ink bg-ink text-paper",
          size === "hero" ? "px-5" : "px-3",
        )}
      >
        <label className="sr-only" htmlFor="vertical-select">
          Verticale
        </label>
        <select
          id="vertical-select"
          value={vertical}
          onChange={(e) => setVertical(e.target.value as Vertical)}
          className={cn(
            "appearance-none bg-transparent font-mono font-bold uppercase tracking-widest outline-none cursor-pointer pr-5",
            size === "hero" ? "text-xs py-4" : "text-[10px] py-2.5",
          )}
        >
          <option value="pokemon">{VERTICAL_LABELS.pokemon}</option>
          <option value="coins">{VERTICAL_LABELS.coins}</option>
          <option value="games">{VERTICAL_LABELS.games}</option>
          <option value="shoes">{VERTICAL_LABELS.shoes}</option>
        </select>
        <span aria-hidden className="pointer-events-none absolute right-2 text-xs opacity-70">
          ▾
        </span>
      </div>

      {/* keyword input */}
      <label className="sr-only" htmlFor="q">
        Cerca
      </label>
      <input
        id="q"
        name="q"
        type="text"
        autoComplete="off"
        placeholder={placeholder ?? defaultPlaceholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className={cn(
          "flex-1 bg-transparent outline-none placeholder:text-ink-faint text-ink",
          size === "hero" && "px-5 py-4 text-lg",
          size === "compact" && "px-3 py-2.5 text-sm",
        )}
      />

      <button
        type="submit"
        className={cn(
          "bg-deal text-paper font-mono font-bold uppercase tracking-widest",
          "border-l-2 border-ink hover:bg-deal-deep transition-colors",
          size === "hero" && "px-7 text-sm",
          size === "compact" && "px-4 text-[11px]",
        )}
      >
        Bin? Deal?
      </button>

      {focused && vertical === "pokemon" && (
        <PokemonAutocomplete
          query={q}
          setId={pokemonSet}
          onPick={(card) => {
            const p = new URLSearchParams({
              q: card.shortName,
              v: "pokemon",
              set: card.setId,
              ref: card.productId,
            })
            router.push(`/search?${p.toString()}`)
          }}
        />
      )}
      {focused && vertical !== "pokemon" && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 bg-surface border-2 border-ink rounded-[3px] shadow-[6px_6px_0_rgba(21,18,13,0.12)]">
          <div className="px-4 py-2 border-b border-line text-[10px] font-mono uppercase tracking-widest text-ink-muted">
            Prova queste
          </div>
          <ul>
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setQ(s)
                    setTimeout(go, 0)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-paper-deep transition-colors flex items-center justify-between"
                >
                  <span>{s}</span>
                  <span className="text-ink-faint text-xs font-mono">↵</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>

    {vertical === "games" && (
      <GamesRefiner
        kind={gameKind}
        onKindChange={setGameKind}
        platform={gamePlatform}
        onPlatformChange={setGamePlatform}
        size={size}
      />
    )}
    {vertical === "shoes" && (
      <ShoesRefiner
        shoeSize={shoeSize}
        onShoeSizeChange={setShoeSize}
        gender={shoeGender}
        onGenderChange={setShoeGender}
        size={size}
      />
    )}
    {vertical === "pokemon" && (
      <PokemonRefiner
        pokemonSet={pokemonSet}
        onPokemonSetChange={setPokemonSet}
        size={size}
      />
    )}
    </div>
  )
}

function GamesRefiner({
  kind,
  onKindChange,
  platform,
  onPlatformChange,
  size,
}: {
  kind: GameKind
  onKindChange: (k: GameKind) => void
  platform: string
  onPlatformChange: (p: string) => void
  size: "hero" | "compact"
}) {
  const grouped = GAME_PLATFORMS.reduce(
    (acc, p) => {
      ;(acc[p.era] ??= []).push(p)
      return acc
    },
    {} as Record<(typeof GAME_PLATFORMS)[number]["era"], typeof GAME_PLATFORMS>,
  )

  return (
    <div
      className={cn(
        "flex items-center flex-wrap gap-3 border-2 border-ink bg-paper/60 px-3 py-2",
        size === "compact" && "py-1.5",
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
        Cerco
      </span>

      {/* kind toggle */}
      <div className="inline-flex border-2 border-ink">
        {(["console", "game"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onKindChange(k)}
            className={cn(
              "px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors",
              kind === k ? "bg-ink text-paper" : "bg-transparent text-ink-muted hover:bg-paper-deep",
            )}
          >
            {k === "console" ? "Una console" : "Un gioco"}
          </button>
        ))}
      </div>

      {/* platform selector only when kind=game */}
      {kind === "game" && (
        <label className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
          per
          <select
            value={platform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="appearance-none bg-surface border-2 border-ink px-2 py-1 font-mono text-[11px] uppercase tracking-wider cursor-pointer text-ink"
          >
            <option value="any">Qualsiasi</option>
            {Object.entries(grouped).map(([era, list]) => (
              <optgroup
                key={era}
                label={ERA_LABELS[era as keyof typeof ERA_LABELS]}
              >
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}

      {/* Precision hint */}
      <span className="ml-auto font-mono text-[10px] normal-case text-ink-muted">
        {kind === "console"
          ? "titoli di giochi verranno esclusi"
          : "la piattaforma verrà aggiunta alla keyword"}
      </span>
    </div>
  )
}

function ShoesRefiner({
  shoeSize,
  onShoeSizeChange,
  gender,
  onGenderChange,
  size,
}: {
  shoeSize: string
  onShoeSizeChange: (s: string) => void
  gender: ShoeGender | "any"
  onGenderChange: (g: ShoeGender | "any") => void
  size: "hero" | "compact"
}) {
  return (
    <div
      className={cn(
        "flex items-center flex-wrap gap-3 border-2 border-ink bg-paper/60 px-3 py-2",
        size === "compact" && "py-1.5",
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
        Taglia
      </span>
      <select
        value={shoeSize}
        onChange={(e) => onShoeSizeChange(e.target.value)}
        className="appearance-none bg-surface border-2 border-ink px-2 py-1 font-mono text-[11px] uppercase tracking-wider cursor-pointer text-ink"
      >
        <option value="any">qualsiasi</option>
        {EU_SIZES.map((s) => (
          <option key={s} value={s}>
            EU {s}
          </option>
        ))}
      </select>

      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
        Genere
      </span>
      <div className="inline-flex border-2 border-ink">
        {(["any", "uomo", "donna", "unisex"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGenderChange(g)}
            className={cn(
              "px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors",
              gender === g ? "bg-ink text-paper" : "bg-transparent text-ink-muted hover:bg-paper-deep",
            )}
          >
            {g === "any" ? "tutti" : g}
          </button>
        ))}
      </div>

      <span className="ml-auto font-mono text-[10px] normal-case text-ink-muted max-w-[32ch] text-right leading-tight">
        titoli senza taglia o con "maglietta / felpa / adesivo" verranno esclusi
      </span>
    </div>
  )
}

function PokemonRefiner({
  pokemonSet,
  onPokemonSetChange,
  size,
}: {
  pokemonSet: string
  onPokemonSetChange: (s: string) => void
  size: "hero" | "compact"
}) {
  const grouped = POKEMON_SETS.reduce(
    (acc, s) => {
      ;(acc[s.era] ??= []).push(s)
      return acc
    },
    {} as Record<(typeof POKEMON_SETS)[number]["era"], typeof POKEMON_SETS>,
  )

  return (
    <div
      className={cn(
        "flex items-center flex-wrap gap-3 border-2 border-ink bg-paper/60 px-3 py-2",
        size === "compact" && "py-1.5",
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
        Set
      </span>
      <select
        value={pokemonSet}
        onChange={(e) => onPokemonSetChange(e.target.value)}
        className="appearance-none bg-surface border-2 border-ink px-2 py-1 font-mono text-[11px] uppercase tracking-wider cursor-pointer text-ink min-w-[20ch]"
      >
        <option value="any">qualsiasi set</option>
        {Object.entries(grouped).map(([era, sets]) => (
          <optgroup
            key={era}
            label={POKEMON_ERA_LABELS[era as keyof typeof POKEMON_ERA_LABELS]}
          >
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <span className="ml-auto font-mono text-[10px] normal-case text-ink-muted max-w-[40ch] text-right leading-tight">
        il set viene aggiunto alla keyword — ref Cardmarket filtrato per set
      </span>
    </div>
  )
}

function PokemonAutocomplete({
  query,
  setId,
  onPick,
}: {
  query: string
  setId: string
  onPick: (card: PokemonCardListing) => void
}) {
  const suggestions = suggestPokemonCards(query, { setId, limit: 10 })

  if (suggestions.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 bg-surface border-2 border-ink rounded-[3px] shadow-[6px_6px_0_rgba(21,18,13,0.12)] px-4 py-6 font-mono text-[11px] text-ink-muted text-center">
        Nessuna carta nel catalogo per questa ricerca. Invio per cercare comunque sui marketplace.
      </div>
    )
  }

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 bg-surface border-2 border-ink rounded-[3px] shadow-[6px_6px_0_rgba(21,18,13,0.12)] max-h-[60vh] overflow-auto">
      <div className="px-4 py-2 border-b border-line text-[10px] font-mono uppercase tracking-widest text-ink-muted flex justify-between">
        <span>Picka la carta</span>
        <span className="normal-case tracking-normal">
          ref → €{query ? "picked" : "auto"}
        </span>
      </div>
      <ul>
        {suggestions.map((card) => (
          <li key={card.productId}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onPick(card)
              }}
              className="w-full text-left px-4 py-3 hover:bg-paper-deep transition-colors flex items-center justify-between gap-4 border-b border-line last:border-0"
            >
              <div className="min-w-0">
                <div className="display text-sm font-bold truncate">
                  {card.shortName}
                  {card.number && (
                    <span className="font-mono font-normal text-ink-muted ml-2">
                      #{card.number}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  {card.setLabel}
                </div>
              </div>
              <div className="font-mono tabular text-sm font-bold shrink-0">
                {formatPrice(card.refPriceCents)}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
