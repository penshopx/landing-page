ALTER TABLE store_orders
  ADD COLUMN IF NOT EXISTS product_registry_id varchar(40),
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS fulfillment_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fulfillment_attempted_at timestamp,
  ADD COLUMN IF NOT EXISTS fulfillment_error text,
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamp;

UPDATE store_orders
   SET fulfillment_status = 'pending'
 WHERE source = 'api_v1'
   AND status = 'paid'
   AND fulfillment_status = 'not_applicable';

UPDATE store_orders
   SET product_registry_id = substring(item_name from '^\[([A-Z0-9_-]+)\]\s')
 WHERE source = 'api_v1'
   AND package_id IS NULL
   AND product_registry_id IS NULL
   AND item_name ~ '^\[[A-Z0-9_-]+\]\s';

CREATE INDEX IF NOT EXISTS idx_store_orders_fulfillment
  ON store_orders (source, fulfillment_status, id)
  WHERE source = 'api_v1';