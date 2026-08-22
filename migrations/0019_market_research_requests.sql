CREATE TABLE IF NOT EXISTS "market_research_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "requested_by" varchar(255) NOT NULL,
  "topic" text NOT NULL,
  "product_id" varchar(160),
  "product_name" text,
  "objective" text NOT NULL,
  "target_segment" text DEFAULT '' NOT NULL,
  "market_scope" text DEFAULT 'Indonesia' NOT NULL,
  "status" varchar(20) DEFAULT 'queued' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "retry_of_id" integer,
  "lease_token" varchar(64),
  "lease_expires_at" timestamp,
  "last_error" text,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "market_research_requests_status_check"
    CHECK ("status" IN ('queued', 'running', 'completed', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "market_needs_reports"
  ADD COLUMN IF NOT EXISTS "report_kind" varchar(20) DEFAULT 'daily' NOT NULL;
--> statement-breakpoint
ALTER TABLE "market_needs_reports"
  ADD COLUMN IF NOT EXISTS "research_request_id" integer;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'market_needs_reports_research_request_id_fkey'
  ) THEN
    ALTER TABLE "market_needs_reports"
      ADD CONSTRAINT "market_needs_reports_research_request_id_fkey"
      FOREIGN KEY ("research_request_id")
      REFERENCES "market_research_requests"("id")
      ON DELETE SET NULL;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_research_requests_status_created_idx"
  ON "market_research_requests" ("status", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_research_requests_requested_by_idx"
  ON "market_research_requests" ("requested_by", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_needs_reports_research_request_idx"
  ON "market_needs_reports" ("research_request_id", "created_at" DESC);