import { eq, isNull, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, notulensi, fiturTerbaru, keuangan, agenda, anggota, tugas, relasi, surat, suratTemplates, inventaris, investorContent, auditLogs, sponsor, reports,
  type User, type SafeUser, type InsertUser,
  type Notulensi, type InsertNotulensi,
  type FiturTerbaru, type InsertFiturTerbaru,
  type Keuangan, type InsertKeuangan,
  type Agenda, type InsertAgenda,
  type Anggota, type InsertAnggota,
  type Tugas, type InsertTugas,
  type Relasi, type InsertRelasi,
  type Surat, type InsertSurat,
  type SuratTemplate, type InsertSuratTemplate,
  type Inventaris, type InsertInventaris,
  type InvestorContent, type InsertInvestorContent,
  type Sponsor, type InsertSponsor,
  type Report, type InsertReport,
  type AuditLog,
} from "../shared/schema";
import bcrypt from "bcryptjs";

// ─── Interface ─────────────────────────────────────────────────────────────────

export interface IStorage {
  // Users
  getUserById(id: number): Promise<SafeUser | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<SafeUser>;
  listUsers(): Promise<SafeUser[]>;
  updateUser(id: number, data: Partial<Omit<User, "id" | "createdAt">>): Promise<SafeUser | undefined>;

  // Notulensi
  listNotulensi(): Promise<Notulensi[]>;
  getNotulensi(id: number): Promise<Notulensi | undefined>;
  createNotulensi(data: InsertNotulensi, userId: number): Promise<Notulensi>;
  updateNotulensi(id: number, data: Partial<InsertNotulensi>, userId: number): Promise<Notulensi | undefined>;
  deleteNotulensi(id: number, userId: number): Promise<boolean>;

  // Fitur Terbaru
  listFiturTerbaru(): Promise<FiturTerbaru[]>;
  getFiturTerbaru(id: number): Promise<FiturTerbaru | undefined>;
  createFiturTerbaru(data: InsertFiturTerbaru, userId: number): Promise<FiturTerbaru>;
  updateFiturTerbaru(id: number, data: Partial<InsertFiturTerbaru>, userId: number): Promise<FiturTerbaru | undefined>;
  deleteFiturTerbaru(id: number, userId: number): Promise<boolean>;
  listHiddenAutoFiturIds(): Promise<string[]>;
  hideAutoFitur(data: { featureId: string; featureTitle?: string; featureCategory?: string }, userId: number): Promise<boolean>;

  // Keuangan
  listKeuangan(): Promise<Keuangan[]>;
  getKeuangan(id: number): Promise<Keuangan | undefined>;
  createKeuangan(data: InsertKeuangan, userId: number): Promise<Keuangan>;
  updateKeuangan(id: number, data: Partial<InsertKeuangan>, userId: number): Promise<Keuangan | undefined>;
  deleteKeuangan(id: number, userId: number): Promise<boolean>;

  // Sponsor
  listSponsor(): Promise<Sponsor[]>;
  getSponsor(id: number): Promise<Sponsor | undefined>;
  createSponsor(data: InsertSponsor, userId: number): Promise<Sponsor>;
  updateSponsor(id: number, data: Partial<InsertSponsor>, userId: number): Promise<Sponsor | undefined>;
  deleteSponsor(id: number, userId: number): Promise<boolean>;

  // Agenda
  listAgenda(): Promise<Agenda[]>;
  getAgenda(id: number): Promise<Agenda | undefined>;
  createAgenda(data: InsertAgenda, userId: number): Promise<Agenda>;
  updateAgenda(id: number, data: Partial<InsertAgenda>, userId: number): Promise<Agenda | undefined>;
  deleteAgenda(id: number, userId: number): Promise<boolean>;

  // Anggota
  listAnggota(): Promise<Anggota[]>;
  getAnggota(id: number): Promise<Anggota | undefined>;
  createAnggota(data: InsertAnggota, userId: number): Promise<Anggota>;
  updateAnggota(id: number, data: Partial<InsertAnggota>, userId: number): Promise<Anggota | undefined>;
  deleteAnggota(id: number, userId: number): Promise<boolean>;

