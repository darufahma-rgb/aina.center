import { useState } from "react";
import { CalendarDays, Plus, Edit, Trash2, MapPin, User } from "lucide-react";
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

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  upcoming: "default", completed: "secondary", cancelled: "destructive",
};

function AgendaForm({ initial, onClose, onSave }: { initial?: Partial<Agenda>; onClose: () => void; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [pic, setPic] = useState(initial?.pic ?? "");
  const [status, setStatus] = useState(initial?.status ?? "upcoming");
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
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
        <Button onClick={() => onSave({ title, date, time, location, pic, status, description })} disabled={!title || !date || !time || !location || !pic} data-testid="button-save-agenda">Simpan</Button>
      </DialogFooter>
    </div>
  );
}

export default function AgendaPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agenda | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<Agenda[]>({ queryKey: ["/api/agenda"] });

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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Agenda" description="Upcoming plans and activities">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" data-testid="button-add-agenda" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah Agenda
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat...</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada agenda.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow" data-testid={`card-agenda-${item.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                    </div>
                    <Badge variant={statusVariant[item.status] ?? "secondary"} className="text-[10px] capitalize">{item.status}</Badge>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>📅 {item.date} · {item.time}</p>
                      <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</p>
                      <p className="flex items-center gap-1"><User className="h-3 w-3" /> {item.pic}</p>
                    </div>
                    {item.description && <p className="text-xs text-foreground/70">{item.description}</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditing(item)} data-testid={`button-edit-agenda-${item.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)} data-testid={`button-delete-agenda-${item.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
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
