import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core"

/**
 * Pokémon TCG sets — imported one-shot from pokemontcg.io and refreshed
 * weekly via cron (~150 rows, rarely changes).
 *
 * The `cardmarketSlug` is the URL token used by cardmarket.com product
 * pages (e.g. "Base-Set", "Evolving-Skies"). Populated manually for the
 * curated sets, left null for auto-imported ones until we reconcile.
 */
export const pokemonSets = pgTable(
  "pokemon_sets",
  {
    id: text("id").primaryKey(), // slug, e.g. "base-set"
    externalId: text("external_id"), // pokemontcg.io id (e.g. "base1")
    name: text("name").notNull(),
    series: text("series"), // "Base", "Neo", "EX", "Scarlet & Violet", etc.
    releaseDate: text("release_date"), // ISO date
    totalCards: integer("total_cards"),
    cardmarketSlug: text("cardmarket_slug"),
    logoUrl: text("logo_url"),
    symbolUrl: text("symbol_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("pokemon_sets_series_idx").on(t.series)],
)

/**
 * Pokémon TCG cards — every printing we know about. Indexed by set for
 * fast "all cards in X set" queries, and by name for autocomplete.
 *
 * One row per printing. A card like Charizard has many rows (Base #4,
 * Base Shadowless #4, Base 1st Ed #4, etc). The tuple (setId, number)
 * is the natural key; id is a derived slug for URL friendliness.
 */
export const pokemonCards = pgTable(
  "pokemon_cards",
  {
    id: text("id").primaryKey(), // "base-set:4", "sv-151:199"
    externalId: text("external_id"), // pokemontcg.io id
    setId: text("set_id")
      .notNull()
      .references(() => pokemonSets.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "Charizard"
    number: text("number").notNull(), // "4", "199", "SV49"
    rarity: text("rarity"), // "Rare Holo", "Ultra Rare", "Illustration Rare"
    supertype: text("supertype"), // "Pokémon", "Trainer", "Energy"
    subtypes: text("subtypes"), // JSON array as string: ["Stage 2", "VMAX"]
    types: text("types"), // JSON array as string: ["Fire"]
    imageSmall: text("image_small"),
    imageLarge: text("image_large"),
    cardmarketSlug: text("cardmarket_slug"),
    cardmarketProductId: integer("cardmarket_product_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Index on (setId, number) — NOT unique, because pokemontcg.io has
  // multiple variant entries that share the same printed number (e.g.
  // a normal and a reverse-holo printing both numbered "4"). The
  // primary `id` (pokemontcg.io's slug like "base1-4") differentiates them.
  (t) => [
    index("pokemon_cards_set_number_idx").on(t.setId, t.number),
    index("pokemon_cards_name_idx").on(t.name),
    index("pokemon_cards_rarity_idx").on(t.rarity),
  ],
)

/**
 * Pokémon card prices — time-series. New row per refresh, so we can
 * track trend over time and answer "was this card always this cheap?"
 * The catalog adapter reads the MOST RECENT row per cardId.
 *
 * All cents in EUR. Source is "cardmarket-scrape" today; becomes
 * "cardmarket-api" if their API reopens.
 */
export const pokemonPrices = pgTable(
  "pokemon_prices",
  {
    id: text("id").primaryKey(), // "<cardId>:<fetchedAt.iso>"
    cardId: text("card_id")
      .notNull()
      .references(() => pokemonCards.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // "cardmarket-scrape"
    trendCents: integer("trend_cents"),
    lowCents: integer("low_cents"),
    avgCents: integer("avg_cents"),
    sellerCount: integer("seller_count"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("pokemon_prices_card_fetched_idx").on(t.cardId, t.fetchedAt),
  ],
)

/**
 * Users — managed via Clerk. We store a shadow copy of the profile
 * to handle local permissions and search quotas without hitting
 * Clerk's API on every request.
 */
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // clerk user id
    email: text("email").notNull(),
    tier: text("tier").notNull().default("free"), // "free" | "pro"
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
)

/**
 * Search logs — audit trail of every search submitted.
 * Used for:
 *   1. Quota enforcement (X searches per day/session)
 *   2. Analytics (what are users looking for?)
 *   3. Abuse detection
 */
export const searchLogs = pgTable(
  "search_logs",
  {
    id: text("id").primaryKey(), // uuid
    userId: text("user_id"), // null for anonymous searches
    sessionId: text("session_id").notNull(), // for anonymous quota tracking
    query: text("query").notNull(),
    vertical: text("vertical").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("search_logs_user_idx").on(t.userId),
    index("search_logs_session_idx").on(t.sessionId),
    index("search_logs_created_idx").on(t.createdAt),
  ]
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type SearchLog = typeof searchLogs.$inferSelect
export type NewSearchLog = typeof searchLogs.$inferInsert

export type PokemonSet = typeof pokemonSets.$inferSelect
export type PokemonCard = typeof pokemonCards.$inferSelect
export type PokemonPrice = typeof pokemonPrices.$inferSelect
