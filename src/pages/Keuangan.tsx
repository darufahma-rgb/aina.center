import { useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Edit, Trash2,
  Handshake, BarChart3, ArrowUpRight, ArrowDownRight,
  ExternalLink, Target, CheckCircle2, BookmarkPlus, Zap, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { RecordMeta } from "@/components/RecordMeta";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Keuangan, Sponsor } from "../../shared/schema";

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatRp = (n: number | string) =>
  "Rp " + Number(n).toLocaleString("id-ID");

const SOURCE_TYPE_LABELS: Record<string, string> = {
  sponsor: "Sponsor", donor: "Donor", partner: "Mitra",
  internal: "Internal", other: "Lainnya",
};

const SPONSOR_STATUS_COLORS: Record<string, string> = {
  prospect: "secondary", confirmed: "default", active: "default",
  completed: "outline", withdrawn: "destructive",
};

const SPONSOR_STATUS_LABELS: Record<string, string> = {
  prospect: "Prospek", confirmed: "Dikonfirmasi", active: "Aktif",
  completed: "Selesai", withdrawn: "Batal",
};

// ─── Template Types & Hook ─────────────────────────────────────────────────────

interface KeuanganTemplate {
  id: string;
  name: string;
  type: "income" | "expense";
  sourceName?: string;
  sourceType?: string;
  amount?: string;
  description?: string;
  category?: string;
  paymentMethod?: string;
  notes?: string;
  purpose?: string;
  responsiblePerson?: string;
}

const LS_KEY = "aina_keuangan_templates";

