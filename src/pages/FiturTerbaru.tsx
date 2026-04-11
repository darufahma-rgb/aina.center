import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Plus, Edit, Trash2, GitCommit, ExternalLink, RefreshCw,
  GitBranch, Clock, User, Wand2, ChevronDown, ChevronUp, Zap,
  Navigation, Copy, Check, MapPin, Loader2,
} from "lucide-react";
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
import MarkdownContent from "@/components/MarkdownContent";

const GITHUB_REPO = "darciatemantaraglobal-gif/aina.web";

// ─── Feature Keyword Mapping ─────────────────────────────────────────────────

const FEATURE_ROUTES: { keywords: string[]; route: string; label: string }[] = [
  { keywords: ["agenda", "event", "jadwal", "schedule"], route: "/agenda", label: "Agenda" },
  { keywords: ["notulensi", "notul", "meeting", "rapat", "minutes"], route: "/notulensi", label: "Notulensi" },
  { keywords: ["anggota", "member", "user", "pengguna"], route: "/anggota", label: "Anggota" },
  { keywords: ["keuangan", "finance", "uang", "dana", "budget", "sponsor", "donasi"], route: "/keuangan", label: "Keuangan" },
  { keywords: ["relasi", "relation", "partner", "mitra", "kontak", "contact"], route: "/relasi", label: "Relasi" },
  { keywords: ["surat", "letter", "dokumen", "document"], route: "/surat", label: "Surat" },
  { keywords: ["inventaris", "inventory", "barang", "aset", "asset"], route: "/inventaris", label: "Inventaris" },
  { keywords: ["investor", "invest"], route: "/investor", label: "Investor Mode" },
  { keywords: ["report", "laporan", "ai report", "ai-report"], route: "/ai-report", label: "AI Report" },
  { keywords: ["fitur", "feature", "terbaru", "changelog", "update"], route: "/fitur", label: "Fitur Terbaru" },
  { keywords: ["dashboard", "home", "beranda"], route: "/", label: "Dashboard" },
];

function guessFeatureRoute(text: string): { route: string; label: string } | null {
  const lower = text.toLowerCase();
  for (const { keywords, route, label } of FEATURE_ROUTES) {
    if (keywords.some((kw) => lower.includes(kw))) return { route, label };
  }
  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  planned:     "bg-muted text-muted-foreground border border-border",
  in_progress: "bg-primary/10 text-primary border border-primary/20",
  completed:   "bg-violet-100 text-violet-700 border border-violet-200",
  on_hold:     "bg-purple-100 text-purple-800 border border-purple-200",
};

