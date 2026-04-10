import { useState } from "react";
import {
  Target, Lightbulb, Shield, Sparkles, TrendingUp, Rocket,
  CheckCircle2, Eye, EyeOff, Edit2, Wallet, Handshake, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FiturTerbaru, InvestorContent } from "../../shared/schema";

const formatRp = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");

function FinancialHighlights() {
  const { data: summary } = useQuery<any>({ queryKey: ["/api/finance/summary"] });
  if (!summary) return null;

  const sponsorStatusLabels: Record<string, string> = {
    prospect: "Prospek", confirmed: "Dikonfirmasi", active: "Aktif",
    completed: "Selesai", withdrawn: "Batal",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Saldo Tersedia</span>
            </div>
            <p className="text-xl font-bold text-primary" data-testid="investor-balance">{formatRp(summary.balance ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">Total Dana Masuk</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatRp(summary.totalIncome ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Handshake className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">Dana Sponsor Diterima</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{formatRp(summary.totalReceived ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">dari {formatRp(summary.totalPledged ?? 0)} dijanjikan</p>
          </CardContent>
        </Card>
      </div>

      {summary.sponsorList && summary.sponsorList.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Ringkasan Sponsor ({summary.totalSponsor} total, {summary.activeSponsor} aktif)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.sponsorList.map((sp: any) => {
                const pledged = Number(sp.pledgedAmount);
                const received = Number(sp.receivedAmount);
                const pct = pledged > 0 ? Math.min((received / pledged) * 100, 100) : 0;
                return (
                  <div key={sp.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium truncate">{sp.name}</p>
                        <Badge variant="secondary" className="text-[9px] shrink-0 ml-2">
                          {sponsorStatusLabels[sp.status] ?? sp.status}
                        </Badge>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatRp(received)} / {formatRp(pledged)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const sectionIcons: Record<string, any> = {
  about: Target, problem: Lightbulb, strengths: Shield,
  features: Sparkles, milestones: TrendingUp, roadmap: Rocket,
};

function ContentEditForm({ item, onClose, onSave }: { item: InvestorContent; onClose: () => void; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Judul</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} data-testid="input-investor-title" />
      </div>
      <div className="space-y-1.5">
        <Label>Konten</Label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} data-testid="input-investor-content" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ title, content })} data-testid="button-save-investor">Simpan</Button>
      </DialogFooter>
    </div>
  );
}

const DEFAULT_CONTENT: Record<string, { title: string; content: string; order: number }> = {
  about: { title: "Tentang AINA", content: "AINA adalah platform manajemen organisasi internal berbasis AI yang dirancang untuk meningkatkan efisiensi operasional dan transparansi.", order: 1 },
  problem: { title: "Masalah yang Kami Selesaikan", content: "Organisasi modern sering kesulitan dalam mengelola dokumentasi, komunikasi, dan pelaporan internal secara efisien.", order: 2 },
  strengths: { title: "Keunggulan Kami", content: "AI-powered automation • Role-based access control • Real-time collaboration • Modular and extensible architecture", order: 3 },
  features: { title: "Fitur Utama", content: "Dashboard Intelligence • Notulensi Otomatis • Manajemen Keuangan • Tracking Agenda • Database Anggota • Investor Mode", order: 4 },
  milestones: { title: "Pencapaian", content: "MVP Launch Q1 2026 • Beta Testing Q2 2026 • Public Release Q3 2026", order: 5 },
  roadmap: { title: "Roadmap", content: "Phase 1: Core modules • Phase 2: AI integration • Phase 3: Mobile app • Phase 4: Enterprise features", order: 6 },
};

export default function InvestorModePage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<InvestorContent | null>(null);

  const { data: contents = [], isLoading: contentLoading } = useQuery<InvestorContent[]>({ queryKey: ["/api/investor-content"] });
  const { data: investorFitur = [] } = useQuery<FiturTerbaru[]>({ queryKey: ["/api/fitur"] });

  const visibleFitur = investorFitur.filter(f => f.isInvestorVisible);

  const updateMutation = useMutation({
    mutationFn: ({ key, data }: { key: string; data: any }) => apiRequest("PUT", `/api/investor-content/${key}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/investor-content"] }); setEditingItem(null); toast({ title: "Konten diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, isVisible }: { id: number; isVisible: boolean }) => apiRequest("PATCH", `/api/investor-content/${id}/visibility`, { isVisible }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/investor-content"] }); toast({ title: "Visibilitas diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const getContent = (key: string): InvestorContent | undefined => contents.find(c => c.key === key);

  const renderSection = (key: string) => {
    const item = getContent(key);
    const def = DEFAULT_CONTENT[key];
    const Icon = sectionIcons[key] ?? Target;
    const title = item?.title ?? def?.title ?? key;
    const content = item?.content ?? def?.content ?? "";
    const isVisible = item ? item.isVisible : true;

    if (!isAdmin && !isVisible) return null;

    return (
      <Card key={key} className={`${!isVisible && isAdmin ? "opacity-60 border-dashed" : ""}`} data-testid={`card-investor-${key}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            {isAdmin && item && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => toggleVisibility.mutate({ id: item.id, isVisible: !isVisible })}
                  data-testid={`button-toggle-visibility-${key}`}
                  title={isVisible ? "Sembunyikan" : "Tampilkan"}
                >
                  {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => setEditingItem(item)}
                  data-testid={`button-edit-investor-${key}`}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {isAdmin && !item && (
              <Button
                variant="ghost" size="sm" className="text-xs text-primary"
                onClick={() => updateMutation.mutate({ key, data: { title: def.title, content: def.content, order: def.order } })}
                data-testid={`button-init-investor-${key}`}
              >
                Inisialisasi
              </Button>
            )}
          </div>
          {isAdmin && !isVisible && (
            <Badge variant="secondary" className="text-[10px] w-fit">Tersembunyi dari investor</Badge>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80 whitespace-pre-line">{content}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Investor Mode" description="Organizational overview for investors and stakeholders">
        {isAdmin && (
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">Mode Admin — kelola visibilitas konten</Badge>
        )}
      </PageHeader>

      {isAdmin && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Mode Admin:</span> Anda dapat mengedit dan mengatur visibilitas setiap bagian. Konten yang tersembunyi tidak akan terlihat oleh investor.
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ringkasan Keuangan</h2>
        <FinancialHighlights />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(DEFAULT_CONTENT).map(renderSection)}
      </div>

      {visibleFitur.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Fitur Unggulan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleFitur.map(f => (
                <div key={f.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{f.name}</p>
                    <Badge variant="secondary" className="text-[10px] capitalize">{f.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.category} · <span className="capitalize">{f.impact} impact</span></p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingItem} onOpenChange={(v) => !v && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Konten</DialogTitle></DialogHeader>
          {editingItem && (
            <ContentEditForm
              item={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(data) => updateMutation.mutate({ key: editingItem.key, data })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