  // Tugas
  listTugasByAnggota(anggotaId: number): Promise<Tugas[]>;
  getTugas(id: number): Promise<Tugas | undefined>;
  createTugas(data: InsertTugas, userId: number): Promise<Tugas>;
  updateTugas(id: number, data: Partial<InsertTugas>, userId: number): Promise<Tugas | undefined>;
  deleteTugas(id: number): Promise<boolean>;

  // Relasi
  listRelasi(): Promise<Relasi[]>;
  getRelasi(id: number): Promise<Relasi | undefined>;
  createRelasi(data: InsertRelasi, userId: number): Promise<Relasi>;
  updateRelasi(id: number, data: Partial<InsertRelasi>, userId: number): Promise<Relasi | undefined>;
  deleteRelasi(id: number, userId: number): Promise<boolean>;

  // Surat
  listSurat(): Promise<Surat[]>;
  getSurat(id: number): Promise<Surat | undefined>;
  createSurat(data: InsertSurat, userId: number): Promise<Surat>;
  updateSurat(id: number, data: Partial<InsertSurat>, userId: number): Promise<Surat | undefined>;
  deleteSurat(id: number, userId: number): Promise<boolean>;

  // Surat Templates
  listSuratTemplates(): Promise<SuratTemplate[]>;
  getSuratTemplate(id: number): Promise<SuratTemplate | undefined>;
  createSuratTemplate(data: InsertSuratTemplate, userId: number): Promise<SuratTemplate>;
  updateSuratTemplate(id: number, data: Partial<InsertSuratTemplate>, userId: number): Promise<SuratTemplate | undefined>;
  deleteSuratTemplate(id: number): Promise<boolean>;

  // Inventaris
  listInventaris(): Promise<Inventaris[]>;
  getInventaris(id: number): Promise<Inventaris | undefined>;
  createInventaris(data: InsertInventaris, userId: number): Promise<Inventaris>;
  updateInventaris(id: number, data: Partial<InsertInventaris>, userId: number): Promise<Inventaris | undefined>;
  deleteInventaris(id: number, userId: number): Promise<boolean>;

  // Investor Content
  listInvestorContent(): Promise<InvestorContent[]>;
  upsertInvestorContent(key: string, data: Partial<InsertInvestorContent>, userId: number): Promise<InvestorContent>;
  updateInvestorContentVisibility(id: number, isVisible: boolean, userId: number): Promise<InvestorContent | undefined>;

  // Reports
  listReports(userId?: number): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(data: InsertReport, userId: number): Promise<Report>;
  deleteReport(id: number): Promise<boolean>;

  // Audit
  createAuditLog(tableName: string, recordId: number, action: "create" | "update" | "delete", oldData: any, newData: any, userId: number): Promise<void>;
  listAuditLogs(tableName?: string, recordId?: number): Promise<AuditLog[]>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toSafeUser(u: User): SafeUser {
  const { passwordHash, ...safe } = u;
  return safe;
}

const now = () => new Date();
const HIDDEN_AUTO_FITUR_KEY = "hidden_auto_fitur";

function parseHiddenAutoFitur(content?: string | null): { featureId: string; featureTitle?: string; featureCategory?: string }[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") return { featureId: item };
        if (item && typeof item.featureId === "string") return item;
        return null;
      })
      .filter(Boolean) as { featureId: string; featureTitle?: string; featureCategory?: string }[];
  } catch {
    return [];
  }
}

// ─── Implementation ────────────────────────────────────────────────────────────

export class DatabaseStorage implements IStorage {

  // ── Users ──

