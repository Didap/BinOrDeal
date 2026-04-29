DROP INDEX "pokemon_cards_set_number_idx";--> statement-breakpoint
CREATE INDEX "pokemon_cards_set_number_idx" ON "pokemon_cards" USING btree ("set_id","number");