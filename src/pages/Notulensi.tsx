import { useState } from "react";
import { FileText, Plus, Edit, Trash2, Users2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
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
import type { Notulensi } from "../../shared/schema";

function NotulensiForm({ initial, onClose, onSave }: {
  initial?: Partial<Notulensi>;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [participants, setParticipants] = useState((initial?.participants ?? []).join(", "));
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [decisions, setDecisions] = useState((initial?.decisions ?? []).join("\n"));
  const [actionItems, setActionItems] = useState((initial?.actionItems ?? []).join("\n"));
  const [status, setStatus] = useState<"draft" | "final">(initial?.status ?? "draft");

  const handleSave = () => {
    if (!title || !date || !summary) return;
    onSave({
      title, date, summary, status,
      participants: participants.split(",").map(s => s.trim()).filter(Boolean),
      decisions: decisions.split("\n").map(s => s.trim()).filter(Boolean),
      actionItems: actionItems.split("\n").map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Judul *</Label>
          <Input data-testid="input-notulensi-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul notulensi" />
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal *</Label>
          <Input data-testid="input-notulensi-date" value={date} onChange={e => setDate(e.target.value)} placeholder="cth: 10 Apr 2026" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger data-testid="select-notulensi-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Peserta (pisahkan dengan koma)</Label>
          <Input data-testid="input-notulensi-participants" value={participants} onChange={e => setParticipants(e.target.value)} placeholder="Fariz, Andi, Sari" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Ringkasan *</Label>
          <Textarea data-testid="input-notulensi-summary" value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder="Ringkasan rapat..." />
        </div>
        <div className="space-y-1.5">
          <Label>Keputusan (1 per baris)</Label>
          <Textarea data-testid="input-notulensi-decisions" value={decisions} onChange={e => setDecisions(e.target.value)} rows={3} placeholder="Keputusan 1&#10;Keputusan 2" />
        </div>
        <div className="space-y-1.5">
          <Label>Tindak Lanjut (1 per baris)</Label>
          <Textarea data-testid="input-notulensi-actions" value={actionItems} onChange={e => setActionItems(e.target.value)} rows={3} placeholder="Action 1&#10;Action 2" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button data-testid="button-save-notulensi" onClick={handleSave} disabled={!title || !date || !summary}>Simpan</Button>
      </DialogFooter>
    </div>
  );
}

export default function Notulensi() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notulensi | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: notes = [], isLoading } = useQuery<Notulensi[]>({ queryKey: ["/api/notulensi"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/notulensi", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notulensi"] }); setDialogOpen(false); toast({ title: "Notulensi ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/notulensi/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notulensi"] }); setEditing(null); toast({ title: "Notulensi diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notulensi/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notulensi"] }); setDeleteId(null); toast({ title: "Notulensi dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Notulensi" description="Meeting notes and internal documentation">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" data-testid="button-add-notulensi" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah Notulensi
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat...</p>
      ) : notes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada notulensi.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow" data-testid={`card-notulensi-${note.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm">{note.title}</h3>
                      <Badge variant={note.status === "final" ? "default" : "secondary"} className="text-[10px] capitalize">
                        {note.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{note.date}</p>
                    {note.participants?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users2 className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{note.participants.join(", ")}</p>
                      </div>
                    )}
                    <p className="text-sm text-foreground/80">{note.summary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {note.decisions?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Keputusan</p>
                          {note.decisions.map((d, j) => (
                            <div key={j} className="flex items-start gap-1.5">
                              <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />
                              <p className="text-xs">{d}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {note.actionItems?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tindak Lanjut</p>
                          {note.actionItems.map((a, j) => (
                            <p key={j} className="text-xs text-foreground/70">• {a}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" data-testid={`button-edit-notulensi-${note.id}`} onClick={() => setEditing(note)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" data-testid={`button-delete-notulensi-${note.id}`} onClick={() => setDeleteId(note.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Tambah Notulensi</DialogTitle></DialogHeader>
          <NotulensiForm onClose={() => setDialogOpen(false)} onSave={(data) => createMutation.mutate(data)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Notulensi</DialogTitle></DialogHeader>
          {editing && <NotulensiForm initial={editing} onClose={() => setEditing(null)} onSave={(data) => updateMutation.mutate({ id: editing.id, data })} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Notulensi?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.</AlertDialogDescription>
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
