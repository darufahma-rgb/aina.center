import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
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
import type { Keuangan } from "../../shared/schema";

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function KeuanganForm({ initial, onClose, onSave }: { initial?: Partial<Keuangan>; onClose: () => void; onSave: (data: any) => void }) {
  const [type, setType] = useState(initial?.type ?? "income");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [counterpart, setCounterpart] = useState(initial?.counterpart ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipe *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger data-testid="select-keuangan-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Dana Masuk</SelectItem>
              <SelectItem value="expense">Dana Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Jumlah (Rp) *</Label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000000" data-testid="input-keuangan-amount" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Deskripsi *</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Keterangan transaksi" data-testid="input-keuangan-description" />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Sponsorship, Operasional, dsb" data-testid="input-keuangan-category" />
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal *</Label>
          <Input value={date} onChange={e => setDate(e.target.value)} placeholder="cth: 10 Apr 2026" data-testid="input-keuangan-date" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Pihak Lain</Label>
          <Input value={counterpart} onChange={e => setCounterpart(e.target.value)} placeholder="Sponsor / Vendor" data-testid="input-keuangan-counterpart" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ type, amount, description, category, date, counterpart })} disabled={!type || !amount || !description || !category || !date} data-testid="button-save-keuangan">Simpan</Button>
      </DialogFooter>
    </div>
  );
}

export default function KeuanganPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Keuangan | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<Keuangan[]>({ queryKey: ["/api/keuangan"] });

  const income = items.filter(k => k.type === "income");
  const expenses = items.filter(k => k.type === "expense");
  const totalIncome = income.reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
  const totalExpense = expenses.reduce((s, k) => s + parseFloat(k.amount.toString()), 0);
  const saldo = totalIncome - totalExpense;

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/keuangan", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/keuangan"] }); setDialogOpen(false); toast({ title: "Transaksi ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/keuangan/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/keuangan"] }); setEditing(null); toast({ title: "Transaksi diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/keuangan/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/keuangan"] }); setDeleteId(null); toast({ title: "Transaksi dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const renderTable = (list: Keuangan[], label: string, type: "income" | "expense") => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {type === "income" ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Belum ada data.</p>
        ) : (
          <div className="space-y-2">
            {list.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors" data-testid={`row-keuangan-${item.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.description}</p>
                  <p className="text-xs text-muted-foreground">{item.category} · {item.date}</p>
                  {item.counterpart && <p className="text-xs text-muted-foreground">{item.counterpart}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <p className={`text-sm font-semibold ${type === "income" ? "text-success" : "text-destructive"}`}>
                    {formatRp(parseFloat(item.amount.toString()))}
                  </p>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditing(item)} data-testid={`button-edit-keuangan-${item.id}`}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(item.id)} data-testid={`button-delete-keuangan-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Keuangan" description="Financial overview and transaction management">
        {isAdmin && (
          <Button size="sm" className="gap-1.5" data-testid="button-add-keuangan" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah Transaksi
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} title="Dana Masuk" value={formatRp(totalIncome)} />
        <StatCard icon={TrendingDown} title="Dana Keluar" value={formatRp(totalExpense)} />
        <StatCard icon={Wallet} title="Saldo Tersedia" value={formatRp(saldo)} gradient />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderTable(income, "Dana Masuk", "income")}
          {renderTable(expenses, "Dana Keluar", "expense")}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Transaksi</DialogTitle></DialogHeader>
          <KeuanganForm onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Transaksi</DialogTitle></DialogHeader>
          {editing && <KeuanganForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
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
