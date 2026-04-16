-- ============================================================
--  AINA Centre Management — Supabase SQL Schema
--  Jalankan script ini di Supabase SQL Editor
--  (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================


-- ────────────────────────────────────────────────────────────
--  ENUM TYPES
-- ────────────────────────────────────────────────────────────

CREATE TYPE IF NOT EXISTS role                    AS ENUM ('admin', 'user');
CREATE TYPE IF NOT EXISTS notulensi_status        AS ENUM ('draft', 'final');
CREATE TYPE IF NOT EXISTS fitur_status            AS ENUM ('planned', 'in_progress', 'completed', 'on_hold');
CREATE TYPE IF NOT EXISTS fitur_impact            AS ENUM ('low', 'medium', 'high');
CREATE TYPE IF NOT EXISTS keuangan_type           AS ENUM ('income', 'expense');
CREATE TYPE IF NOT EXISTS keuangan_source_type    AS ENUM ('sponsor', 'donor', 'partner', 'internal', 'other');
CREATE TYPE IF NOT EXISTS agenda_status           AS ENUM ('upcoming', 'completed', 'cancelled');
CREATE TYPE IF NOT EXISTS anggota_status          AS ENUM ('active', 'inactive');
CREATE TYPE IF NOT EXISTS relasi_status           AS ENUM ('active', 'inactive', 'prospect');
CREATE TYPE IF NOT EXISTS surat_type              AS ENUM ('masuk', 'keluar');
CREATE TYPE IF NOT EXISTS surat_status            AS ENUM ('draft', 'sent', 'received', 'archived');
CREATE TYPE IF NOT EXISTS inventaris_condition    AS ENUM ('baik', 'rusak', 'perlu_perbaikan');
CREATE TYPE IF NOT EXISTS audit_action            AS ENUM ('create', 'update', 'delete');
CREATE TYPE IF NOT EXISTS report_mode             AS ENUM ('notulensi', 'progress', 'investor', 'summary');
CREATE TYPE IF NOT EXISTS sponsor_status          AS ENUM ('prospect', 'confirmed', 'active', 'completed', 'withdrawn');
CREATE TYPE IF NOT EXISTS tugas_status            AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE IF NOT EXISTS tugas_priority          AS ENUM ('low', 'medium', 'high');


-- ────────────────────────────────────────────────────────────
--  SESSION TABLE  (connect-pg-simple)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "session" (
  "sid"    varchar      NOT NULL COLLATE "default",
  "sess"   json         NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");


-- ────────────────────────────────────────────────────────────
--  USERS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "users" (
  "id"            serial       PRIMARY KEY,
  "username"      text         NOT NULL UNIQUE,
  "email"         text         NOT NULL UNIQUE,
  "password_hash" text         NOT NULL,
  "role"          role         NOT NULL DEFAULT 'user',
  "is_active"     boolean      NOT NULL DEFAULT true,
  "display_name"  text,
  "avatar_url"    text,
  "created_at"    timestamp    NOT NULL DEFAULT now(),
  "updated_at"    timestamp    NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
--  NOTULENSI
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "notulensi" (
  "id"           serial             PRIMARY KEY,
  "title"        text               NOT NULL,
  "date"         text               NOT NULL,
  "participants" text[]             NOT NULL DEFAULT '{}',
  "summary"      text               NOT NULL,
  "decisions"    text[]             NOT NULL DEFAULT '{}',
  "action_items" text[]             NOT NULL DEFAULT '{}',
  "status"       notulensi_status   NOT NULL DEFAULT 'draft',
  "created_by"   integer            REFERENCES "users"("id"),
  "updated_by"   integer            REFERENCES "users"("id"),
  "created_at"   timestamp          NOT NULL DEFAULT now(),
  "updated_at"   timestamp          NOT NULL DEFAULT now(),
  "deleted_at"   timestamp
);


-- ────────────────────────────────────────────────────────────
--  FITUR TERBARU
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "fitur_terbaru" (
  "id"                   serial         PRIMARY KEY,
  "name"                 text           NOT NULL,
  "category"             text           NOT NULL,
  "status"               fitur_status   NOT NULL DEFAULT 'planned',
  "description"          text           NOT NULL,
  "impact"               fitur_impact   NOT NULL DEFAULT 'medium',
  "is_investor_visible"  boolean        NOT NULL DEFAULT false,
  "created_by"           integer        REFERENCES "users"("id"),
  "updated_by"           integer        REFERENCES "users"("id"),
  "created_at"           timestamp      NOT NULL DEFAULT now(),
  "updated_at"           timestamp      NOT NULL DEFAULT now(),
  "deleted_at"           timestamp
);


-- ────────────────────────────────────────────────────────────
--  KEUANGAN
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "keuangan" (
  "id"                 serial                 PRIMARY KEY,
  "type"               keuangan_type          NOT NULL,
  "amount"             numeric(15,2)          NOT NULL,
  "description"        text                   NOT NULL,
  "category"           text                   NOT NULL,
  "date"               text                   NOT NULL,
  "source_name"        text,
  "source_type"        keuangan_source_type,
  "responsible_person" text,
  "purpose"            text,
  "payment_method"     text,
  "proof_url"          text,
  "notes"              text,
  "counterpart"        text,
  "created_by"         integer                REFERENCES "users"("id"),
  "updated_by"         integer                REFERENCES "users"("id"),
  "created_at"         timestamp              NOT NULL DEFAULT now(),
  "updated_at"         timestamp              NOT NULL DEFAULT now(),
  "deleted_at"         timestamp
);


-- ────────────────────────────────────────────────────────────
--  SPONSOR
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sponsor" (
  "id"               serial           PRIMARY KEY,
  "name"             text             NOT NULL,
  "institution"      text             NOT NULL,
  "contact_person"   text             NOT NULL,
  "status"           sponsor_status   NOT NULL DEFAULT 'prospect',
  "pledged_amount"   numeric(15,2)    NOT NULL DEFAULT 0,
  "received_amount"  numeric(15,2)    NOT NULL DEFAULT 0,
  "notes"            text,
  "created_by"       integer          REFERENCES "users"("id"),
  "updated_by"       integer          REFERENCES "users"("id"),
  "created_at"       timestamp        NOT NULL DEFAULT now(),
  "updated_at"       timestamp        NOT NULL DEFAULT now(),
  "deleted_at"       timestamp
);


-- ────────────────────────────────────────────────────────────
--  AGENDA
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "agenda" (
  "id"          serial          PRIMARY KEY,
  "title"       text            NOT NULL,
  "date"        text            NOT NULL,
  "time"        text            NOT NULL,
  "location"    text            NOT NULL,
  "pic"         text            NOT NULL,
  "status"      agenda_status   NOT NULL DEFAULT 'upcoming',
  "description" text,
  "created_by"  integer         REFERENCES "users"("id"),
  "updated_by"  integer         REFERENCES "users"("id"),
  "created_at"  timestamp       NOT NULL DEFAULT now(),
  "updated_at"  timestamp       NOT NULL DEFAULT now(),
  "deleted_at"  timestamp
);


-- ────────────────────────────────────────────────────────────
--  ANGGOTA
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "anggota" (
  "id"           serial           PRIMARY KEY,
  "name"         text             NOT NULL,
  "role"         text             NOT NULL,
  "division"     text             NOT NULL,
  "status"       anggota_status   NOT NULL DEFAULT 'active',
  "email"        text,
  "photo_url"    text,
  "access_level" role             NOT NULL DEFAULT 'user',
  "user_id"      integer          REFERENCES "users"("id"),
  "created_by"   integer          REFERENCES "users"("id"),
  "updated_by"   integer          REFERENCES "users"("id"),
  "created_at"   timestamp        NOT NULL DEFAULT now(),
  "updated_at"   timestamp        NOT NULL DEFAULT now(),
  "deleted_at"   timestamp
);


-- ────────────────────────────────────────────────────────────
--  TUGAS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tugas" (
  "id"          serial           PRIMARY KEY,
  "title"       text             NOT NULL,
  "description" text,
  "status"      tugas_status     NOT NULL DEFAULT 'todo',
  "priority"    tugas_priority   NOT NULL DEFAULT 'medium',
  "anggota_id"  integer          NOT NULL REFERENCES "anggota"("id"),
  "due_date"    text,
  "created_by"  integer          REFERENCES "users"("id"),
  "updated_by"  integer          REFERENCES "users"("id"),
  "created_at"  timestamp        NOT NULL DEFAULT now(),
  "updated_at"  timestamp        NOT NULL DEFAULT now(),
  "deleted_at"  timestamp
);


-- ────────────────────────────────────────────────────────────
--  RELASI
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "relasi" (
  "id"          serial          PRIMARY KEY,
  "name"        text            NOT NULL,
  "institution" text            NOT NULL,
  "role"        text            NOT NULL,
  "contact"     text,
  "status"      relasi_status   NOT NULL DEFAULT 'active',
  "notes"       text,
  "created_by"  integer         REFERENCES "users"("id"),
  "updated_by"  integer         REFERENCES "users"("id"),
  "created_at"  timestamp       NOT NULL DEFAULT now(),
  "updated_at"  timestamp       NOT NULL DEFAULT now(),
  "deleted_at"  timestamp
);


-- ────────────────────────────────────────────────────────────
--  SURAT
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "surat" (
  "id"          serial         PRIMARY KEY,
  "title"       text           NOT NULL,
  "number"      text           NOT NULL,
  "date"        text           NOT NULL,
  "type"        surat_type     NOT NULL,
  "status"      surat_status   NOT NULL DEFAULT 'draft',
  "file_url"    text,
  "description" text,
  "created_by"  integer        REFERENCES "users"("id"),
  "updated_by"  integer        REFERENCES "users"("id"),
  "created_at"  timestamp      NOT NULL DEFAULT now(),
  "updated_at"  timestamp      NOT NULL DEFAULT now(),
  "deleted_at"  timestamp
);


-- ────────────────────────────────────────────────────────────
--  SURAT TEMPLATES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "surat_templates" (
  "id"             serial      PRIMARY KEY,
  "name"           text        NOT NULL,
  "type"           text        NOT NULL DEFAULT 'all',
  "image_url"      text        NOT NULL,
  "field_mappings" text        NOT NULL DEFAULT '[]',
  "created_by"     integer     REFERENCES "users"("id"),
  "created_at"     timestamp   NOT NULL DEFAULT now(),
  "updated_at"     timestamp   NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
--  INVENTARIS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "inventaris" (
  "id"         serial                  PRIMARY KEY,
  "name"       text                    NOT NULL,
  "category"   text                    NOT NULL,
  "quantity"   integer                 NOT NULL DEFAULT 1,
  "condition"  inventaris_condition    NOT NULL DEFAULT 'baik',
  "holder"     text                    NOT NULL,
  "notes"      text,
  "created_by" integer                 REFERENCES "users"("id"),
  "updated_by" integer                 REFERENCES "users"("id"),
  "created_at" timestamp               NOT NULL DEFAULT now(),
  "updated_at" timestamp               NOT NULL DEFAULT now(),
  "deleted_at" timestamp
);


-- ────────────────────────────────────────────────────────────
--  INVESTOR CONTENT
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "investor_content" (
  "id"         serial      PRIMARY KEY,
  "key"        text        NOT NULL UNIQUE,
  "title"      text        NOT NULL,
  "content"    text        NOT NULL,
  "is_visible" boolean     NOT NULL DEFAULT true,
  "order"      integer     NOT NULL DEFAULT 0,
  "created_by" integer     REFERENCES "users"("id"),
  "updated_by" integer     REFERENCES "users"("id"),
  "created_at" timestamp   NOT NULL DEFAULT now(),
  "updated_at" timestamp   NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
--  AI REPORTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "reports" (
  "id"               serial        PRIMARY KEY,
  "title"            text          NOT NULL,
  "mode"             report_mode   NOT NULL,
  "raw_input"        text          NOT NULL,
  "generated_output" text          NOT NULL,
  "saved_to_module"  text,
  "related_id"       integer,
  "created_by"       integer       REFERENCES "users"("id"),
  "created_at"       timestamp     NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
--  COMMIT INSIGHTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "commit_insights" (
  "id"                    serial      PRIMARY KEY,
  "commit_hash"           text        NOT NULL UNIQUE,
  "repo_name"             text        NOT NULL,
  "detailed_explanation"  text,
  "simple_explanation"    text,
  "mapped_feature_target" text,
  "generated_by"          integer     REFERENCES "users"("id"),
  "created_at"            timestamp   NOT NULL DEFAULT now(),
  "updated_at"            timestamp   NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
--  COMMIT READS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "commit_reads" (
  "id"          serial      PRIMARY KEY,
  "user_id"     integer     NOT NULL REFERENCES "users"("id"),
  "commit_hash" text        NOT NULL,
  "repo_name"   text        NOT NULL,
  "read_at"     timestamp   NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
--  AUDIT LOGS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         serial         PRIMARY KEY,
  "table_name" text           NOT NULL,
  "record_id"  integer        NOT NULL,
  "action"     audit_action   NOT NULL,
  "old_data"   text,
  "new_data"   text,
  "user_id"    integer        REFERENCES "users"("id"),
  "created_at" timestamp      NOT NULL DEFAULT now()
);


-- ============================================================
--  BUAT AKUN PENGGUNA
--  Ganti username, email, display_name sesuai kebutuhan.
--  Password default: Admin@AINA2024  →  role: admin
--  Password default: User@AINA2024   →  role: user
-- ============================================================

-- Akun ADMIN (sudah ada jika app pernah jalan — skip jika duplikat)
INSERT INTO "users" ("username", "email", "password_hash", "role", "is_active", "display_name")
VALUES (
  'admin',
  'admin@aina.id',
  '$2b$12$Qb2Wji0MiPyoe0PMUBJaYufbRKrApy9QbNkzY8G6Yx5uoWdBaSJQK',  -- Admin@AINA2024
  'admin',
  true,
  'Administrator'
)
ON CONFLICT ("username") DO NOTHING;


-- ────────────────────────────────────────────────────────────
--  TEMPLATE: Tambah akun anggota baru
--  Duplikat blok di bawah ini untuk setiap anggota.
--  Password default semua anggota: User@AINA2024
-- ────────────────────────────────────────────────────────────

/*
INSERT INTO "users" ("username", "email", "password_hash", "role", "is_active", "display_name")
VALUES (
  'username_anggota',               -- ganti username (harus unik, tanpa spasi)
  'email@aina.id',                  -- ganti email
  '$2b$12$4YIl6ToHJZWVMvvK3U457OXWuH3EIkyj1hGdL5Ehw.nJHWx8P9pC2',  -- User@AINA2024
  'user',
  true,
  'Nama Lengkap Anggota'            -- ganti nama tampilan
)
ON CONFLICT ("username") DO NOTHING;
*/


-- ============================================================
--  CEK HASIL — jalankan query ini setelah insert untuk verifikasi
-- ============================================================

-- SELECT id, username, email, role, is_active, display_name, created_at FROM "users" ORDER BY id;
