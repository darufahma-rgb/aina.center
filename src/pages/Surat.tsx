import { useState } from "react";
import { Mail, Plus, Edit, Trash2 } from "lucide-react";
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
import type { Surat } from "../../shared/schema";

function SuratForm({ initial, onClose, onSave }: { initial?: Partial<Surat>; onClose: () => void; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [type, setType] = useState(initial?.type ?? "masuk");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Judul *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul surat" data-testid="input-surat-title" />
        </div>
        <div className="space-y-1.5">
          <Label>Nomor Surat *</Label>
          <Input value={number} onChange={e => setNumber(e.target.value)} placeholder="001/AINA/IV/2026" data-testid="input-surat-number" />
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal *</Label>
          <Input value={date} onChange={e => setDate(e.target.value)} placeholder="10 Apr 2026" data-testid="input-surat-date" />
        </div>
        <div className="space-y-1.5">
          <Label>Jenis</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="masuk">Surat Masuk</SelectItem>
              <SelectItem value="keluar">Surat Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Deskripsi</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Keterangan surat..." data-testid="input-surat-description" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ title, number, date, type, status, description })} disabled={!title || !number || !date} data-testid="button-save-surat">Simpan</Button>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Surat" description="Incoming and outgoing official documents">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" data-testid="button-add-surat" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah Surat
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat...</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada surat.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`card-surat-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                        <Badge variant={item.type === "masuk" ? "default" : "outline"} className="text-[10px] capitalize shrink-0">
                          {item.type === "masuk" ? "Masuk" : "Keluar"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize shrink-0">{item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.number} · {item.date}</p>
                      {item.description && <p className="text-xs text-foreground/70 mt-1">{item.description}</p>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditing(item)} data-testid={`button-edit-surat-${item.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)} data-testid={`button-delete-surat-${item.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Surat</DialogTitle></DialogHeader>
          <SuratForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Surat</DialogTitle></DialogHeader>
          {editing && <SuratForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Surat?</AlertDialogTitle>
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
