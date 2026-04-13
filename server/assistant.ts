/**
 * Asisten AINA — AI Command Engine
 *
 * Conversational AI that can take real actions in the portal:
 * create agenda, notulensi, save surat templates, generate reports, etc.
 *
 * Uses OpenAI Chat Completions with function calling (gpt-4o-mini).
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import type { IStorage } from "./storage";
import { generateReport } from "./aiReport";

const OPENAI_MODEL = "gpt-4o-mini";

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
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_agenda",
      description: "Membuat agenda atau jadwal kegiatan baru di modul Agenda portal AINA. Gunakan ini jika pengguna menyebut rapat, pertemuan, acara, atau jadwal.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Judul agenda atau kegiatan" },
          date: { type: "string", description: "Tanggal kegiatan, format bebas (misal: '14 April 2026', '2026-04-14')" },
          time: { type: "string", description: "Waktu kegiatan (misal: '15:00', '09.00 WIB'). Default: '00:00' jika tidak disebutkan." },
          location: { type: "string", description: "Tempat kegiatan. Default: 'Belum ditentukan' jika tidak disebutkan." },
          pic: { type: "string", description: "Nama penanggung jawab (PIC). Default: 'Admin' jika tidak disebutkan." },
          description: { type: "string", description: "Deskripsi singkat agenda (opsional)" },
          status: { type: "string", enum: ["upcoming", "completed", "cancelled"], description: "Status agenda, default 'upcoming'" },
        },
        required: ["title", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_notulensi",
      description: "Membuat notulensi rapat baru di modul Notulensi. Gunakan jika pengguna memberikan catatan rapat atau meminta notulensi dibuat.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Judul rapat atau notulensi" },
          date: { type: "string", description: "Tanggal rapat" },
          participants: {
            type: "array",
            items: { type: "string" },
            description: "Daftar nama peserta rapat",
          },
          summary: { type: "string", description: "Ringkasan singkat jalannya rapat" },
          decisions: {
            type: "array",
            items: { type: "string" },
            description: "Poin-poin keputusan yang diambil",
          },
          action_items: {
            type: "array",
            items: { type: "string" },
            description: "Tindak lanjut yang perlu dilakukan",
          },
          status: { type: "string", enum: ["draft", "final"], description: "Status notulensi, default 'draft'" },
        },
        required: ["title", "date", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_surat_template",
      description: "Menyimpan file yang diupload pengguna sebagai template surat di modul Surat. Gunakan jika ada file diupload dan pengguna menyebut surat, template, atau dokumen surat.",
      parameters: {
        type: "object",
        properties: {
          template_name: { type: "string", description: "Nama template surat" },
          description: { type: "string", description: "Deskripsi singkat kegunaan template ini (opsional)" },
        },
        required: ["template_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_document_report",
      description: "Generate laporan terstruktur dari teks mentah yang diberikan pengguna. Mode: notulensi, progress, investor, atau summary.",
      parameters: {
        type: "object",
        properties: {
          raw_text: { type: "string", description: "Teks mentah yang akan diubah menjadi laporan" },
          mode: {
            type: "string",
            enum: ["notulensi", "progress", "investor", "summary"],
            description: "Mode laporan: notulensi=notulensi rapat, progress=laporan progress, investor=ringkasan investor, summary=ringkasan singkat",
          },
        },
        required: ["raw_text", "mode"],
      },
    },
  },
];

// ─── Context Builder ──────────────────────────────────────────────────────────

async function buildPortalContext(storage: IStorage): Promise<string> {
  try {
    const [anggota, agenda, notulensi, keuangan] = await Promise.all([
      storage.listAnggota(),
      storage.listAgenda(),
      storage.listNotulensi(),
      storage.listKeuangan(),
    ]);

    const now = new Date();
    const todayLabel = now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const tomorrowLabel = new Date(now.getTime() + 86400000).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });

    const upcoming = agenda.filter(a => a.status === "upcoming").slice(0, 5);
    const recentNot = notulensi.slice(0, 3);
    const totalIncome = keuangan.filter(k => k.type === "income").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
    const totalExpense = keuangan.filter(k => k.type === "expense").reduce((s, k) => s + parseFloat(k.amount.toString()), 0);

    return [
      `[Konteks Portal AINA — ${todayLabel}]`,
      `- Besok = ${tomorrowLabel}`,
      `- Anggota aktif: ${anggota.filter(a => a.status === "active").length} orang`,
      `- Agenda mendatang: ${upcoming.length > 0 ? upcoming.map(a => `"${a.title}" tgl ${a.date}`).join(" | ") : "tidak ada"}`,
      `- Notulensi terbaru: ${recentNot.length > 0 ? recentNot.map(n => `"${n.title}"`).join(" | ") : "belum ada"}`,
      `- Saldo keuangan: Rp ${(totalIncome - totalExpense).toLocaleString("id-ID")}`,
    ].join("\n");
  } catch {
    return `[Konteks: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}]`;
  }
}

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AssistantContext,
): Promise<ActionResult> {
  const { storage, userId, fileBuffer, fileName } = ctx;

  if (name === "create_agenda") {
    try {
      const a = await storage.createAgenda({
        title: String(args.title ?? "Agenda Baru"),
        date: String(args.date ?? new Date().toLocaleDateString("id-ID")),
        time: String(args.time ?? "00:00"),
        location: String(args.location ?? "Belum ditentukan"),
        pic: String(args.pic ?? "Admin"),
        description: args.description ? String(args.description) : undefined,
        status: (args.status as "upcoming" | "completed" | "cancelled") ?? "upcoming",
      }, userId);
      return {
        tool: name,
        success: true,
        label: `Agenda "${a.title}" berhasil dibuat`,
        url: "/agenda",
        data: { id: a.id, title: a.title, date: a.date, time: a.time, location: a.location },
      };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal membuat agenda", error: e.message };
    }
  }

  if (name === "create_notulensi") {
    try {
      const participants = Array.isArray(args.participants) ? args.participants.map(String) : [];
      const decisions = Array.isArray(args.decisions) ? args.decisions.map(String) : [];
      const actionItems = Array.isArray(args.action_items) ? args.action_items.map(String) : [];
      const n = await storage.createNotulensi({
        title: String(args.title ?? "Notulensi Rapat"),
        date: String(args.date ?? new Date().toLocaleDateString("id-ID")),
        participants,
        summary: String(args.summary ?? ""),
        decisions,
        actionItems,
        status: (args.status as "draft" | "final") ?? "draft",
      }, userId);
      return {
        tool: name,
        success: true,
        label: `Notulensi "${n.title}" berhasil dibuat sebagai draft`,
        url: "/notulensi",
        data: { id: n.id, title: n.title, date: n.date, status: n.status },
      };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal membuat notulensi", error: e.message };
    }
  }

  if (name === "save_surat_template") {
    if (!fileBuffer || !fileName) {
      return { tool: name, success: false, label: "Gagal simpan template", error: "Tidak ada file yang diupload. Upload gambar template surat terlebih dahulu." };
    }
    try {
      const uploadDir = "/tmp/uploads";
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const ext = path.extname(fileName) || ".png";
      const savedName = `surat-template-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(uploadDir, savedName), fileBuffer);
      const imageUrl = `/uploads/${savedName}`;
      const templateName = args.template_name ? String(args.template_name) : path.basename(fileName, ext);
      const t = await storage.createSuratTemplate({
        name: templateName,
        type: "all",
        imageUrl,
        fieldMappings: "[]",
      }, userId);
      return {
        tool: name,
        success: true,
        label: `Template surat "${t.name}" berhasil disimpan`,
        url: "/surat",
        data: { id: t.id, name: t.name, imageUrl: t.imageUrl },
      };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal simpan template surat", error: e.message };
    }
  }

  if (name === "generate_document_report") {
    try {
      const report = await generateReport(String(args.raw_text ?? ""), args.mode as any ?? "summary");
      return {
        tool: name,
        success: true,
        label: `Laporan "${report.title}" berhasil di-generate`,
        url: "/ai-report",
        data: { title: report.title, mode: report.mode, sections: report.sections },
      };
    } catch (e: any) {
      return { tool: name, success: false, label: "Gagal generate laporan", error: e.message };
    }
  }

  return { tool: name, success: false, label: "Tool tidak dikenal", error: `Unknown tool: ${name}` };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function runAssistant(
  message: string,
  history: ChatMessage[],
  ctx: AssistantContext,
): Promise<AssistantResponse> {
  const client = getClient();
  const portalContext = await buildPortalContext(ctx.storage);

  const fileHint = ctx.fileBuffer && ctx.fileName
    ? `\n\n[File diupload oleh pengguna: "${ctx.fileName}" (${Math.round(ctx.fileBuffer.length / 1024)} KB)]`
    : "";

  const systemPrompt = `Kamu adalah **Asisten AINA** — AI cerdas di portal manajemen AINA Centre yang bisa mengambil tindakan nyata.

${portalContext}

KEMAMPUANMU:
• Buat agenda/jadwal kegiatan → gunakan tool create_agenda
• Buat notulensi rapat → gunakan tool create_notulensi  
• Simpan template surat dari file yang diupload → gunakan tool save_surat_template
• Generate laporan terstruktur dari teks mentah → gunakan tool generate_document_report
• Jawab pertanyaan seputar portal dan data AINA

PETUNJUK:
- Jika pengguna sebut "rapat", "pertemuan", "acara", "jadwal" → langsung buat agenda
- Jika ada catatan rapat dan minta notulensi → langsung buat notulensi
- Jika ada file diupload dan menyebut "surat", "template" → simpan sebagai template surat
- Jika pengguna paste teks panjang untuk laporan → gunakan generate_document_report
- Selalu konfirmasi tindakan dengan ringkas dan ramah
- Bahasa Indonesia yang hangat, profesional, dan to the point
- Jika info kurang lengkap (misal tidak ada waktu/lokasi), pakai nilai default dan informasikan ke pengguna`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message + fileHint },
  ];

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    tools: TOOLS,
    tool_choice: "auto",
    temperature: 0.7,
    max_tokens: 1200,
  });

  const choice = response.choices[0];
  const actions: ActionResult[] = [];

  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    for (const tc of choice.message.tool_calls) {
      try {
        const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        const result = await executeTool(tc.function.name, args, ctx);
        actions.push(result);
      } catch (e: any) {
        actions.push({ tool: tc.function.name, success: false, label: "Error", error: e.message });
      }
    }

    const toolResults: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = actions.map((a, i) => ({
      role: "tool" as const,
      tool_call_id: choice.message.tool_calls![i]?.id ?? `tool_${i}`,
      content: a.success
        ? JSON.stringify({ success: true, result: a.label })
        : JSON.stringify({ error: a.error }),
    }));

    const followUp = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        ...messages,
        { role: "assistant", content: choice.message.content ?? "", tool_calls: choice.message.tool_calls },
        ...toolResults,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return {
      reply: followUp.choices[0]?.message?.content ?? "Tindakan berhasil dilakukan!",
      actions,
    };
  }

  return {
    reply: choice.message.content ?? "Maaf, terjadi kesalahan.",
    actions: [],
  };
}
