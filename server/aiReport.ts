/**
 * AI Report Assistant — OpenAI Integration
 *
 * Uses gpt-4o-mini via the OpenAI Responses API for cost-efficient,
 * high-quality structured rewriting and summarization.
 *
 * Integration point: generateReport() → calls OpenAI and returns GeneratedReport.
 * To swap the model, change OPENAI_MODEL constant below.
 */

import OpenAI from "openai";

const OPENAI_MODEL = "gpt-4o-mini";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY tidak dikonfigurasi.");
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportMode = "notulensi" | "progress" | "investor" | "summary";

export interface ReportSection {
  key: string;
  label: string;
  content: string;
}

export interface GeneratedReport {
  mode: ReportMode;
  title: string;
  sections: ReportSection[];
}

// ─── Prompt Templates ─────────────────────────────────────────────────────────

const SYSTEM_BASE = `Kamu adalah asisten laporan profesional yang membantu mengubah catatan mentah menjadi dokumen terstruktur dalam Bahasa Indonesia.

Aturan ketat yang HARUS diikuti:
- Hanya gunakan informasi yang ada di dalam teks input. JANGAN mengarang, JANGAN menambahkan fakta, nama, tanggal, atau keputusan yang tidak ada di input.
- Jika informasi untuk suatu bagian tidak tersedia dari teks, tulis: "(tidak ditemukan dari teks — tambahkan secara manual)"
- Jangan berikan penjelasan tambahan, hanya output JSON yang diminta.
- Selalu gunakan Bahasa Indonesia yang bersih, formal, dan jelas.
- Untuk poin-poin, mulai setiap item dengan "• " (bullet point).`;

