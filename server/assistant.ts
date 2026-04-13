/**
 * Asisten AINA — JARVIS-Level AI Command Engine
 *
 * Full-spectrum AI that can take actions across ALL portal modules:
 * agenda, notulensi, keuangan, relasi, surat templates, reports, search.
 *
 * Vision capability: analyzes uploaded images (surat templates) via gpt-4o.
 * Uses gpt-4o-mini for text, gpt-4o for vision/image analysis.
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import type { IStorage } from "./storage";
import { generateReport } from "./aiReport";

const MODEL_TEXT   = "gpt-4o-mini";
const MODEL_VISION = "gpt-4o";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY tidak dikonfigurasi.");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ActionResult {
  tool: string;
  success: boolean;
  label: string;
  url?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface AssistantContext {
  storage: IStorage;
  userId: number;
  fileBuffer?: Buffer;
  fileName?: string;
  fileMimeType?: string;
}

export interface AssistantResponse {
  reply: string;
  actions: ActionResult[];
  suggestions: string[];
}

// ─── Tool Definitions (10 tools) ─────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  // ── Agenda ──────────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "create_agenda",
      description: "Membuat agenda/jadwal kegiatan baru di modul Agenda. Gunakan jika pengguna menyebut rapat, pertemuan, acara, atau jadwal.",
      parameters: {
        type: "object",
        properties: {
          title:       { type: "string", description: "Judul agenda" },
          date:        { type: "string", description: "Tanggal (bebas format, misal: '14 April 2026')" },
          time:        { type: "string", description: "Waktu (misal: '15:00'). Default: '00:00'" },
          location:    { type: "string", description: "Tempat. Default: 'Belum ditentukan'" },
          pic:         { type: "string", description: "Penanggung jawab. Default: 'Admin'" },
          description: { type: "string" },
          status:      { type: "string", enum: ["upcoming", "completed", "cancelled"] },
        },
        required: ["title", "date"],
      },
    },
  },
  // ── Notulensi ────────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "create_notulensi",
      description: "Membuat notulensi rapat baru di modul Notulensi.",
      parameters: {
        type: "object",
        properties: {
          title:        { type: "string" },
          date:         { type: "string" },
          participants: { type: "array", items: { type: "string" } },
          summary:      { type: "string", description: "Ringkasan rapat" },
          decisions:    { type: "array", items: { type: "string" } },
          action_items: { type: "array", items: { type: "string" } },
          status:       { type: "string", enum: ["draft", "final"] },
        },
        required: ["title", "date", "summary"],
      },
    },
  },
  // ── Update Status ─────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "update_agenda_status",
      description: "Memperbarui status agenda berdasarkan judul atau ID.",
      parameters: {
        type: "object",
        properties: {
          title_contains: { type: "string", description: "Kata kunci dalam judul agenda yang akan diupdate" },
          status:         { type: "string", enum: ["upcoming", "completed", "cancelled"] },
        },
        required: ["title_contains", "status"],
      },
    },
  },
  // ── Keuangan ─────────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "create_keuangan",
      description: "Mencatat transaksi keuangan baru (pemasukan atau pengeluaran) di modul Keuangan.",
      parameters: {
        type: "object",
        properties: {
          type:              { type: "string", enum: ["income", "expense"], description: "Jenis: income=pemasukan, expense=pengeluaran" },
          amount:            { type: "string", description: "Jumlah uang (angka saja, tanpa titik/koma, dalam Rupiah)" },
          description:       { type: "string", description: "Deskripsi transaksi" },
          category:          { type: "string", description: "Kategori (misal: 'Operasional', 'Program', 'Sponsorship', 'Gaji')" },
          date:              { type: "string", description: "Tanggal transaksi" },
          source_name:       { type: "string", description: "Nama sumber dana (untuk income)" },
          responsible_person:{ type: "string", description: "Nama PIC pengeluaran (untuk expense)" },
        },
        required: ["type", "amount", "description", "category", "date"],
      },
    },
  },
  // ── Relasi ───────────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "add_relasi",
      description: "Menambahkan kontak/mitra eksternal baru ke modul Relasi.",
      parameters: {
        type: "object",
        properties: {
          name:        { type: "string", description: "Nama lengkap kontak" },
          institution: { type: "string", description: "Institusi/organisasi" },
          role:        { type: "string", description: "Jabatan/peran di institusinya" },
          contact:     { type: "string", description: "Email atau nomor telepon" },
          notes:       { type: "string", description: "Catatan tambahan" },
          status:      { type: "string", enum: ["active", "inactive", "prospect"] },
        },
        required: ["name", "institution", "role"],
      },
    },
  },
  // ── Surat Template ────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "save_surat_template",
      description: "Menyimpan file yang diupload sebagai template surat. Sertakan field_names jika ada info field dari analisis gambar.",
      parameters: {
        type: "object",
        properties: {
          template_name: { type: "string" },
          description:   { type: "string" },
          field_names:   { type: "array", items: { type: "string" }, description: "Nama field/kolom yang terdeteksi di template" },
        },
        required: ["template_name"],
      },
    },
  },
  // ── Search ────────────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "search_portal",
      description: "Mencari data di seluruh modul portal (agenda, notulensi, anggota, relasi, keuangan). Gunakan untuk query seperti 'cari rapat tentang...', 'siapa anggota yang...', dll.",
      parameters: {
        type: "object",
        properties: {
          query:   { type: "string", description: "Kata kunci pencarian" },
          modules: {
            type: "array",
            items: { type: "string", enum: ["agenda", "notulensi", "anggota", "relasi", "keuangan", "surat"] },
            description: "Modul yang ingin dicari. Kosong = cari semua modul.",
          },
        },
        required: ["query"],
      },
    },
  },
  // ── Briefing ─────────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_full_briefing",
      description: "Ambil data lengkap seluruh modul portal untuk diberikan sebagai briefing komprehensif kepada pengguna. Gunakan jika pengguna minta 'briefing', 'status portal', 'laporan lengkap', 'ringkasan', atau 'apa yang perlu diperhatikan'.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            enum: ["full", "agenda", "keuangan", "notulensi"],
            description: "Fokus briefing. Default: full",
          },
        },
        required: [],
      },
    },
  },
  // ── Generate Report ───────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "generate_document_report",
      description: "Generate laporan terstruktur dari teks mentah (notulensi, progress, investor, summary).",
      parameters: {
        type: "object",
        properties: {
          raw_text: { type: "string" },
          mode:     { type: "string", enum: ["notulensi", "progress", "investor", "summary"] },
        },
        required: ["raw_text", "mode"],
      },
    },
  },
  // ── Add Anggota ───────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "add_anggota",
      description: "Menambahkan anggota tim baru ke modul Anggota.",
      parameters: {
        type: "object",
        properties: {
          name:     { type: "string" },
          role:     { type: "string", description: "Jabatan" },
          division: { type: "string", description: "Divisi" },
          email:    { type: "string" },
        },
        required: ["name", "role", "division"],
      },
    },
  },
];

// ─── Vision Analysis ──────────────────────────────────────────────────────────

async function analyzeImageWithVision(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<{ description: string; suggestedName: string; detectedFields: string[] }> {
  const client = getClient();
  const base64 = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  try {
    const resp = await client.chat.completions.create({
      model: MODEL_VISION,
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
            {
              type: "text",
              text: `Analisis dokumen/template surat dalam gambar ini. Berikan output JSON dengan format:
{
  "suggestedName": "nama singkat template (maks 40 karakter)",
  "description": "deskripsi singkat kegunaan template ini (1 kalimat)",
  "detectedFields": ["daftar field/kolom kosong yang terlihat di template, misal: Nama, Tanggal, Nomor Surat, Perihal, dst"]
}

Hanya kembalikan JSON, tanpa teks lain.`,
            },
          ],
        },
      ],
    });

    const text = resp.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      suggestedName: String(parsed.suggestedName ?? "Template Surat"),
      description: String(parsed.description ?? ""),
      detectedFields: Array.isArray(parsed.detectedFields) ? parsed.detectedFields.map(String) : [],
    };
  } catch {
    return { suggestedName: "Template Surat", description: "", detectedFields: [] };
  }
}

// ─── Portal Context Builder ───────────────────────────────────────────────────

async function buildPortalContext(storage: IStorage): Promise<{ summary: string; fullData: Record<string, unknown> }> {
  const [anggota, agenda, notulensi, keuangan, relasi, surat] = await Promise.all([
    storage.listAnggota(),
    storage.listAgenda(),
    storage.listNotulensi(),
    storage.listKeuangan(),
    storage.listRelasi(),
    storage.listSurat(),
  ]);

  const now = new Date();
  const calYear = now.getFullYear();
  const calMonth = now.getMonth();

  const totalIncome  = keuangan.filter(k => k.type === "income").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
  const totalExpense = keuangan.filter(k => k.type === "expense").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
  const saldo = totalIncome - totalExpense;

  const upcoming = agenda.filter(a => a.status === "upcoming");
  const calAgenda = agenda.filter(a => {
    try { const d = new Date(a.date); return d.getFullYear() === calYear && d.getMonth() === calMonth; } catch { return false; }
  });
  const draftNotulensi  = notulensi.filter(n => n.status === "draft");
  const finalNotulensi  = notulensi.filter(n => n.status === "final");
  const recentKeuangan  = [...keuangan].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const todayLabel     = now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const tomorrowLabel  = new Date(now.getTime() + 86400000).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  const monthName      = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const summary = [
    `[PORTAL AINA — ${todayLabel}]`,
    `Besok: ${tomorrowLabel}`,
    ``,
    `ANGGOTA: ${anggota.filter(a => a.status === "active").length} aktif dari ${anggota.length} total`,
    `AGENDA: ${upcoming.length} mendatang | ${calAgenda.length} di ${monthName}`,
    `  ${upcoming.slice(0, 5).map(a => `• "${a.title}" — ${a.date} ${a.time || ""} di ${a.location}`).join("\n  ")}`,
    `NOTULENSI: ${notulensi.length} total | ${draftNotulensi.length} draft | ${finalNotulensi.length} final`,
    `  Terbaru: ${notulensi.slice(0, 3).map(n => `"${n.title}" (${n.status})`).join(", ")}`,
    `KEUANGAN: Saldo Rp ${saldo.toLocaleString("id-ID")} | Pemasukan Rp ${totalIncome.toLocaleString("id-ID")} | Pengeluaran Rp ${totalExpense.toLocaleString("id-ID")}`,
    `RELASI: ${relasi.filter(r => r.status === "active").length} aktif | ${relasi.filter(r => r.status === "prospect").length} prospek`,
    `SURAT: ${surat.length} total`,
  ].join("\n");

  return {
    summary,
    fullData: {
      anggota: anggota.map(a => ({ id: a.id, name: a.name, role: a.role, division: a.division, status: a.status })),
      agenda: agenda.map(a => ({ id: a.id, title: a.title, date: a.date, time: a.time, location: a.location, status: a.status })),
      notulensi: notulensi.map(n => ({ id: n.id, title: n.title, date: n.date, status: n.status })),
      keuangan: {
        totalIncome, totalExpense, saldo,
        recent: recentKeuangan.map(k => ({ id: k.id, type: k.type, amount: k.amount, description: k.description, date: k.date })),
      },
      relasi: relasi.map(r => ({ id: r.id, name: r.name, institution: r.institution, role: r.role, status: r.status })),
    },
  };
}

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AssistantContext,
  portalData: Record<string, unknown>,
): Promise<ActionResult> {
  const { storage, userId, fileBuffer, fileName, fileMimeType } = ctx;

  // ── create_agenda ────────────────────────────────────────────────────────────
  if (name === "create_agenda") {
    try {
      const a = await storage.createAgenda({
        title:       String(args.title ?? "Agenda Baru"),
        date:        String(args.date ?? new Date().toLocaleDateString("id-ID")),
        time:        String(args.time ?? "00:00"),
        location:    String(args.location ?? "Belum ditentukan"),
        pic:         String(args.pic ?? "Admin"),
        description: args.description ? String(args.description) : undefined,
        status:      (args.status as "upcoming" | "completed" | "cancelled") ?? "upcoming",
      }, userId);
      return { tool: name, success: true, label: `Agenda "${a.title}" berhasil dibuat`, url: "/agenda",
        data: { id: a.id, title: a.title, date: a.date, time: a.time, location: a.location, status: a.status } };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal membuat agenda", error: e.message };
    }
  }

  // ── create_notulensi ──────────────────────────────────────────────────────────
  if (name === "create_notulensi") {
    try {
      const n = await storage.createNotulensi({
        title:       String(args.title ?? "Notulensi Rapat"),
        date:        String(args.date ?? new Date().toLocaleDateString("id-ID")),
        participants: Array.isArray(args.participants) ? args.participants.map(String) : [],
        summary:     String(args.summary ?? ""),
        decisions:   Array.isArray(args.decisions) ? args.decisions.map(String) : [],
        actionItems: Array.isArray(args.action_items) ? args.action_items.map(String) : [],
        status:      (args.status as "draft" | "final") ?? "draft",
      }, userId);
      return { tool: name, success: true, label: `Notulensi "${n.title}" berhasil dibuat (draft)`, url: "/notulensi",
        data: { id: n.id, title: n.title, date: n.date, status: n.status } };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal membuat notulensi", error: e.message };
    }
  }

  // ── update_agenda_status ──────────────────────────────────────────────────────
  if (name === "update_agenda_status") {
    try {
      const keyword = String(args.title_contains ?? "").toLowerCase();
      const allAgenda = (portalData.agenda as { id: number; title: string }[]) ?? [];
      const found = allAgenda.find(a => a.title.toLowerCase().includes(keyword));
      if (!found) return { tool: name, success: false, label: "Agenda tidak ditemukan", error: `Tidak ada agenda dengan kata kunci: "${args.title_contains}"` };
      const updated = await storage.updateAgenda(found.id, { status: args.status as "upcoming" | "completed" | "cancelled" }, userId);
      return { tool: name, success: true, label: `Status agenda "${found.title}" diperbarui ke "${args.status}"`, url: "/agenda",
        data: { id: found.id, title: found.title, newStatus: args.status } };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal update status", error: e.message };
    }
  }

  // ── create_keuangan ───────────────────────────────────────────────────────────
  if (name === "create_keuangan") {
    try {
      const rawAmount = String(args.amount ?? "0").replace(/[^0-9]/g, "");
      const k = await storage.createKeuangan({
        type:              (args.type as "income" | "expense"),
        amount:            rawAmount,
        description:       String(args.description ?? ""),
        category:          String(args.category ?? "Lainnya"),
        date:              String(args.date ?? new Date().toLocaleDateString("id-ID")),
        sourceName:        args.source_name ? String(args.source_name) : undefined,
        responsiblePerson: args.responsible_person ? String(args.responsible_person) : undefined,
      }, userId);
      const amountFmt = `Rp ${parseInt(rawAmount).toLocaleString("id-ID")}`;
      return { tool: name, success: true,
        label: `Transaksi ${k.type === "income" ? "pemasukan" : "pengeluaran"} ${amountFmt} dicatat`,
        url: "/keuangan",
        data: { id: k.id, type: k.type, amount: k.amount, description: k.description } };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal mencatat keuangan", error: e.message };
    }
  }

  // ── add_relasi ────────────────────────────────────────────────────────────────
  if (name === "add_relasi") {
    try {
      const r = await storage.createRelasi({
        name:        String(args.name ?? ""),
        institution: String(args.institution ?? ""),
        role:        String(args.role ?? ""),
        contact:     args.contact ? String(args.contact) : undefined,
        notes:       args.notes ? String(args.notes) : undefined,
        status:      (args.status as "active" | "inactive" | "prospect") ?? "active",
      }, userId);
      return { tool: name, success: true, label: `Relasi "${r.name}" dari ${r.institution} berhasil ditambahkan`, url: "/relasi",
        data: { id: r.id, name: r.name, institution: r.institution, role: r.role } };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal menambahkan relasi", error: e.message };
    }
  }

  // ── save_surat_template ────────────────────────────────────────────────────────
  if (name === "save_surat_template") {
    if (!fileBuffer || !fileName) {
      return { tool: name, success: false, label: "Tidak ada file", error: "Upload file gambar template terlebih dahulu." };
    }
    try {
      const uploadDir = "/tmp/uploads";
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const ext = path.extname(fileName) || ".png";
      const savedName = `surat-template-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(uploadDir, savedName), fileBuffer);
      const imageUrl = `/uploads/${savedName}`;
      const templateName = args.template_name ? String(args.template_name) : path.basename(fileName, ext);
      const fieldNames = Array.isArray(args.field_names) ? args.field_names : [];
      // Build fieldMappings from detected fields
      const fieldMappings = fieldNames.map((fn: unknown, i: number) => ({
        id: `f${i}`, label: String(fn), x: 10, y: 10 + i * 30, width: 200, height: 25,
      }));
      const t = await storage.createSuratTemplate({
        name: templateName,
        type: "all",
        imageUrl,
        fieldMappings: JSON.stringify(fieldMappings),
      }, userId);
      return { tool: name, success: true,
        label: `Template surat "${t.name}" tersimpan${fieldNames.length > 0 ? ` dengan ${fieldNames.length} field` : ""}`,
        url: "/surat",
        data: { id: t.id, name: t.name, imageUrl: t.imageUrl, fields: fieldNames } };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal simpan template", error: e.message };
    }
  }

  // ── search_portal ─────────────────────────────────────────────────────────────
  if (name === "search_portal") {
    const query = String(args.query ?? "").toLowerCase();
    const mods = Array.isArray(args.modules) && args.modules.length > 0
      ? args.modules as string[]
      : ["agenda", "notulensi", "anggota", "relasi", "keuangan"];

    const results: Record<string, unknown[]> = {};

    if (mods.includes("agenda")) {
      const data = (portalData.agenda as { title: string; date: string; status: string }[]) ?? [];
      results.agenda = data.filter(a => a.title.toLowerCase().includes(query));
    }
    if (mods.includes("notulensi")) {
      const data = (portalData.notulensi as { title: string; date: string; status: string }[]) ?? [];
      results.notulensi = data.filter(n => n.title.toLowerCase().includes(query));
    }
    if (mods.includes("anggota")) {
      const data = (portalData.anggota as { name: string; role: string; division: string }[]) ?? [];
      results.anggota = data.filter(a => `${a.name} ${a.role} ${a.division}`.toLowerCase().includes(query));
    }
    if (mods.includes("relasi")) {
      const data = (portalData.relasi as { name: string; institution: string; role: string }[]) ?? [];
      results.relasi = data.filter(r => `${r.name} ${r.institution}`.toLowerCase().includes(query));
    }
    if (mods.includes("keuangan")) {
      const kData = portalData.keuangan as { recent: { description: string }[] } | undefined;
      const recent = kData?.recent ?? [];
      results.keuangan = recent.filter(k => k.description.toLowerCase().includes(query));
    }

    const totalFound = Object.values(results).reduce((s, arr) => s + arr.length, 0);
    return { tool: name, success: true,
      label: `Pencarian "${args.query}": ${totalFound} hasil ditemukan`,
      data: { query: args.query, results, totalFound } };
  }

  // ── get_full_briefing ─────────────────────────────────────────────────────────
  if (name === "get_full_briefing") {
    return {
      tool: name, success: true,
      label: "Data briefing lengkap berhasil diambil",
      data: portalData,
    };
  }

  // ── generate_document_report ──────────────────────────────────────────────────
  if (name === "generate_document_report") {
    try {
      const report = await generateReport(String(args.raw_text ?? ""), args.mode as "notulensi" | "progress" | "investor" | "summary" ?? "summary");
      return { tool: name, success: true, label: `Laporan "${report.title}" berhasil di-generate`, url: "/ai-report",
        data: { title: report.title, mode: report.mode, sections: report.sections } };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal generate laporan", error: e.message };
    }
  }

  // ── add_anggota ────────────────────────────────────────────────────────────────
  if (name === "add_anggota") {
    try {
      const a = await storage.createAnggota({
        name:        String(args.name ?? ""),
        role:        String(args.role ?? ""),
        division:    String(args.division ?? ""),
        email:       args.email ? String(args.email) : undefined,
        status:      "active",
        accessLevel: "user",
      }, userId);
      return { tool: name, success: true, label: `Anggota "${a.name}" berhasil ditambahkan`, url: "/anggota",
        data: { id: a.id, name: a.name, role: a.role, division: a.division } };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal tambah anggota", error: e.message };
    }
  }

  return { tool: name, success: false, label: "Tool tidak dikenal", error: `Unknown: ${name}` };
}

// ─── Suggestion Engine ────────────────────────────────────────────────────────

function generateSuggestions(actions: ActionResult[], message: string): string[] {
  const lm = message.toLowerCase();

  if (actions.some(a => a.tool === "create_agenda")) {
    return ["Buat notulensi untuk rapat ini", "Lihat semua agenda", "Perbarui status agenda"];
  }
  if (actions.some(a => a.tool === "create_notulensi")) {
    return ["Finalisasi notulensi ke status Final", "Lihat semua notulensi", "Buat agenda rapat berikutnya"];
  }
  if (actions.some(a => a.tool === "create_keuangan")) {
    return ["Lihat laporan keuangan lengkap", "Tambah transaksi lainnya", "Briefing status keuangan"];
  }
  if (actions.some(a => a.tool === "add_relasi")) {
    return ["Lihat semua relasi", "Tambah relasi lainnya", "Buat agenda pertemuan dengan relasi"];
  }
  if (actions.some(a => a.tool === "save_surat_template")) {
    return ["Buka editor template surat", "Upload template lainnya", "Lihat semua template"];
  }
  if (actions.some(a => a.tool === "search_portal")) {
    return ["Cari dengan kata kunci lain", "Briefing penuh portal", "Buat agenda rapat"];
  }
  if (actions.some(a => a.tool === "get_full_briefing")) {
    return ["Buat agenda untuk item urgent", "Cek detail keuangan", "Update status notulensi draft"];
  }
  if (lm.includes("briefing") || lm.includes("status") || lm.includes("ringkasan")) {
    return ["Minta briefing harian portal", "Cek agenda mendatang", "Catat pengeluaran hari ini"];
  }
  return ["Minta briefing harian portal", "Buat agenda rapat", "Catat transaksi keuangan"];
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function runAssistant(
  message: string,
  history: ChatMessage[],
  ctx: AssistantContext,
): Promise<AssistantResponse> {
  const client = getClient();

  // Build context
  const { summary: portalSummary, fullData: portalData } = await buildPortalContext(ctx.storage);

  // Vision analysis for image files
  let visionAnalysis: { suggestedName: string; description: string; detectedFields: string[] } | null = null;
  const isImage = ctx.fileMimeType?.startsWith("image/");
  if (ctx.fileBuffer && isImage) {
    visionAnalysis = await analyzeImageWithVision(ctx.fileBuffer, ctx.fileMimeType!);
  }

  const now = new Date();
  const fileHint = ctx.fileBuffer && ctx.fileName
    ? `\n\n[File diupload: "${ctx.fileName}" (${Math.round(ctx.fileBuffer.length / 1024)} KB)${visionAnalysis ? `\nAnalisis visual: Template "${visionAnalysis.suggestedName}" — ${visionAnalysis.description}\nField terdeteksi: ${visionAnalysis.detectedFields.join(", ")}` : ""}]`
    : "";

  const systemPrompt = `Kamu adalah JARVIS — sistem AI komando portal AINA Centre. Kamu bukan sekadar chatbot: kamu adalah asisten eksekutif yang bisa langsung mengambil tindakan nyata di seluruh modul portal.

${portalSummary}

KARAKTERMU:
- Analitis, percaya diri, dan selalu proaktif — seperti asisten eksekutif kelas dunia
- Berikan respons yang concise tapi berisi data dan insight nyata
- Setelah setiap tindakan, selalu beri 1-2 observasi atau rekomendasi tambahan
- Gunakan Bahasa Indonesia yang profesional dan hangat
- Jika pengguna minta "briefing" atau "status" → panggil get_full_briefing lalu analisis datanya secara mendalam

ATURAN TINDAKAN:
- "Ada rapat/pertemuan/agenda..." → create_agenda
- "Catat/buat notulensi..." → create_notulensi
- "Pemasukan/pengeluaran/bayar/terima..." → create_keuangan  
- "Tambah kontak/mitra/relasi..." → add_relasi
- Upload gambar + kata "surat/template" → save_surat_template (gunakan field_names dari visionAnalysis jika tersedia)
- "Cari/temukan..." → search_portal
- "Briefing/status/ringkasan/kondisi portal" → get_full_briefing
- Paste teks panjang + "jadikan laporan" → generate_document_report

KONTEKS WAKTU: Hari ini ${now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}, ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message + fileHint },
  ];

  // If vision analysis found fields, hint the AI to use them in save_surat_template
  if (visionAnalysis && visionAnalysis.detectedFields.length > 0) {
    const lastMsg = messages[messages.length - 1] as { role: string; content: string };
    lastMsg.content += `\n\n[INSTRUKSI: Gunakan save_surat_template dengan template_name="${visionAnalysis.suggestedName}" dan field_names=${JSON.stringify(visionAnalysis.detectedFields)}]`;
  }

  const response = await client.chat.completions.create({
    model: MODEL_TEXT,
    messages,
    tools: TOOLS,
    tool_choice: "auto",
    temperature: 0.7,
    max_tokens: 1500,
  });

  const choice = response.choices[0];
  const actions: ActionResult[] = [];

  // Execute tool calls
  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    for (const tc of choice.message.tool_calls) {
      try {
        const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        const result = await executeTool(tc.function.name, args, ctx, portalData);
        actions.push(result);
      } catch (e: any) {
        actions.push({ tool: tc.function.name, success: false, label: "Error eksekusi tool", error: e.message });
      }
    }

    // Follow-up response after tool execution
    const toolResults: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = actions.map((a, i) => ({
      role: "tool" as const,
      tool_call_id: choice.message.tool_calls![i]?.id ?? `tool_${i}`,
      content: a.success
        ? JSON.stringify({ success: true, result: a.label, data: a.data })
        : JSON.stringify({ error: a.error }),
    }));

    const followUp = await client.chat.completions.create({
      model: MODEL_TEXT,
      messages: [
        ...messages,
        { role: "assistant", content: choice.message.content ?? "", tool_calls: choice.message.tool_calls },
        ...toolResults,
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return {
      reply: followUp.choices[0]?.message?.content ?? "Tindakan berhasil dilakukan.",
      actions,
      suggestions: generateSuggestions(actions, message),
    };
  }

  return {
    reply: choice.message.content ?? "Maaf, terjadi kesalahan.",
    actions: [],
    suggestions: generateSuggestions([], message),
  };
}
