"use client"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useState, useTransition, useEffect } from "react"
import posthog from "posthog-js"
import { ChevronDown } from "lucide-react"
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
  initialTcgGame?: "pokemon" | "mtg" | "onepiece"
  initialPokemonSet?: string
  initialExcludeLotteries?: boolean
  initialPlatforms?: import("@/lib/types").Platform[]
  size?: "hero" | "compact"
  placeholder?: string
  suggestions?: string[]
}

export function SearchBox({
  initialQuery = "",
  initialVertical = "tcg",
  initialTcgGame = "pokemon",
  initialGameKind = "console",
  initialGamePlatform,
  initialShoeSize,
  initialShoeGender,
  initialPokemonSet,
  initialExcludeLotteries = true,
  initialPlatforms,
  size = "hero",
  placeholder,
  suggestions = [],
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [q, setQ] = useState(initialQuery)
  const [vertical, setVertical] = useState<Vertical>(initialVertical)
  const [focused, setFocused] = useState(false)
  const [tcgGame, setTcgGame] = useState<"pokemon" | "mtg" | "onepiece">(initialTcgGame)
  const [gameKind, setGameKind] = useState<GameKind>(initialGameKind)
  const [gamePlatform, setGamePlatform] = useState<string>(initialGamePlatform ?? "any")
  const [shoeSize, setShoeSize] = useState<string>(initialShoeSize ?? "any")
  const [shoeGender, setShoeGender] = useState<ShoeGender | "any">(initialShoeGender ?? "any")
  const [pokemonSet, setPokemonSet] = useState<string>(initialPokemonSet ?? "any")
  const [excludeLotteries, setExcludeLotteries] = useState(initialExcludeLotteries)
  
  // Platform preferences state
  const [platforms, setPlatforms] = useState<import("@/lib/types").Platform[]>(() => {
    if (initialPlatforms) return initialPlatforms
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pref_platforms")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {}
      }
    }
    return ["ebay", "vinted", "wallapop", "subito", "facebook"]
  })

  useEffect(() => {
    localStorage.setItem("pref_platforms", JSON.stringify(platforms))
  }, [platforms])

  const isTcg = vertical === "tcg"
  const defaultPlaceholder =
    vertical === "tcg"
      ? tcgGame === "pokemon" ? "charizard, pikachu, eevee…" : tcgGame === "mtg" ? "black lotus, mox, lilliana…" : "shanks, luffy, zoro…"
      : vertical === "coins"
        ? "2 euro 2004, 500 lire…"
        : vertical === "games"
          ? "ps5, switch 2, zelda…"
          : vertical === "shoes" ? "jordan 1, yeezy…" : "oggetto vintage, orologio…"

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
    if (vertical === "tcg") {
      params.set("game", tcgGame)
      if (tcgGame === "pokemon" && pokemonSet && pokemonSet !== "any") {
        params.set("set", pokemonSet)
      }
      if (tcgGame === "pokemon" && !excludeLotteries) {
        params.set("exl", "0")
      }
    }
    
    // Add platform filter if not all are selected
    if (platforms.length < 5) {
      params.set("p", platforms.join(","))
    }

    posthog.capture("search_submit", {
      query: trimmed,
      vertical,
      platforms,
    })
    startTransition(() => {
      router.push(`/search?${params.toString()}`)
    })
  }

  return (
    <div className="w-full space-y-3">
      {isPending && <SubmitOverlay query={q.trim()} />}

      <form
        onSubmit={go}
        className={cn(
          "flex flex-col sm:flex-row items-stretch bg-surface border-2 border-ink",
          size === "hero" ? "rounded-[4px] shadow-[6px_6px_0_rgba(21,18,13,0.1)]" : "rounded-[2px]",
        )}
      >
        {/* Category selector */}
        <div className="relative group/cat min-w-0 sm:min-w-[180px] border-b-2 sm:border-b-0 sm:border-r-2 border-ink bg-ink text-paper shrink-0">
          <select
            value={vertical}
            onChange={(e) => setVertical(e.target.value as Vertical)}
            className="w-full h-11 sm:h-auto pl-4 pr-10 py-3 bg-transparent font-mono text-[11px] uppercase tracking-widest cursor-pointer appearance-none outline-none"
          >
            {Object.entries(VERTICAL_LABELS).map(([val, label]) => (
              <option key={val} value={val} className="text-ink">
                {label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-70">
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder={placeholder ?? defaultPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            className={cn(
              "w-full h-12 sm:h-full px-4 py-3 bg-transparent font-sans text-base outline-none placeholder:text-ink-faint",
              size === "hero" && "sm:text-lg",
            )}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "h-12 sm:h-auto px-6 sm:px-8 bg-deal text-paper font-mono text-[11px] uppercase tracking-[0.2em] font-black border-t-2 sm:border-t-0 sm:border-l-2 border-ink hover:bg-deal-deep transition-all",
            isPending && "opacity-80 cursor-wait",
          )}
        >
          {isPending ? "Cerco…" : (
            <>
              <span className="sm:hidden">Verifica Prezzi</span>
              <span className="hidden sm:inline">Bin? Deal?</span>
            </>
          )}
        </button>
      </form>

      {/* Refiner strips — stack on mobile */}
      <div className="flex flex-col gap-2">
        {vertical === "games" && (
          <GamesRefiner
            kind={gameKind}
            onKindChange={setGameKind}
            platform={gamePlatform}
            onPlatformChange={setGamePlatform}
          />
        )}
        {vertical === "shoes" && (
          <ShoesRefiner
            shoeSize={shoeSize}
            onShoeSizeChange={setShoeSize}
            gender={shoeGender}
            onGenderChange={setShoeGender}
          />
        )}
        {isTcg && (
          <TcgRefiner
            game={tcgGame}
            onGameChange={setTcgGame}
            pokemonSet={pokemonSet}
            onPokemonSetChange={setPokemonSet}
            excludeLotteries={excludeLotteries}
            onExcludeLotteriesChange={setExcludeLotteries}
          />
        )}

        <PlatformRefiner selected={platforms} onChange={setPlatforms} />
      </div>

      {/* Suggestions — wrap aggressively */}
      {suggestions.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap pt-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted py-1.5">
            Prova →
          </span>
          <div className="flex gap-2 flex-wrap min-w-0">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQ(s)
                  setTimeout(go, 10)
                }}
                className="border-2 border-line-strong px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function GamesRefiner({
  kind,
  onKindChange,
  platform,
  onPlatformChange,
}: {
  kind: GameKind
  onKindChange: (k: GameKind) => void
  platform: string
  onPlatformChange: (p: string) => void
}) {
  return (
    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 border-2 border-ink bg-paper-deep p-2 xs:px-3 xs:py-2">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted shrink-0">
          Tipo
        </span>
        <div className="flex border-2 border-ink shrink-0 bg-surface">
          {(["console", "game"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onKindChange(k)}
              className={cn(
                "px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors",
                kind === k ? "bg-ink text-paper" : "bg-transparent text-ink-muted",
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      {kind === "game" && (
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">per</span>
          <select
            value={platform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="flex-1 h-9 bg-surface border-2 border-ink px-2 font-mono text-[10px] uppercase outline-none"
          >
            <option value="any">Qualsiasi</option>
            {GAME_PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function ShoesRefiner({
  shoeSize,
  onShoeSizeChange,
  gender,
  onGenderChange,
}: {
  shoeSize: string
  onShoeSizeChange: (s: string) => void
  gender: ShoeGender | "any"
  onGenderChange: (g: ShoeGender | "any") => void
}) {
  return (
    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 border-2 border-ink bg-paper-deep p-2 xs:px-3 xs:py-2">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Taglia</span>
        <select
          value={shoeSize}
          onChange={(e) => onShoeSizeChange(e.target.value)}
          className="h-9 bg-surface border-2 border-ink px-2 font-mono text-[10px] outline-none"
        >
          <option value="any">qualsiasi</option>
          {EU_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Genere</span>
        <div className="flex border-2 border-ink bg-surface">
          {(["any", "uomo", "donna"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGenderChange(g)}
              className={cn(
                "px-3 py-2 font-mono text-[10px] uppercase tracking-widest",
                gender === g ? "bg-ink text-paper" : "bg-transparent text-ink-muted",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TcgRefiner({
  game,
  onGameChange,
  pokemonSet,
  onPokemonSetChange,
  excludeLotteries,
  onExcludeLotteriesChange,
}: {
  game: "pokemon" | "mtg" | "onepiece"
  onGameChange: (g: "pokemon" | "mtg" | "onepiece") => void
  pokemonSet: string
  onPokemonSetChange: (s: string) => void
  excludeLotteries: boolean
  onExcludeLotteriesChange: (b: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-3 border-2 border-ink bg-paper-deep p-3 xs:px-3 xs:py-2">
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Gioco</span>
          <div className="flex border-2 border-ink bg-surface">
            {(["pokemon", "mtg", "onepiece"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onGameChange(g)}
                className={cn(
                  "px-3 py-2 font-mono text-[10px] uppercase tracking-widest",
                  game === g ? "bg-ink text-paper" : "bg-transparent text-ink-muted",
                )}
              >
                {g === "pokemon" ? "PKMN" : g.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {game === "pokemon" && (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Set</span>
            <select
              value={pokemonSet}
              onChange={(e) => onPokemonSetChange(e.target.value)}
              className="flex-1 h-10 xs:h-9 bg-surface border-2 border-ink px-3 font-mono text-[11px] uppercase outline-none min-w-0"
            >
              <option value="any">Qualsiasi Set</option>
              {POKEMON_SETS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {game === "pokemon" && (
        <label className="flex items-center gap-2 cursor-pointer select-none py-1 border-t border-ink-faint xs:border-t-0">
          <input
            type="checkbox"
            checked={excludeLotteries}
            onChange={(e) => onExcludeLotteriesChange(e.target.checked)}
            className="size-4 accent-ink"
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink">
            Escludi lotterie
          </span>
        </label>
      )}
    </div>
  )
}

function PlatformRefiner({
  selected,
  onChange,
}: {
  selected: import("@/lib/types").Platform[]
  onChange: (p: import("@/lib/types").Platform[]) => void
}) {
  const platforms: { id: import("@/lib/types").Platform; label: string }[] = [
    { id: "ebay", label: "eBay" },
    { id: "vinted", label: "Vinted" },
    { id: "wallapop", label: "Wallapop" },
    { id: "subito", label: "Subito" },
    { id: "facebook", label: "FB Market" },
  ]

  const toggle = (id: import("@/lib/types").Platform) => {
    if (selected.includes(id)) {
      if (selected.length > 1) {
        onChange(selected.filter((p) => p !== id))
      }
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-2 border-ink bg-paper-deep p-2 xs:px-3 xs:py-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mr-1">Mercati</span>
      <div className="flex flex-wrap gap-2">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={cn(
              "px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest border-2 transition-colors",
              selected.includes(p.id)
                ? "bg-ink text-paper border-ink font-bold"
                : "bg-surface text-ink-muted border-line-strong hover:border-ink",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SubmitOverlay({ query }: { query: string }) {
  return (
    <div className="fixed inset-0 z-[60] bg-paper/98 backdrop-blur-sm grid place-items-center p-6 text-center">
      <div className="rise">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-muted">Aggrego i mercati…</div>
        <div className="mt-4 display text-4xl font-black tracking-tightest">Cerco “{query}”</div>
        <div className="mt-8 flex justify-center gap-2">
          <div className="size-2 bg-deal animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="size-2 bg-deal animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="size-2 bg-deal animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  )
}
