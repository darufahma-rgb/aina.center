import { useState, useMemo } from "react";
import { Handshake, Plus, Edit, Trash2, Search, Phone, Mail, Building2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { Relasi } from "../../shared/schema";

const STATUS_LABELS: Record<string, string> = { active: "Aktif", inactive: "Nonaktif", prospect: "Prospek" };
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-700 border-green-500/30",
  inactive: "bg-muted text-muted-foreground border-border",
  prospect: "bg-amber-500/10 text-amber-700 border-amber-500/30",
};

function ContactBadge({ contact }: { contact: string }) {
  const isEmail = contact.includes("@");
  const Icon = isEmail ? Mail : Phone;
  return (
    <a
      href={isEmail ? `mailto:${contact}` : `tel:${contact}`}
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      data-testid="link-relasi-contact"
    >
      <Icon className="h-3 w-3" />
      {contact}
    </a>
  );
}

function RelasiForm({ initial, onClose, onSave, isPending }: {
  initial?: Partial<Relasi>; onClose: () => void; onSave: (data: any) => void; isPending?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [institution, setInstitution] = useState(initial?.institution ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [status, setStatus] = useState(initial?.status ?? "prospect");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nama <span className="text-destructive">*</span></Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kontak" data-testid="input-relasi-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Institusi <span className="text-destructive">*</span></Label>
          <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Perusahaan / Universitas" data-testid="input-relasi-institution" />
        </div>
        <div className="space-y-1.5">
          <Label>Peran <span className="text-destructive">*</span></Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Partner, Investor, dsb" data-testid="input-relasi-role" />
        </div>
        <div className="space-y-1.5">
          <Label>Kontak</Label>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="email@domain.com atau 08xx" data-testid="input-relasi-contact" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="select-relasi-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospek</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Detail relasi, konteks, atau tindak lanjut..." data-testid="input-relasi-notes" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
        <Button onClick={() => onSave({ name, institution, role, contact: contact || null, status, notes: notes || null })} disabled={!name || !institution || !role || isPending} data-testid="button-save-relasi">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function RelasiPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Relasi | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery<Relasi[]>({ queryKey: ["/api/relasi"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/relasi", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/relasi"] }); setDialogOpen(false); toast({ title: "Relasi ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/relasi/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/relasi"] }); setEditing(null); toast({ title: "Relasi diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/relasi/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/relasi"] }); setDeleteId(null); toast({ title: "Relasi dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === "active").length,
    prospect: items.filter((i) => i.status === "prospect").length,
    inactive: items.filter((i) => i.status === "inactive").length,
  }), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filterStatus !== "all") list = list.filter((i) => i.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.institution.toLowerCase().includes(q) ||
        i.role.toLowerCase().includes(q) ||
        (i.contact?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [items, filterStatus, search]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Relasi" description="Kontak, mitra, dan jaringan strategis organisasi">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)} data-testid="button-add-relasi">
            <Plus className="h-3.5 w-3.5" /> Tambah Relasi
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-primary" },
          { label: "Aktif", value: stats.active, icon: Handshake, color: "text-green-600" },
          { label: "Prospek", value: stats.prospect, icon: Building2, color: "text-amber-600" },
          { label: "Nonaktif", value: stats.inactive, icon: Users, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} data-testid={`stat-relasi-${s.label.toLowerCase()}`}>
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
            placeholder="Cari nama, institusi, peran..."
            className="pl-9 h-9"
            data-testid="input-search-relasi"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "active", "prospect", "inactive"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              className="h-9 text-xs"
              onClick={() => setFilterStatus(s)}
              data-testid={`filter-relasi-${s}`}
            >
              {s === "all" ? "Semua" : STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-5 space-y-3">
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Handshake className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{search || filterStatus !== "all" ? "Tidak ada hasil ditemukan" : "Belum ada relasi"}</p>
            <p className="text-xs text-muted-foreground">
              {search || filterStatus !== "all" ? "Coba ubah filter atau kata kunci pencarian" : "Tambahkan kontak pertama Anda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-all hover:-translate-y-0.5" data-testid={`card-relasi-${item.id}`}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Handshake className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.institution}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditing(item)} data-testid={`button-edit-relasi-${item.id}`}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)} data-testid={`button-delete-relasi-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{item.role}</Badge>
                  </div>

                  {item.contact && <ContactBadge contact={item.contact} />}
                  {item.notes && <p className="text-xs text-foreground/70 line-clamp-2">{item.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Relasi</DialogTitle></DialogHeader>
          <RelasiForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} isPending={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Relasi</DialogTitle></DialogHeader>
          {editing && <RelasiForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} isPending={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus relasi ini?</AlertDialogTitle>
            <AlertDialogDescription>Data akan dihapus secara permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive hover:bg-destructive/90" data-testid="button-confirm-delete-relasi">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
