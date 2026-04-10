import { useState, useMemo } from "react";
import { Package, Plus, Edit, Trash2, Search, Boxes, AlertTriangle, CheckCircle, Wrench } from "lucide-react";
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
import type { Inventaris } from "../../shared/schema";

const CONDITION_LABEL: Record<string, string> = { baik: "Baik", perlu_perbaikan: "Perlu Perbaikan", rusak: "Rusak" };
const CONDITION_COLOR: Record<string, string> = {
  baik: "bg-green-500/10 text-green-700 border-green-500/30",
  perlu_perbaikan: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  rusak: "bg-destructive/10 text-destructive border-destructive/30",
};
const CONDITION_ICON: Record<string, any> = { baik: CheckCircle, perlu_perbaikan: Wrench, rusak: AlertTriangle };

function InventarisForm({ initial, onClose, onSave, isPending }: {
  initial?: Partial<Inventaris>; onClose: () => void; onSave: (data: any) => void; isPending?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? "1");
  const [condition, setCondition] = useState(initial?.condition ?? "baik");
  const [holder, setHolder] = useState(initial?.holder ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nama Barang <span className="text-destructive">*</span></Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama barang atau aset" data-testid="input-inventaris-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori <span className="text-destructive">*</span></Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Elektronik, Furnitur, dsb" data-testid="input-inventaris-category" />
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah</Label>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} data-testid="input-inventaris-quantity" />
        </div>
        <div className="space-y-1.5">
          <Label>Kondisi</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger data-testid="select-inventaris-condition"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baik">Baik</SelectItem>
              <SelectItem value="perlu_perbaikan">Perlu Perbaikan</SelectItem>
              <SelectItem value="rusak">Rusak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Pemegang <span className="text-destructive">*</span></Label>
          <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Nama pemegang / divisi" data-testid="input-inventaris-holder" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Lokasi, kode aset, atau keterangan lain..." data-testid="input-inventaris-notes" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
        <Button onClick={() => onSave({ name, category, quantity: parseInt(quantity) || 1, condition, holder, notes: notes || null })} disabled={!name || !category || !holder || isPending} data-testid="button-save-inventaris">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function InventarisPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Inventaris | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCondition, setFilterCondition] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery<Inventaris[]>({ queryKey: ["/api/inventaris"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/inventaris", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/inventaris"] }); setDialogOpen(false); toast({ title: "Item ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/inventaris/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/inventaris"] }); setEditing(null); toast({ title: "Item diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inventaris/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/inventaris"] }); setDeleteId(null); toast({ title: "Item dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const stats = useMemo(() => ({
    total: items.length,
    totalUnits: items.reduce((acc, i) => acc + i.quantity, 0),
    baik: items.filter((i) => i.condition === "baik").length,
    perluPerbaikan: items.filter((i) => i.condition === "perlu_perbaikan").length,
    rusak: items.filter((i) => i.condition === "rusak").length,
  }), [items]);

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return Array.from(cats).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filterCondition !== "all") list = list.filter((i) => i.condition === filterCondition);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.holder.toLowerCase().includes(q) ||
        (i.notes?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [items, filterCondition, search]);

  const needsAttention = stats.perluPerbaikan + stats.rusak;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Inventaris" description="Aset dan perlengkapan organisasi">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)} data-testid="button-add-inventaris">
            <Plus className="h-3.5 w-3.5" /> Tambah Item
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Jenis Barang", value: stats.total, icon: Package, color: "text-primary" },
          { label: "Total Unit", value: stats.totalUnits, icon: Boxes, color: "text-primary" },
          { label: "Kondisi Baik", value: stats.baik, icon: CheckCircle, color: "text-green-600" },
          { label: "Perlu Perhatian", value: needsAttention, icon: AlertTriangle, color: needsAttention > 0 ? "text-amber-600" : "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} data-testid={`stat-inventaris-${s.label.toLowerCase().replace(/ /g, "-")}`}>
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

      {/* Attention banner */}
      {needsAttention > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5" data-testid="banner-inventaris-attention">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>{needsAttention} item</strong> memerlukan perhatian — {stats.perluPerbaikan} perlu perbaikan, {stats.rusak} rusak.
          </p>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kategori, pemegang..."
            className="pl-9 h-9"
            data-testid="input-search-inventaris"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { val: "all", label: "Semua" },
            { val: "baik", label: "Baik" },
            { val: "perlu_perbaikan", label: "Perlu Perbaikan" },
            { val: "rusak", label: "Rusak" },
          ].map((f) => (
            <Button key={f.val} size="sm" variant={filterCondition === f.val ? "default" : "outline"} className="h-9 text-xs" onClick={() => setFilterCondition(f.val)} data-testid={`filter-condition-${f.val}`}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category quick-filter chips */}
      {categories.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSearch(cat === search ? "" : cat)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${search === cat ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground"}`}
              data-testid={`chip-category-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-5 space-y-3">
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{search || filterCondition !== "all" ? "Tidak ada hasil ditemukan" : "Belum ada inventaris"}</p>
            <p className="text-xs text-muted-foreground">
              {search || filterCondition !== "all" ? "Coba ubah filter atau kata kunci pencarian" : "Tambahkan aset pertama untuk mulai mencatat"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const CondIcon = CONDITION_ICON[item.condition] ?? CheckCircle;
            return (
              <Card key={item.id} className={`hover:shadow-md transition-all hover:-translate-y-0.5 ${item.condition === "rusak" ? "border-destructive/20" : item.condition === "perlu_perbaikan" ? "border-amber-500/20" : ""}`} data-testid={`card-inventaris-${item.id}`}>
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditing(item)} data-testid={`button-edit-inventaris-${item.id}`}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)} data-testid={`button-delete-inventaris-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${CONDITION_COLOR[item.condition]}`}>
                        <CondIcon className="h-2.5 w-2.5" />
                        {CONDITION_LABEL[item.condition] ?? item.condition}
                      </span>
                      <Badge variant="outline" className="text-[10px]">×{item.quantity} unit</Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{item.holder}</span>
                    </div>
                    {item.notes && <p className="text-xs text-foreground/60 line-clamp-2">{item.notes}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Item Inventaris</DialogTitle></DialogHeader>
          <InventarisForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} isPending={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
          {editing && <InventarisForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} isPending={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item ini?</AlertDialogTitle>
            <AlertDialogDescription>Data inventaris akan dihapus secara permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive hover:bg-destructive/90" data-testid="button-confirm-delete-inventaris">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
