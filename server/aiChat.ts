import OpenAI from "openai";

const OPENAI_MODEL = "gpt-4o-mini";

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY tidak dikonfigurasi.");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const SYSTEM_PROMPT = `Kamu adalah Asisten Virtual AINA Centre, sistem manajemen internal organisasi AINA.

Kamu membantu anggota dan admin dengan:
- Menjelaskan fitur-fitur portal (Notulensi, Agenda, Keuangan, Anggota, Surat, Inventaris, Relasi, Investor Mode, AI Report)
- Menjawab pertanyaan seputar penggunaan portal
- Membantu memahami laporan dan data organisasi
- Memberikan panduan untuk fitur-fitur yang tersedia

FITUR PORTAL AINA:
- Dashboard: Ringkasan semua data + export PDF laporan
- Notulensi: Catatan rapat dan pertemuan
- Agenda: Jadwal kegiatan organisasi
- Keuangan: Manajemen dana masuk/keluar dan saldo
- Anggota: Daftar dan manajemen anggota aktif
- Surat: Dokumen surat menyurat
- Inventaris: Pencatatan barang dan aset
- Relasi: Manajemen relasi dan mitra eksternal
- Investor Mode: Presentasi untuk investor
- AI Report: Generate laporan otomatis dengan AI

Berikan jawaban yang singkat, jelas, dan mudah dipahami dalam Bahasa Indonesia.
Jika pertanyaan di luar konteks AINA Portal, tetap bantu dengan sopan.
Gunakan emoji yang relevan untuk membuat respons lebih ramah 😊`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithAI(
  messages: ChatMessage[],
): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? "Maaf, terjadi kesalahan. Coba lagi.";
}