const MODE_PROMPTS: Record<ReportMode, { systemExtra: string; userPrompt: (text: string) => string; schema: ReportSection[] }> = {
  notulensi: {
    systemExtra: "Kamu sedang membuat notulensi rapat resmi.",
    userPrompt: (text) => `Ubah catatan mentah berikut menjadi notulensi rapat terstruktur.

Kembalikan HANYA JSON dengan format berikut (tidak ada teks lain):
{
  "title": "judul rapat dari teks",
  "sections": [
    {"key": "judul", "label": "Judul Rapat", "content": "..."},
    {"key": "tanggal", "label": "Tanggal", "content": "..."},
    {"key": "peserta", "label": "Peserta", "content": "nama1, nama2, ... (pisahkan dengan koma)"},
    {"key": "ringkasan", "label": "Ringkasan", "content": "paragraf ringkasan rapat"},
    {"key": "keputusan", "label": "Keputusan", "content": "• keputusan 1\n• keputusan 2"},
    {"key": "tindak_lanjut", "label": "Tindak Lanjut", "content": "• tindak lanjut 1\n• tindak lanjut 2"}
  ]
}

CATATAN MENTAH:
${text}`,
    schema: [
      { key: "judul", label: "Judul Rapat", content: "" },
      { key: "tanggal", label: "Tanggal", content: "" },
      { key: "peserta", label: "Peserta", content: "" },
      { key: "ringkasan", label: "Ringkasan", content: "" },
      { key: "keputusan", label: "Keputusan", content: "" },
      { key: "tindak_lanjut", label: "Tindak Lanjut", content: "" },
    ],
  },

  progress: {
    systemExtra: "Kamu sedang membuat laporan progres internal.",
    userPrompt: (text) => `Ubah teks berikut menjadi laporan progres internal terstruktur.

Kembalikan HANYA JSON dengan format berikut:
{
  "title": "judul laporan singkat",
  "sections": [
    {"key": "fokus_update", "label": "Fokus Update", "content": "1-2 kalimat fokus utama"},
    {"key": "perkembangan", "label": "Perkembangan Utama", "content": "• item 1\n• item 2"},
    {"key": "kendala", "label": "Kendala", "content": "• kendala 1\n• kendala 2"},
    {"key": "insight", "label": "Insight & Catatan", "content": "• insight 1\n• insight 2"},
    {"key": "next_step", "label": "Next Step", "content": "• langkah 1\n• langkah 2"}
  ]
}

TEKS INPUT:
${text}`,
    schema: [
      { key: "fokus_update", label: "Fokus Update", content: "" },
      { key: "perkembangan", label: "Perkembangan Utama", content: "" },
      { key: "kendala", label: "Kendala", content: "" },
      { key: "insight", label: "Insight & Catatan", content: "" },
      { key: "next_step", label: "Next Step", content: "" },
    ],
  },

  investor: {
    systemExtra: "Kamu sedang membuat ringkasan untuk investor. Tulis dengan bahasa yang strategis, jelas, dan profesional — tapi HANYA berdasarkan fakta dari teks input.",
    userPrompt: (text) => `Ubah catatan internal berikut menjadi ringkasan investor yang strategis dan jelas.

PENTING: Jangan menambahkan klaim, angka, atau fakta yang tidak ada di teks. Buat kalimat terdengar profesional dan strategis, tapi tetap faktual.

Kembalikan HANYA JSON dengan format berikut:
{
  "title": "judul ringkasan investor singkat",
  "sections": [
    {"key": "highlight_utama", "label": "Highlight Utama", "content": "• highlight 1\n• highlight 2"},
    {"key": "progress_penting", "label": "Progress Penting", "content": "• progress 1\n• progress 2"},
    {"key": "dampak_strategis", "label": "Dampak Strategis", "content": "• dampak 1\n• dampak 2"},
    {"key": "arah_selanjutnya", "label": "Arah Selanjutnya", "content": "• arah 1\n• arah 2"}
  ]
}

CATATAN INTERNAL:
${text}`,
    schema: [
      { key: "highlight_utama", label: "Highlight Utama", content: "" },
      { key: "progress_penting", label: "Progress Penting", content: "" },
      { key: "dampak_strategis", label: "Dampak Strategis", content: "" },
      { key: "arah_selanjutnya", label: "Arah Selanjutnya", content: "" },
    ],
  },

  summary: {
    systemExtra: "Kamu sedang membuat ringkasan singkat berupa poin-poin padat.",
    userPrompt: (text) => `Buat ringkasan singkat dari teks berikut dalam 5-8 poin paling penting.

Kembalikan HANYA JSON dengan format berikut:
{
  "title": "judul ringkasan singkat",
  "sections": [
    {"key": "ringkasan_singkat", "label": "Ringkasan Singkat", "content": "• poin 1\n• poin 2\n• poin 3"}
  ]
}

TEKS:
${text}`,
    schema: [
      { key: "ringkasan_singkat", label: "Ringkasan Singkat", content: "" },
    ],
  },
};

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function generateReport(
  rawText: string,
  mode: ReportMode
): Promise<GeneratedReport> {
  if (!rawText || rawText.trim().length < 10) {
    throw new Error("Teks terlalu pendek untuk diproses.");
  }
  if (rawText.trim().length > 12000) {
    throw new Error("Teks terlalu panjang (maksimal ~12.000 karakter). Potong menjadi beberapa bagian.");
  }

  const template = MODE_PROMPTS[mode];
  if (!template) throw new Error("Mode tidak dikenal.");

  const client = getClient();

  let raw: string;
  try {
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      instructions: `${SYSTEM_BASE}\n\n${template.systemExtra}`,
      input: template.userPrompt(rawText.trim()),
    });
    raw = response.output_text?.trim() ?? "";
  } catch (err: any) {
    // Log safely (no API key exposure)
    console.error("[AI Report] OpenAI request failed:", err?.status, err?.code, err?.message?.slice(0, 120));
    if (err?.status === 401) throw new Error("API key tidak valid. Periksa konfigurasi OPENAI_API_KEY.");
    if (err?.status === 429) throw new Error("Batas penggunaan API tercapai. Coba lagi dalam beberapa saat.");
    if (err?.status === 500) throw new Error("Layanan AI sedang tidak tersedia. Coba lagi.");
    throw new Error("Gagal menghubungi layanan AI. Coba lagi.");
  }

  // Strip markdown code fences if model wraps in ```json
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[AI Report] JSON parse failed. Raw output snippet:", cleaned.slice(0, 300));
    throw new Error("Gagal memproses respons AI. Coba lagi dengan teks yang berbeda.");
  }

  const title: string = parsed.title ?? "Laporan";
  const sections: ReportSection[] = (parsed.sections ?? []).map((s: any) => ({
    key: String(s.key ?? ""),
    label: String(s.label ?? ""),
    content: String(s.content ?? ""),
  }));

  // Validate we got at least one section
  if (sections.length === 0) {
    throw new Error("AI tidak menghasilkan konten. Coba lagi dengan teks yang lebih lengkap.");
  }

  return { mode, title, sections };
}
