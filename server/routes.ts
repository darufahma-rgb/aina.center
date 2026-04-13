import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, requireAdmin } from "./auth";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function uploadAvatarToSupabase(filePath: string, filename: string, mimeType: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filename, fileBuffer, { contentType: mimeType, upsert: true });
  if (error) { console.error("Supabase upload error:", error.message); return null; }
  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filename);
  return publicUrl;
}
import { storage } from "./storage";
import {
  insertNotulensiSchema,
  insertFiturTerbaruSchema,
  insertKeuanganSchema,
  insertAgendaSchema,
  insertAnggotaSchema,
  insertRelasiSchema,
  insertSuratSchema,
  insertInventarisSchema,
  insertInvestorContentSchema,
  insertUserSchema,
  insertSponsorSchema,
  commitInsights,
  commitReads,
} from "../shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import { generateReport, type ReportMode } from "./aiReport";
import { z } from "zod";

const uploadsDir = process.env.NODE_ENV === "production"
  ? "/tmp/uploads"
  : path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `avatar-${(req as any).session?.userId ?? "u"}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

export function registerRoutes(app: Router) {

  // ── Auth ────────────────────────────────────────────────────────────────────

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = user.id;
    req.session.userRole = user.role;
    const { passwordHash, ...safe } = user;
    return res.json(safe);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(user);
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const schema = z.object({
      displayName: z.string().min(1).max(60).optional(),
      avatarUrl: z.string().url().max(500).or(z.literal("")).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const updated = await storage.updateUser(userId, parsed.data);
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(updated);
  });

  app.post("/api/auth/profile/avatar", requireAuth, (req, res) => {
    avatarUpload.single("avatar")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      let avatarUrl = `/uploads/${req.file.filename}`;

      const supabaseUrl = await uploadAvatarToSupabase(
        req.file.path,
        req.file.filename,
        req.file.mimetype,
      );
      if (supabaseUrl) {
        avatarUrl = supabaseUrl;
        try { fs.unlinkSync(req.file.path); } catch {}
      }

      const updated = await storage.updateUser(req.session.userId!, { avatarUrl });
      res.json(updated);
    });
  });

  // ── Users (admin only) ──────────────────────────────────────────────────────

  app.get("/api/users", requireAdmin, async (req, res) => {
    res.json(await storage.listUsers());
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    try {
      const user = await storage.createUser(parsed.data);
      res.status(201).json(user);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { role, isActive, username, email } = req.body;
    // Prevent admin from demoting or deactivating themselves
    if (id === req.session.userId) {
      if (role !== undefined && role !== req.session.userRole) {
        return res.status(403).json({ message: "Cannot change your own role" });
      }
      if (isActive === false) {
        return res.status(403).json({ message: "Cannot deactivate your own account" });
      }
    }
    const updates: Record<string, any> = {};
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    const user = await storage.updateUser(id, updates);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (id === req.session.userId) {
      return res.status(403).json({ message: "Cannot delete your own account" });
    }
    const user = await storage.updateUser(id, { isActive: false });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deactivated" });
  });

  app.get("/api/users/map", requireAuth, async (req, res) => {
    const users = await storage.listUsers();
    const map: Record<number, string> = {};
    users.forEach(u => { map[u.id] = u.username; });
    res.json(map);
  });

  // ── Notulensi ───────────────────────────────────────────────────────────────

  app.get("/api/notulensi", requireAuth, async (req, res) => {
    res.json(await storage.listNotulensi());
  });

  app.get("/api/notulensi/:id", requireAuth, async (req, res) => {
    const n = await storage.getNotulensi(parseInt(req.params.id));
    if (!n) return res.status(404).json({ message: "Not found" });
    res.json(n);
  });

  app.post("/api/notulensi", requireAdmin, async (req, res) => {
    const parsed = insertNotulensiSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const n = await storage.createNotulensi(parsed.data, req.session.userId!);
    res.status(201).json(n);
  });

  app.patch("/api/notulensi/:id", requireAdmin, async (req, res) => {
    const n = await storage.updateNotulensi(parseInt(req.params.id), req.body, req.session.userId!);
    if (!n) return res.status(404).json({ message: "Not found" });
    res.json(n);
  });

  app.delete("/api/notulensi/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteNotulensi(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Fitur Terbaru ───────────────────────────────────────────────────────────

  app.get("/api/fitur", requireAuth, async (req, res) => {
    res.json(await storage.listFiturTerbaru());
  });

  app.get("/api/fitur/:id", requireAuth, async (req, res) => {
    const f = await storage.getFiturTerbaru(parseInt(req.params.id));
    if (!f) return res.status(404).json({ message: "Not found" });
    res.json(f);
  });

  app.post("/api/fitur", requireAdmin, async (req, res) => {
    const parsed = insertFiturTerbaruSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const f = await storage.createFiturTerbaru(parsed.data, req.session.userId!);
    res.status(201).json(f);
  });

  app.patch("/api/fitur/:id", requireAdmin, async (req, res) => {
    const f = await storage.updateFiturTerbaru(parseInt(req.params.id), req.body, req.session.userId!);
    if (!f) return res.status(404).json({ message: "Not found" });
    res.json(f);
  });

  app.delete("/api/fitur/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteFiturTerbaru(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Keuangan ────────────────────────────────────────────────────────────────

  app.get("/api/keuangan", requireAuth, async (req, res) => {
    res.json(await storage.listKeuangan());
  });

  app.get("/api/keuangan/:id", requireAuth, async (req, res) => {
    const k = await storage.getKeuangan(parseInt(req.params.id));
    if (!k) return res.status(404).json({ message: "Not found" });
    res.json(k);
  });

  app.post("/api/keuangan", requireAdmin, async (req, res) => {
    const parsed = insertKeuanganSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const k = await storage.createKeuangan(parsed.data, req.session.userId!);
    res.status(201).json(k);
  });

  app.patch("/api/keuangan/:id", requireAdmin, async (req, res) => {
    const k = await storage.updateKeuangan(parseInt(req.params.id), req.body, req.session.userId!);
    if (!k) return res.status(404).json({ message: "Not found" });
    res.json(k);
  });

  app.delete("/api/keuangan/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteKeuangan(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Sponsor ─────────────────────────────────────────────────────────────────

  app.get("/api/sponsor", requireAuth, async (req, res) => {
    res.json(await storage.listSponsor());
  });

  app.get("/api/sponsor/:id", requireAuth, async (req, res) => {
    const s = await storage.getSponsor(parseInt(req.params.id));
    if (!s) return res.status(404).json({ message: "Not found" });
    res.json(s);
  });

  app.post("/api/sponsor", requireAdmin, async (req, res) => {
    const parsed = insertSponsorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const s = await storage.createSponsor(parsed.data, req.session.userId!);
    res.status(201).json(s);
  });

  app.patch("/api/sponsor/:id", requireAdmin, async (req, res) => {
    const s = await storage.updateSponsor(parseInt(req.params.id), req.body, req.session.userId!);
    if (!s) return res.status(404).json({ message: "Not found" });
    res.json(s);
  });

  app.delete("/api/sponsor/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteSponsor(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── AI Report ────────────────────────────────────────────────────────────────

  app.post("/api/ai-report/generate", requireAuth, requireAdmin, async (req, res) => {
    const { rawText, mode } = req.body as { rawText: string; mode: ReportMode };
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ message: "rawText diperlukan." });
    }
    const validModes: ReportMode[] = ["notulensi", "progress", "investor", "summary"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ message: "mode tidak valid." });
    }
    try {
      const result = await generateReport(rawText, mode);
      res.json(result);
    } catch (e: any) {
      res.status(422).json({ message: e.message ?? "Gagal memproses teks." });
    }
  });

  app.get("/api/reports", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const isAdmin = req.session.userRole === "admin";
    // Admins see all reports; regular users see their own
    const list = await storage.listReports(isAdmin ? undefined : userId);
    res.json(list);
  });

  app.get("/api/reports/:id", requireAuth, async (req, res) => {
    const r = await storage.getReport(parseInt(req.params.id));
    if (!r) return res.status(404).json({ message: "Not found" });
    // Check ownership
    if (req.session.userRole !== "admin" && r.createdBy !== req.session.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(r);
  });

  app.post("/api/reports", requireAuth, async (req, res) => {
    const { title, mode, rawInput, generatedOutput, savedToModule, relatedId } = req.body;
    if (!title || !mode || !rawInput || !generatedOutput) {
      return res.status(400).json({ message: "Field wajib tidak lengkap." });
    }
    const r = await storage.createReport(
      { title, mode, rawInput, generatedOutput, savedToModule: savedToModule ?? null, relatedId: relatedId ?? null },
      req.session.userId!
    );
    res.status(201).json(r);
  });

  app.delete("/api/reports/:id", requireAuth, async (req, res) => {
    const r = await storage.getReport(parseInt(req.params.id));
    if (!r) return res.status(404).json({ message: "Not found" });
    if (req.session.userRole !== "admin" && r.createdBy !== req.session.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const ok = await storage.deleteReport(parseInt(req.params.id));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Finance Summary (investor-safe) ─────────────────────────────────────────

  app.get("/api/finance/summary", requireAuth, async (req, res) => {
    const [allKeuangan, allSponsor] = await Promise.all([
      storage.listKeuangan(),
      storage.listSponsor(),
    ]);
    const isAdmin = req.session.userRole === "admin";
    const totalIncome = allKeuangan.filter(k => k.type === "income").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
    const totalExpense = allKeuangan.filter(k => k.type === "expense").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
    const totalPledged = allSponsor.reduce((s, sp) => s + parseFloat(sp.pledgedAmount.toString()), 0);
    const totalReceived = allSponsor.reduce((s, sp) => s + parseFloat(sp.receivedAmount.toString()), 0);
    const activeSponsor = allSponsor.filter(sp => ["confirmed", "active"].includes(sp.status)).length;

    // Build monthly trend (last 6 months label buckets from date field)
    const monthlyMap: Record<string, { income: number; expense: number }> = {};
    allKeuangan.forEach(k => {
      const month = k.date.substring(0, 7); // Try ISO "YYYY-MM" or just use first 7 chars
      if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 };
      const amt = parseFloat(k.amount.toString());
      if (k.type === "income") monthlyMap[month].income += amt;
      else monthlyMap[month].expense += amt;
    });

    const summary = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      totalPledged,
      totalReceived,
      activeSponsor,
      totalSponsor: allSponsor.length,
      monthlyTrend: monthlyMap,
      // For investor mode: only summary, no raw transactions
      recentTransactions: isAdmin ? allKeuangan.slice(0, 5) : [],
      sponsorList: isAdmin ? allSponsor : allSponsor.map(sp => ({
        id: sp.id, name: sp.name, institution: sp.institution, status: sp.status,
        pledgedAmount: sp.pledgedAmount, receivedAmount: sp.receivedAmount,
      })),
    };
    res.json(summary);
  });

  // ── Agenda ──────────────────────────────────────────────────────────────────

  app.get("/api/agenda", requireAuth, async (req, res) => {
    res.json(await storage.listAgenda());
  });

  // Fetch AIGYPT news as completed agenda items from external Supabase
  app.get("/api/aigypt/berita", requireAuth, async (req, res) => {
    try {
      const url  = process.env.AIGYPT_SUPABASE_URL;
      const key  = process.env.AIGYPT_SUPABASE_ANON_KEY;
      if (!url || !key) return res.status(503).json({ error: "AIGYPT Supabase not configured." });

      const resp = await fetch(
        `${url}/rest/v1/masisir_news?is_active=eq.true&order=published_at.desc&limit=50`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      if (!resp.ok) return res.status(resp.status).json({ error: "Gagal mengambil data berita AIGYPT." });

      const rows: any[] = await resp.json();
      const items = rows.map((r) => ({
        id:          r.id,
        title:       r.title,
        date:        r.published_at
          ? new Date(r.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
          : "-",
        published_at: r.published_at,
        image_url:   r.image_url ?? null,
        category:    r.category ?? "aigypt",
        summary:     (r.content as string | null)?.split("\n")[0]?.slice(0, 200) ?? "",
        status:      "completed" as const,
        source:      "aigypt",
      }));
      res.json(items);
    } catch (err: any) {
      console.error("AIGYPT berita error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/agenda/:id", requireAuth, async (req, res) => {
    const a = await storage.getAgenda(parseInt(req.params.id));
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json(a);
  });

  app.post("/api/agenda", requireAdmin, async (req, res) => {
    const parsed = insertAgendaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const a = await storage.createAgenda(parsed.data, req.session.userId!);
    res.status(201).json(a);
  });

  app.patch("/api/agenda/:id", requireAdmin, async (req, res) => {
    const a = await storage.updateAgenda(parseInt(req.params.id), req.body, req.session.userId!);
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json(a);
  });

  app.delete("/api/agenda/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteAgenda(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Anggota ─────────────────────────────────────────────────────────────────

  app.get("/api/anggota", requireAuth, async (req, res) => {
    res.json(await storage.listAnggota());
  });

  app.get("/api/anggota/:id", requireAuth, async (req, res) => {
    const a = await storage.getAnggota(parseInt(req.params.id));
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json(a);
  });

  app.post("/api/anggota", requireAdmin, async (req, res) => {
    const parsed = insertAnggotaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const a = await storage.createAnggota(parsed.data, req.session.userId!);
    res.status(201).json(a);
  });

  app.patch("/api/anggota/:id", requireAdmin, async (req, res) => {
    const a = await storage.updateAnggota(parseInt(req.params.id), req.body, req.session.userId!);
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json(a);
  });

  app.delete("/api/anggota/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteAnggota(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Relasi ──────────────────────────────────────────────────────────────────

  app.get("/api/relasi", requireAuth, async (req, res) => {
    res.json(await storage.listRelasi());
  });

  app.get("/api/relasi/:id", requireAuth, async (req, res) => {
    const r = await storage.getRelasi(parseInt(req.params.id));
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json(r);
  });

  app.post("/api/relasi", requireAdmin, async (req, res) => {
    const parsed = insertRelasiSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const r = await storage.createRelasi(parsed.data, req.session.userId!);
    res.status(201).json(r);
  });

  app.patch("/api/relasi/:id", requireAdmin, async (req, res) => {
    const r = await storage.updateRelasi(parseInt(req.params.id), req.body, req.session.userId!);
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json(r);
  });

  app.delete("/api/relasi/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteRelasi(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Surat ───────────────────────────────────────────────────────────────────

  app.get("/api/surat", requireAuth, async (req, res) => {
    res.json(await storage.listSurat());
  });

  app.get("/api/surat/:id", requireAuth, async (req, res) => {
    const s = await storage.getSurat(parseInt(req.params.id));
    if (!s) return res.status(404).json({ message: "Not found" });
    res.json(s);
  });

  app.post("/api/surat", requireAdmin, async (req, res) => {
    const parsed = insertSuratSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const s = await storage.createSurat(parsed.data, req.session.userId!);
    res.status(201).json(s);
  });

  app.patch("/api/surat/:id", requireAdmin, async (req, res) => {
    const s = await storage.updateSurat(parseInt(req.params.id), req.body, req.session.userId!);
    if (!s) return res.status(404).json({ message: "Not found" });
    res.json(s);
  });

  app.delete("/api/surat/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteSurat(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Inventaris ──────────────────────────────────────────────────────────────

  app.get("/api/inventaris", requireAuth, async (req, res) => {
    res.json(await storage.listInventaris());
  });

  app.get("/api/inventaris/:id", requireAuth, async (req, res) => {
    const i = await storage.getInventaris(parseInt(req.params.id));
    if (!i) return res.status(404).json({ message: "Not found" });
    res.json(i);
  });

  app.post("/api/inventaris", requireAdmin, async (req, res) => {
    const parsed = insertInventarisSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const i = await storage.createInventaris(parsed.data, req.session.userId!);
    res.status(201).json(i);
  });

  app.patch("/api/inventaris/:id", requireAdmin, async (req, res) => {
    const i = await storage.updateInventaris(parseInt(req.params.id), req.body, req.session.userId!);
    if (!i) return res.status(404).json({ message: "Not found" });
    res.json(i);
  });

  app.delete("/api/inventaris/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteInventaris(parseInt(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  });

  // ── Investor Content ────────────────────────────────────────────────────────

  app.get("/api/investor-content", requireAuth, async (req, res) => {
    const all = await storage.listInvestorContent();
    const isAdmin = req.session.userRole === "admin";
    // _config key is always shared so non-admin presentation respects admin settings
    res.json(isAdmin ? all : all.filter(c => c.isVisible || c.key === "_config"));
  });

  app.put("/api/investor-content/:key", requireAdmin, async (req, res) => {
    const c = await storage.upsertInvestorContent(req.params.key, req.body, req.session.userId!);
    res.json(c);
  });

  app.patch("/api/investor-content/:id/visibility", requireAdmin, async (req, res) => {
    const { isVisible } = req.body;
    const c = await storage.updateInvestorContentVisibility(parseInt(req.params.id), isVisible, req.session.userId!);
    if (!c) return res.status(404).json({ message: "Not found" });
    res.json(c);
  });

  // ── Dashboard Summary ───────────────────────────────────────────────────────

  app.get("/api/dashboard", requireAuth, async (req, res) => {
    const [allNotulensi, allAgenda, allFitur, allKeuangan, allAnggota, allSurat, allInventaris, allRelasi] = await Promise.all([
      storage.listNotulensi(),
      storage.listAgenda(),
      storage.listFiturTerbaru(),
      storage.listKeuangan(),
      storage.listAnggota(),
      storage.listSurat(),
      storage.listInventaris(),
      storage.listRelasi(),
    ]);

    const now = new Date();
    const weekAgo      = new Date(now.getTime() - 7  * 86400000);
    const twoWeeksAgo  = new Date(now.getTime() - 14 * 86400000);
    const monthAgo     = new Date(now.getTime() - 30 * 86400000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 86400000);

    const afterDate  = (d: string | Date, from: Date) => new Date(d) >= from;
    const betweenDate = (d: string | Date, from: Date, to: Date) => new Date(d) >= from && new Date(d) < to;

    // ── Week-over-week notulensi ──
    const notulensiThisWeek = allNotulensi.filter(n => afterDate(n.createdAt, weekAgo)).length;
    const notulensiLastWeek = allNotulensi.filter(n => betweenDate(n.createdAt, twoWeeksAgo, weekAgo)).length;
    const finalNotulensi = allNotulensi.filter(n => n.status === "final").length;

    // ── Month-over-month agenda created ──
    const agendaThisMonth = allAgenda.filter(a => afterDate(a.createdAt, monthAgo)).length;
    const agendaLastMonth = allAgenda.filter(a => betweenDate(a.createdAt, twoMonthsAgo, monthAgo)).length;

    // ── This calendar month agenda (by event date) ──
    const calYear = now.getFullYear();
    const calMonth = now.getMonth();
    const parseAgendaDate = (d: string | null | undefined): Date | null => {
      if (!d) return null;
      try {
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch { /* ignore */ }
      return null;
    };
    const agendaThisCalMonthList = allAgenda.filter(a => {
      const d = parseAgendaDate(a.date);
      return d && d.getFullYear() === calYear && d.getMonth() === calMonth;
    });
    const agendaThisCalMonth = agendaThisCalMonthList.length;
    const agendaCompletedThisCalMonth = agendaThisCalMonthList.filter(a => a.status === "completed").length;

    // ── Feature stats ──
    const fiturThisMonth  = allFitur.filter(f => afterDate(f.createdAt, monthAgo)).length;
    const completedFitur  = allFitur.filter(f => f.status === "completed").length;
    const inProgressFitur = allFitur.filter(f => f.status === "in_progress").length;
    const categoryCounts  = allFitur.reduce((acc, f) => { acc[f.category] = (acc[f.category] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const topCategory     = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // ── Month-over-month financials ──
    const sumKeuangan = (type: string, from: Date, to?: Date) =>
      allKeuangan
        .filter(k => k.type === type && (to ? betweenDate(k.createdAt, from, to) : afterDate(k.createdAt, from)))
        .reduce((s, k) => s + parseFloat(k.amount.toString()), 0);

    const totalIncome      = allKeuangan.filter(k => k.type === "income").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
    const totalExpense     = allKeuangan.filter(k => k.type === "expense").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
    const incomeThisMonth  = sumKeuangan("income",  monthAgo);
    const incomeLastMonth  = sumKeuangan("income",  twoMonthsAgo, monthAgo);
    const expenseThisMonth = sumKeuangan("expense", monthAgo);
    const expenseLastMonth = sumKeuangan("expense", twoMonthsAgo, monthAgo);

    res.json({
      totalAnggota: allAnggota.filter(a => a.status === "active").length,
      totalAnggotaAll: allAnggota.length,
      upcomingAgenda: allAgenda.filter(a => a.status === "upcoming").length,
      totalNotulensi: allNotulensi.length,
      finalNotulensi,
      draftNotulensi: allNotulensi.filter(n => n.status === "draft").length,
      totalSurat: allSurat.length,
      totalInventaris: allInventaris.length,
      totalRelasi: allRelasi.length,
      saldoTersedia: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      recentNotulensi: allNotulensi.slice(0, 5),
      upcomingAgendaList: allAgenda.filter(a => a.status === "upcoming").slice(0, 5),
      agendaThisCalMonthList: agendaThisCalMonthList.slice(0, 8),
      agendaThisCalMonth,
      agendaCompletedThisCalMonth,
      allAgendaList: allAgenda.slice(0, 10),
      latestFitur: allFitur.slice(0, 5),
      recentKeuangan: allKeuangan.slice(0, 8),
      anggotaList: allAnggota.filter(a => a.status === "active").slice(0, 10),
      // ── Insight data ──
      insights: {
        notulensiThisWeek,
        notulensiLastWeek,
        agendaThisMonth,
        agendaLastMonth,
        agendaThisCalMonth,
        agendaCompletedThisCalMonth,
        fiturThisMonth,
        completedFitur,
        inProgressFitur,
        totalFitur: allFitur.length,
        topCategory,
        incomeThisMonth,
        incomeLastMonth,
        expenseThisMonth,
        expenseLastMonth,
        balance: totalIncome - totalExpense,
      },
    });
  });

  // ── Audit Logs ──────────────────────────────────────────────────────────────

  app.get("/api/audit", requireAdmin, async (req, res) => {
    const { table, recordId } = req.query;
    res.json(await storage.listAuditLogs(table as string, recordId ? parseInt(recordId as string) : undefined));
  });

  // ── Commit Reads: per-user read tracking ────────────────────────────────────

  // GET /api/commit-reads?repo=xxx&hashes=sha1,sha2,... → returns set of already-read hashes for current user
  app.get("/api/commit-reads", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const repo = (req as any).query?.repo as string | undefined;
      const hashesParam = (req as any).query?.hashes as string | undefined;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      let query = db.select({ commitHash: commitReads.commitHash })
        .from(commitReads)
        .where(eq(commitReads.userId, userId));

      const rows = await query;
      const readSet = new Set(rows.map((r: any) => r.commitHash));

      // If hashes supplied, also return unread count from that list
      let unreadCount = 0;
      if (hashesParam) {
        const hashes = hashesParam.split(",").filter(Boolean);
        unreadCount = hashes.filter((h) => !readSet.has(h)).length;
      }

      res.json({ readHashes: Array.from(readSet), unreadCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/commit-reads  { commitHash, repo } → mark as read for current user
  app.post("/api/commit-reads", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const { commitHash, repo } = req.body as { commitHash: string; repo: string };
      if (!userId || !commitHash || !repo) return res.status(400).json({ error: "commitHash dan repo diperlukan." });

      // Check if already read (upsert-style: ignore duplicates)
      const existing = await db.select().from(commitReads)
        .where(and(eq(commitReads.userId, userId), eq(commitReads.commitHash, commitHash)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(commitReads).values({ userId, commitHash, repoName: repo });
      }

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Commit Insights: CRUD ────────────────────────────────────────────────────

  app.get("/api/commit-insights/:sha", requireAuth, async (req, res) => {
    try {
      const { sha } = req.params;
      const rows = await db.select().from(commitInsights).where(eq(commitInsights.commitHash, sha)).limit(1);
      if (rows.length === 0) return res.json(null);
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/commit-insights/:sha/mapping", requireAdmin, async (req, res) => {
    try {
      const { sha } = req.params;
      const { mappedFeatureTarget, repo } = req.body as { mappedFeatureTarget: string; repo: string };
      const existing = await db.select().from(commitInsights).where(eq(commitInsights.commitHash, sha)).limit(1);
      if (existing.length === 0) {
        await db.insert(commitInsights).values({
          commitHash: sha,
          repoName: repo ?? "",
          mappedFeatureTarget,
          generatedBy: (req as any).session?.userId ?? null,
        });
      } else {
        await db.update(commitInsights)
          .set({ mappedFeatureTarget, updatedAt: new Date() })
          .where(eq(commitInsights.commitHash, sha));
      }
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GitHub: Detailed Explain ─────────────────────────────────────────────────

  app.post("/api/github/explain", requireAuth, async (req, res) => {
    try {
      const { sha, message, repo } = req.body as { sha: string; message: string; repo: string };
      if (!sha || !message || !repo) return res.status(400).json({ error: "sha, message, dan repo diperlukan." });

      // Return cached if already stored
      const cached = await db.select().from(commitInsights).where(eq(commitInsights.commitHash, sha)).limit(1);
      if (cached.length > 0 && cached[0].detailedExplanation) {
        return res.json({
          explanation: cached[0].detailedExplanation,
          simpleExplanation: cached[0].simpleExplanation ?? null,
          mappedFeatureTarget: cached[0].mappedFeatureTarget ?? null,
        });
      }

      // Fetch commit diff from GitHub
      let diffText = "";
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, {
          headers: { Accept: "application/vnd.github.diff", "User-Agent": "AINA-Portal" },
        });
        if (ghRes.ok) {
          const raw = await ghRes.text();
          diffText = raw.slice(0, 6000);
        }
      } catch { /* diff optional */ }

      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `Kamu adalah asisten AINA Centre yang ramah, seru, dan mudah dimengerti siapa saja — bukan cuma developer!

