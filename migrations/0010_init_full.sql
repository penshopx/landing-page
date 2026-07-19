CREATE TABLE "access_code_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"subscription_id" varchar(36),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"plan" text DEFAULT 'profesional' NOT NULL,
	"duration_days" integer DEFAULT 30 NOT NULL,
	"label" text DEFAULT '',
	"max_redemptions" integer DEFAULT 1 NOT NULL,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "event_testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT '',
	"rating" integer DEFAULT 5 NOT NULL,
	"quote" text NOT NULL,
	"agent_id" integer,
	"source" varchar(32) DEFAULT 'lainnya' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "klinik_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT '',
	"role" text DEFAULT '',
	"rating" integer DEFAULT 5 NOT NULL,
	"kesan" text NOT NULL,
	"harapan" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_monthly_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" varchar(255) NOT NULL,
	"month" varchar(7) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_topup_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer NOT NULL,
	"requested_by_email" text NOT NULL,
	"kind" varchar(16) NOT NULL,
	"amount" integer NOT NULL,
	"note" text,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"bucket_key" varchar(255) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"agent_slug" text NOT NULL,
	"agent_name" text DEFAULT '',
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(32) NOT NULL,
	"user_id" varchar(255) DEFAULT '' NOT NULL,
	"topic" text,
	"profile" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_certificates_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "workroom_gates" (
	"id" serial PRIMARY KEY NOT NULL,
	"workroom_id" integer NOT NULL,
	"stage_key" text DEFAULT '' NOT NULL,
	"question" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decided_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "workroom_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workroom_id" integer NOT NULL,
	"type" text DEFAULT 'note' NOT NULL,
	"content" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workrooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" text NOT NULL,
	"domain" text DEFAULT 'tender' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_stage" integer DEFAULT 0 NOT NULL,
	"stages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "contact_phone" varchar(32);--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "seat_capacity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "admin_emails" text[];--> statement-breakpoint
ALTER TABLE "subscriptions_new" ADD COLUMN "partner_id" integer;--> statement-breakpoint
ALTER TABLE "subscriptions_new" ADD COLUMN "granted_by" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_channel" varchar DEFAULT 'wa';--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_access_code_redemption" ON "access_code_redemptions" USING btree ("code_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_event_testimonial_user" ON "event_testimonials" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "owner_monthly_usage_owner_month_idx" ON "owner_monthly_usage" USING btree ("owner_user_id","month");--> statement-breakpoint
CREATE INDEX "research_reports_user_slug_idx" ON "research_reports" USING btree ("user_id","agent_slug");--> statement-breakpoint
CREATE INDEX "workroom_gates_wr_idx" ON "workroom_gates" USING btree ("workroom_id");--> statement-breakpoint
CREATE INDEX "workroom_logs_wr_idx" ON "workroom_logs" USING btree ("workroom_id");--> statement-breakpoint
CREATE INDEX "workrooms_user_idx" ON "workrooms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agents_active_category_idx" ON "agents" USING btree ("is_active","category");--> statement-breakpoint
CREATE INDEX "agents_parent_agent_id_idx" ON "agents" USING btree ("parent_agent_id");--> statement-breakpoint
CREATE INDEX "store_products_active_category_idx" ON "store_products" USING btree ("is_active","category");