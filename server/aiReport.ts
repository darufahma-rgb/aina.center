/**
 * AI Report Assistant — Structured Extraction Engine
 *
 * Architecture note: The `generateReport()` function is the single integration
 * point for an LLM API. Replace the body of that function with an API call
 * (e.g. OpenAI, Anthropic, Google Gemini) and keep the same return type.
 *
 * Current implementation: rule-based keyword extraction that classifies
 * sentences into thematic buckets, then assembles them per output mode.
 */

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

// ─── Keyword dictionaries ─────────────────────────────────────────────────────

const KW = {
  participants: [
    "hadir", "peserta", "dihadiri", "attendee", "present", "anggota yang hadir",
    "diikuti", "yang menghadiri", "partisipan",
  ],
  decisions: [
    "diputuskan", "setuju", "sepakat", "keputusan", "disepakati",
    "agreed", "decided", "memutuskan", "kesepakatan", "approve", "disetujui",
  ],
  actions: [
    "tindak lanjut", "follow up", "action item", "akan dilakukan", "perlu dilakukan",
    "harus", "segera", "todo", "tugas", "pic:", "penanggung jawab",
    "deadline", "paling lambat", "target selesai",
  ],
  problems: [
    "kendala", "masalah", "hambatan", "tantangan", "belum selesai",
    "gagal", "terhambat", "problem", "issue", "delay", "terlambat",
    "tidak berjalan", "tidak tercapai", "perlu perhatian",
  ],
  achievements: [
    "selesai", "berhasil", "completed", "achieved", "sudah", "telah selesai",
    "sukses", "tercapai", "done", "launched", "diluncurkan", "berhasil",
    "peningkatan", "kenaikan", "growth",
  ],
  plans: [
    "rencana", "selanjutnya", "next step", "plan", "roadmap",
    "target", "bulan depan", "minggu depan", "akan dilakukan",
    "fokus berikutnya", "prioritas", "tahap selanjutnya",
  ],
  insights: [
    "insight", "temuan", "catatan penting", "pelajaran", "learning",
    "perlu diperhatikan", "rekomendasi", "saran", "observation", "noted",
  ],
  impact: [
    "dampak", "impact", "strategis", "growth", "pertumbuhan",
    "manfaat", "pengaruh", "hasil", "outcome", "efek",
  ],
  highlights: [
    "highlight", "pencapaian", "milestone", "capaian", "achievement",
    "penting", "utama", "kunci", "key", "signifikan",
  ],
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function splitLines(text: string): string[] {
  // First split by newlines, then by ". " (sentence boundaries) for single-line text
  const byNewlines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  // If most content is on very few lines (pasted as a single block of text), also split by sentences
  const result: string[] = [];
  for (const line of byNewlines) {
    if (line.length > 120) {
      // Long line: split into sentences
      const sentences = line
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);
      result.push(...sentences);
    } else {
      result.push(line);
    }
  }

  return result
    .map((l) => l.replace(/^[-•*\d]+[.)]\s*/, "").trim())
    .filter((l) => l.length > 5);
}

