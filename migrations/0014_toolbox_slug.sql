ALTER TABLE toolboxes
ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS toolboxes_big_idea_slug_unique
ON toolboxes (big_idea_id, slug)
WHERE slug IS NOT NULL;