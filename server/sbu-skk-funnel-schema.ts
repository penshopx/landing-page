export interface SbuSkkSchemaQueryable {
  query: (text: string, params?: any[]) => Promise<any>;
}

/**
 * Single schema bootstrap used by both application startup and the idempotent
 * funnel seed. It must remain safe for a clean database and for upgrading the
 * older non-unique lead/order schema.
 */
export async function ensureSbuSkkFunnelSchema(
  client: SbuSkkSchemaQueryable,
): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS lead_assets (
      id serial PRIMARY KEY,
      asset_slug varchar(80) NOT NULL UNIQUE,
      title text NOT NULL,
      mime_type text NOT NULL DEFAULT 'application/pdf',
      size_bytes integer NOT NULL,
      sha256 varchar(64) NOT NULL,
      content bytea NOT NULL,
      pages integer,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS lead_submissions (
      id serial PRIMARY KEY,
      asset_slug varchar(80) NOT NULL,
      name text NOT NULL,
      email varchar(255) NOT NULL,
      whatsapp varchar(30),
      whatsapp_consent boolean NOT NULL DEFAULT false,
      utm_source text DEFAULT '',
      utm_medium text DEFAULT '',
      utm_campaign text DEFAULT '',
      utm_content text DEFAULT '',
      utm_term text DEFAULT '',
      referrer text DEFAULT '',
      landing_path text DEFAULT '',
      access_token varchar(64) NOT NULL UNIQUE,
      expires_at timestamp NOT NULL,
      email_sent boolean NOT NULL DEFAULT false,
      email_sent_at timestamp,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    ALTER TABLE lead_submissions
      ADD COLUMN IF NOT EXISTS whatsapp_consent boolean NOT NULL DEFAULT false
  `);
  await client.query(`
    DELETE FROM lead_submissions duplicate
    USING lead_submissions keeper
    WHERE duplicate.id < keeper.id
      AND duplicate.email = keeper.email
      AND duplicate.asset_slug = keeper.asset_slug
  `);
  await client.query(`DROP INDEX IF EXISTS idx_lead_submissions_email_slug`);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_submissions_email_slug
    ON lead_submissions (email, asset_slug)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS product_entitlements (
      id serial PRIMARY KEY,
      entitlement_key varchar(60) NOT NULL,
      email varchar(255) NOT NULL,
      user_id varchar(255),
      product_registry_id varchar(40) NOT NULL,
      agent_slug varchar(80) NOT NULL,
      starts_at timestamp NOT NULL DEFAULT now(),
      expires_at timestamp NOT NULL,
      quota_total integer NOT NULL DEFAULT 100,
      quota_used integer NOT NULL DEFAULT 0,
      status varchar(20) NOT NULL DEFAULT 'pending',
      source varchar(40) NOT NULL DEFAULT 'manual',
      provider_order_ref varchar(120),
      manual_order_ref varchar(120),
      granted_by varchar(255),
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_entitlement_provider_order
    ON product_entitlements (entitlement_key, email, provider_order_ref)
    WHERE provider_order_ref IS NOT NULL
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_entitlement_manual_order
    ON product_entitlements (entitlement_key, manual_order_ref)
    WHERE manual_order_ref IS NOT NULL
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_entitlement_email_key
    ON product_entitlements (email, entitlement_key)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_entitlement_user_key
    ON product_entitlements (user_id, entitlement_key)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sbu_skk_tutor_sources (
      id serial PRIMARY KEY,
      source_title text NOT NULL,
      page_number integer NOT NULL,
      chunk_index integer NOT NULL DEFAULT 0,
      content text NOT NULL,
      search_terms text DEFAULT '',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_sbu_skk_tutor_sources_search
    ON sbu_skk_tutor_sources (source_title, page_number)
  `);
  await client.query(`
    DELETE FROM sbu_skk_tutor_sources duplicate
    USING sbu_skk_tutor_sources keeper
    WHERE duplicate.id > keeper.id
      AND duplicate.source_title = keeper.source_title
      AND duplicate.page_number = keeper.page_number
      AND duplicate.chunk_index = keeper.chunk_index
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_sbu_skk_tutor_source_chunk
    ON sbu_skk_tutor_sources (source_title, page_number, chunk_index)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sbu_skk_orders (
      id serial PRIMARY KEY,
      offer_key varchar(40) NOT NULL,
      product_id varchar(40) NOT NULL,
      amount integer NOT NULL,
      buyer_name text NOT NULL,
      buyer_email varchar(255) NOT NULL,
      buyer_whatsapp varchar(30),
      whatsapp_consent boolean NOT NULL DEFAULT false,
      order_ref varchar(80) NOT NULL UNIQUE,
      status varchar(20) NOT NULL DEFAULT 'pending',
      confirmed_by varchar(255),
      confirmed_at timestamp,
      confirm_evidence text DEFAULT '',
      fulfillment_error text DEFAULT '',
      entitlement_id integer,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    ALTER TABLE sbu_skk_orders
      ADD COLUMN IF NOT EXISTS fulfillment_error text DEFAULT '',
      ADD COLUMN IF NOT EXISTS whatsapp_consent boolean NOT NULL DEFAULT false
  `);
}