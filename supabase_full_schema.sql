-- ============================================================
-- AINA Portal — Full Schema for Supabase
-- Tembak ke: Supabase Dashboard → SQL Editor → Run
-- Aman dijalankan berulang (IF NOT EXISTS / DO NOTHING)
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "public"."role" AS ENUM('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."notulensi_status" AS ENUM('draft', 'final');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."fitur_status" AS ENUM('planned', 'in_progress', 'completed', 'on_hold');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."fitur_impact" AS ENUM('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."keuangan_type" AS ENUM('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."keuangan_source_type" AS ENUM('sponsor', 'donor', 'partner', 'internal', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."agenda_status" AS ENUM('upcoming', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."anggota_status" AS ENUM('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."relasi_status" AS ENUM('active', 'inactive', 'prospect');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."surat_type" AS ENUM('masuk', 'keluar');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."surat_status" AS ENUM('draft', 'sent', 'received', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."inventaris_condition" AS ENUM('baik', 'rusak', 'perlu_perbaikan');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."report_mode" AS ENUM('notulensi', 'progress', 'investor', 'summary');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."sponsor_status" AS ENUM('prospect', 'confirmed', 'active', 'completed', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."tugas_status" AS ENUM('todo', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."tugas_priority" AS ENUM('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── Session (express-session / connect-pg-simple) ─────────────

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- ── Users ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "role" "role" DEFAULT 'user' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "display_name" text,
  "avatar_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_username_unique" UNIQUE("username"),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- ── Notulensi ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "notulensi" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "date" text NOT NULL,
  "participants" text[] DEFAULT '{}' NOT NULL,
  "summary" text NOT NULL,
  "decisions" text[] DEFAULT '{}' NOT NULL,
  "action_items" text[] DEFAULT '{}' NOT NULL,
  "status" "notulensi_status" DEFAULT 'draft' NOT NULL,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Fitur Terbaru ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "fitur_terbaru" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "status" "fitur_status" DEFAULT 'planned' NOT NULL,
  "description" text NOT NULL,
  "impact" "fitur_impact" DEFAULT 'medium' NOT NULL,
  "is_investor_visible" boolean DEFAULT false NOT NULL,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Keuangan ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "keuangan" (
  "id" serial PRIMARY KEY NOT NULL,
  "type" "keuangan_type" NOT NULL,
  "amount" numeric(15, 2) NOT NULL,
  "description" text NOT NULL,
  "category" text NOT NULL,
  "date" text NOT NULL,
  "source_name" text,
  "source_type" "keuangan_source_type",
  "responsible_person" text,
  "purpose" text,
  "payment_method" text,
  "proof_url" text,
  "notes" text,
  "counterpart" text,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Sponsor ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sponsor" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "institution" text NOT NULL,
  "contact_person" text NOT NULL,
  "status" "sponsor_status" DEFAULT 'prospect' NOT NULL,
  "pledged_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
  "received_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
  "notes" text,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Agenda ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "agenda" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "date" text NOT NULL,
  "time" text NOT NULL,
  "location" text NOT NULL,
  "pic" text NOT NULL,
  "status" "agenda_status" DEFAULT 'upcoming' NOT NULL,
  "description" text,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Anggota ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "anggota" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "division" text NOT NULL,
  "status" "anggota_status" DEFAULT 'active' NOT NULL,
  "email" text,
  "photo_url" text,
  "access_level" "role" DEFAULT 'user' NOT NULL,
  "user_id" integer REFERENCES "users"("id"),
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Tugas ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tugas" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "status" "tugas_status" DEFAULT 'todo' NOT NULL,
  "priority" "tugas_priority" DEFAULT 'medium' NOT NULL,
  "anggota_id" integer NOT NULL REFERENCES "anggota"("id"),
  "due_date" text,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Relasi ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "relasi" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "institution" text NOT NULL,
  "role" text NOT NULL,
  "contact" text,
  "status" "relasi_status" DEFAULT 'active' NOT NULL,
  "notes" text,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Surat ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "surat" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "number" text NOT NULL,
  "date" text NOT NULL,
  "type" "surat_type" NOT NULL,
  "status" "surat_status" DEFAULT 'draft' NOT NULL,
  "file_url" text,
  "description" text,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Surat Templates ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "surat_templates" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "type" text DEFAULT 'all' NOT NULL,
  "image_url" text NOT NULL,
  "field_mappings" text DEFAULT '[]' NOT NULL,
  "created_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- ── Inventaris ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "inventaris" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "condition" "inventaris_condition" DEFAULT 'baik' NOT NULL,
  "holder" text NOT NULL,
  "notes" text,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

-- ── Investor Content ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "investor_content" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "is_visible" boolean DEFAULT true NOT NULL,
  "order" integer DEFAULT 0 NOT NULL,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "investor_content_key_unique" UNIQUE("key")
);

-- ── Reports ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "mode" "report_mode" NOT NULL,
  "raw_input" text NOT NULL,
  "generated_output" text NOT NULL,
  "saved_to_module" text,
  "related_id" integer,
  "created_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ── Commit Insights ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "commit_insights" (
  "id" serial PRIMARY KEY NOT NULL,
  "commit_hash" text NOT NULL,
  "repo_name" text NOT NULL,
  "detailed_explanation" text,
  "simple_explanation" text,
  "mapped_feature_target" text,
  "generated_by" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "commit_insights_commit_hash_unique" UNIQUE("commit_hash")
);

-- ── Commit Reads (per-user read tracking) ────────────────────

CREATE TABLE IF NOT EXISTS "commit_reads" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "commit_hash" text NOT NULL,
  "repo_name" text NOT NULL,
  "read_at" timestamp DEFAULT now() NOT NULL
);

-- ── Audit Logs ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "table_name" text NOT NULL,
  "record_id" integer NOT NULL,
  "action" "audit_action" NOT NULL,
  "old_data" text,
  "new_data" text,
  "user_id" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- ── Indexes (performa) ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_keuangan_type" ON "keuangan" ("type");
CREATE INDEX IF NOT EXISTS "idx_keuangan_date" ON "keuangan" ("date");
CREATE INDEX IF NOT EXISTS "idx_agenda_date" ON "agenda" ("date");
CREATE INDEX IF NOT EXISTS "idx_agenda_status" ON "agenda" ("status");
CREATE INDEX IF NOT EXISTS "idx_commit_reads_user" ON "commit_reads" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_commit_reads_hash" ON "commit_reads" ("commit_hash");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_table" ON "audit_logs" ("table_name", "record_id");
