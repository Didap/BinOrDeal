CREATE TABLE "price_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"query" text NOT NULL,
	"vertical" text NOT NULL,
	"params" text NOT NULL,
	"target_price_cents" integer NOT NULL,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"last_checked_at" timestamp with time zone,
	"last_notified_at" timestamp with time zone,
	"is_enabled" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "search_logs" ADD COLUMN "platforms" text;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "price_alerts_user_idx" ON "price_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "price_alerts_enabled_freq_idx" ON "price_alerts" USING btree ("is_enabled","frequency");