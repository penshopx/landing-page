-- Demand-led promotion engine.
-- Human-approved promotion campaigns, immutable inventory snapshots, and an
-- append-only, deduped event ledger. All DDL is idempotent (IF NOT EXISTS).
-- Attribution columns on store_orders are additive + nullable (backward-safe).

CREATE TABLE IF NOT EXISTS "promotion_campaigns" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "placements" text[] NOT NULL,
  "segment" varchar(40) NOT NULL,
  "problem" varchar(40) NOT NULL,
  "hook" text NOT NULL,
  "cta" text NOT NULL,
  "reason" text NOT NULL,
  "status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "created_by" varchar(255) NOT NULL,
  "published_by" varchar(255),
  "published_at" timestamp with time zone,
  "paused_by" varchar(255),
  "paused_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "promotion_campaigns_placements_check"
    CHECK ("placements" <@ ARRAY['homepage', 'store']::text[]
           AND array_length("placements", 1) BETWEEN 1 AND 2),
  CONSTRAINT "promotion_campaigns_status_check"
    CHECK ("status" IN ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_promotion_campaign_slug"
  ON "promotion_campaigns" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_campaigns_status"
  ON "promotion_campaigns" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_campaigns_schedule"
  ON "promotion_campaigns" USING btree ("starts_at", "ends_at");
--> statement-breakpoint
-- GIN index accelerates array overlap (&&) used for placement matching + pausing.
CREATE INDEX IF NOT EXISTS "idx_promotion_campaigns_placements_gin"
  ON "promotion_campaigns" USING gin ("placements");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "promotion_campaign_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "campaign_id" integer NOT NULL,
  "role" varchar(20) NOT NULL,
  "item_kind" varchar(20) NOT NULL,
  "product_id" varchar(40),
  "package_id" varchar(60),
  "package_version" integer,
  "canonical_id" varchar(60) NOT NULL,
  "snapshot" jsonb NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "promotion_campaign_items_campaign_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "promotion_campaigns"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "promotion_campaign_items_role_check"
    CHECK ("role" IN ('primary', 'support')),
  CONSTRAINT "promotion_campaign_items_kind_check"
    CHECK ("item_kind" IN ('product', 'package')),
  -- Exactly one canonical id must be set, matching item_kind.
  CONSTRAINT "promotion_campaign_items_one_id_check"
    CHECK (
      ("item_kind" = 'product' AND "product_id" IS NOT NULL AND "package_id" IS NULL AND "canonical_id" = "product_id")
      OR
      ("item_kind" = 'package' AND "package_id" IS NOT NULL AND "product_id" IS NULL AND "canonical_id" = "package_id")
    )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_campaign_items_campaign"
  ON "promotion_campaign_items" USING btree ("campaign_id", "sort_order");
--> statement-breakpoint
-- No duplicate canonical item within one campaign.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_promotion_item_canonical"
  ON "promotion_campaign_items" USING btree ("campaign_id", "item_kind", "canonical_id");
--> statement-breakpoint
-- Exactly one primary per campaign (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS "uq_promotion_item_primary"
  ON "promotion_campaign_items" USING btree ("campaign_id")
  WHERE "role" = 'primary';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "promotion_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "event_id" varchar(80) NOT NULL,
  "campaign_id" integer,
  "event_type" varchar(20) NOT NULL,
  "placement" varchar(20) NOT NULL,
  "problem" varchar(40),
  "segment" varchar(40),
  "item_role" varchar(20),
  "product_id" varchar(40),
  "package_id" varchar(60),
  "session_hash" varchar(64),
  "amount" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "promotion_events_campaign_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "promotion_campaigns"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "promotion_events_type_check"
    CHECK ("event_type" IN ('impression', 'click', 'search', 'trial', 'lead', 'return_visit', 'order')),
  CONSTRAINT "promotion_events_placement_check"
    CHECK ("placement" IN ('homepage', 'store')),
  CONSTRAINT "promotion_events_item_role_check"
    CHECK ("item_role" IS NULL OR "item_role" IN ('primary', 'support'))
);
--> statement-breakpoint
-- Globally unique eventId → durable dedupe even when campaign_id is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_promotion_event_id"
  ON "promotion_events" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_events_campaign_type"
  ON "promotion_events" USING btree ("campaign_id", "event_type", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_events_signal"
  ON "promotion_events" USING btree ("event_type", "problem", "segment", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_promotion_events_created"
  ON "promotion_events" USING btree ("created_at");
--> statement-breakpoint

ALTER TABLE "store_orders"
  ADD COLUMN IF NOT EXISTS "promotion_campaign_id" integer;
--> statement-breakpoint
ALTER TABLE "store_orders"
  ADD COLUMN IF NOT EXISTS "promotion_event_id" varchar(80);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_orders_promotion_campaign"
  ON "store_orders" USING btree ("promotion_campaign_id");
