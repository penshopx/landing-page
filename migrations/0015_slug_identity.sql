CREATE UNIQUE INDEX IF NOT EXISTS big_ideas_slug_unique
  ON big_ideas (slug)
  WHERE slug IS NOT NULL AND btrim(slug) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS agents_slug_unique
  ON agents (slug)
  WHERE slug IS NOT NULL AND btrim(slug) <> '';