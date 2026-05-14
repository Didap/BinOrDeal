ALTER TABLE "search_logs" ADD COLUMN "min_price_cents" integer;--> statement-breakpoint
ALTER TABLE "search_logs" ADD COLUMN "max_price_cents" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;