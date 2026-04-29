import { NextResponse } from "next/server"
import { runSearch } from "@/lib/search"
import type { Platform, ScoreTier, Vertical } from "@/lib/types"

/**
 * GET /api/search?q=...&v=pokemon&p=ebay,vinted&t=deal,fair&s=score&min=1000&max=5000
 *
 * User-initiated proxy. No caching. No listing persistence (info.md §Strategia legale).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  if (!q) {
    return NextResponse.json({ error: "missing 'q' param" }, { status: 400 })
  }

  const vertical = (searchParams.get("v") as Vertical) ?? "pokemon"
  const platforms = searchParams.get("p")?.split(",").filter(Boolean) as Platform[] | undefined
  const tiers = searchParams.get("t")?.split(",").filter(Boolean) as ScoreTier[] | undefined
  const sort = (searchParams.get("s") as "score" | "price-asc" | "price-desc" | "posted-desc" | null) ?? "score"
  const minPriceCents = searchParams.get("min") ? Math.round(Number(searchParams.get("min")) * 100) : undefined
  const maxPriceCents = searchParams.get("max") ? Math.round(Number(searchParams.get("max")) * 100) : undefined
  const gameKind = (searchParams.get("kind") as "console" | "game" | null) ?? undefined
  const gamePlatform = searchParams.get("platform") ?? undefined
  const shoeSize = searchParams.get("size") ?? undefined
  const shoeGender = (searchParams.get("gender") as "uomo" | "donna" | "unisex" | null) ?? undefined
  const pokemonSet = searchParams.get("set") ?? undefined
  const refOverride = searchParams.get("ref") ?? undefined

  try {
    const result = await runSearch({
      q,
      vertical,
      platforms,
      tiers,
      sort,
      minPriceCents,
      maxPriceCents,
      gameKind,
      gamePlatform,
      shoeSize,
      shoeGender,
      pokemonSet,
      refOverride,
    })
    return NextResponse.json(result, {
      headers: {
        // Short cache on the edge is fine — this is not listing data, it's a view.
        "cache-control": "private, max-age=60",
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: "search failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    )
  }
}