const impactColors: Record<string, string> = {
  low: "text-muted-foreground", medium: "text-purple-500", high: "text-primary",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function shortSha(sha: string) { return sha.slice(0, 7); }

function cleanMessage(msg: string) {
  const firstLine = msg.split("\n")[0];
  return firstLine.length > 80 ? firstLine.slice(0, 77) + "…" : firstLine;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface GitHubCommit {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  html_url: string;
}

interface StoredInsight {
  detailedExplanation: string | null;
  simpleExplanation: string | null;
  mappedFeatureTarget: string | null;
}

// ─── CommitCard ──────────────────────────────────────────────────────────────

function CommitCard({
  commit,
  isRead,
  onRead,
}: {
  commit: GitHubCommit;
  isRead: boolean;
  onRead: (sha: string) => void;
}) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [expanded, setExpanded] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSimple, setLoadingSimple] = useState(false);
  const [copied, setCopied] = useState(false);

  const [detailedExplanation, setDetailedExplanation] = useState<string | null>(null);
  const [simpleExplanation, setSimpleExplanation] = useState<string | null>(null);
  const [mappedTarget, setMappedTarget] = useState<string | null>(null);
  const [insightLoaded, setInsightLoaded] = useState(false);

  // Derive effective target: stored mapping → keyword guess from message
  const effectiveTarget = mappedTarget
    ?? guessFeatureRoute(commit.commit.message)?.route
    ?? null;
  const effectiveLabel = mappedTarget
    ? (FEATURE_ROUTES.find((f) => f.route === mappedTarget)?.label ?? "Fitur")
    : (guessFeatureRoute(commit.commit.message)?.label ?? null);

  async function loadInsight() {
    try {
      const res = await fetch(`/api/commit-insights/${commit.sha}`, { credentials: "include" });
      if (res.ok) {
        const data: StoredInsight | null = await res.json();
        if (data) {
          if (data.detailedExplanation) setDetailedExplanation(data.detailedExplanation);
          if (data.simpleExplanation) setSimpleExplanation(data.simpleExplanation);
          if (data.mappedFeatureTarget) setMappedTarget(data.mappedFeatureTarget);
        }
      }
    } catch { /* non-fatal */ }
    setInsightLoaded(true);
  }

  async function handleExpand() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    // Mark as read when user opens the commit
    if (!isRead) {
      onRead(commit.sha);
      fetch("/api/commit-reads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commitHash: commit.sha, repo: GITHUB_REPO }),
      }).catch(() => {});
    }
    if (!insightLoaded) await loadInsight();
    if (!detailedExplanation && !loadingDetail) {
      await generateDetailedExplanation();
    }
  }

  async function generateDetailedExplanation() {
    setLoadingDetail(true);
    try {
      const res = await fetch("/api/github/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sha: commit.sha, message: commit.commit.message, repo: GITHUB_REPO }),
      });
      const data = await res.json();
      setDetailedExplanation(data.explanation ?? data.error ?? "Gagal mendapatkan penjelasan.");
      if (data.simpleExplanation) setSimpleExplanation(data.simpleExplanation);
      if (data.mappedFeatureTarget) setMappedTarget(data.mappedFeatureTarget);
    } catch {
      setDetailedExplanation("Terjadi kesalahan saat menghubungi AI.");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSimpleExplain() {
    if (!isAdmin) return;
    setLoadingSimple(true);
    try {
      const res = await fetch("/api/github/simple-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sha: commit.sha,
          message: commit.commit.message,
          detailedExplanation: detailedExplanation ?? "",
          repo: GITHUB_REPO,
        }),
      });
      const data = await res.json();
      setSimpleExplanation(data.simpleExplanation ?? data.error ?? "Gagal.");
    } catch {
      toast({ title: "Gagal", description: "Tidak dapat menghubungi AI.", variant: "destructive" });
    } finally {
      setLoadingSimple(false);
    }
  }

  async function handleCopy() {
    const text = [
      `Commit: ${commit.commit.message.split("\n")[0]}`,
      detailedExplanation ? `\nPenjelasan:\n${detailedExplanation}` : "",
      simpleExplanation ? `\nRingkasan sederhana:\n${simpleExplanation}` : "",
    ].join("").trim();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="hover:shadow-sm transition-shadow border border-border/60">
      <CardContent className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "linear-gradient(135deg, #3E0FA3, #7C3AED)" }}
          >
            <GitCommit className="h-3.5 w-3.5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Commit title + meta */}
            <div className="flex items-start gap-2">
              <p className="text-[13px] font-medium text-foreground leading-snug flex-1">
                {cleanMessage(commit.commit.message)}
              </p>
              {!isRead && (
                <span
                  className="shrink-0 mt-1 h-2 w-2 rounded-full"
                  style={{ background: "#7C3AED" }}
                  title="Belum dibaca"
                />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <a
                href={commit.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-primary hover:underline"
              >
                {shortSha(commit.sha)}
              </a>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <User className="h-3 w-3" />{commit.commit.author.name}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />{timeAgo(commit.commit.author.date)}
              </span>
            </div>

            {/* Expanded panel */}
            {expanded && (
              <div className="mt-3 space-y-3">
                {/* Detailed explanation */}
                <div
                  className="rounded-xl p-3 text-[12px] leading-relaxed"
                  style={{ background: "linear-gradient(135deg, #f5f0ff, #ede9fe)", border: "1px solid #ddd6fe" }}
                >
                  <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide mb-1.5">
                    Penjelasan Perubahan
                  </p>
                  {loadingDetail ? (
                    <div className="flex items-center gap-2 text-purple-600">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>AI sedang menganalisis perubahan...</span>
                    </div>
                  ) : (
                    <MarkdownContent content={detailedExplanation ?? ""} prose="purple" className="text-[12px]" />
                  )}
                </div>

                {/* Simple explanation (visible to all once generated) */}
                {simpleExplanation && (
                  <div
                    className="rounded-xl p-3 text-[12px] leading-relaxed"
                    style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #86efac" }}
                  >
                    <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Penjelasan Sederhana
                    </p>
                    <MarkdownContent content={simpleExplanation ?? ""} prose="green" className="text-[12px]" />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {/* Buka ke Fitur */}
                  {effectiveTarget ? (
                    <button
                      onClick={() => navigate(effectiveTarget)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #3E0FA3, #7C3AED)", color: "#fff" }}
                    >
                      <Navigation className="h-3 w-3" />
                      Buka {effectiveLabel}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border/50">
                      <MapPin className="h-3 w-3" />
                      Fitur terkait belum tersedia
                    </span>
                  )}

                  {/* AI Jelasin Sederhana (admin only trigger, result visible to all) */}
                  {isAdmin && !simpleExplanation && (
                    <button
                      onClick={handleSimpleExplain}
                      disabled={loadingSimple || loadingDetail || !detailedExplanation}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border"
                      style={{
                        borderColor: "#86efac",
                        color: loadingSimple ? "#9ca3af" : "#16a34a",
                        background: loadingSimple ? "#f9fafb" : "#f0fdf4",
                      }}
                    >
                      {loadingSimple
                        ? <><Loader2 className="h-3 w-3 animate-spin" /> Menganalisis...</>
                        : <><Zap className="h-3 w-3" /> AI Jelasin Sederhana</>
                      }
                    </button>
                  )}

                  {/* Copy */}
                  {(detailedExplanation || simpleExplanation) && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Tersalin" : "Salin"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Expand trigger */}
            <button
              onClick={handleExpand}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
              style={{ color: expanded ? "#7C3AED" : "#999" }}
            >
              <Wand2 className="h-3 w-3" />
              {expanded ? (
                <span className="flex items-center gap-0.5">Sembunyikan <ChevronUp className="h-3 w-3" /></span>
              ) : (
                <span className="flex items-center gap-0.5">Jelaskan perubahan <ChevronDown className="h-3 w-3" /></span>
              )}
            </button>
          </div>

          {/* External link */}
          <a
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── GitHub Tab ──────────────────────────────────────────────────────────────

function GitHubTab({ onUnreadChange }: { onUnreadChange: (n: number) => void }) {
  const [perPage, setPerPage] = useState(20);
  const [readHashes, setReadHashes] = useState<Set<string>>(new Set());
  const fetchedReads = useRef(false);

  const { data: commits, isLoading, isError, refetch, isFetching } = useQuery<GitHubCommit[]>({
    queryKey: ["github-commits", perPage],
    queryFn: async () => {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=${perPage}`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error("Gagal mengambil data GitHub");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  // Once commits loaded, fetch which ones the current user has already read
  useEffect(() => {
    if (!commits || commits.length === 0) return;
    const hashes = commits.map((c) => c.sha).join(",");
    fetch(`/api/commit-reads?hashes=${encodeURIComponent(hashes)}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        const set = new Set<string>(data.readHashes ?? []);
        setReadHashes(set);
        const unread = commits.filter((c) => !set.has(c.sha)).length;
        onUnreadChange(unread);
      })
      .catch(() => {});
  }, [commits]);

  // Called by each CommitCard when user opens it
  function handleRead(sha: string) {
    setReadHashes((prev) => {
      if (prev.has(sha)) return prev;
      const next = new Set(prev);
      next.add(sha);
      const unread = (commits ?? []).filter((c) => !next.has(c.sha)).length;
      onUnreadChange(unread);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Mengambil data dari GitHub...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-destructive font-medium mb-2">Gagal memuat data GitHub</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Coba Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = (commits ?? []).filter((c) => !readHashes.has(c.sha)).length;

  return (
    <div className="space-y-4">
      {/* Repo info bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {GITHUB_REPO}
            <ExternalLink className="h-3 w-3" />
          </a>
          <Badge variant="outline" className="text-[10px]">main</Badge>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="text-[11px] text-purple-600 font-medium">
              {unreadCount} belum dibaca
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info hint */}
      <div
        className="rounded-xl px-4 py-2.5 text-[11px] text-purple-700 flex items-start gap-2"
        style={{ background: "#f5f0ff", border: "1px solid #ddd6fe" }}
      >
        <Wand2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Titik ungu menandakan update yang <strong>belum kamu buka</strong>.
          Klik <strong>Jelaskan perubahan</strong> untuk membaca dan menandai sudah dilihat.
        </span>
      </div>

      {/* Commit list */}
      <div className="space-y-2">
        {commits?.map((commit) => (
          <CommitCard
            key={commit.sha}
            commit={commit}
            isRead={readHashes.has(commit.sha)}
            onRead={handleRead}
          />
        ))}
      </div>

      {/* Load more */}
      {commits && commits.length === perPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setPerPage((p) => p + 20)}
            disabled={isFetching}
          >
            {isFetching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
            Muat Lebih Banyak
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Fitur Form ───────────────────────────────────────────────────────────────

function FiturForm({
  initial, onClose, onSave, isAdmin,
}: {
  initial?: Partial<FiturTerbaru>;
  onClose: () => void;
  onSave: (data: any) => void;
  isAdmin: boolean;
}) {
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
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama fitur" />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori *</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="AI, UX, Backend, dsb" />
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
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Deskripsi fitur..."
          />
        </div>
        {isAdmin && (
          <div className="col-span-2 flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Tampilkan di Investor Mode</p>
              <p className="text-xs text-muted-foreground">Fitur ini akan terlihat di halaman investor</p>
            </div>
            <Switch checked={isInvestorVisible} onCheckedChange={setIsInvestorVisible} />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button
          onClick={() => onSave({ name, category, status, description, impact, isInvestorVisible })}
          disabled={!name || !category || !description}
        >
          Simpan
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FiturTerbaruPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"fitur" | "github">("fitur");
  const [githubUnreadCount, setGithubUnreadCount] = useState(0);
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
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Fitur Terbaru AINA" description="Product development progress and feature tracking">
        {isAdmin && activeTab === "fitur" && (
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah Fitur
          </Button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "rgba(0,0,0,0.05)" }}>
        {([
          { key: "fitur",  label: "Fitur",          icon: Sparkles  },
          { key: "github", label: "Riwayat GitHub",  icon: GitCommit },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={
              activeTab === key
                ? { background: "#fff", color: "#3E0FA3", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }
                : { color: "#888" }
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {key === "github" && githubUnreadCount > 0 && (
              <span
                className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold text-white"
                style={{ background: "#7C3AED" }}
              >
                {githubUnreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feature list tab */}
      {activeTab === "fitur" && (
        <>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Memuat...</p>
          ) : features.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Belum ada fitur.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <Card key={f.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="font-semibold text-sm leading-tight">{f.name}</h3>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditing(f)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(f.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[f.status] ?? ""}`}>
                          {f.status.replace("_", " ")}
                        </span>
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
        </>
      )}

      {/* GitHub tab */}
      {activeTab === "github" && <GitHubTab onUnreadChange={setGithubUnreadCount} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tambah Fitur</DialogTitle></DialogHeader>
          <FiturForm isAdmin={isAdmin} onClose={() => setDialogOpen(false)} onSave={(d) => createMutation.mutate(d)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Fitur</DialogTitle></DialogHeader>
          {editing && (
            <FiturForm
              isAdmin={isAdmin}
              initial={editing}
              onClose={() => setEditing(null)}
              onSave={(d) => updateMutation.mutate({ id: editing.id, data: d })}
            />
          )}
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
