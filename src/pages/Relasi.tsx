import { useState } from "react";
import { Handshake, Plus, Edit, Trash2 } from "lucide-react";
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
import type { Relasi } from "../../shared/schema";

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  active: "default", inactive: "secondary", prospect: "outline",
};

function RelasiForm({ initial, onClose, onSave }: { initial?: Partial<Relasi>; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [institution, setInstitution] = useState(initial?.institution ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [status, setStatus] = useState(initial?.status ?? "prospect");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nama *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama kontak" data-testid="input-relasi-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Institusi *</Label>
          <Input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Perusahaan / Universitas" data-testid="input-relasi-institution" />
        </div>
        <div className="space-y-1.5">
          <Label>Peran *</Label>
          <Input value={role} onChange={e => setRole(e.target.value)} placeholder="Partner, Investor, dsb" data-testid="input-relasi-role" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Catatan</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Catatan relasi..." data-testid="input-relasi-notes" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ name, institution, role, status, notes })} disabled={!name || !institution || !role} data-testid="button-save-relasi">Simpan</Button>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Relasi" description="External relationships and partnerships">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" data-testid="button-add-relasi" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah Relasi
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat...</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada relasi.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`card-relasi-${item.id}`}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Handshake className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditing(item)} data-testid={`button-edit-relasi-${item.id}`}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)} data-testid={`button-delete-relasi-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.institution}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{item.role}</Badge>
                    <Badge variant={statusColors[item.status] ?? "secondary"} className="text-[10px] capitalize">{item.status}</Badge>
                  </div>
                  {item.notes && <p className="text-xs text-foreground/70">{item.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Relasi</DialogTitle></DialogHeader>
          <RelasiForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Relasi</DialogTitle></DialogHeader>
          {editing && <RelasiForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Relasi?</AlertDialogTitle>
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