  async getUserById(id: number) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u ? toSafeUser(u) : undefined;
  }

  async getUserByUsername(username: string) {
    const [u] = await db.select().from(users).where(eq(users.username, username));
    return u;
  }

  async createUser(data: InsertUser) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const [u] = await db.insert(users).values({
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role ?? "user",
      isActive: true,
    }).returning();
    return toSafeUser(u);
  }

  async listUsers() {
    const all = await db.select().from(users).orderBy(desc(users.createdAt));
    return all.map(toSafeUser);
  }

  async updateUser(id: number, data: Partial<Omit<User, "id" | "createdAt">>) {
    const [u] = await db.update(users).set({ ...data, updatedAt: now() }).where(eq(users.id, id)).returning();
    return u ? toSafeUser(u) : undefined;
  }

  // ── Notulensi ──

  async listNotulensi() {
    return db.select().from(notulensi).where(isNull(notulensi.deletedAt)).orderBy(desc(notulensi.createdAt));
  }

  async getNotulensi(id: number) {
    const [n] = await db.select().from(notulensi).where(and(eq(notulensi.id, id), isNull(notulensi.deletedAt)));
    return n;
  }

  async createNotulensi(data: InsertNotulensi, userId: number) {
    const [n] = await db.insert(notulensi).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("notulensi", n.id, "create", null, n, userId);
    return n;
  }

  async updateNotulensi(id: number, data: Partial<InsertNotulensi>, userId: number) {
    const old = await this.getNotulensi(id);
    const [n] = await db.update(notulensi).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(notulensi.id, id)).returning();
    if (n) await this.createAuditLog("notulensi", id, "update", old, n, userId);
    return n;
  }

  async deleteNotulensi(id: number, userId: number) {
    const old = await this.getNotulensi(id);
    const [n] = await db.update(notulensi).set({ deletedAt: now(), updatedBy: userId }).where(eq(notulensi.id, id)).returning();
    if (n) await this.createAuditLog("notulensi", id, "delete", old, null, userId);
    return !!n;
  }

  // ── Fitur Terbaru ──

  async listFiturTerbaru() {
    return db.select().from(fiturTerbaru).where(isNull(fiturTerbaru.deletedAt)).orderBy(desc(fiturTerbaru.createdAt));
  }

  async getFiturTerbaru(id: number) {
    const [f] = await db.select().from(fiturTerbaru).where(and(eq(fiturTerbaru.id, id), isNull(fiturTerbaru.deletedAt)));
    return f;
  }

  async createFiturTerbaru(data: InsertFiturTerbaru, userId: number) {
    const [f] = await db.insert(fiturTerbaru).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("fitur_terbaru", f.id, "create", null, f, userId);
    return f;
  }

  async updateFiturTerbaru(id: number, data: Partial<InsertFiturTerbaru>, userId: number) {
    const old = await this.getFiturTerbaru(id);
    const [f] = await db.update(fiturTerbaru).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(fiturTerbaru.id, id)).returning();
    if (f) await this.createAuditLog("fitur_terbaru", id, "update", old, f, userId);
    return f;
  }

  async deleteFiturTerbaru(id: number, userId: number) {
    const old = await this.getFiturTerbaru(id);
    const [f] = await db.update(fiturTerbaru).set({ deletedAt: now(), updatedBy: userId }).where(eq(fiturTerbaru.id, id)).returning();
    if (f) await this.createAuditLog("fitur_terbaru", id, "delete", old, null, userId);
    return !!f;
  }

  async listHiddenAutoFiturIds() {
    const [row] = await db.select().from(investorContent).where(eq(investorContent.key, HIDDEN_AUTO_FITUR_KEY)).limit(1);
    return parseHiddenAutoFitur(row?.content).map((item) => item.featureId);
  }

  async hideAutoFitur(data: { featureId: string; featureTitle?: string; featureCategory?: string }, userId: number) {
    const [old] = await db.select().from(investorContent).where(eq(investorContent.key, HIDDEN_AUTO_FITUR_KEY)).limit(1);
    const hidden = parseHiddenAutoFitur(old?.content);
    if (!hidden.some((item) => item.featureId === data.featureId)) {
      hidden.push(data);
    }
    const payload = {
      title: "Hidden Auto Fitur",
      content: JSON.stringify(hidden),
      isVisible: false,
      order: 0,
      updatedBy: userId,
      updatedAt: now(),
    };
    const [row] = old
      ? await db.update(investorContent).set(payload).where(eq(investorContent.key, HIDDEN_AUTO_FITUR_KEY)).returning()
      : await db.insert(investorContent).values({ key: HIDDEN_AUTO_FITUR_KEY, ...payload, createdBy: userId }).returning();
    if (row) await this.createAuditLog("hidden_auto_fitur", row.id, "delete", old, row, userId);
    return !!row;
  }

  // ── Keuangan ──

  async listKeuangan() {
    return db.select().from(keuangan).where(isNull(keuangan.deletedAt)).orderBy(desc(keuangan.createdAt));
  }

  async getKeuangan(id: number) {
    const [k] = await db.select().from(keuangan).where(and(eq(keuangan.id, id), isNull(keuangan.deletedAt)));
    return k;
  }

  async createKeuangan(data: InsertKeuangan, userId: number) {
    const [k] = await db.insert(keuangan).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("keuangan", k.id, "create", null, k, userId);
    return k;
  }

  async updateKeuangan(id: number, data: Partial<InsertKeuangan>, userId: number) {
    const old = await this.getKeuangan(id);
    const [k] = await db.update(keuangan).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(keuangan.id, id)).returning();
    if (k) await this.createAuditLog("keuangan", id, "update", old, k, userId);
    return k;
  }

  async deleteKeuangan(id: number, userId: number) {
    const old = await this.getKeuangan(id);
    const [k] = await db.update(keuangan).set({ deletedAt: now(), updatedBy: userId }).where(eq(keuangan.id, id)).returning();
    if (k) await this.createAuditLog("keuangan", id, "delete", old, null, userId);
    return !!k;
  }

  // ── Sponsor ──

  async listSponsor() {
    return db.select().from(sponsor).where(isNull(sponsor.deletedAt)).orderBy(desc(sponsor.createdAt));
  }

  async getSponsor(id: number) {
    const [s] = await db.select().from(sponsor).where(and(eq(sponsor.id, id), isNull(sponsor.deletedAt)));
    return s;
  }

  async createSponsor(data: InsertSponsor, userId: number) {
    const [s] = await db.insert(sponsor).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("sponsor", s.id, "create", null, s, userId);
    return s;
  }

  async updateSponsor(id: number, data: Partial<InsertSponsor>, userId: number) {
    const old = await this.getSponsor(id);
    const [s] = await db.update(sponsor).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(sponsor.id, id)).returning();
    if (s) await this.createAuditLog("sponsor", id, "update", old, s, userId);
    return s;
  }

  async deleteSponsor(id: number, userId: number) {
    const old = await this.getSponsor(id);
    const [s] = await db.update(sponsor).set({ deletedAt: now(), updatedBy: userId }).where(eq(sponsor.id, id)).returning();
    if (s) await this.createAuditLog("sponsor", id, "delete", old, null, userId);
    return !!s;
  }

  // ── Agenda ──

  async listAgenda() {
    return db.select().from(agenda).where(isNull(agenda.deletedAt)).orderBy(desc(agenda.date));
  }

  async getAgenda(id: number) {
    const [a] = await db.select().from(agenda).where(and(eq(agenda.id, id), isNull(agenda.deletedAt)));
    return a;
  }

  async createAgenda(data: InsertAgenda, userId: number) {
    const [a] = await db.insert(agenda).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("agenda", a.id, "create", null, a, userId);
    return a;
  }

  async updateAgenda(id: number, data: Partial<InsertAgenda>, userId: number) {
    const old = await this.getAgenda(id);
    const [a] = await db.update(agenda).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(agenda.id, id)).returning();
    if (a) await this.createAuditLog("agenda", id, "update", old, a, userId);
    return a;
  }

  async deleteAgenda(id: number, userId: number) {
    const old = await this.getAgenda(id);
    const [a] = await db.update(agenda).set({ deletedAt: now(), updatedBy: userId }).where(eq(agenda.id, id)).returning();
    if (a) await this.createAuditLog("agenda", id, "delete", old, null, userId);
    return !!a;
  }

  // ── Anggota ──

  async listAnggota() {
    return db.select().from(anggota).where(isNull(anggota.deletedAt)).orderBy(desc(anggota.createdAt));
  }

  async getAnggota(id: number) {
    const [a] = await db.select().from(anggota).where(and(eq(anggota.id, id), isNull(anggota.deletedAt)));
    return a;
  }

  async createAnggota(data: InsertAnggota, userId: number) {
    const [a] = await db.insert(anggota).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("anggota", a.id, "create", null, a, userId);
    return a;
  }

  async updateAnggota(id: number, data: Partial<InsertAnggota>, userId: number) {
    const old = await this.getAnggota(id);
    const [a] = await db.update(anggota).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(anggota.id, id)).returning();
    if (a) await this.createAuditLog("anggota", id, "update", old, a, userId);
    return a;
  }

  async deleteAnggota(id: number, userId: number) {
    const old = await this.getAnggota(id);
    const [a] = await db.update(anggota).set({ deletedAt: now(), updatedBy: userId }).where(eq(anggota.id, id)).returning();
    if (a) await this.createAuditLog("anggota", id, "delete", old, null, userId);
    return !!a;
  }

  // ── Tugas ──

  async listTugasByAnggota(anggotaId: number) {
    return db.select().from(tugas).where(and(eq(tugas.anggotaId, anggotaId), isNull(tugas.deletedAt))).orderBy(desc(tugas.createdAt));
  }

  async getTugas(id: number) {
    const [t] = await db.select().from(tugas).where(and(eq(tugas.id, id), isNull(tugas.deletedAt)));
    return t;
  }

  async createTugas(data: InsertTugas, userId: number) {
    const [t] = await db.insert(tugas).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    return t;
  }

  async updateTugas(id: number, data: Partial<InsertTugas>, userId: number) {
    const [t] = await db.update(tugas).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(tugas.id, id)).returning();
    return t;
  }

  async deleteTugas(id: number) {
    const [t] = await db.update(tugas).set({ deletedAt: now() }).where(eq(tugas.id, id)).returning();
    return !!t;
  }

  // ── Relasi ──

  async listRelasi() {
    return db.select().from(relasi).where(isNull(relasi.deletedAt)).orderBy(desc(relasi.createdAt));
  }

  async getRelasi(id: number) {
    const [r] = await db.select().from(relasi).where(and(eq(relasi.id, id), isNull(relasi.deletedAt)));
    return r;
  }

  async createRelasi(data: InsertRelasi, userId: number) {
    const [r] = await db.insert(relasi).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("relasi", r.id, "create", null, r, userId);
    return r;
  }

  async updateRelasi(id: number, data: Partial<InsertRelasi>, userId: number) {
    const old = await this.getRelasi(id);
    const [r] = await db.update(relasi).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(relasi.id, id)).returning();
    if (r) await this.createAuditLog("relasi", id, "update", old, r, userId);
    return r;
  }

  async deleteRelasi(id: number, userId: number) {
    const old = await this.getRelasi(id);
    const [r] = await db.update(relasi).set({ deletedAt: now(), updatedBy: userId }).where(eq(relasi.id, id)).returning();
    if (r) await this.createAuditLog("relasi", id, "delete", old, null, userId);
    return !!r;
  }

  // ── Surat ──

  async listSurat() {
    return db.select().from(surat).where(isNull(surat.deletedAt)).orderBy(desc(surat.createdAt));
  }

  async getSurat(id: number) {
    const [s] = await db.select().from(surat).where(and(eq(surat.id, id), isNull(surat.deletedAt)));
    return s;
  }

  async createSurat(data: InsertSurat, userId: number) {
    const [s] = await db.insert(surat).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("surat", s.id, "create", null, s, userId);
    return s;
  }

  async updateSurat(id: number, data: Partial<InsertSurat>, userId: number) {
    const old = await this.getSurat(id);
    const [s] = await db.update(surat).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(surat.id, id)).returning();
    if (s) await this.createAuditLog("surat", id, "update", old, s, userId);
    return s;
  }

  async deleteSurat(id: number, userId: number) {
    const old = await this.getSurat(id);
    const [s] = await db.update(surat).set({ deletedAt: now(), updatedBy: userId }).where(eq(surat.id, id)).returning();
    if (s) await this.createAuditLog("surat", id, "delete", old, null, userId);
    return !!s;
  }

  // ── Surat Templates ──

  async listSuratTemplates() {
    return db.select().from(suratTemplates).orderBy(desc(suratTemplates.createdAt));
  }

  async getSuratTemplate(id: number) {
    const [t] = await db.select().from(suratTemplates).where(eq(suratTemplates.id, id));
    return t;
  }

  async createSuratTemplate(data: InsertSuratTemplate, userId: number) {
    const [t] = await db.insert(suratTemplates).values({ ...data, createdBy: userId }).returning();
    return t;
  }

  async updateSuratTemplate(id: number, data: Partial<InsertSuratTemplate>, userId: number) {
    const [t] = await db.update(suratTemplates).set({ ...data, updatedAt: now() }).where(eq(suratTemplates.id, id)).returning();
    return t;
  }

  async deleteSuratTemplate(id: number) {
    const result = await db.delete(suratTemplates).where(eq(suratTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ── Inventaris ──

  async listInventaris() {
    return db.select().from(inventaris).where(isNull(inventaris.deletedAt)).orderBy(desc(inventaris.createdAt));
  }

  async getInventaris(id: number) {
    const [i] = await db.select().from(inventaris).where(and(eq(inventaris.id, id), isNull(inventaris.deletedAt)));
    return i;
  }

  async createInventaris(data: InsertInventaris, userId: number) {
    const [i] = await db.insert(inventaris).values({ ...data, createdBy: userId, updatedBy: userId }).returning();
    await this.createAuditLog("inventaris", i.id, "create", null, i, userId);
    return i;
  }

  async updateInventaris(id: number, data: Partial<InsertInventaris>, userId: number) {
    const old = await this.getInventaris(id);
    const [i] = await db.update(inventaris).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(inventaris.id, id)).returning();
    if (i) await this.createAuditLog("inventaris", id, "update", old, i, userId);
    return i;
  }

  async deleteInventaris(id: number, userId: number) {
    const old = await this.getInventaris(id);
    const [i] = await db.update(inventaris).set({ deletedAt: now(), updatedBy: userId }).where(eq(inventaris.id, id)).returning();
    if (i) await this.createAuditLog("inventaris", id, "delete", old, null, userId);
    return !!i;
  }

  // ── Investor Content ──

  async listInvestorContent() {
    return db.select().from(investorContent).orderBy(investorContent.order);
  }

  async upsertInvestorContent(key: string, data: Partial<InsertInvestorContent>, userId: number) {
    const existing = await db.select().from(investorContent).where(eq(investorContent.key, key));
    if (existing.length > 0) {
      const [c] = await db.update(investorContent).set({ ...data, updatedBy: userId, updatedAt: now() }).where(eq(investorContent.key, key)).returning();
      return c;
    } else {
      const [c] = await db.insert(investorContent).values({ key, title: data.title ?? key, content: data.content ?? "", isVisible: data.isVisible ?? true, order: data.order ?? 0, createdBy: userId, updatedBy: userId }).returning();
      return c;
    }
  }

  async updateInvestorContentVisibility(id: number, isVisible: boolean, userId: number) {
    const [c] = await db.update(investorContent).set({ isVisible, updatedBy: userId, updatedAt: now() }).where(eq(investorContent.id, id)).returning();
    return c;
  }

  // ── Reports ──

  async listReports(userId?: number) {
    if (userId) {
      return db.select().from(reports).where(eq(reports.createdBy, userId)).orderBy(desc(reports.createdAt));
    }
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReport(id: number) {
    const [r] = await db.select().from(reports).where(eq(reports.id, id));
    return r;
  }

  async createReport(data: InsertReport, userId: number) {
    const [r] = await db.insert(reports).values({ ...data, createdBy: userId }).returning();
    return r;
  }

  async deleteReport(id: number) {
    const [r] = await db.delete(reports).where(eq(reports.id, id)).returning();
    return !!r;
  }

  // ── Audit Logs ──

  async createAuditLog(tableName: string, recordId: number, action: "create" | "update" | "delete", oldData: any, newData: any, userId: number) {
    await db.insert(auditLogs).values({
      tableName,
      recordId,
      action,
      oldData: oldData ? JSON.stringify(oldData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      userId,
    });
  }

  async listAuditLogs(tableName?: string, recordId?: number) {
    if (tableName && recordId) {
      return db.select().from(auditLogs).where(and(eq(auditLogs.tableName, tableName), eq(auditLogs.recordId, recordId))).orderBy(desc(auditLogs.createdAt));
    }
    if (tableName) {
      return db.select().from(auditLogs).where(eq(auditLogs.tableName, tableName)).orderBy(desc(auditLogs.createdAt));
    }
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  }
}

export const storage = new DatabaseStorage();
