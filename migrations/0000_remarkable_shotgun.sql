CREATE TYPE "public"."agenda_status" AS ENUM('upcoming', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."anggota_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."fitur_impact" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."fitur_status" AS ENUM('planned', 'in_progress', 'completed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."inventaris_condition" AS ENUM('baik', 'rusak', 'perlu_perbaikan');--> statement-breakpoint
CREATE TYPE "public"."keuangan_source_type" AS ENUM('sponsor', 'donor', 'partner', 'internal', 'other');--> statement-breakpoint
CREATE TYPE "public"."keuangan_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."notulensi_status" AS ENUM('draft', 'final');--> statement-breakpoint
CREATE TYPE "public"."relasi_status" AS ENUM('active', 'inactive', 'prospect');--> statement-breakpoint
CREATE TYPE "public"."report_mode" AS ENUM('notulensi', 'progress', 'investor', 'summary');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."sponsor_status" AS ENUM('prospect', 'confirmed', 'active', 'completed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."surat_status" AS ENUM('draft', 'sent', 'received', 'archived');--> statement-breakpoint
CREATE TYPE "public"."surat_type" AS ENUM('masuk', 'keluar');--> statement-breakpoint
CREATE TABLE "agenda" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"location" text NOT NULL,
	"pic" text NOT NULL,
	"status" "agenda_status" DEFAULT 'upcoming' NOT NULL,
	"description" text,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "anggota" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"division" text NOT NULL,
	"status" "anggota_status" DEFAULT 'active' NOT NULL,
	"email" text NOT NULL,
	"access_level" "role" DEFAULT 'user' NOT NULL,
	"user_id" integer,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"record_id" integer NOT NULL,
	"action" "audit_action" NOT NULL,
	"old_data" text,
	"new_data" text,
	"user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitur_terbaru" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"status" "fitur_status" DEFAULT 'planned' NOT NULL,
	"description" text NOT NULL,
	"impact" "fitur_impact" DEFAULT 'medium' NOT NULL,
	"is_investor_visible" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "inventaris" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"condition" "inventaris_condition" DEFAULT 'baik' NOT NULL,
	"holder" text NOT NULL,
	"notes" text,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "investor_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investor_content_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "keuangan" (
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
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notulensi" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"participants" text[] DEFAULT '{}' NOT NULL,
	"summary" text NOT NULL,
	"decisions" text[] DEFAULT '{}' NOT NULL,
	"action_items" text[] DEFAULT '{}' NOT NULL,
	"status" "notulensi_status" DEFAULT 'draft' NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "relasi" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"institution" text NOT NULL,
	"role" text NOT NULL,
	"contact" text,
	"status" "relasi_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"mode" "report_mode" NOT NULL,
	"raw_input" text NOT NULL,
	"generated_output" text NOT NULL,
	"saved_to_module" text,
	"related_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"institution" text NOT NULL,
	"contact_person" text NOT NULL,
	"status" "sponsor_status" DEFAULT 'prospect' NOT NULL,
	"pledged_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"received_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "surat" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"number" text NOT NULL,
	"date" text NOT NULL,
	"type" "surat_type" NOT NULL,
	"status" "surat_status" DEFAULT 'draft' NOT NULL,
	"file_url" text,
	"description" text,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
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
--> statement-breakpoint
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anggota" ADD CONSTRAINT "anggota_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anggota" ADD CONSTRAINT "anggota_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anggota" ADD CONSTRAINT "anggota_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitur_terbaru" ADD CONSTRAINT "fitur_terbaru_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitur_terbaru" ADD CONSTRAINT "fitur_terbaru_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventaris" ADD CONSTRAINT "inventaris_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventaris" ADD CONSTRAINT "inventaris_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_content" ADD CONSTRAINT "investor_content_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_content" ADD CONSTRAINT "investor_content_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keuangan" ADD CONSTRAINT "keuangan_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keuangan" ADD CONSTRAINT "keuangan_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notulensi" ADD CONSTRAINT "notulensi_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notulensi" ADD CONSTRAINT "notulensi_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relasi" ADD CONSTRAINT "relasi_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relasi" ADD CONSTRAINT "relasi_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat" ADD CONSTRAINT "surat_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surat" ADD CONSTRAINT "surat_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;