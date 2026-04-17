import { useState } from "react";
import {
  CalendarDays, Plus, Edit, Trash2, MapPin, User,
  CheckCircle2, Clock, XCircle, Newspaper, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Agenda } from "../../shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIGYPTBerita {
  id: string;
  title: string;
  date: string;
  published_at: string;
  image_url: string | null;
  category: string;
  summary: string;
  status: "completed";
  source: "aigypt";
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CFG = {
  upcoming:  { label: "Akan Datang", color: "#2563EB", bg: "#EFF6FF", icon: Clock },
  completed: { label: "Selesai",     color: "#16A34A", bg: "#F0FDF4", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan",  color: "#DC2626", bg: "#FEF2F2", icon: XCircle },
} as const;

// ─── Form ─────────────────────────────────────────────────────────────────────

function AgendaForm({ initial, onClose, onSave }: {
  initial?: Partial<Agenda>; onClose: () => void; onSave: (data: any) => void;
}) {
  const [title,       setTitle]       = useState(initial?.title ?? "");
  const [date,        setDate]        = useState(initial?.date ?? "");
  const [time,        setTime]        = useState(initial?.time ?? "");
  const [location,    setLocation]    = useState(initial?.location ?? "");
  const [pic,         setPic]         = useState(initial?.pic ?? "");
  const [status,      setStatus]      = useState(initial?.status ?? "upcoming");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Judul *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul agenda" data-testid="input-agenda-title" />
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal *</Label>
          <Input value={date} onChange={e => setDate(e.target.value)} placeholder="cth: 10 Apr 2026" data-testid="input-agenda-date" />
        </div>
        <div className="space-y-1.5">
          <Label>Waktu *</Label>
          <Input value={time} onChange={e => setTime(e.target.value)} placeholder="cth: 09:00" data-testid="input-agenda-time" />
        </div>
        <div className="space-y-1.5">
          <Label>Lokasi *</Label>
          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Lokasi" data-testid="input-agenda-location" />
        </div>
        <div className="space-y-1.5">
          <Label>PIC *</Label>
          <Input value={pic} onChange={e => setPic(e.target.value)} placeholder="Penanggung jawab" data-testid="input-agenda-pic" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Akan Datang</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Deskripsi</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Deskripsi agenda..." data-testid="input-agenda-description" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button
          onClick={() => onSave({ title, date, time, location, pic, status, description })}
          disabled={!title || !date || !time || !location || !pic}
          data-testid="button-save-agenda"
        >
          Simpan
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Manual Agenda Card ───────────────────────────────────────────────────────

function AgendaCard({ item, isAdmin, onEdit, onDelete }: {
  item: Agenda; isAdmin: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const st = STATUS_CFG[item.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.upcoming;
  const Icon = st.icon;
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-agenda-${item.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" style={{ color: "#7C3AED" }} />
              <h3 className="font-semibold text-sm leading-tight">{item.title}</h3>
            </div>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: st.bg, color: st.color }}
            >
              <Icon className="h-3 w-3" />
              {st.label}
            </span>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>📅 {item.date} · {item.time}</p>
              <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</p>
              <p className="flex items-center gap-1"><User className="h-3 w-3" /> {item.pic}</p>
            </div>
            {item.description && <p className="text-xs text-foreground/70 mt-1">{item.description}</p>}
          </div>
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onEdit} data-testid={`button-edit-agenda-${item.id}`}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} data-testid={`button-delete-agenda-${item.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AIGYPT Berita Detail Dialog ──────────────────────────────────────────────

function BeritaDetailDialog({ item, onClose }: { item: AIGYPTBerita; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">{item.title}</DialogTitle>
        </DialogHeader>
        {item.image_url && (
          <div className="w-full rounded-xl overflow-hidden bg-muted" style={{ maxHeight: 280 }}>
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "#F0FDF4", color: "#16A34A" }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Selesai
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
            style={{ background: "#EDE9FE", color: "#7C3AED" }}
          >
            AIGYPT
          </span>
          <span className="text-[11px] text-muted-foreground ml-auto">{item.date}</span>
        </div>
        {item.summary ? (
          <p className="text-sm text-foreground/80 leading-relaxed">{item.summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Tidak ada ringkasan tersedia.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── AIGYPT Berita Card ───────────────────────────────────────────────────────

function BeritaCard({ item, onClick }: { item: AIGYPTBerita; onClick: () => void }) {
  return (
    <Card
      className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {item.image_url && (
          <div className="h-36 w-full overflow-hidden bg-muted">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 shrink-0" style={{ color: "#7C3AED" }} />
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#F0FDF4", color: "#16A34A" }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Selesai
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">{item.date}</span>
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-[#7C3AED] transition-colors">{item.title}</h3>
          {item.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.summary}</p>
          )}
          <div className="flex items-center gap-1.5 pt-1">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ background: "#EDE9FE", color: "#7C3AED" }}
            >
              AIGYPT
            </span>
            <span className="text-[9px] text-muted-foreground ml-auto group-hover:text-[#7C3AED] transition-colors font-medium">Lihat detail →</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab helpers ──────────────────────────────────────────────────────────────

type Tab = "manual" | "aigypt";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [tab,           setTab]           = useState<Tab>("aigypt");
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editing,       setEditing]       = useState<Agenda | null>(null);
  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [selectedBerita, setSelectedBerita] = useState<AIGYPTBerita | null>(null);

  const { data: manualItems = [], isLoading: loadingManual } = useQuery<Agenda[]>({
    queryKey: ["/api/agenda"],
  });

  const { data: beritaItems = [], isLoading: loadingBerita } = useQuery<AIGYPTBerita[]>({
    queryKey: ["/api/aigypt/berita"],
    staleTime: 10 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/agenda", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/agenda"] }); setDialogOpen(false); toast({ title: "Agenda ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/agenda/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/agenda"] }); setEditing(null); toast({ title: "Agenda diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/agenda/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/agenda"] }); setDeleteId(null); toast({ title: "Agenda dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const upcomingCount = manualItems.filter(i => i.status === "upcoming").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Agenda" description="Kegiatan organisasi AINA">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" data-testid="button-add-agenda" onClick={() => { setTab("manual"); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> Tambah Agenda
          </Button>
        )}
      </PageHeader>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#F3F0FF" }}>
        {([
          { id: "aigypt",  label: "Berita AIGYPT", count: beritaItems.length },
          { id: "manual",  label: "Agenda Manual",  count: upcomingCount },
        ] as { id: Tab; label: string; count: number }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={tab === t.id
              ? { background: "#7C3AED", color: "#fff" }
              : { color: "#7C3AED" }
            }
          >
            {t.label}
            <span
              className="text-[10px] px-1.5 py-0 rounded-full font-bold"
              style={tab === t.id
                ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                : { background: "#EDE9FE", color: "#7C3AED" }
              }
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── AIGYPT Berita Tab ── */}
      {tab === "aigypt" && (
        <>
          <div className="flex items-center gap-2 px-1">
            <Newspaper className="h-4 w-4" style={{ color: "#7C3AED" }} />
            <p className="text-sm text-muted-foreground">
              Kegiatan yang telah dilaksanakan, diambil otomatis dari berita AIGYPT.
            </p>
          </div>
          {loadingBerita ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-list">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-56 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : beritaItems.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada berita dari AIGYPT.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-list">
              {beritaItems.map((item) => (
                <BeritaCard key={item.id} item={item} onClick={() => setSelectedBerita(item)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Manual Agenda Tab ── */}
      {tab === "manual" && (
        <>
          <div className="flex items-center gap-2 px-1">
            <CalendarDays className="h-4 w-4" style={{ color: "#7C3AED" }} />
            <p className="text-sm text-muted-foreground">
              Agenda yang diinput manual oleh tim.
            </p>
          </div>
          {loadingManual ? (
            <p className="text-muted-foreground text-sm">Memuat...</p>
          ) : manualItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                Belum ada agenda manual.{" "}
                {isAdmin && (
                  <button
                    className="font-semibold underline"
                    style={{ color: "#7C3AED" }}
                    onClick={() => setDialogOpen(true)}
                  >
                    Tambah sekarang
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-list">
              {manualItems.map((item) => (
                <AgendaCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onEdit={() => setEditing(item)}
                  onDelete={() => setDeleteId(item.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Berita Detail Popup ── */}
      {selectedBerita && (
        <BeritaDetailDialog item={selectedBerita} onClose={() => setSelectedBerita(null)} />
      )}

      {/* ── Dialogs ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Agenda</DialogTitle></DialogHeader>
          <AgendaForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Agenda</DialogTitle></DialogHeader>
          {editing && <AgendaForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Agenda?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
