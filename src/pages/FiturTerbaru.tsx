import { useState } from "react";
import { Sparkles, Plus, Edit, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import type { FiturTerbaru } from "../../shared/schema";

const statusColors: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  on_hold: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const impactColors: Record<string, string> = {
  low: "text-muted-foreground", medium: "text-amber-500", high: "text-red-500",
};

function FiturForm({ initial, onClose, onSave, isAdmin }: { initial?: Partial<FiturTerbaru>; onClose: () => void; onSave: (data: any) => void; isAdmin: boolean }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [status, setStatus] = useState(initial?.status ?? "planned");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [impact, setImpact] = useState(initial?.impact ?? "medium");
  const [isInvestorVisible, setIsInvestorVisible] = useState(initial?.isInvestorVisible ?? false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nama Fitur *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama fitur" data-testid="input-fitur-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="AI, UX, Backend, dsb" data-testid="input-fitur-category" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Impact</Label>
          <Select value={impact} onValueChange={setImpact}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Deskripsi *</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Deskripsi fitur..." data-testid="input-fitur-description" />
        </div>
        {isAdmin && (
          <div className="col-span-2 flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Tampilkan di Investor Mode</p>
              <p className="text-xs text-muted-foreground">Fitur ini akan terlihat di halaman investor</p>
            </div>
            <Switch checked={isInvestorVisible} onCheckedChange={setIsInvestorVisible} data-testid="switch-fitur-investor" />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ name, category, status, description, impact, isInvestorVisible })} disabled={!name || !category || !description} data-testid="button-save-fitur">Simpan</Button>
      </DialogFooter>
    </div>
  );
}

export default function FiturTerbaruPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FiturTerbaru | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: features = [], isLoading } = useQuery<FiturTerbaru[]>({ queryKey: ["/api/fitur"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/fitur", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/fitur"] }); setDialogOpen(false); toast({ title: "Fitur ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/fitur/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/fitur"] }); setEditing(null); toast({ title: "Fitur diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/fitur/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/fitur"] }); setDeleteId(null); toast({ title: "Fitur dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Fitur Terbaru AINA" description="Product development progress and feature tracking">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" data-testid="button-add-fitur" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah Fitur
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat...</p>
      ) : features.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada fitur.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow" data-testid={`card-fitur-${f.id}`}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm leading-tight">{f.name}</h3>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditing(f)} data-testid={`button-edit-fitur-${f.id}`}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(f.id)} data-testid={`button-delete-fitur-${f.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[f.status] ?? ""}`}>{f.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-foreground/70">{f.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Impact: <span className={`font-medium capitalize ${impactColors[f.impact]}`}>{f.impact}</span>
                    </p>
                    {f.isInvestorVisible && (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Investor</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Fitur</DialogTitle></DialogHeader>
          <FiturForm isAdmin={isAdmin} onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Fitur</DialogTitle></DialogHeader>
          {editing && <FiturForm isAdmin={isAdmin} initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Fitur?</AlertDialogTitle>
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
