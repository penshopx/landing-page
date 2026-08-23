BEGIN;

CREATE TABLE IF NOT EXISTS sbu_skk_level1_diagnostics (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  diagnostic_type varchar(3) NOT NULL
    CHECK (diagnostic_type IN ('sbu', 'skk')),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  status_key varchar(30) NOT NULL
    CHECK (status_key IN ('foundation', 'organize', 'validate')),
  status_label text NOT NULL,
  rubric_version varchar(80) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sbu_skk_level1_diagnostic_order
  ON sbu_skk_level1_diagnostics (order_id);

COMMIT;