Tugasmu: jelaskan perubahan commit dengan gaya yang:
- **Santai tapi informatif** — kayak ngobrol sama teman yang paham teknologi
- Mudah dimengerti oleh siapapun, termasuk yang tidak berlatar belakang teknis
- Pakai format **Markdown** — gunakan bold untuk kata/frasa penting, bullet list untuk poin-poin
- Maksimal 4–5 poin singkat
- Ceritakan: **apa yang berubah** dan **kenapa itu penting atau berguna**
- Hindari jargon teknis yang berat; kalau terpaksa pakai, jelaskan singkat

Jangan mengarang fakta yang tidak ada di pesan commit atau diff.`;

      const userPrompt = diffText
        ? `Pesan commit: **"${message.split("\n")[0]}"**\n\nDiff kode:\n${diffText}`
        : `Pesan commit: **"${message.split("\n")[0]}"**\n\nBerdasarkan pesan commit ini, jelaskan kemungkinan perubahan yang dilakukan.`;

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.6,
      });

      const explanation = response.choices[0]?.message?.content ?? "Tidak dapat menghasilkan penjelasan.";

      // Upsert detailed explanation to DB
      try {
        if (cached.length === 0) {
          await db.insert(commitInsights).values({
            commitHash: sha,
            repoName: repo,
            detailedExplanation: explanation,
            generatedBy: (req as any).session?.userId ?? null,
          });
        } else {
          await db.update(commitInsights)
            .set({ detailedExplanation: explanation, updatedAt: new Date() })
            .where(eq(commitInsights.commitHash, sha));
        }
      } catch { /* non-fatal */ }

      res.json({ explanation, simpleExplanation: null, mappedFeatureTarget: null });
    } catch (err: any) {
      console.error("GitHub explain error:", err);
      res.status(500).json({ error: err.message ?? "Terjadi kesalahan." });
    }
  });

  // ── GitHub: Simple AI Explanation (admin generates, all can read) ─────────────

  app.post("/api/github/simple-explain", requireAdmin, async (req, res) => {
    try {
      const { sha, message, detailedExplanation, repo } = req.body as {
        sha: string; message: string; detailedExplanation: string; repo: string;
      };
      if (!sha || !message || !repo) return res.status(400).json({ error: "sha, message, dan repo diperlukan." });

      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const context = detailedExplanation
        ? `Pesan commit: "${message.split("\n")[0]}"\n\nPenjelasan teknis:\n${detailedExplanation}`
        : `Pesan commit: "${message.split("\n")[0]}"`;

      const systemPrompt = `Kamu adalah asisten AINA Centre yang ramah dan seru! 🎉

