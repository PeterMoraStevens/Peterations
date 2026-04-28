CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        UNIQUE NOT NULL,
  title       TEXT        NOT NULL,
  excerpt     TEXT        NOT NULL DEFAULT '',
  content     TEXT        NOT NULL DEFAULT '',
  cover_image      TEXT,
  cover_image_path TEXT,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  published   BOOLEAN     NOT NULL DEFAULT false,
  read_time   INTEGER,
  author      TEXT,
  published_at TIMESTAMPTZ,
  image_paths TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_slug_idx        ON posts (slug);
CREATE INDEX IF NOT EXISTS posts_published_idx   ON posts (published, published_at DESC);

CREATE TABLE IF NOT EXISTS photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT,
  description  TEXT,
  camera       TEXT,
  lens         TEXT,
  taken_at     TIMESTAMPTZ,
  location     TEXT,
  storage_path TEXT        NOT NULL,
  url          TEXT        NOT NULL,
  width        INTEGER     NOT NULL,
  height       INTEGER     NOT NULL,
  "order"      INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS photos_order_idx ON photos ("order" ASC, created_at ASC);

CREATE TABLE IF NOT EXISTS about_profile (
  id          TEXT        PRIMARY KEY DEFAULT 'main',
  name        TEXT        NOT NULL DEFAULT '',
  bio         TEXT        NOT NULL DEFAULT '',
  photo_url   TEXT,
  photo_path  TEXT,
  skills      TEXT[]      NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  role        TEXT        NOT NULL,
  company     TEXT        NOT NULL,
  start_date  DATE        NOT NULL,
  end_date    DATE,
  description TEXT        NOT NULL DEFAULT '',
  bullets     TEXT[]      NOT NULL DEFAULT '{}',
  skills      TEXT[]      NOT NULL DEFAULT '{}',
  "order"     INTEGER     NOT NULL DEFAULT 0,
  current     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timeline_order_idx ON timeline ("order" ASC);

CREATE TABLE IF NOT EXISTS projects (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  url         TEXT,
  repo_url    TEXT,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  image_url   TEXT,
  image_path  TEXT,
  featured    BOOLEAN     NOT NULL DEFAULT false,
  "order"     INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_order_idx ON projects ("order" ASC, created_at ASC);

CREATE TABLE IF NOT EXISTS about_links (
  id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  label   TEXT    NOT NULL,
  url     TEXT    NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS about_links_order_idx ON about_links ("order" ASC);

-- Living Life
CREATE TABLE IF NOT EXISTS living_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL,
  name       TEXT NOT NULL,
  "order"    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS living_groups_type_order_idx ON living_groups (type, "order" ASC);

CREATE TABLE IF NOT EXISTS music_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES living_groups(id) ON DELETE SET NULL,
  artist      TEXT NOT NULL,
  track       TEXT NOT NULL,
  album       TEXT NOT NULL DEFAULT '',
  listened_at DATE NOT NULL DEFAULT CURRENT_DATE,
  spotify_url TEXT,
  art_url     TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movie_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID REFERENCES living_groups(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  rating         NUMERIC(3,1) NOT NULL DEFAULT 0,
  watched_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  letterboxd_url TEXT,
  poster_url     TEXT,
  poster_path    TEXT,
  review         TEXT,
  year           INTEGER,
  "order"        INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dish_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID REFERENCES living_groups(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  cooked_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url  TEXT,
  image_path TEXT,
  notes      TEXT,
  cuisine    TEXT,
  "order"    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE photos ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES living_groups(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS guestbook_entries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL DEFAULT 'Anonymous',
  message    TEXT        NOT NULL,
  approved   BOOLEAN     NOT NULL DEFAULT false,
  reply      TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guestbook_approved_idx ON guestbook_entries (approved, created_at DESC);
