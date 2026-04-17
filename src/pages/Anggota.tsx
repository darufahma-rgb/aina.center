import { useState } from "react";
import { Users, Plus, Edit, Trash2, Mail, ShieldCheck, Shield, Download, FileDown, Loader2, Search, MoreVertical, X } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AnggotaProfile } from "@/components/AnggotaProfile";
import type { Anggota } from "../../shared/schema";

function MemberAvatar({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-base" : "h-10 w-10 text-sm";

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover border border-black/10 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full gradient-primary flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-semibold">{name.slice(0, 2).toUpperCase()}</span>
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
        <Button
          onClick={() => onSave({ name, role, division, email: email || null, photoUrl: photoUrl || null, status, accessLevel })}
          disabled={!name || !role || !division}
          data-testid="button-save-anggota"
        >
          Simpan
        </Button>
      </DialogFooter>
    </div>
  );
}

const DIVISION_ORDER = ["Founder", "Head of AINA Mesir", "Operations & Admin", "Community & Partnership", "Developer Assistant", "Creative & Media"];

export default function AnggotaPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Anggota | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Anggota | null>(null);

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
      if (res.alreadyComplete) {
        toast({ title: "Semua anggota sudah ada", description: "14 anggota AINA sudah tersimpan di database." });
      } else {
        toast({
          title: `Import selesai: ${res.imported} anggota ditambahkan`,
          description: res.skipped > 0 ? `${res.skipped} sudah ada sebelumnya, dilewati.` : undefined,
        });
      }
    },
    onError: (e: any) => toast({ title: "Gagal import", description: e.message, variant: "destructive" }),
  });

  const filtered = members.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    m.division.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, m) => {
    const div = m.division ?? "Lainnya";
    if (!acc[div]) acc[div] = [];
    acc[div].push(m);
    return acc;
  }, {} as Record<string, Anggota[]>);

  const sortedDivisions = [
    ...DIVISION_ORDER.filter(d => grouped[d]),
    ...Object.keys(grouped).filter(d => !DIVISION_ORDER.includes(d)),
  ];

  const activeCount = members.filter(m => m.status === "active").length;
  const selectedProfileMember = selectedProfile ? members.find(m => m.id === selectedProfile.id) ?? selectedProfile : null;

  function handleExportCSV() {
    const headers = ["Nama", "Role/Jabatan", "Divisi", "Email", "Status", "Level Akses"];
    const rows = members.map(m => [
      m.name,
      m.role,
      m.division,
      m.email ?? "",
      m.status,
      m.accessLevel,
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anggota-aina-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Anggota" description="Tim orang-orang di balik AINA">
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 hidden sm:flex"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Import
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 sm:hidden"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 hidden sm:flex"
              onClick={handleExportCSV}
              disabled={members.length === 0}
            >
              <FileDown className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 sm:hidden"
              onClick={handleExportCSV}
              disabled={members.length === 0}
            >
              <FileDown className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" className="gap-1.5 hidden sm:flex" data-testid="button-add-anggota" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Tambah
            </Button>
            <Button size="icon" className="h-8 w-8 sm:hidden" data-testid="button-add-anggota" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Stats + Search bar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {searchOpen ? (
            <div className="flex items-center gap-1.5 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama, role, divisi..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { setSearch(""); setSearchOpen(false); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cari anggota...</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto sm:ml-2">
                <span className="font-medium text-foreground">{members.length}</span> anggota
                <span className="text-muted-foreground/50">·</span>
                <span className="font-medium text-green-600">{activeCount}</span> aktif
              </div>
            </>
          )}
        </div>
        {!searchOpen && (
          <Button size="icon" variant="ghost" className="h-8 w-8 sm:hidden flex-shrink-0" onClick={() => setSearchOpen(true)}>
            <Search className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          Tidak ada anggota yang cocok dengan "<span className="font-medium text-foreground">{search}</span>"
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDivisions.map(division => (
            <div key={division}>
              {/* Division header */}
              <div className="flex items-center gap-2 mb-2 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{division}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">{grouped[division].length}</span>
              </div>

              {/* Mobile: compact list */}
              <div className="sm:hidden divide-y divide-border rounded-xl border bg-card overflow-hidden">
                {grouped[division].map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2.5 active:bg-muted/50 cursor-pointer"
                    data-testid={`card-anggota-${m.id}`}
                    onClick={() => setSelectedProfile(m)}
                  >
                    <MemberAvatar name={m.name} photoUrl={m.photoUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{m.role}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${m.status === "active" ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                      {m.accessLevel === "admin" && (
                        <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />
                      )}
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground -mr-1">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => setEditing(m)} data-testid={`button-edit-anggota-${m.id}`}>
                              <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(m.id)}
                              className="text-destructive focus:text-destructive"
                              data-testid={`button-delete-anggota-${m.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: card grid */}
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {grouped[division].map((m) => (
                  <Card
                    key={m.id}
                    className="hover:shadow-md transition-shadow group cursor-pointer"
                    data-testid={`card-anggota-${m.id}`}
                    onClick={() => setSelectedProfile(m)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <MemberAvatar name={m.name} photoUrl={m.photoUrl} size="lg" />
                          {isAdmin && (
                            <div
                              className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              onClick={e => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => setEditing(m)}
                                data-testid={`button-edit-anggota-${m.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteId(m.id)}
                                data-testid={`button-delete-anggota-${m.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-snug">{m.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.role}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant={m.status === "active" ? "default" : "secondary"}
                            className="text-[10px] capitalize h-4 px-1.5"
                          >
                            {m.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] flex items-center gap-0.5 h-4 px-1.5">
                            {m.accessLevel === "admin" ? <ShieldCheck className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
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

      <AnggotaProfile anggota={selectedProfileMember} onClose={() => setSelectedProfile(null)} />

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
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
