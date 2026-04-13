import { pgTable, serial, text, timestamp, boolean, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["admin", "user"]);
export const notulensiStatusEnum = pgEnum("notulensi_status", ["draft", "final"]);
export const fiturStatusEnum = pgEnum("fitur_status", ["planned", "in_progress", "completed", "on_hold"]);
export const fiturImpactEnum = pgEnum("fitur_impact", ["low", "medium", "high"]);
export const keuanganTypeEnum = pgEnum("keuangan_type", ["income", "expense"]);
export const keuanganSourceTypeEnum = pgEnum("keuangan_source_type", ["sponsor", "donor", "partner", "internal", "other"]);
export const agendaStatusEnum = pgEnum("agenda_status", ["upcoming", "completed", "cancelled"]);
export const anggotaStatusEnum = pgEnum("anggota_status", ["active", "inactive"]);
export const relasiStatusEnum = pgEnum("relasi_status", ["active", "inactive", "prospect"]);
export const suratTypeEnum = pgEnum("surat_type", ["masuk", "keluar"]);
export const suratStatusEnum = pgEnum("surat_status", ["draft", "sent", "received", "archived"]);
export const inventarisConditionEnum = pgEnum("inventaris_condition", ["baik", "rusak", "perlu_perbaikan"]);
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete"]);
export const reportModeEnum = pgEnum("report_mode", ["notulensi", "progress", "investor", "summary"]);
export const sponsorStatusEnum = pgEnum("sponsor_status", ["prospect", "confirmed", "active", "completed", "withdrawn"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, passwordHash: true }).extend({
  password: z.string().min(6),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "passwordHash">;

// ─── Notulensi ────────────────────────────────────────────────────────────────

export const notulensi = pgTable("notulensi", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  participants: text("participants").array().notNull().default([]),
  summary: text("summary").notNull(),
  decisions: text("decisions").array().notNull().default([]),
  actionItems: text("action_items").array().notNull().default([]),
  status: notulensiStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertNotulensiSchema = createInsertSchema(notulensi).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
});
export type InsertNotulensi = z.infer<typeof insertNotulensiSchema>;
export type Notulensi = typeof notulensi.$inferSelect;

// ─── Fitur Terbaru ────────────────────────────────────────────────────────────

export const fiturTerbaru = pgTable("fitur_terbaru", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  status: fiturStatusEnum("status").notNull().default("planned"),
  description: text("description").notNull(),
  impact: fiturImpactEnum("impact").notNull().default("medium"),
  isInvestorVisible: boolean("is_investor_visible").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertFiturTerbaruSchema = createInsertSchema(fiturTerbaru).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
});
export type InsertFiturTerbaru = z.infer<typeof insertFiturTerbaruSchema>;
export type FiturTerbaru = typeof fiturTerbaru.$inferSelect;

// ─── Keuangan (extended) ──────────────────────────────────────────────────────

export const keuangan = pgTable("keuangan", {
  id: serial("id").primaryKey(),
  type: keuanganTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  // Income-specific
  sourceName: text("source_name"),
  sourceType: keuanganSourceTypeEnum("source_type"),
  // Expense-specific
  responsiblePerson: text("responsible_person"),
  purpose: text("purpose"),
  // Shared extras
  paymentMethod: text("payment_method"),
  proofUrl: text("proof_url"),
  notes: text("notes"),
  // Legacy field kept for backward compat
  counterpart: text("counterpart"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertKeuanganSchema = createInsertSchema(keuangan).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
}).extend({
  amount: z.string().or(z.number()).transform(v => String(v)),
});
export type InsertKeuangan = z.infer<typeof insertKeuanganSchema>;
export type Keuangan = typeof keuangan.$inferSelect;

// ─── Sponsor ──────────────────────────────────────────────────────────────────

export const sponsor = pgTable("sponsor", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  institution: text("institution").notNull(),
  contactPerson: text("contact_person").notNull(),
  status: sponsorStatusEnum("status").notNull().default("prospect"),
  pledgedAmount: numeric("pledged_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  receivedAmount: numeric("received_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertSponsorSchema = createInsertSchema(sponsor).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
}).extend({
  pledgedAmount: z.string().or(z.number()).transform(v => String(v)).optional(),
  receivedAmount: z.string().or(z.number()).transform(v => String(v)).optional(),
});
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type Sponsor = typeof sponsor.$inferSelect;

// ─── Agenda ───────────────────────────────────────────────────────────────────

export const agenda = pgTable("agenda", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  pic: text("pic").notNull(),
  status: agendaStatusEnum("status").notNull().default("upcoming"),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertAgendaSchema = createInsertSchema(agenda).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
});
export type InsertAgenda = z.infer<typeof insertAgendaSchema>;
export type Agenda = typeof agenda.$inferSelect;

