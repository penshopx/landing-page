CREATE TABLE "ruang_kelola_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"doc_id" uuid,
	"detail" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ruang_kelola_biro_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"doc_id" uuid,
	"service_type" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ruang_kelola_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"doc_type" text NOT NULL,
	"doc_name" text NOT NULL,
	"doc_number" text,
	"issued_by" text,
	"issued_date" date,
	"expired_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"reminder_sent_30d" boolean DEFAULT false NOT NULL,
	"reminder_sent_7d" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ruang_kelola_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"nib" text,
	"npwp" text,
	"bujk_class" text,
	"province" text,
	"phone" text,
	"email" text,
	"address" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ruang_kelola_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "scalev_mappings" ADD COLUMN "scalev_slug" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "scalev_mappings" ADD COLUMN "meta" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "extra_message_credits" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storage_plan" varchar DEFAULT 'gratis';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "storage_plan_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "ruang_kelola_biro_requests" ADD CONSTRAINT "ruang_kelola_biro_requests_doc_id_ruang_kelola_documents_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."ruang_kelola_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rk_audit_user_time" ON "ruang_kelola_audit_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_rk_biro_user" ON "ruang_kelola_biro_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "rk_docs_user_expired_idx" ON "ruang_kelola_documents" USING btree ("user_id","expired_date");