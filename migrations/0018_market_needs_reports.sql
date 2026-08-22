CREATE TABLE IF NOT EXISTS "market_needs_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "report_date" date NOT NULL,
  "generated_by" text DEFAULT 'scheduler' NOT NULL,
  "source_count" integer DEFAULT 0 NOT NULL,
  "internal_signal_window_days" integer DEFAULT 30 NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "market_needs_reports"
  DROP CONSTRAINT IF EXISTS "market_needs_reports_report_date_key";
--> statement-breakpoint
ALTER TABLE "market_needs_reports"
  DROP CONSTRAINT IF EXISTS "market_needs_reports_report_date_unique";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_needs_reports_report_date_idx"
ON "market_needs_reports" USING btree ("report_date" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_needs_reports_updated_idx"
ON "market_needs_reports" USING btree ("updated_at" DESC);