function matchesAny(line: string, keywords: string[]): boolean {
  const lower = line.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function extractDate(text: string): string {
  const patterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b(\d{1,2}\s+(?:Jan(?:uari)?|Feb(?:ruari)?|Mar(?:et)?|Apr(?:il)?|Mei|Jun(?:i)?|Jul(?:i)?|Agu(?:stus)?|Sep(?:tember)?|Okt(?:ober)?|Nov(?:ember)?|Des(?:ember)?)\w*\s+\d{4})\b/i,
    /\b((?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s+\d{1,2}\s+\w+\s+\d{4})\b/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1];
  }
  const d = new Date();
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function extractTitle(text: string): string {
  const lines = splitLines(text);
  // Check for explicit title markers
  const titleLine = lines.find((l) =>
    /^(?:judul|agenda|topik|perihal|re:|subject|tentang|meeting|rapat)\s*[:：]/i.test(l)
  );
  if (titleLine) {
    return titleLine.replace(/^[^:：]+[:：]\s*/i, "").trim();
  }
  // Take first meaningful line that's not too long
  const first = lines.find((l) => l.length < 80 && l.length > 3);
  return first ?? "Laporan";
}

function extractParticipants(text: string): string {
  const lines = splitLines(text);

  // Priority order: longer keywords first to avoid partial matching
  const kwOrder = ["dihadiri", "diikuti", "peserta", "attendee", "present", "hadir"];

  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const kw of kwOrder) {
      const idx = lower.indexOf(kw);
      if (idx === -1) continue;
      // Slice everything after the keyword and strip leading delimiters
      const afterKw = line
        .slice(idx + kw.length)
        .replace(/^[\s:,oleh]+/i, "")
        .trim();
      if (afterKw.length > 2) {
        const names = afterKw
          .split(/[,\n]|(?:\s+dan\s+)/)
          .map((n) => n.replace(/[.!?]$/, "").trim())
          .filter((n) => n.length > 1 && n.length < 60);
        if (names.length > 0) return names.join(", ");
      }
      break; // found a keyword in this line, stop looking for more on the same line
    }
  }

  // Fallback: try to detect capitalized name patterns
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = namePattern.exec(text)) !== null) {
    const candidate = m[1];
    // Exclude common non-names
    if (
      !names.includes(candidate) &&
      candidate.length > 3 &&
      !/^(Rapat|Meeting|Tanggal|Agenda|Topik|Perihal|Target|April|Maret|Januari|Februari|Oktober|November|Desember|Update|Progress)$/i.test(candidate)
    ) {
      names.push(candidate);
    }
  }
  if (names.length > 0) return names.slice(0, 8).join(", ");
  return "(tidak teridentifikasi dari teks)";
}

function classifyLines(lines: string[]): Map<string, string[]> {
  const buckets = new Map<string, string[]>([
    ["decisions", []],
    ["actions", []],
    ["problems", []],
    ["achievements", []],
    ["plans", []],
    ["insights", []],
    ["impact", []],
    ["highlights", []],
    ["general", []],
  ]);

  for (const line of lines) {
    let placed = false;
    // Priority order matters: decisions > actions > problems > achievements > plans > ...
    for (const [key, keywords] of [
      ["decisions", KW.decisions] as const,
      ["actions", KW.actions] as const,
      ["problems", KW.problems] as const,
      ["achievements", KW.achievements] as const,
      ["insights", KW.insights] as const,
      ["impact", KW.impact] as const,
      ["highlights", KW.highlights] as const,
      ["plans", KW.plans] as const,
    ]) {
      if (matchesAny(line, keywords)) {
        buckets.get(key)!.push(line);
        placed = true;
        break;
      }
    }
    if (!placed) buckets.get("general")!.push(line);
  }

  return buckets;
}

function formatBullets(lines: string[]): string {
  if (lines.length === 0) return "(tidak ditemukan dari teks — tambahkan secara manual)";
  return lines.map((l) => `• ${l}`).join("\n");
}

function summarizeParagraphs(lines: string[], maxLines = 5): string {
  if (lines.length === 0) return "(tidak ada konten umum)";
  // Take first sentence and any that contain strong action/importance signals
  const important = lines.filter((l) =>
    /penting|utama|kunci|perlu|harus|disepakati|berhasil|target/i.test(l)
  );
  const rest = lines.filter((l) => !important.includes(l));
  const combined = [...important, ...rest].slice(0, maxLines);
  return combined.join(" ").replace(/\s+/g, " ").trim();
}

// ─── Mode generators ──────────────────────────────────────────────────────────

function generateNotulensi(rawText: string, buckets: Map<string, string[]>): ReportSection[] {
  const lines = splitLines(rawText);
  const generalLines = buckets.get("general") ?? [];

  return [
    {
      key: "judul",
      label: "Judul Rapat",
      content: extractTitle(rawText),
    },
    {
      key: "tanggal",
      label: "Tanggal",
      content: extractDate(rawText),
    },
    {
      key: "peserta",
      label: "Peserta",
      content: extractParticipants(rawText),
    },
    {
      key: "ringkasan",
      label: "Ringkasan",
      content: summarizeParagraphs(generalLines.length > 0 ? generalLines : lines, 4),
    },
    {
      key: "keputusan",
      label: "Keputusan",
      content: formatBullets(buckets.get("decisions") ?? []),
    },
    {
      key: "tindak_lanjut",
      label: "Tindak Lanjut",
      content: formatBullets(buckets.get("actions") ?? []),
    },
  ];
}

