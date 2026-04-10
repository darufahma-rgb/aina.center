import { useState } from "react";
import {
  Users, Plus, Shield, ShieldOff, UserCheck, UserX,
  Crown, User as UserIcon, MoreHorizontal, KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigate } from "react-router-dom";
import type { SafeUser } from "../../shared/schema";

function CreateUserForm({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Username *</Label>
          <Input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="nama_pengguna"
            data-testid="input-create-username"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@aina.org"
            data-testid="input-create-email"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Password * (min. 6 karakter)</Label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            data-testid="input-create-password"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Regular User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button
          onClick={() => onSave({ username, email, password, role })}
          disabled={!username || !email || password.length < 6}
          data-testid="button-confirm-create-user"
        >
          Buat Pengguna
        </Button>
      </DialogFooter>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return role === "admin" ? (
    <Badge className="gap-1 text-[10px]">
      <Crown className="h-2.5 w-2.5" /> Admin
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1 text-[10px]">
      <UserIcon className="h-2.5 w-2.5" /> User
    </Badge>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="outline" className="gap-1 text-[10px] border-primary/40 text-primary">
      <UserCheck className="h-2.5 w-2.5" /> Aktif
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-[10px] border-muted-foreground/30 text-muted-foreground">
      <UserX className="h-2.5 w-2.5" /> Nonaktif
    </Badge>
  );
}

export default function ManageUsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "role" | "status";
    user: SafeUser;
    newValue: any;
    label: string;
  } | null>(null);

  if (!isAdmin) return <Navigate to="/" replace />;

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateOpen(false);
      toast({ title: "Pengguna berhasil dibuat" });
    },
    onError: (e: any) => toast({ title: "Gagal membuat pengguna", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setConfirmAction(null);
      toast({ title: "Pengguna diperbarui" });
    },
    onError: (e: any) => {
      setConfirmAction(null);
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    },
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, user, newValue } = confirmAction;
    if (type === "role") {
      updateMutation.mutate({ id: user.id, data: { role: newValue } });
    } else {
      updateMutation.mutate({ id: user.id, data: { isActive: newValue } });
    }
  };

  const isSelf = (u: SafeUser) => u.id === currentUser?.id;

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    active: users.filter(u => u.isActive).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Kelola Pengguna" description="Manage system users, roles and access">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateOpen(true)}
          data-testid="button-add-user"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Pengguna
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-total-users">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Pengguna</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-total-admins">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-active-users">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Akun Aktif</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-6">Memuat...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">Belum ada pengguna.</p>
          ) : (
            <div className="divide-y">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition-colors ${!u.isActive ? "opacity-60" : ""}`}
                  data-testid={`row-user-${u.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {u.username.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm" data-testid={`text-username-${u.id}`}>{u.username}</p>
                        {isSelf(u) && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">Anda</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-email-${u.id}`}>{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RoleBadge role={u.role} />
                    <StatusBadge isActive={u.isActive} />
                    {!isSelf(u) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            data-testid={`button-actions-user-${u.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {u.role === "user" ? (
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setConfirmAction({
                                type: "role",
                                user: u,
                                newValue: "admin",
                                label: `Jadikan ${u.username} sebagai Admin?`,
                              })}
                              data-testid={`menu-promote-${u.id}`}
                            >
                              <Shield className="h-3.5 w-3.5 text-amber-600" /> Jadikan Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => setConfirmAction({
                                type: "role",
                                user: u,
                                newValue: "user",
                                label: `Turunkan ${u.username} ke Regular User?`,
                              })}
                              data-testid={`menu-demote-${u.id}`}
                            >
                              <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" /> Turunkan ke User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {u.isActive ? (
                            <DropdownMenuItem
                              className="gap-2 text-muted-foreground focus:text-foreground"
                              onClick={() => setConfirmAction({
                                type: "status",
                                user: u,
                                newValue: false,
                                label: `Nonaktifkan akun ${u.username}?`,
                              })}
                              data-testid={`menu-deactivate-${u.id}`}
                            >
                              <UserX className="h-3.5 w-3.5" /> Nonaktifkan
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="gap-2 text-primary focus:text-primary"
                              onClick={() => setConfirmAction({
                                type: "status",
                                user: u,
                                newValue: true,
                                label: `Aktifkan kembali akun ${u.username}?`,
                              })}
                              data-testid={`menu-activate-${u.id}`}
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Aktifkan
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Guide */}
      <Card className="border-muted">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Hak Akses per Role</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-600" /> Admin
                  </p>
                  <ul className="space-y-0.5">
                    <li>✓ Buat, edit, hapus semua data</li>
                    <li>✓ Kelola pengguna & role</li>
                    <li>✓ Kelola konten Investor Mode</li>
                    <li>✓ Lihat semua modul</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                    <UserIcon className="h-3 w-3 text-muted-foreground" /> Regular User
                  </p>
                  <ul className="space-y-0.5">
                    <li>✓ Lihat semua modul (read-only)</li>
                    <li>✗ Tidak bisa buat, edit, hapus</li>
                    <li>✗ Tidak bisa akses manajemen user</li>
                    <li>✗ Tidak bisa ubah konten investor</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          </DialogHeader>
          <CreateUserForm
            onClose={() => setCreateOpen(false)}
            onSave={(d) => createMutation.mutate(d)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "status" && !confirmAction.newValue
                ? "Akun yang dinonaktifkan tidak bisa login sampai diaktifkan kembali."
                : "Tindakan ini dapat diubah kembali kapan saja."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmAction?.type === "status" && !confirmAction.newValue
                  ? "bg-purple-700 hover:bg-purple-800"
                  : ""
              }
              data-testid="button-confirm-action"
            >
              Konfirmasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