// ─── Anggota ──────────────────────────────────────────────────────────────────

export const anggota = pgTable("anggota", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  division: text("division").notNull(),
  status: anggotaStatusEnum("status").notNull().default("active"),
  email: text("email"),
  photoUrl: text("photo_url"),
  accessLevel: roleEnum("access_level").notNull().default("user"),
  userId: integer("user_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertAnggotaSchema = createInsertSchema(anggota).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
});
export type InsertAnggota = z.infer<typeof insertAnggotaSchema>;
export type Anggota = typeof anggota.$inferSelect;

// ─── Relasi ───────────────────────────────────────────────────────────────────

export const relasi = pgTable("relasi", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  institution: text("institution").notNull(),
  role: text("role").notNull(),
  contact: text("contact"),
  status: relasiStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertRelasiSchema = createInsertSchema(relasi).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
});
export type InsertRelasi = z.infer<typeof insertRelasiSchema>;
export type Relasi = typeof relasi.$inferSelect;

// ─── Surat ────────────────────────────────────────────────────────────────────

export const surat = pgTable("surat", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  number: text("number").notNull(),
  date: text("date").notNull(),
  type: suratTypeEnum("type").notNull(),
  status: suratStatusEnum("status").notNull().default("draft"),
  fileUrl: text("file_url"),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertSuratSchema = createInsertSchema(surat).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
});
export type InsertSurat = z.infer<typeof insertSuratSchema>;
export type Surat = typeof surat.$inferSelect;

// ─── Surat Templates ──────────────────────────────────────────────────────────

export const suratTemplates = pgTable("surat_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("all"), // 'masuk' | 'keluar' | 'all'
  imageUrl: text("image_url").notNull(),
  fieldMappings: text("field_mappings").notNull().default("[]"), // JSON string
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSuratTemplateSchema = createInsertSchema(suratTemplates).omit({
  id: true, createdAt: true, updatedAt: true, createdBy: true,
});
export type InsertSuratTemplate = z.infer<typeof insertSuratTemplateSchema>;
export type SuratTemplate = typeof suratTemplates.$inferSelect;

export type FieldMapping = {
  field: "number" | "date" | "title" | "description";
  label: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  maxWidth: number;
  align: "left" | "center" | "right";
  multiline: boolean;
};

// ─── Inventaris ───────────────────────────────────────────────────────────────

export const inventaris = pgTable("inventaris", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(1),
  condition: inventarisConditionEnum("condition").notNull().default("baik"),
  holder: text("holder").notNull(),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertInventarisSchema = createInsertSchema(inventaris).omit({
  id: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: true, updatedBy: true,
});
export type InsertInventaris = z.infer<typeof insertInventarisSchema>;
export type Inventaris = typeof inventaris.$inferSelect;

// ─── Investor Content ─────────────────────────────────────────────────────────

export const investorContent = pgTable("investor_content", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isVisible: boolean("is_visible").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInvestorContentSchema = createInsertSchema(investorContent).omit({
  id: true, createdAt: true, updatedAt: true, createdBy: true, updatedBy: true,
});
export type InsertInvestorContent = z.infer<typeof insertInvestorContentSchema>;
export type InvestorContent = typeof investorContent.$inferSelect;

// ─── AI Reports ───────────────────────────────────────────────────────────────

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  mode: reportModeEnum("mode").notNull(),
  rawInput: text("raw_input").notNull(),
  generatedOutput: text("generated_output").notNull(),
  savedToModule: text("saved_to_module"),
  relatedId: integer("related_id"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true, createdAt: true, createdBy: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// ─── Commit Insights ─────────────────────────────────────────────────────────

export const commitInsights = pgTable("commit_insights", {
  id: serial("id").primaryKey(),
  commitHash: text("commit_hash").notNull().unique(),
  repoName: text("repo_name").notNull(),
  detailedExplanation: text("detailed_explanation"),
  simpleExplanation: text("simple_explanation"),
  mappedFeatureTarget: text("mapped_feature_target"),
  generatedBy: integer("generated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CommitInsight = typeof commitInsights.$inferSelect;

// ─── Commit Reads (per-user read tracking) ────────────────────────────────────

export const commitReads = pgTable("commit_reads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  commitHash: text("commit_hash").notNull(),
  repoName: text("repo_name").notNull(),
  readAt: timestamp("read_at").notNull().defaultNow(),
});

export type CommitRead = typeof commitReads.$inferSelect;

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  recordId: integer("record_id").notNull(),
  action: auditActionEnum("action").notNull(),
  oldData: text("old_data"),
  newData: text("new_data"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