function generateProgress(rawText: string, buckets: Map<string, string[]>): ReportSection[] {
  const allLines = splitLines(rawText);
  const general = buckets.get("general") ?? [];
  const focusLines = [...(buckets.get("highlights") ?? []), ...general].slice(0, 2);

  return [
    {
      key: "fokus_update",
      label: "Fokus Update",
      content: focusLines.length > 0 ? focusLines.join(" ") : allLines.slice(0, 2).join(" "),
    },
    {
      key: "perkembangan",
      label: "Perkembangan Utama",
      content: formatBullets([...(buckets.get("achievements") ?? [])]),
    },
    {
      key: "kendala",
      label: "Kendala",
      content: formatBullets(buckets.get("problems") ?? []),
    },
    {
      key: "insight",
      label: "Insight & Catatan",
      content: formatBullets(buckets.get("insights") ?? []),
    },
    {
      key: "next_step",
      label: "Next Step",
      content: formatBullets([...(buckets.get("plans") ?? []), ...(buckets.get("actions") ?? [])]),
    },
  ];
}

function generateInvestor(rawText: string, buckets: Map<string, string[]>): ReportSection[] {
  const allLines = splitLines(rawText);
  const highlights = [
    ...(buckets.get("highlights") ?? []),
    ...(buckets.get("achievements") ?? []),
  ];
  const progress = [
    ...(buckets.get("achievements") ?? []),
    ...(buckets.get("decisions") ?? []),
  ];

  return [
    {
      key: "highlight_utama",
      label: "Highlight Utama",
      content: formatBullets(highlights.length > 0 ? highlights.slice(0, 4) : allLines.slice(0, 3)),
    },
    {
      key: "progress_penting",
      label: "Progress Penting",
      content: formatBullets(progress.slice(0, 4)),
    },
    {
      key: "dampak_strategis",
      label: "Dampak Strategis",
      content: formatBullets(buckets.get("impact") ?? []),
    },
    {
      key: "arah_selanjutnya",
      label: "Arah Selanjutnya",
      content: formatBullets([...(buckets.get("plans") ?? [])].slice(0, 4)),
    },
  ];
}

function generateSummary(rawText: string, buckets: Map<string, string[]>): ReportSection[] {
  const allLines = splitLines(rawText);

  // Score lines by importance
  const scored = allLines.map((line) => {
    let score = 0;
    if (matchesAny(line, KW.decisions)) score += 3;
    if (matchesAny(line, KW.achievements)) score += 2;
    if (matchesAny(line, KW.highlights)) score += 2;
    if (matchesAny(line, KW.actions)) score += 2;
    if (matchesAny(line, KW.problems)) score += 1;
    if (matchesAny(line, KW.plans)) score += 1;
    // Prefer shorter sentences
    if (line.length < 100) score += 1;
    return { line, score };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .sort((a, b) => allLines.indexOf(a.line) - allLines.indexOf(b.line)) // restore order
    .map((s) => s.line);

  return [
    {
      key: "ringkasan_singkat",
      label: "Ringkasan Singkat",
      content: formatBullets(top),
    },
  ];
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Generate a structured report from raw text.
 *
 * ⚡ LLM INTEGRATION POINT
 * To plug in an LLM (OpenAI, Anthropic, etc.), replace the logic below with
 * an API call. Pass `rawText` and `mode` in your system/user prompt.
 * Parse the response into `GeneratedReport` and return it.
 * Keep the function signature and return type unchanged.
 */
export async function generateReport(
  rawText: string,
  mode: ReportMode
): Promise<GeneratedReport> {
  if (!rawText || rawText.trim().length < 10) {
    throw new Error("Teks terlalu pendek untuk diproses.");
  }

  const lines = splitLines(rawText);
  const buckets = classifyLines(lines);
  const title = extractTitle(rawText);

  let sections: ReportSection[];
  switch (mode) {
    case "notulensi":
      sections = generateNotulensi(rawText, buckets);
      break;
    case "progress":
      sections = generateProgress(rawText, buckets);
      break;
    case "investor":
      sections = generateInvestor(rawText, buckets);
      break;
    case "summary":
      sections = generateSummary(rawText, buckets);
      break;
    default:
      throw new Error("Mode tidak dikenal.");
  }

  return { mode, title, sections };
}
