import { useState } from "react";
import { Users, Plus, Edit, Trash2, Mail, ShieldCheck, Shield, Download, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Anggota } from "../../shared/schema";

function MemberAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        className="h-14 w-14 rounded-full object-cover border border-black/10 flex-shrink-0"
      />
    );
  }
  return (
    <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
      <span className="text-white font-semibold text-base">{name.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

function AnggotaForm({ initial, onClose, onSave }: { initial?: Partial<Anggota>; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [division, setDivision] = useState(initial?.division ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [accessLevel, setAccessLevel] = useState(initial?.accessLevel ?? "user");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Nama *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama anggota" data-testid="input-anggota-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Role/Jabatan *</Label>
          <Input value={role} onChange={e => setRole(e.target.value)} placeholder="CEO, Developer, dsb" data-testid="input-anggota-role" />
        </div>
        <div className="space-y-1.5">
          <Label>Divisi *</Label>
          <Input value={division} onChange={e => setDivision(e.target.value)} placeholder="Divisi" data-testid="input-anggota-division" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@aina.id (opsional)" data-testid="input-anggota-email" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>URL Foto</Label>
          <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://... (opsional)" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Level Akses</Label>
          <Select value={accessLevel} onValueChange={setAccessLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ name, role, division, email: email || null, photoUrl: photoUrl || null, status, accessLevel })} disabled={!name || !role || !division} data-testid="button-save-anggota">Simpan</Button>
      </DialogFooter>
    </div>
  );
}

export default function AnggotaPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Anggota | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: members = [], isLoading } = useQuery<Anggota[]>({ queryKey: ["/api/anggota"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/anggota", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/anggota"] }); setDialogOpen(false); toast({ title: "Anggota ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/anggota/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/anggota"] }); setEditing(null); toast({ title: "Anggota diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/anggota/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/anggota"] }); setDeleteId(null); toast({ title: "Anggota dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const importMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/anggota/import-from-aina-web", {}),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/anggota"] });
      toast({
        title: `Import selesai: ${res.imported} anggota ditambahkan`,
        description: res.skipped > 0 ? `${res.skipped} sudah ada, dilewati.` : undefined,
      });
    },
    onError: (e: any) => toast({ title: "Gagal import", description: e.message, variant: "destructive" }),
  });

  const grouped = members.reduce((acc, m) => {
    const div = m.division ?? "Lainnya";
    if (!acc[div]) acc[div] = [];
    acc[div].push(m);
    return acc;
  }, {} as Record<string, Anggota[]>);

  const divisionOrder = ["Founder", "Head of AINA Mesir", "Operations & Admin", "Community & Partnership", "Developer Assistant", "Creative & Media"];
  const sortedDivisions = [
    ...divisionOrder.filter(d => grouped[d]),
    ...Object.keys(grouped).filter(d => !divisionOrder.includes(d)),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Anggota" description="Tim orang-orang di balik AINA">
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Import dari AINA Web
            </Button>
            <Button size="sm" className="gap-1.5" data-testid="button-add-anggota" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Tambah Anggota
            </Button>
          </div>
        )}
      </PageHeader>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat...</p>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Belum ada anggota.</p>
            {isAdmin && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => importMutation.mutate()} disabled={importMutation.isPending}>
                {importMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Import dari AINA Web
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedDivisions.map(division => (
            <div key={division}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">{division}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {grouped[division].map((m) => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow" data-testid={`card-anggota-${m.id}`}>
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <MemberAvatar name={m.name} photoUrl={m.photoUrl} />
                          {isAdmin && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditing(m)} data-testid={`button-edit-anggota-${m.id}`}><Edit className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(m.id)} data-testid={`button-delete-anggota-${m.id}`}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-snug">{m.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.role}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{m.status}</Badge>
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                            {m.accessLevel === "admin" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                            {m.accessLevel}
                          </Badge>
                        </div>
                        {m.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Anggota</DialogTitle></DialogHeader>
          <AnggotaForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Anggota</DialogTitle></DialogHeader>
          {editing && <AnggotaForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
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
