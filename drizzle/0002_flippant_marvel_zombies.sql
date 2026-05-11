CREATE TABLE "search_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"query" text NOT NULL,
	"vertical" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "search_logs_user_idx" ON "search_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_logs_session_idx" ON "search_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "search_logs_created_idx" ON "search_logs" USING btree ("created_at");