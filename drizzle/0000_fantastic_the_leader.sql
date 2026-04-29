CREATE TABLE "pokemon_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" text,
	"set_id" text NOT NULL,
	"name" text NOT NULL,
	"number" text NOT NULL,
	"rarity" text,
	"supertype" text,
	"subtypes" text,
	"types" text,
	"image_small" text,
	"image_large" text,
	"cardmarket_slug" text,
	"cardmarket_product_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"source" text NOT NULL,
	"trend_cents" integer,
	"low_cents" integer,
	"avg_cents" integer,
	"seller_count" integer,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"series" text,
	"release_date" text,
	"total_cards" integer,
	"cardmarket_slug" text,
	"logo_url" text,
	"symbol_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pokemon_cards" ADD CONSTRAINT "pokemon_cards_set_id_pokemon_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."pokemon_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_prices" ADD CONSTRAINT "pokemon_prices_card_id_pokemon_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."pokemon_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pokemon_cards_set_number_idx" ON "pokemon_cards" USING btree ("set_id","number");--> statement-breakpoint
CREATE INDEX "pokemon_cards_name_idx" ON "pokemon_cards" USING btree ("name");--> statement-breakpoint
CREATE INDEX "pokemon_cards_rarity_idx" ON "pokemon_cards" USING btree ("rarity");--> statement-breakpoint
CREATE INDEX "pokemon_prices_card_fetched_idx" ON "pokemon_prices" USING btree ("card_id","fetched_at");--> statement-breakpoint
CREATE INDEX "pokemon_sets_series_idx" ON "pokemon_sets" USING btree ("series");