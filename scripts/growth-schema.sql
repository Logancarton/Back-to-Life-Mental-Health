CREATE TABLE IF NOT EXISTS growth_counts (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  page TEXT NOT NULL,
  source TEXT NOT NULL,
  placement TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK(count >= 0),
  PRIMARY KEY (day, event, page, source, placement)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS growth_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) WITHOUT ROWID;