function useKeuanganTemplates() {
  const [templates, setTemplates] = useState<KeuanganTemplate[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
    catch { return []; }
  });

  const saveTemplate = (t: KeuanganTemplate) => {
    const next = [...templates.filter(x => x.id !== t.id), t];
    setTemplates(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const removeTemplate = (id: string) => {
    const next = templates.filter(x => x.id !== id);
    setTemplates(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  return { templates, saveTemplate, removeTemplate };
}

// ─── Template Chips ───────────────────────────────────────────────────────────

function TemplateChips({
  templates, type, onApply, onDelete,
}: {
  templates: KeuanganTemplate[];
  type: "income" | "expense";
  onApply: (t: KeuanganTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = templates.filter(t => t.type === type);
  if (filtered.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap px-1 py-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Zap className="h-3 w-3" style={{ color: "#7C3AED" }} />
        Template:
      </span>
      {filtered.map(t => (
        <div
          key={t.id}
          className="group flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-all hover:shadow-sm"
          style={{ borderColor: "#7C3AED", color: "#7C3AED", background: "#F5F3FF" }}
          onClick={() => onApply(t)}
          data-testid={`template-chip-${t.id}`}
        >
          {t.name}
          {t.amount && (
            <span className="text-[9px] text-muted-foreground font-normal ml-0.5">
              · {formatRp(Number(t.amount))}
            </span>
          )}
          <button
            className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            onClick={e => { e.stopPropagation(); onDelete(t.id); }}
            title="Hapus template"
            data-testid={`template-delete-${t.id}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({ items, sponsors }: { items: Keuangan[]; sponsors: Sponsor[] }) {
  const totalIncome = items.filter(k => k.type === "income").reduce((s, k) => s + Number(k.amount), 0);
  const totalExpense = items.filter(k => k.type === "expense").reduce((s, k) => s + Number(k.amount), 0);
  const balance = totalIncome - totalExpense;
  const totalPledged = sponsors.reduce((s, sp) => s + Number(sp.pledgedAmount), 0);
  const totalReceived = sponsors.reduce((s, sp) => s + Number(sp.receivedAmount), 0);

  const cards = [
    { icon: <TrendingUp className="h-3.5 w-3.5 text-violet-600" />, bg: "bg-violet-100", label: "Dana Masuk",       value: totalIncome,   color: "text-violet-600",  testid: "stat-total-income", extra: "" },
    { icon: <TrendingDown className="h-3.5 w-3.5 text-purple-700" />, bg: "bg-purple-100", label: "Dana Keluar",   value: totalExpense,  color: "text-purple-700",  testid: "stat-total-expense", extra: "" },
    { icon: <Wallet className={`h-3.5 w-3.5 ${balance >= 0 ? "text-primary" : "text-destructive"}`} />, bg: balance >= 0 ? "bg-primary/10" : "bg-destructive/10", label: "Saldo", value: balance, color: balance >= 0 ? "text-primary" : "text-destructive", testid: "stat-balance", extra: balance >= 0 ? "border-primary/30 bg-primary/[0.02]" : "border-destructive/30" },
    { icon: <Target className="h-3.5 w-3.5 text-purple-600" />, bg: "bg-purple-100",      label: "Dijanjikan",    value: totalPledged,  color: "text-purple-600",  testid: "stat-pledged", extra: "" },
    { icon: <CheckCircle2 className="h-3.5 w-3.5 text-primary" />, bg: "bg-primary/10",   label: "Diterima",      value: totalReceived, color: "text-primary",     testid: "stat-received", extra: "" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-3">
      {cards.map((c, i) => (
        <Card key={i} className={`${i === 0 ? "col-span-2 sm:col-span-1" : ""} ${c.extra} min-w-0`}>
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2 min-w-0">
              <div className={`h-5 w-5 sm:h-7 sm:w-7 rounded-md ${c.bg} flex items-center justify-center shrink-0`}>
                <span className="scale-75 sm:scale-100">{c.icon}</span>
              </div>
              <span className="text-[9px] sm:text-xs text-muted-foreground truncate">{c.label}</span>
            </div>
            <p className="text-sm sm:text-xl font-bold truncate" style={{ color: "inherit" }}>
              <span className={c.color} data-testid={c.testid}>{formatRp(c.value)}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Trend Chart (CSS-based) ──────────────────────────────────────────────────

function TrendChart({ items }: { items: Keuangan[] }) {
  const monthMap: Record<string, { income: number; expense: number; label: string }> = {};
  items.forEach(k => {
    const raw = k.date ?? "";
    let key = raw.slice(0, 7);
    if (!key || key.length < 4) key = "Unknown";
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0, label: key };
    const amt = Number(k.amount);
    if (k.type === "income") monthMap[key].income += amt;
    else monthMap[key].expense += amt;
  });

  const months = Object.values(monthMap).sort((a, b) => a.label.localeCompare(b.label)).slice(-6);
  if (months.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Belum ada data transaksi untuk menampilkan tren.
        </CardContent>
      </Card>
    );
  }

  const maxVal = Math.max(...months.flatMap(m => [m.income, m.expense]), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Tren Keuangan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 h-32">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5 w-full h-24">
                <div
                  className="flex-1 bg-violet-500/70 rounded-t-sm transition-all"
                  style={{ height: `${(m.income / maxVal) * 100}%` }}
                  title={`Masuk: ${formatRp(m.income)}`}
                />
                <div
                  className="flex-1 bg-purple-300/70 rounded-t-sm transition-all"
                  style={{ height: `${(m.expense / maxVal) * 100}%` }}
                  title={`Keluar: ${formatRp(m.expense)}`}
                />
              </div>
              <p className="text-[9px] text-muted-foreground text-center leading-tight">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-violet-500/70 inline-block" /> Masuk</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-purple-300/70 inline-block" /> Keluar</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Save Template Inline ─────────────────────────────────────────────────────

function SaveTemplateInline({ onSave }: { onSave: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-primary"
        onClick={() => setOpen(true)}
        data-testid="button-open-save-template"
      >
        <BookmarkPlus className="h-3.5 w-3.5" /> Simpan Template
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nama template..."
        className="h-8 text-xs w-36"
        onKeyDown={e => {
          if (e.key === "Enter" && name.trim()) { onSave(name.trim()); setOpen(false); setName(""); }
          if (e.key === "Escape") { setOpen(false); setName(""); }
        }}
        data-testid="input-template-name"
      />
      <Button
        type="button"
        size="sm"
        className="h-8 text-xs px-2.5"
        disabled={!name.trim()}
        onClick={() => { onSave(name.trim()); setOpen(false); setName(""); }}
        data-testid="button-confirm-save-template"
      >
        Simpan
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setOpen(false); setName(""); }}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ─── Income Form ──────────────────────────────────────────────────────────────

function IncomeForm({ initial, onClose, onSave, isPending, onSaveTemplate }: {
  initial?: Partial<Keuangan>; onClose: () => void; onSave: (d: any) => void;
  isPending?: boolean; onSaveTemplate?: (values: Omit<KeuanganTemplate, "id" | "name">, name: string) => void;
}) {
  const [date, setDate] = useState(initial?.date ?? "");
  const [sourceName, setSourceName] = useState(initial?.sourceName ?? initial?.counterpart ?? "");
  const [sourceType, setSourceType] = useState(initial?.sourceType ?? "other");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "");
  const [proofUrl, setProofUrl] = useState(initial?.proofUrl ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const valid = date && sourceName && amount && parseFloat(amount) > 0 && description && category;

  const currentValues = (): Omit<KeuanganTemplate, "id" | "name"> => ({
    type: "income", sourceName, sourceType, amount, description, category, paymentMethod, notes,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tanggal *</Label>
          <Input value={date} onChange={e => setDate(e.target.value)} placeholder="2026-04-10" data-testid="input-income-date" />
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah (Rp) *</Label>
          <Input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000000" data-testid="input-income-amount" />
        </div>
        <div className="space-y-1.5">
          <Label>Nama Sumber *</Label>
          <Input value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="PT. Mitra Abadi" data-testid="input-income-source-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Tipe Sumber *</Label>
          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sponsor">Sponsor</SelectItem>
              <SelectItem value="donor">Donor</SelectItem>
              <SelectItem value="partner">Mitra</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="other">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Deskripsi *</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Keterangan pemasukan" data-testid="input-income-description" />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Sponsorship, Donasi, dsb" data-testid="input-income-category" />
        </div>
        <div className="space-y-1.5">
          <Label>Metode Bayar</Label>
          <Input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} placeholder="Transfer, Tunai, dsb" data-testid="input-income-payment-method" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Link Bukti Pembayaran</Label>
          <Input value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="https://drive.google.com/..." data-testid="input-income-proof" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Catatan tambahan..." data-testid="input-income-notes" />
        </div>
      </div>
      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
        {onSaveTemplate && (
          <div className="mr-auto">
            <SaveTemplateInline onSave={(name) => onSaveTemplate(currentValues(), name)} />
          </div>
        )}
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ type: "income", date, sourceName, sourceType, amount, description, category, paymentMethod, proofUrl, notes, counterpart: sourceName })} disabled={!valid || isPending} data-testid="button-save-income">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Expense Form ─────────────────────────────────────────────────────────────

function ExpenseForm({ initial, onClose, onSave, isPending, onSaveTemplate }: {
  initial?: Partial<Keuangan>; onClose: () => void; onSave: (d: any) => void;
  isPending?: boolean; onSaveTemplate?: (values: Omit<KeuanganTemplate, "id" | "name">, name: string) => void;
}) {
  const [date, setDate] = useState(initial?.date ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [responsiblePerson, setResponsiblePerson] = useState(initial?.responsiblePerson ?? "");
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "");
  const [proofUrl, setProofUrl] = useState(initial?.proofUrl ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const valid = date && amount && parseFloat(amount) > 0 && description && category && responsiblePerson;

  const currentValues = (): Omit<KeuanganTemplate, "id" | "name"> => ({
    type: "expense", amount, description, category, purpose, responsiblePerson, paymentMethod, notes,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tanggal *</Label>
          <Input value={date} onChange={e => setDate(e.target.value)} placeholder="2026-04-10" data-testid="input-expense-date" />
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah (Rp) *</Label>
          <Input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} placeholder="1500000" data-testid="input-expense-amount" />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Operasional, Acara, dsb" data-testid="input-expense-category" />
        </div>
        <div className="space-y-1.5">
          <Label>Penanggung Jawab *</Label>
          <Input value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} placeholder="Nama PJ" data-testid="input-expense-responsible" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Deskripsi *</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Keterangan pengeluaran" data-testid="input-expense-description" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Tujuan / Keperluan</Label>
          <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Detail penggunaan dana" data-testid="input-expense-purpose" />
        </div>
        <div className="space-y-1.5">
          <Label>Metode Bayar</Label>
          <Input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} placeholder="Transfer, Tunai, dsb" data-testid="input-expense-payment-method" />
        </div>
        <div className="space-y-1.5">
          <Label>Link Bukti</Label>
          <Input value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="https://..." data-testid="input-expense-proof" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Catatan tambahan..." data-testid="input-expense-notes" />
        </div>
      </div>
      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
        {onSaveTemplate && (
          <div className="mr-auto">
            <SaveTemplateInline onSave={(name) => onSaveTemplate(currentValues(), name)} />
          </div>
        )}
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ type: "expense", date, amount, description, category, purpose, responsiblePerson, paymentMethod, proofUrl, notes })} disabled={!valid || isPending} data-testid="button-save-expense">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Sponsor Form ─────────────────────────────────────────────────────────────

function SponsorForm({ initial, onClose, onSave, isPending }: {
  initial?: Partial<Sponsor>; onClose: () => void; onSave: (d: any) => void; isPending?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [institution, setInstitution] = useState(initial?.institution ?? "");
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? "");
  const [status, setStatus] = useState(initial?.status ?? "prospect");
  const [pledgedAmount, setPledgedAmount] = useState(initial?.pledgedAmount?.toString() ?? "0");
  const [receivedAmount, setReceivedAmount] = useState(initial?.receivedAmount?.toString() ?? "0");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const pledged = parseFloat(pledgedAmount) || 0;
  const received = parseFloat(receivedAmount) || 0;
  const valid = name && institution && contactPerson && received <= pledged;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nama Sponsor *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama perusahaan / orang" data-testid="input-sponsor-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Institusi *</Label>
          <Input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="PT, Universitas, dsb" data-testid="input-sponsor-institution" />
        </div>
        <div className="space-y-1.5">
          <Label>Contact Person *</Label>
          <Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Nama kontak" data-testid="input-sponsor-contact" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospek</SelectItem>
              <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="withdrawn">Batal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Dijanjikan (Rp)</Label>
          <Input type="number" min={0} value={pledgedAmount} onChange={e => setPledgedAmount(e.target.value)} data-testid="input-sponsor-pledged" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Diterima (Rp) {received > pledged && <span className="text-destructive text-xs ml-1">tidak boleh melebihi dijanjikan</span>}</Label>
          <Input type="number" min={0} max={pledged || undefined} value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} data-testid="input-sponsor-received" className={received > pledged ? "border-destructive" : ""} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Detail kerjasama, syarat, dsb..." data-testid="input-sponsor-notes" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ name, institution, contactPerson, status, pledgedAmount, receivedAmount, notes })} disabled={!valid || isPending} data-testid="button-save-sponsor">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ item, isAdmin, onEdit, onDelete }: {
  item: Keuangan; isAdmin: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const isIncome = item.type === "income";
  return (
    <div className="flex items-start justify-between gap-4 p-4 hover:bg-muted/40 transition-colors" data-testid={`row-keuangan-${item.id}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isIncome ? "bg-violet-100" : "bg-purple-100"}`}>
          {isIncome
            ? <ArrowUpRight className="h-4 w-4 text-violet-600" />
            : <ArrowDownRight className="h-4 w-4 text-purple-700" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{item.description}</p>
            {isIncome && item.sourceType && (
              <Badge variant="outline" className="text-[10px]">{SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {item.category} · {item.date}
            {isIncome && item.sourceName && ` · ${item.sourceName}`}
            {!isIncome && item.responsiblePerson && ` · PJ: ${item.responsiblePerson}`}
          </p>
          {item.purpose && <p className="text-xs text-foreground/60 mt-0.5">{item.purpose}</p>}
          <div className="flex items-center gap-3 mt-1">
            {item.paymentMethod && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.paymentMethod}</span>}
            {item.proofUrl && (
              <a href={item.proofUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-0.5 hover:underline">
                <ExternalLink className="h-2.5 w-2.5" /> Bukti
              </a>
            )}
          </div>
          {item.notes && <p className="text-[10px] text-muted-foreground mt-0.5 italic">{item.notes}</p>}
          <RecordMeta createdBy={item.createdBy} updatedBy={item.updatedBy} createdAt={item.createdAt} className="mt-1" />
        </div>
      </div>
      <div className="flex items-start gap-2 shrink-0">
        <p className={`text-sm font-bold ${isIncome ? "text-violet-600" : "text-purple-700"}`}>
          {isIncome ? "+" : "-"}{formatRp(Number(item.amount))}
        </p>
        {isAdmin && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={onEdit} data-testid={`button-edit-keuangan-${item.id}`}><Edit className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete} data-testid={`button-delete-keuangan-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KeuanganPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { templates, saveTemplate, removeTemplate } = useKeuanganTemplates();

  const [incomeDialog, setIncomeDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [sponsorDialog, setSponsorDialog] = useState(false);
  const [editingKeuangan, setEditingKeuangan] = useState<Keuangan | null>(null);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [deleteKeuangan, setDeleteKeuangan] = useState<number | null>(null);
  const [deleteSponsor, setDeleteSponsor] = useState<number | null>(null);

  // Template pre-fill state — key is incremented to force form remount
  const [incomeInitial, setIncomeInitial] = useState<Partial<Keuangan> | undefined>(undefined);
  const [expenseInitial, setExpenseInitial] = useState<Partial<Keuangan> | undefined>(undefined);
  const [incomeKey, setIncomeKey] = useState(0);
  const [expenseKey, setExpenseKey] = useState(0);

  const { data: items = [], isLoading } = useQuery<Keuangan[]>({ queryKey: ["/api/keuangan"] });
  const { data: sponsors = [] } = useQuery<Sponsor[]>({ queryKey: ["/api/sponsor"] });

  const income = items.filter(k => k.type === "income");
  const expenses = items.filter(k => k.type === "expense");

  // ── Keuangan mutations ──
  const createK = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/keuangan", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keuangan"] });
      setIncomeDialog(false); setExpenseDialog(false);
      setIncomeInitial(undefined); setExpenseInitial(undefined);
      toast({ title: "Transaksi ditambahkan" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateK = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/keuangan/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keuangan"] });
      setEditingKeuangan(null);
      toast({ title: "Transaksi diperbarui" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteK = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/keuangan/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keuangan"] });
      setDeleteKeuangan(null);
      toast({ title: "Transaksi dihapus" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  // ── Sponsor mutations ──
  const createS = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sponsor", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor"] });
      setSponsorDialog(false);
      toast({ title: "Sponsor ditambahkan" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateS = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/sponsor/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor"] });
      setEditingSponsor(null);
      toast({ title: "Sponsor diperbarui" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteS = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sponsor/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsor"] });
      setDeleteSponsor(null);
      toast({ title: "Sponsor dihapus" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  // ── Template handlers ──
  const handleSaveIncomeTemplate = (values: Omit<KeuanganTemplate, "id" | "name">, name: string) => {
    saveTemplate({ ...values, id: crypto.randomUUID(), name });
    toast({ title: `Template "${name}" disimpan`, description: "Klik chip template untuk pakai lagi." });
  };
  const handleSaveExpenseTemplate = (values: Omit<KeuanganTemplate, "id" | "name">, name: string) => {
    saveTemplate({ ...values, id: crypto.randomUUID(), name });
    toast({ title: `Template "${name}" disimpan`, description: "Klik chip template untuk pakai lagi." });
  };
  const applyIncomeTemplate = (t: KeuanganTemplate) => {
    setIncomeInitial({ sourceName: t.sourceName, sourceType: t.sourceType as any, amount: t.amount as any, description: t.description, category: t.category, paymentMethod: t.paymentMethod, notes: t.notes });
    setIncomeKey(k => k + 1);
    setIncomeDialog(true);
  };
  const applyExpenseTemplate = (t: KeuanganTemplate) => {
    setExpenseInitial({ amount: t.amount as any, description: t.description, category: t.category, purpose: t.purpose, responsiblePerson: t.responsiblePerson, paymentMethod: t.paymentMethod, notes: t.notes });
    setExpenseKey(k => k + 1);
    setExpenseDialog(true);
  };

  return (
    <div className="space-y-3 sm:space-y-6 animate-fade-in">
      <PageHeader title="Keuangan & Sponsor" description="">
        {isAdmin && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setExpenseInitial(undefined); setExpenseDialog(true); }} data-testid="button-add-expense">
              <TrendingDown className="h-3.5 w-3.5 text-purple-700" /> Pengeluaran
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => { setIncomeInitial(undefined); setIncomeDialog(true); }} data-testid="button-add-income">
              <Plus className="h-3.5 w-3.5" /> Pemasukan
            </Button>
          </div>
        )}
      </PageHeader>

      <SummaryCards items={items} sponsors={sponsors} />

      <Tabs defaultValue="overview">
        <div className="overflow-x-auto -mx-1 px-1 pb-0.5">
          <TabsList className="h-8 w-max min-w-full">
            <TabsTrigger value="overview" className="text-[11px] whitespace-nowrap px-2.5">Overview</TabsTrigger>
            <TabsTrigger value="income" className="text-[11px] whitespace-nowrap px-2.5">Masuk ({income.length})</TabsTrigger>
            <TabsTrigger value="expense" className="text-[11px] whitespace-nowrap px-2.5">Keluar ({expenses.length})</TabsTrigger>
            <TabsTrigger value="sponsor" className="text-[11px] whitespace-nowrap px-2.5">Sponsor ({sponsors.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <TrendChart items={items} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-violet-600" /> Pemasukan Terbaru
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {income.length === 0
                  ? <p className="text-xs text-muted-foreground p-4">Belum ada pemasukan.</p>
                  : <div className="divide-y">{income.slice(0, 4).map(item => (
                    <TransactionRow key={item.id} item={item} isAdmin={false} onEdit={() => {}} onDelete={() => {}} />
                  ))}</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-purple-700" /> Pengeluaran Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {expenses.length === 0
                  ? <p className="text-xs text-muted-foreground p-4">Belum ada pengeluaran.</p>
                  : <div className="divide-y">{expenses.slice(0, 4).map(item => (
                    <TransactionRow key={item.id} item={item} isAdmin={false} onEdit={() => {}} onDelete={() => {}} />
                  ))}</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Income Tab ── */}
        <TabsContent value="income" className="mt-4 space-y-2">
          {isAdmin && (
            <TemplateChips
              templates={templates}
              type="income"
              onApply={applyIncomeTemplate}
              onDelete={removeTemplate}
            />
          )}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Semua Pemasukan</CardTitle>
                {isAdmin && (
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { setIncomeInitial(undefined); setIncomeDialog(true); }} data-testid="button-add-income-tab">
                    <Plus className="h-3 w-3" /> Tambah
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-xs text-muted-foreground p-4">Memuat...</p>
              ) : income.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">Belum ada data pemasukan.</p>
              ) : (
                <div className="divide-y">
                  {income.map(item => (
                    <TransactionRow
                      key={item.id} item={item} isAdmin={isAdmin}
                      onEdit={() => setEditingKeuangan(item)}
                      onDelete={() => setDeleteKeuangan(item.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Expense Tab ── */}
        <TabsContent value="expense" className="mt-4 space-y-2">
          {isAdmin && (
            <TemplateChips
              templates={templates}
              type="expense"
              onApply={applyExpenseTemplate}
              onDelete={removeTemplate}
            />
          )}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Semua Pengeluaran</CardTitle>
                {isAdmin && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setExpenseInitial(undefined); setExpenseDialog(true); }} data-testid="button-add-expense-tab">
                    <Plus className="h-3 w-3" /> Tambah
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-xs text-muted-foreground p-4">Memuat...</p>
              ) : expenses.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">Belum ada data pengeluaran.</p>
              ) : (
                <div className="divide-y">
                  {expenses.map(item => (
                    <TransactionRow
                      key={item.id} item={item} isAdmin={isAdmin}
                      onEdit={() => setEditingKeuangan(item)}
                      onDelete={() => setDeleteKeuangan(item.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sponsor Tab ── */}
        <TabsContent value="sponsor" className="mt-4">
          <div className="space-y-3">
            {isAdmin && (
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={() => setSponsorDialog(true)} data-testid="button-add-sponsor">
                  <Plus className="h-3.5 w-3.5" /> Tambah Sponsor
                </Button>
              </div>
            )}
            {sponsors.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada sponsor terdaftar.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsors.map(sp => {
                  const pledged = Number(sp.pledgedAmount);
                  const received = Number(sp.receivedAmount);
                  const pct = pledged > 0 ? Math.min((received / pledged) * 100, 100) : 0;
                  return (
                    <Card key={sp.id} className="hover:shadow-md transition-shadow" data-testid={`card-sponsor-${sp.id}`}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Handshake className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="font-semibold text-sm">{sp.name}</p>
                              <p className="text-xs text-muted-foreground">{sp.institution}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant={SPONSOR_STATUS_COLORS[sp.status] as any} className="text-[10px] capitalize">
                              {SPONSOR_STATUS_LABELS[sp.status] ?? sp.status}
                            </Badge>
                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditingSponsor(sp)} data-testid={`button-edit-sponsor-${sp.id}`}><Edit className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteSponsor(sp.id)} data-testid={`button-delete-sponsor-${sp.id}`}><Trash2 className="h-3 w-3" /></Button>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Kontak: <span className="font-medium text-foreground">{sp.contactPerson}</span></p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progress Dana</span>
                            <span className="font-medium">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Diterima: <span className="font-medium text-foreground">{formatRp(received)}</span></span>
                            <span className="text-muted-foreground">Target: <span className="font-medium text-foreground">{formatRp(pledged)}</span></span>
                          </div>
                        </div>
                        {sp.notes && <p className="text-xs text-foreground/60 italic">{sp.notes}</p>}
                        <RecordMeta createdBy={sp.createdBy} createdAt={sp.createdAt} updatedBy={sp.updatedBy} updatedAt={sp.updatedAt} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Income Dialog ── */}
      <Dialog open={incomeDialog} onOpenChange={(v) => { if (!v) { setIncomeInitial(undefined); } setIncomeDialog(v); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {incomeInitial ? "Pemasukan dari Template" : "Tambah Pemasukan"}
            </DialogTitle>
          </DialogHeader>
          <IncomeForm
            key={incomeKey}
            initial={incomeInitial}
            onClose={() => { setIncomeDialog(false); setIncomeInitial(undefined); }}
            onSave={d => createK.mutate(d)}
            isPending={createK.isPending}
            onSaveTemplate={handleSaveIncomeTemplate}
          />
        </DialogContent>
      </Dialog>

      {/* ── Expense Dialog ── */}
      <Dialog open={expenseDialog} onOpenChange={(v) => { if (!v) { setExpenseInitial(undefined); } setExpenseDialog(v); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {expenseInitial ? "Pengeluaran dari Template" : "Tambah Pengeluaran"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            key={expenseKey}
            initial={expenseInitial}
            onClose={() => { setExpenseDialog(false); setExpenseInitial(undefined); }}
            onSave={d => createK.mutate(d)}
            isPending={createK.isPending}
            onSaveTemplate={handleSaveExpenseTemplate}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit Keuangan Dialog ── */}
      <Dialog open={!!editingKeuangan} onOpenChange={v => !v && setEditingKeuangan(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingKeuangan?.type === "income" ? "Pemasukan" : "Pengeluaran"}</DialogTitle>
          </DialogHeader>
          {editingKeuangan && (editingKeuangan.type === "income" ? (
            <IncomeForm initial={editingKeuangan} onClose={() => setEditingKeuangan(null)} onSave={d => updateK.mutate({ id: editingKeuangan.id, data: d })} isPending={updateK.isPending} />
          ) : (
            <ExpenseForm initial={editingKeuangan} onClose={() => setEditingKeuangan(null)} onSave={d => updateK.mutate({ id: editingKeuangan.id, data: d })} isPending={updateK.isPending} />
          ))}
        </DialogContent>
      </Dialog>

      {/* ── Sponsor Dialog ── */}
      <Dialog open={sponsorDialog} onOpenChange={setSponsorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Sponsor</DialogTitle></DialogHeader>
          <SponsorForm onClose={() => setSponsorDialog(false)} onSave={d => createS.mutate(d)} isPending={createS.isPending} />
        </DialogContent>
      </Dialog>

      {/* ── Edit Sponsor Dialog ── */}
      <Dialog open={!!editingSponsor} onOpenChange={v => !v && setEditingSponsor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Sponsor</DialogTitle></DialogHeader>
          {editingSponsor && (
            <SponsorForm initial={editingSponsor} onClose={() => setEditingSponsor(null)} onSave={d => updateS.mutate({ id: editingSponsor.id, data: d })} isPending={updateS.isPending} />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Keuangan ── */}
      <AlertDialog open={deleteKeuangan !== null} onOpenChange={v => !v && setDeleteKeuangan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>Data akan dihapus dan dicatat di audit log. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteKeuangan && deleteK.mutate(deleteKeuangan)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Sponsor ── */}
      <AlertDialog open={deleteSponsor !== null} onOpenChange={v => !v && setDeleteSponsor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sponsor?</AlertDialogTitle>
            <AlertDialogDescription>Data sponsor akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSponsor && deleteS.mutate(deleteSponsor)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
