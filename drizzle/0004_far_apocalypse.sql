ALTER TABLE "search_logs" ADD COLUMN "user_ip" text;--> statement-breakpoint
CREATE INDEX "search_logs_ip_idx" ON "search_logs" USING btree ("user_ip");