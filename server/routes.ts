import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAuth, requireAdmin } from "./auth";
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
} from "../shared/schema";
import { z } from "zod";

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

  // ── Agenda ──────────────────────────────────────────────────────────────────

  app.get("/api/agenda", requireAuth, async (req, res) => {
    res.json(await storage.listAgenda());
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
    res.json(isAdmin ? all : all.filter(c => c.isVisible));
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
    const [allNotulensi, allAgenda, allFitur, allKeuangan, allAnggota] = await Promise.all([
      storage.listNotulensi(),
      storage.listAgenda(),
      storage.listFiturTerbaru(),
      storage.listKeuangan(),
      storage.listAnggota(),
    ]);

    const totalIncome = allKeuangan.filter(k => k.type === "income").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
    const totalExpense = allKeuangan.filter(k => k.type === "expense").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);

    res.json({
      totalAnggota: allAnggota.filter(a => a.status === "active").length,
      upcomingAgenda: allAgenda.filter(a => a.status === "upcoming").length,
      totalNotulensi: allNotulensi.length,
      draftNotulensi: allNotulensi.filter(n => n.status === "draft").length,
      saldoTersedia: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      recentNotulensi: allNotulensi.slice(0, 3),
      upcomingAgendaList: allAgenda.filter(a => a.status === "upcoming").slice(0, 3),
      latestFitur: allFitur.slice(0, 3),
    });
  });

  // ── Audit Logs ──────────────────────────────────────────────────────────────

  app.get("/api/audit", requireAdmin, async (req, res) => {
    const { table, recordId } = req.query;
    res.json(await storage.listAuditLogs(table as string, recordId ? parseInt(recordId as string) : undefined));
  });
}
