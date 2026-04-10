import { useState } from "react";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Inventaris } from "../../shared/schema";

const conditionColors: Record<string, "default" | "secondary" | "destructive"> = {
  baik: "default", perlu_perbaikan: "secondary", rusak: "destructive",
};

function InventarisForm({ initial, onClose, onSave }: { initial?: Partial<Inventaris>; onClose: () => void; onSave: (data: any) => void }) {
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
          <Label>Nama Barang *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama barang" data-testid="input-inventaris-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Elektronik, Perabot, dsb" data-testid="input-inventaris-category" />
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah</Label>
          <Input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} data-testid="input-inventaris-quantity" />
        </div>
        <div className="space-y-1.5">
          <Label>Kondisi</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baik">Baik</SelectItem>
              <SelectItem value="perlu_perbaikan">Perlu Perbaikan</SelectItem>
              <SelectItem value="rusak">Rusak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Pemegang *</Label>
          <Input value={holder} onChange={e => setHolder(e.target.value)} placeholder="Nama pemegang" data-testid="input-inventaris-holder" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Catatan..." data-testid="input-inventaris-notes" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ name, category, quantity: parseInt(quantity), condition, holder, notes })} disabled={!name || !category || !holder} data-testid="button-save-inventaris">Simpan</Button>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Inventaris" description="Asset and equipment management">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" data-testid="button-add-inventaris" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah Item
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat...</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada inventaris.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`card-inventaris-${item.id}`}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditing(item)} data-testid={`button-edit-inventaris-${item.id}`}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)} data-testid={`button-delete-inventaris-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={conditionColors[item.condition] ?? "secondary"} className="text-[10px] capitalize">{item.condition.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Pemegang: <span className="font-medium text-foreground">{item.holder}</span></p>
                  {item.notes && <p className="text-xs text-foreground/70">{item.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Item</DialogTitle></DialogHeader>
          <InventarisForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
          {editing && <InventarisForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Item?</AlertDialogTitle>
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
