import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail, ShieldCheck, Shield, Link2, Link2Off, Plus, Trash2,
  CheckCircle2, Circle, Clock, AlertCircle, Loader2,
  CalendarDays, User2,
} from "lucide-react";
import type { Anggota, Tugas } from "../../shared/schema";

type SafeUser = { id: number; username: string; email: string; displayName?: string | null; role: string };

function MemberAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        className="h-16 w-16 rounded-full object-cover border border-black/10 flex-shrink-0"
      />
    );
  }
  return (
    <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
      <span className="text-white font-bold text-lg">{name.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

const STATUS_CONFIG = {
  todo:        { label: "To Do",       icon: Circle,       color: "text-muted-foreground", bg: "bg-muted" },
  in_progress: { label: "In Progress", icon: Clock,        color: "text-blue-600",          bg: "bg-blue-50 dark:bg-blue-950" },
  done:        { label: "Selesai",     icon: CheckCircle2, color: "text-green-600",         bg: "bg-green-50 dark:bg-green-950" },
};

const PRIORITY_CONFIG = {
  low:    { label: "Low",    color: "text-muted-foreground border-border" },
  medium: { label: "Medium", color: "text-yellow-600 border-yellow-300" },
  high:   { label: "High",   color: "text-red-600 border-red-300" },
};

function TugasItem({
  t,
  isAdmin,
  onStatusChange,
  onDelete,
}: {
  t: Tugas;
  isAdmin: boolean;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = STATUS_CONFIG[t.status];
  const pCfg = PRIORITY_CONFIG[t.priority];
  const Icon = cfg.icon;
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-lg border p-3 space-y-1.5 ${cfg.bg}`}>
      <div className="flex items-start gap-2">
        <button
          className={`mt-0.5 flex-shrink-0 ${cfg.color} ${isAdmin ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}
          onClick={() => {
            if (!isAdmin) return;
            const next = t.status === "todo" ? "in_progress" : t.status === "in_progress" ? "done" : "todo";
            onStatusChange(t.id, next);
          }}
          title={isAdmin ? "Klik untuk ubah status" : undefined}
        >
          <Icon className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
            {t.title}
          </p>
          {t.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] border rounded px-1.5 py-0.5 font-medium ${pCfg.color}`}>
              {pCfg.label}
            </span>
            {t.dueDate && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-2.5 w-2.5" />
                {t.dueDate}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <button
            className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => onDelete(t.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddTugasForm({ anggotaId, onDone }: { anggotaId: number; onDone: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/anggota/${anggotaId}/tugas`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/anggota/${anggotaId}/tugas`] });
      toast({ title: "Tugas ditambahkan" });
      onDone();
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
      <div className="space-y-1.5">
        <Label className="text-xs">Judul Tugas *</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nama tugas..." className="h-8 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Deskripsi</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detail tugas (opsional)..." className="text-sm min-h-[60px] resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Prioritas</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Deadline</Label>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={onDone}>Batal</Button>
        <Button
          size="sm"
          className="flex-1 text-xs h-8"
          disabled={!title || mutation.isPending}
          onClick={() => mutation.mutate({ title, description: description || null, priority, dueDate: dueDate || null })}
        >
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Simpan"}
        </Button>
      </div>
    </div>
  );
}

interface AnggotaProfileProps {
  anggota: Anggota | null;
  onClose: () => void;
}

export function AnggotaProfile({ anggota: member, onClose }: AnggotaProfileProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [addingTugas, setAddingTugas] = useState(false);
  const [linkingUser, setLinkingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const { data: tugasList = [], isLoading: loadingTugas } = useQuery<Tugas[]>({
    queryKey: [`/api/anggota/${member?.id}/tugas`],
    enabled: !!member,
  });

  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const updateTugasMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/tugas/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/anggota/${member?.id}/tugas`] }),
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const deleteTugasMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tugas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/anggota/${member?.id}/tugas`] }),
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const linkUserMutation = useMutation({
    mutationFn: (userId: number | null) =>
      apiRequest("PATCH", `/api/anggota/${member?.id}/link-user`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anggota"] });
      setLinkingUser(false);
      toast({ title: "Akun berhasil di-link" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  if (!member) return null;

  const linkedUser = users.find(u => u.id === member.userId);
  const todoCount = tugasList.filter(t => t.status === "todo").length;
  const inProgressCount = tugasList.filter(t => t.status === "in_progress").length;
  const doneCount = tugasList.filter(t => t.status === "done").length;

  return (
    <Sheet open={!!member} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b flex-shrink-0">
          <SheetHeader className="mb-0">
            <SheetTitle className="sr-only">Profil Anggota</SheetTitle>
          </SheetHeader>
          <div className="flex items-start gap-4">
            <MemberAvatar name={member.name} photoUrl={member.photoUrl} />
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="font-bold text-base leading-tight">{member.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{member.role}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{member.division}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Badge
                  variant={member.status === "active" ? "default" : "secondary"}
                  className="text-[10px] h-4 px-1.5 capitalize"
                >
                  {member.status}
                </Badge>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex items-center gap-0.5">
                  {member.accessLevel === "admin" ? <ShieldCheck className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
                  {member.accessLevel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="mt-3 space-y-1.5">
            {member.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {/* Linked account */}
            <div className="flex items-center gap-2 text-xs">
              <User2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              {linkedUser ? (
                <span className="text-foreground font-medium">@{linkedUser.username}</span>
              ) : (
                <span className="text-muted-foreground">Belum ada akun terhubung</span>
              )}
              {isAdmin && (
                <button
                  className="ml-auto text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  onClick={() => { setLinkingUser(v => !v); setSelectedUserId(member.userId?.toString() ?? ""); }}
                  title={linkedUser ? "Ubah link akun" : "Hubungkan akun"}
                >
                  {linkedUser ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>

            {/* Link user form */}
            {linkingUser && isAdmin && (
              <div className="pt-1 flex items-center gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Pilih akun..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Tidak ada —</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        @{u.username} {u.displayName ? `(${u.displayName})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-7 text-xs px-3"
                  disabled={linkUserMutation.isPending}
                  onClick={() => linkUserMutation.mutate(
                    selectedUserId && selectedUserId !== "none" ? parseInt(selectedUserId) : null
                  )}
                >
                  {linkUserMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Simpan"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tugas section */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Tugas header + stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Tugas</h3>
              {tugasList.length > 0 && (
                <div className="flex items-center gap-1 text-[10px]">
                  {inProgressCount > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-950 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                      {inProgressCount} aktif
                    </span>
                  )}
                  {doneCount > 0 && (
                    <span className="bg-green-100 dark:bg-green-950 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                      {doneCount} selesai
                    </span>
                  )}
                  {todoCount > 0 && (
                    <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                      {todoCount} todo
                    </span>
                  )}
                </div>
              )}
            </div>
            {isAdmin && !addingTugas && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2" onClick={() => setAddingTugas(true)}>
                <Plus className="h-3 w-3" /> Tambah
              </Button>
            )}
          </div>

          {/* Add tugas form */}
          {addingTugas && (
            <AddTugasForm anggotaId={member.id} onDone={() => setAddingTugas(false)} />
          )}

          {/* Task list */}
          {loadingTugas ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : tugasList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Belum ada tugas untuk anggota ini.</p>
              {isAdmin && (
                <Button size="sm" variant="outline" className="mt-3 text-xs h-7 gap-1" onClick={() => setAddingTugas(true)}>
                  <Plus className="h-3 w-3" /> Tambah Tugas
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* In progress first */}
              {["in_progress", "todo", "done"].map(status =>
                tugasList.filter(t => t.status === status).map(t => (
                  <TugasItem
                    key={t.id}
                    t={t}
                    isAdmin={isAdmin}
                    onStatusChange={(id, s) => updateTugasMutation.mutate({ id, status: s })}
                    onDelete={(id) => deleteTugasMutation.mutate(id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
