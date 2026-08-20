CREATE TABLE IF NOT EXISTS "sales_ladders" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'DRAFT' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sales_ladder_slug" ON "sales_ladders" USING btree ("slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sales_ladder_nodes" (
  "id" serial PRIMARY KEY NOT NULL,
  "ladder_id" integer NOT NULL,
  "stage" text NOT NULL,
  "node_type" text NOT NULL,
  "product_registry_id" varchar(40),
  "package_registry_id" varchar(60),
  "label" text,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sales_ladder_nodes_ladder_id_sales_ladders_id_fk"
    FOREIGN KEY ("ladder_id") REFERENCES "sales_ladders"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "sales_ladder_nodes_product_registry_id_product_registry_product_id_fk"
    FOREIGN KEY ("product_registry_id") REFERENCES "product_registry"("product_id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "sales_ladder_nodes_package_registry_id_package_registry_package_id_fk"
    FOREIGN KEY ("package_registry_id") REFERENCES "package_registry"("package_id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_node_product_per_ladder"
  ON "sales_ladder_nodes" USING btree ("ladder_id", "product_registry_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_node_package_per_ladder"
  ON "sales_ladder_nodes" USING btree ("ladder_id", "package_registry_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_ladder_nodes_ladder" ON "sales_ladder_nodes" USING btree ("ladder_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sales_ladder_edges" (
  "id" serial PRIMARY KEY NOT NULL,
  "ladder_id" integer NOT NULL,
  "from_node_id" integer NOT NULL,
  "to_node_id" integer NOT NULL,
  "relation_type" text NOT NULL,
  "rule_text" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sales_ladder_edges_ladder_id_sales_ladders_id_fk"
    FOREIGN KEY ("ladder_id") REFERENCES "sales_ladders"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "sales_ladder_edges_from_node_id_sales_ladder_nodes_id_fk"
    FOREIGN KEY ("from_node_id") REFERENCES "sales_ladder_nodes"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "sales_ladder_edges_to_node_id_sales_ladder_nodes_id_fk"
    FOREIGN KEY ("to_node_id") REFERENCES "sales_ladder_nodes"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ladder_edge"
  ON "sales_ladder_edges" USING btree ("ladder_id", "from_node_id", "to_node_id", "relation_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_ladder_edges_ladder" ON "sales_ladder_edges" USING btree ("ladder_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "sales_ladder_coverage" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_registry_id" varchar(40) NOT NULL,
  "coverage_status" text DEFAULT 'UNDECIDED' NOT NULL,
  "note" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sales_ladder_coverage_product_registry_id_product_registry_product_id_fk"
    FOREIGN KEY ("product_registry_id") REFERENCES "product_registry"("product_id") ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_coverage_product"
  ON "sales_ladder_coverage" USING btree ("product_registry_id");
--> statement-breakpoint

ALTER TABLE "sales_ladder_nodes"
  ALTER COLUMN "product_registry_id" TYPE varchar(40) USING "product_registry_id"::varchar(40),
  ALTER COLUMN "package_registry_id" TYPE varchar(60) USING "package_registry_id"::varchar(60);
--> statement-breakpoint
ALTER TABLE "sales_ladder_coverage"
  ALTER COLUMN "product_registry_id" TYPE varchar(40) USING "product_registry_id"::varchar(40);
--> statement-breakpoint

ALTER TABLE "sales_ladders"
  DROP CONSTRAINT IF EXISTS "sales_ladders_slug_key";
--> statement-breakpoint
ALTER TABLE "sales_ladder_coverage"
  DROP CONSTRAINT IF EXISTS "sales_ladder_coverage_product_registry_id_key";