-- Search indexes for the matching engine.
--
-- Written by hand because Prisma's schema language can't express expression
-- indexes. Verified that `prisma migrate diff` leaves them alone rather than
-- generating a DROP, so they survive future schema changes.

-- Trigram matching, for fuzzy/partial words ("hydroflask" vs "hydro flask").
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search over title and description. Title is weighted above
-- description: "black backpack" in a title is a stronger signal than the same
-- words buried in a paragraph.
CREATE INDEX IF NOT EXISTS "Post_fts_idx" ON "Post" USING GIN (
  (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
  )
);

-- Trigram indexes backing similarity() on each field.
CREATE INDEX IF NOT EXISTS "Post_title_trgm_idx" ON "Post" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Post_description_trgm_idx" ON "Post" USING GIN ("description" gin_trgm_ops);

-- The matcher always narrows by type + status + date before scoring.
CREATE INDEX IF NOT EXISTS "Post_type_status_occurredOn_idx" ON "Post" ("type", "status", "occurredOn");