Tugasmu: ubah penjelasan teknis commit menjadi ringkasan yang **super gampang dipahami** siapa saja.

Aturan:
- Tulis dalam Bahasa Indonesia yang santai dan hangat
- Maksimal **2–3 kalimat pendek** saja
- **Tebalkan** kata atau frasa yang paling penting
- Ceritakan: apa yang berubah + kenapa pengguna akan merasakannya
- Nol jargon teknis — kalau terpaksa, ganti dengan analogi sehari-hari
- Jangan mengarang fakta baru
- Format Markdown boleh dipakai`;

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context },
        ],
        max_tokens: 200,
        temperature: 0.65,
      });

      const simpleExplanation = response.choices[0]?.message?.content ?? "Tidak dapat menghasilkan penjelasan sederhana.";

      // Save to DB
      const existing = await db.select().from(commitInsights).where(eq(commitInsights.commitHash, sha)).limit(1);
      if (existing.length === 0) {
        await db.insert(commitInsights).values({
          commitHash: sha,
          repoName: repo,
          simpleExplanation,
          generatedBy: (req as any).session?.userId ?? null,
        });
      } else {
        await db.update(commitInsights)
          .set({ simpleExplanation, updatedAt: new Date() })
          .where(eq(commitInsights.commitHash, sha));
      }

      res.json({ simpleExplanation });
    } catch (err: any) {
      console.error("GitHub simple explain error:", err);
      res.status(500).json({ error: err.message ?? "Terjadi kesalahan." });
    }
  });

  // ── GitHub: Extract Features from Commit History ─────────────────────────────

  app.post("/api/github/extract-features", requireAuth, async (req, res) => {
    try {
      const { commits } = req.body as {
        commits: { sha: string; message: string; date: string; url: string }[];
      };
      if (!commits || !Array.isArray(commits) || commits.length === 0) {
        return res.status(400).json({ error: "commits diperlukan." });
      }

      const CATEGORIES = [
        { name: "AI & Laporan Cerdas",    emoji: "🤖", keywords: ["ai", "openai", "gpt", "chat", "report", "laporan", "explain", "insight", "simple-explain"] },
        { name: "Tampilan & Pengalaman",  emoji: "🎨", keywords: ["ui", "style", "design", "layout", "theme", "css", "component", "button", "icon", "color", "responsive", "animate", "card", "modal", "page", "view", "dark", "light", "markdown", "font"] },
        { name: "Keuangan",               emoji: "💰", keywords: ["keuangan", "finance", "dana", "uang", "budget", "sponsor", "donasi"] },
        { name: "Anggota & Relasi",       emoji: "👥", keywords: ["anggota", "member", "relasi", "partner", "kontak", "user", "profile"] },
        { name: "Agenda & Kegiatan",      emoji: "📅", keywords: ["agenda", "event", "jadwal", "schedule", "kegiatan"] },
        { name: "Notulensi & Rapat",      emoji: "📝", keywords: ["notulensi", "notul", "rapat", "meeting", "minutes"] },
        { name: "Dokumen & Inventaris",   emoji: "📦", keywords: ["surat", "inventaris", "dokumen", "aset", "barang", "letter"] },
        { name: "Sistem & Infrastruktur", emoji: "⚙️", keywords: ["auth", "security", "database", "schema", "migration", "api", "server", "backend", "route", "login", "password", "session", "build", "deploy", "vercel", "supabase", "vite", "esbuild"] },
        { name: "Perbaikan & Performa",   emoji: "🔧", keywords: ["fix", "bug", "error", "performance", "optimize", "cache", "bundle", "speed", "patch", "hotfix", "improve", "update"] },
        { name: "Fitur Baru",             emoji: "✨", keywords: ["fitur", "feature", "changelog", "baru", "tambah", "add", "new"] },
      ];

      // Group commits by first matching category
      const grouped: Record<string, { commits: typeof commits; cat: typeof CATEGORIES[0] }> = {};
      for (const commit of commits) {
        const lower = commit.message.toLowerCase();
        let matched = false;
        for (const cat of CATEGORIES) {
          if (cat.keywords.some((kw) => lower.includes(kw))) {
            if (!grouped[cat.name]) grouped[cat.name] = { commits: [], cat };
            grouped[cat.name].commits.push(commit);
            matched = true;
            break;
          }
        }
        if (!matched) {
          const misc = "Lainnya";
          if (!grouped[misc]) grouped[misc] = { commits: [], cat: { name: "Lainnya", emoji: "📌", keywords: [] } };
          grouped[misc].commits.push(commit);
        }
      }

      const sevenDays  = Date.now() - 7  * 24 * 60 * 60 * 1000;
      const thirtyDays = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const groups = Object.entries(grouped)
        .filter(([, v]) => v.commits.length > 0)
        .map(([, v]) => {
          const sorted = [...v.commits].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const isNew     = sorted.some((c) => new Date(c.date).getTime() > sevenDays);
          const isRecent  = sorted.some((c) => new Date(c.date).getTime() > thirtyDays);
          const status    = isNew ? "baru" : isRecent ? "ditingkatkan" : "stabil";
          return {
            category:    v.cat.name,
            emoji:       v.cat.emoji,
            status,
            commitCount: v.commits.length,
            lastUpdated: sorted[0].date,
            commits:     sorted.slice(0, 6).map((c) => ({
              sha:     c.sha,
              message: c.message.split("\n")[0].slice(0, 90),
              date:    c.date,
              url:     c.url,
            })),
            messages: sorted.slice(0, 6).map((c) => c.message.split("\n")[0]).join("\n"),
          };
        })
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 9);

      // Single AI call for all groups
      let aiMap: Record<string, { title: string; explanation: string }> = {};
      try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey && groups.length > 0) {
          const OpenAI = (await import("openai")).default;
          const client = new OpenAI({ apiKey });

          const groupSummary = groups
            .map((g, i) => `Kelompok ${i + 1} — ${g.category}:\n${g.messages}`)
            .join("\n\n---\n\n");

          const aiResponse = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Kamu adalah teman yang asik dan suka njelasin hal-hal teknis dengan cara yang gampang dimengerti.
Tugasmu: ubah catatan teknis pengembangan jadi penjelasan yang santai, seru, dan langsung nyambung — kayak temen yang lagi cerita ke kamu.
Pakai Bahasa Indonesia gaul tapi tetap sopan. Boleh pakai kata-kata kayak "nah", "jadi gini", "keren kan?", "btw", dll.
Hindari banget jargon teknis. Fokus ke: apa yang berubah, manfaatnya buat pengguna, dan cara aksesnya.
Balas HANYA dalam format JSON yang diminta.`,
              },
              {
                role: "user",
                content: `Berikut kelompok perubahan dari pengembangan portal AINA:

${groupSummary}

Peta menu AINA Centre (gunakan saat mengisi cara akses):
- AI & Laporan Cerdas → menu "AI Report" di sidebar
- Tampilan & Pengalaman → tampil otomatis saat membuka portal
- Keuangan → menu "Keuangan" di sidebar
- Anggota & Relasi → menu "Anggota" atau "Relasi" di sidebar
- Agenda & Kegiatan → menu "Agenda" di sidebar
- Notulensi & Rapat → menu "Notulensi" di sidebar
- Dokumen & Inventaris → menu "Surat" atau "Inventaris" di sidebar
- Sistem & Infrastruktur → tidak perlu akses khusus, berlaku otomatis
- Perbaikan & Performa → tidak perlu akses khusus, berlaku otomatis
- Fitur Baru → menu "Fitur Terbaru" di sidebar

Untuk setiap kelompok, buatkan:
1. "title": judul fitur pendek dan catchy (max 5 kata, Bahasa Indonesia)
2. "explanation": 3 poin dengan format PERSIS berikut (pisahkan dengan karakter • di awal, newline antar poin):
   • 🔥 Yang baru: <1-2 kalimat casual tentang apa yang berubah, pakai gaya bicara teman>
   • 💡 Enaknya: <1-2 kalimat tentang manfaat nyata, dengan nada antusias>
   • 📍 Cara buka: <instruksi singkat berdasarkan peta menu, casual>

Contoh explanation yang bagus:
"• 🔥 Yang baru: Sekarang ada fitur buat nyimpan template transaksi — jadi kalau ada pemasukan rutin, gak perlu ngisi ulang dari awal!\n• 💡 Enaknya: Hemat waktu banget, tinggal klik template yang udah disimpen, form langsung terisi otomatis. Praktis!\n• 📍 Cara buka: Buka menu Keuangan di sidebar, terus ke tab Masuk atau Keluar — chipnya ada di atas daftar transaksi."

Format JSON:
{
  "features": [
    { "category": "<nama kategori persis>", "title": "...", "explanation": "• 🔥 Yang baru: ...\n• 💡 Enaknya: ...\n• 📍 Cara buka: ..." }
  ]
}`,
              },
            ],
            max_tokens: 1400,
            temperature: 0.55,
            response_format: { type: "json_object" },
          });

          const content = aiResponse.choices[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content) as { features?: { category: string; title: string; explanation: string }[] };
          for (const f of parsed.features ?? []) {
            aiMap[f.category] = { title: f.title, explanation: f.explanation };
          }
        }
      } catch (aiErr) {
        console.error("Feature extraction AI error:", aiErr);
      }

      const features = groups.map((g) => ({
        id:          g.category.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        title:       aiMap[g.category]?.title       ?? g.category,
        category:    g.category,
        emoji:       g.emoji,
        explanation: aiMap[g.category]?.explanation ?? `Perkembangan terkini di area ${g.category} pada portal AINA Centre.`,
        status:      g.status,
        commitCount: g.commitCount,
        lastUpdated: g.lastUpdated,
        commits:     g.commits,
      }));

      res.json({ features });
    } catch (err: any) {
      console.error("Extract features error:", err);
      res.status(500).json({ error: err.message ?? "Terjadi kesalahan." });
    }
  });

  app.post("/api/ai-chat", requireAuth, async (req, res) => {
    try {
      const { messages } = req.body as { messages: { role: "user" | "assistant"; content: string }[] };
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "messages diperlukan." });
      }
      const { chatWithAI } = await import("./aiChat.js");
      const reply = await chatWithAI(messages);
      res.json({ reply });
    } catch (err: any) {
      console.error("AI Chat error:", err);
      res.status(500).json({ error: err.message ?? "Terjadi kesalahan." });
    }
  });
}
