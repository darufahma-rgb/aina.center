import { useState, useMemo } from "react";
import { Mail, Plus, Edit, Trash2, Search, FileText, ExternalLink, ArrowDownLeft, ArrowUpRight, Archive, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Surat } from "../../shared/schema";
import { TemplateManagerSection, TemplatePrintDialog } from "@/components/SuratTemplateManager";

const STATUS_LABEL: Record<string, string> = { draft: "Draft", sent: "Terkirim", received: "Diterima", archived: "Diarsipkan" };
const STATUS_COLOR: Record<string, string> = {
  draft:    "bg-muted text-muted-foreground border-border",
  sent:     "bg-primary/10 text-primary border-primary/20",
  received: "bg-violet-100 text-violet-700 border-violet-200",
  archived: "bg-secondary text-secondary-foreground border-border",
};

function SuratForm({ initial, onClose, onSave, isPending }: {
  initial?: Partial<Surat>; onClose: () => void; onSave: (data: any) => void; isPending?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [type, setType] = useState(initial?.type ?? "masuk");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Judul Surat <span className="text-destructive">*</span></Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Perihal surat" data-testid="input-surat-title" />
        </div>
        <div className="space-y-1.5">
          <Label>Nomor Surat <span className="text-destructive">*</span></Label>
          <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="001/AINA/IV/2026" data-testid="input-surat-number" />
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal <span className="text-destructive">*</span></Label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="10 Apr 2026" data-testid="input-surat-date" />
        </div>
        <div className="space-y-1.5">
          <Label>Jenis</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger data-testid="select-surat-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="masuk">Surat Masuk</SelectItem>
              <SelectItem value="keluar">Surat Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="select-surat-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Terkirim</SelectItem>
              <SelectItem value="received">Diterima</SelectItem>
              <SelectItem value="archived">Diarsipkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Link File</Label>
          <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/... atau link dokumen" data-testid="input-surat-fileurl" />
          <p className="text-[11px] text-muted-foreground">Google Drive, Dropbox, OneDrive, atau tautan lainnya</p>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Keterangan</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Ringkasan isi surat..." data-testid="input-surat-description" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
        <Button onClick={() => onSave({ title, number, date, type, status, fileUrl: fileUrl || null, description: description || null })} disabled={!title || !number || !date || isPending} data-testid="button-save-surat">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function SuratPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Surat | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [printSurat, setPrintSurat] = useState<Surat | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery<Surat[]>({ queryKey: ["/api/surat"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/surat", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/surat"] }); setDialogOpen(false); toast({ title: "Surat ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/surat/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/surat"] }); setEditing(null); toast({ title: "Surat diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/surat/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/surat"] }); setDeleteId(null); toast({ title: "Surat dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const stats = useMemo(() => ({
    total: items.length,
    masuk: items.filter((i) => i.type === "masuk").length,
    keluar: items.filter((i) => i.type === "keluar").length,
    archived: items.filter((i) => i.status === "archived").length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filterType !== "all") list = list.filter((i) => i.type === filterType);
    if (filterStatus !== "all") list = list.filter((i) => i.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.number.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [items, filterType, filterStatus, search]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Surat" description="Manajemen surat masuk dan keluar organisasi">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)} data-testid="button-add-surat">
            <Plus className="h-3.5 w-3.5" /> Tambah Surat
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "text-primary" },
          { label: "Masuk", value: stats.masuk, icon: ArrowDownLeft, color: "text-violet-600" },
          { label: "Keluar", value: stats.keluar, icon: ArrowUpRight, color: "text-primary" },
          { label: "Diarsipkan", value: stats.archived, icon: Archive, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} data-testid={`stat-surat-${s.label.toLowerCase()}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau nomor surat..."
            className="pl-9 h-9"
            data-testid="input-search-surat"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { val: "all", label: "Semua Jenis" },
            { val: "masuk", label: "Masuk" },
            { val: "keluar", label: "Keluar" },
          ].map((f) => (
            <Button key={f.val} size="sm" variant={filterType === f.val ? "default" : "outline"} className="h-9 text-xs" onClick={() => setFilterType(f.val)} data-testid={`filter-type-${f.val}`}>
              {f.label}
            </Button>
          ))}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 text-xs w-36" data-testid="filter-status-surat">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Terkirim</SelectItem>
              <SelectItem value="received">Diterima</SelectItem>
              <SelectItem value="archived">Diarsipkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4 flex gap-3 items-center">
              <div className="h-9 w-9 bg-muted rounded-lg animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
              </div>
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{search || filterType !== "all" || filterStatus !== "all" ? "Tidak ada hasil ditemukan" : "Belum ada surat"}</p>
            <p className="text-xs text-muted-foreground">
              {search || filterType !== "all" || filterStatus !== "all" ? "Coba ubah filter atau kata kunci pencarian" : "Tambahkan surat pertama untuk mulai mencatat"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const isMasuk = item.type === "masuk";
            return (
              <Card key={item.id} className="hover:shadow-sm transition-shadow" data-testid={`card-surat-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isMasuk ? "bg-violet-100" : "bg-primary/10"}`}>
                      {isMasuk ? <ArrowDownLeft className="h-4 w-4 text-violet-600" /> : <ArrowUpRight className="h-4 w-4 text-primary" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLOR[item.status]}`}>
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                        <Badge variant={isMasuk ? "default" : "outline"} className="text-[10px] shrink-0">
                          {isMasuk ? "Masuk" : "Keluar"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{item.number}</span>
                        <span>·</span>
                        <span>{item.date}</span>
                        {item.fileUrl && (
                          <>
                            <span>·</span>
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                              data-testid={`link-surat-file-${item.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> Lihat File
                            </a>
                          </>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-foreground/60 mt-1 line-clamp-1">{item.description}</p>
                      )}
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Cetak dari Template" onClick={() => setPrintSurat(item)} data-testid={`button-print-surat-${item.id}`}>
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditing(item)} data-testid={`button-edit-surat-${item.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)} data-testid={`button-delete-surat-${item.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Template Manager Section */}
      <TemplateManagerSection isAdmin={isAdmin} />

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Surat</DialogTitle></DialogHeader>
          <SuratForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} isPending={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Surat</DialogTitle></DialogHeader>
          {editing && <SuratForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} isPending={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus surat ini?</AlertDialogTitle>
            <AlertDialogDescription>Data akan dihapus secara permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive hover:bg-destructive/90" data-testid="button-confirm-delete-surat">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {printSurat && (
        <TemplatePrintDialog
          surat={printSurat}
          open={!!printSurat}
          onClose={() => setPrintSurat(null)}
        />
      )}
    </div>
  );
}
