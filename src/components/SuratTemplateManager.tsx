import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, ImagePlus, Printer, Download, X, Move, ChevronDown, ChevronUp, LayoutTemplate } from "lucide-react";
import type { SuratTemplate, FieldMapping, Surat } from "../../shared/schema";

const FIELD_DEFS: { field: FieldMapping["field"]; label: string; color: string }[] = [
  { field: "number", label: "Nomor Surat", color: "#1A1A1A" },
  { field: "date", label: "Tanggal", color: "#1A1A1A" },
  { field: "title", label: "Perihal / Judul", color: "#1A1A1A" },
  { field: "description", label: "Keterangan", color: "#1A1A1A" },
];

const FIELD_COLORS = ["#1A1A1A", "#3E0FA3", "#1A5F7A", "#B71C1C", "#1B5E20", "#4A148C"];

function getSuratValue(surat: Surat, field: FieldMapping["field"]): string {
  if (field === "number") return surat.number;
  if (field === "date") return surat.date;
  if (field === "title") return surat.title;
  if (field === "description") return surat.description ?? "";
  return "";
}

// ── Canvas Print Preview ────────────────────────────────────────────────────

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  multiline: boolean
) {
  if (!multiline) {
    ctx.fillText(text, x, y, maxWidth);
    return;
  }
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  for (const word of words) {
    const testLine = line ? line + " " + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, lineY);
}

function useTemplateCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  imageUrl: string | null,
  mappings: FieldMapping[],
  suratData: Surat | null
) {
  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      for (const m of mappings) {
        const x = (m.x / 100) * img.naturalWidth;
        const y = (m.y / 100) * img.naturalHeight;
        const maxWidth = (m.maxWidth / 100) * img.naturalWidth;
        const pxSize = (m.fontSize / 100) * img.naturalHeight;
        const lineHeight = pxSize * 1.4;

        ctx.save();
        ctx.font = `${pxSize}px sans-serif`;
        ctx.fillStyle = m.color;
        ctx.textBaseline = "top";
        ctx.textAlign = m.align;

        const value = suratData ? getSuratValue(suratData, m.field) : `[${m.label}]`;
        drawWrappedText(ctx, value || `[${m.label}]`, x, y, maxWidth, lineHeight, m.multiline);
        ctx.restore();
      }
    };
    img.onerror = () => {
      canvas.width = 800;
      canvas.height = 200;
      ctx.fillStyle = "#eee";
      ctx.fillRect(0, 0, 800, 200);
      ctx.fillStyle = "#888";
      ctx.font = "20px sans-serif";
      ctx.fillText("Gagal memuat gambar template", 20, 90);
    };
    img.src = imageUrl;
  }, [imageUrl, mappings, suratData, canvasRef]);
}

// ── Print Preview Dialog ────────────────────────────────────────────────────

export function TemplatePrintDialog({
  surat,
  open,
  onClose,
}: {
  surat: Surat;
  open: boolean;
  onClose: () => void;
}) {
  const { data: templates = [] } = useQuery<SuratTemplate[]>({ queryKey: ["/api/surat-templates"] });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const relevant = templates.filter((t) => t.type === "all" || t.type === surat.type);

  const selected = relevant.find((t) => t.id === selectedId) ?? relevant[0] ?? null;
  const mappings: FieldMapping[] = selected ? JSON.parse(selected.fieldMappings || "[]") : [];

  useEffect(() => {
    if (relevant.length > 0 && !selectedId) setSelectedId(relevant[0].id);
  }, [relevant.length]);

  useTemplateCanvas(canvasRef, selected?.imageUrl ?? null, mappings, surat);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `surat-${surat.number.replace(/\//g, "-")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Cetak Surat</title>
      <style>body{margin:0;padding:0} img{width:100%;height:auto;display:block} @media print{@page{margin:0}}</style>
      </head><body><img src="${dataUrl}" /></body></html>
    `);
    win.document.close();
    win.onload = () => { win.print(); };
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cetak Surat dari Template</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 shrink-0">
          <Label className="text-sm shrink-0">Template:</Label>
          {relevant.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada template. Buat template dulu di bagian bawah halaman Surat.</p>
          ) : (
            <Select value={String(selected?.id ?? "")} onValueChange={(v) => setSelectedId(Number(v))}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Pilih template..." />
              </SelectTrigger>
              <SelectContent>
                {relevant.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 flex items-center justify-center min-h-[300px]">
          {selected ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain shadow-md"
              style={{ display: "block" }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Pilih template untuk preview</p>
          )}
        </div>

        <DialogFooter className="gap-2 shrink-0">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button variant="outline" onClick={handleDownload} disabled={!selected} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download PNG
          </Button>
          <Button onClick={handlePrint} disabled={!selected} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Field Marker on Editor Image ────────────────────────────────────────────

function FieldMarker({
  mapping,
  index,
  onRemove,
  onUpdate,
  imgW,
  imgH,
}: {
  mapping: FieldMapping;
  index: number;
  onRemove: () => void;
  onUpdate: (m: FieldMapping) => void;
  imgW: number;
  imgH: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const def = FIELD_DEFS.find((d) => d.field === mapping.field);

  return (
    <div className="border rounded-xl overflow-hidden text-xs">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: mapping.color }} />
        <span className="font-medium flex-1">{def?.label ?? mapping.field}</span>
        <span className="text-muted-foreground">
          ({Math.round(mapping.x)}%, {Math.round(mapping.y)}%)
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-destructive hover:text-destructive/80 ml-1"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-2 bg-muted/20 border-t">
          <div className="space-y-1">
            <Label className="text-[10px]">Font Size (%)</Label>
            <Input
              type="number"
              value={mapping.fontSize}
              min={0.5}
              max={10}
              step={0.1}
              className="h-7 text-xs"
              onChange={(e) => onUpdate({ ...mapping, fontSize: parseFloat(e.target.value) || 2 })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Max Width (%)</Label>
            <Input
              type="number"
              value={mapping.maxWidth}
              min={10}
              max={100}
              className="h-7 text-xs"
              onChange={(e) => onUpdate({ ...mapping, maxWidth: parseInt(e.target.value) || 50 })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Warna Teks</Label>
            <div className="flex gap-1 flex-wrap">
              {FIELD_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border-2 ${mapping.color === c ? "border-primary" : "border-transparent"}`}
                  style={{ background: c }}
                  onClick={() => onUpdate({ ...mapping, color: c })}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Rata</Label>
            <Select value={mapping.align} onValueChange={(v: any) => onUpdate({ ...mapping, align: v })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Kiri</SelectItem>
                <SelectItem value="center">Tengah</SelectItem>
                <SelectItem value="right">Kanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id={`multi-${index}`}
              checked={mapping.multiline}
              onChange={(e) => onUpdate({ ...mapping, multiline: e.target.checked })}
              className="w-3 h-3"
            />
            <Label htmlFor={`multi-${index}`} className="text-[10px] cursor-pointer">Teks banyak baris (multiline)</Label>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Template Editor Dialog ──────────────────────────────────────────────────

function TemplateEditorDialog({
  open,
  initial,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean;
  initial?: SuratTemplate;
  onClose: () => void;
  onSave: (data: { name: string; type: string; imageUrl: string; fieldMappings: string }) => void;
  isPending: boolean;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "all");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [mappings, setMappings] = useState<FieldMapping[]>(() => {
    if (initial?.fieldMappings) {
      try { return JSON.parse(initial.fieldMappings); } catch { return []; }
    }
    return [];
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [placeField, setPlaceField] = useState<FieldMapping["field"] | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setName(initial?.name ?? "");
    setType(initial?.type ?? "all");
    setImageUrl(initial?.imageUrl ?? "");
    setMappings(initial?.fieldMappings ? (() => { try { return JSON.parse(initial.fieldMappings); } catch { return []; } })() : []);
    setPlaceField(null);
  }, [initial, open]);

  useTemplateCanvas(previewCanvasRef, imageUrl || null, mappings, null);

  const handleUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/surat-templates/upload", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setImageUrl(json.imageUrl);
    } catch (e: any) {
      toast({ title: "Upload gagal", description: e.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!placeField || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const def = FIELD_DEFS.find((d) => d.field === placeField)!;
    const existing = mappings.find((m) => m.field === placeField);
    if (existing) {
      setMappings((prev) => prev.map((m) => m.field === placeField ? { ...m, x, y } : m));
    } else {
      setMappings((prev) => [
        ...prev,
        { field: placeField, label: def.label, x, y, fontSize: 2.2, color: "#1A1A1A", maxWidth: 50, align: "left", multiline: false },
      ]);
    }
    setPlaceField(null);
  }, [placeField, mappings]);

  const handleSave = () => {
    if (!name.trim()) return toast({ title: "Nama template harus diisi", variant: "destructive" });
    if (!imageUrl) return toast({ title: "Upload gambar template dulu", variant: "destructive" });
    onSave({ name: name.trim(), type, imageUrl, fieldMappings: JSON.stringify(mappings) });
  };

  const usedFields = mappings.map((m) => m.field);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <DialogTitle>{initial ? "Edit Template" : "Tambah Template Surat"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Image area */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {!imageUrl ? (
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-xl h-64 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  {uploadingImage ? "Mengupload..." : "Klik untuk upload gambar template PNG/JPG"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {placeField
                      ? <span className="text-primary font-semibold animate-pulse">👆 Klik pada gambar untuk menempatkan: <strong>{FIELD_DEFS.find((d) => d.field === placeField)?.label}</strong></span>
                      : "Pilih field di kanan, lalu klik posisi pada gambar"
                    }
                  </p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
                    Ganti Gambar
                  </Button>
                </div>
                <div
                  className={`relative rounded-xl overflow-hidden border select-none ${placeField ? "cursor-crosshair ring-2 ring-primary" : ""}`}
                  onClick={handleImageClick}
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Template"
                    className="w-full h-auto block"
                    draggable={false}
                  />
                  {mappings.map((m) => (
                    <div
                      key={m.field}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${m.x}%`,
                        top: `${m.y}%`,
                        transform: "translate(-4px, -4px)",
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full border-2 border-white shadow-md"
                        style={{ background: m.color }}
                      />
                      <span
                        className="absolute left-4 top-0 whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded font-medium shadow"
                        style={{ background: m.color, color: "#fff", fontSize: "10px" }}
                      >
                        {FIELD_DEFS.find((d) => d.field === m.field)?.label ?? m.field}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Preview hanya menampilkan posisi marker. Tampilan cetak akan menggunakan teks yang diisi saat mencetak surat.</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
          </div>

          {/* Right: Settings */}
          <div className="w-72 border-l overflow-y-auto p-4 space-y-4 shrink-0 bg-muted/20">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Template</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template Surat Keluar" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Jenis Surat</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="masuk">Surat Masuk</SelectItem>
                  <SelectItem value="keluar">Surat Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Field yang Ditampilkan</Label>
              <p className="text-[10px] text-muted-foreground leading-tight">Pilih field → klik posisi di gambar template</p>
              <div className="space-y-1.5">
                {FIELD_DEFS.map((def) => {
                  const placed = usedFields.includes(def.field);
                  const isPlacing = placeField === def.field;
                  return (
                    <Button
                      key={def.field}
                      variant={isPlacing ? "default" : placed ? "outline" : "ghost"}
                      size="sm"
                      className="w-full justify-start h-8 text-xs gap-2"
                      onClick={() => {
                        if (!imageUrl) return toast({ title: "Upload gambar dulu", variant: "destructive" });
                        setPlaceField(isPlacing ? null : def.field);
                      }}
                    >
                      <Move className="h-3 w-3 shrink-0" />
                      {def.label}
                      {placed && !isPlacing && <Badge variant="secondary" className="ml-auto text-[9px] h-4">✓</Badge>}
                      {isPlacing && <span className="ml-auto text-[9px] animate-pulse">Klik gambar...</span>}
                    </Button>
                  );
                })}
              </div>
            </div>

            {mappings.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Pengaturan Field</Label>
                <div className="space-y-1.5">
                  {mappings.map((m, i) => (
                    <FieldMarker
                      key={m.field}
                      mapping={m}
                      index={i}
                      imgW={100}
                      imgH={100}
                      onRemove={() => setMappings((prev) => prev.filter((_, j) => j !== i))}
                      onUpdate={(updated) => setMappings((prev) => prev.map((item, j) => j === i ? updated : item))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button onClick={handleSave} disabled={isPending || !imageUrl || !name}>
            {isPending ? "Menyimpan..." : "Simpan Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Template Manager Section ────────────────────────────────────────────────

export function TemplateManagerSection({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SuratTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: templates = [], isLoading } = useQuery<SuratTemplate[]>({ queryKey: ["/api/surat-templates"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/surat-templates", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/surat-templates"] }); setEditorOpen(false); toast({ title: "Template ditambahkan" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/surat-templates/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/surat-templates"] }); setEditing(null); setEditorOpen(false); toast({ title: "Template diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/surat-templates/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/surat-templates"] }); setDeleteId(null); toast({ title: "Template dihapus" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const typeLabel = (t: string) => t === "masuk" ? "Masuk" : t === "keluar" ? "Keluar" : "Semua";

  return (
    <>
      <div className="rounded-2xl border bg-muted/30">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-2xl"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="flex items-center gap-2.5">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Template Surat</span>
            {templates.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{templates.length}</Badge>
            )}
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="px-4 pb-4 space-y-3 border-t">
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">Template PNG untuk cetak surat dengan data otomatis</p>
              {isAdmin && (
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { setEditing(null); setEditorOpen(true); }}>
                  <Plus className="h-3 w-3" /> Tambah
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : templates.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <LayoutTemplate className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                Belum ada template. {isAdmin ? "Tambah template untuk mulai." : "Hubungi admin untuk menambahkan template."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {templates.map((t) => {
                  const mappings: FieldMapping[] = (() => { try { return JSON.parse(t.fieldMappings); } catch { return []; } })();
                  return (
                    <Card key={t.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative h-28 bg-muted overflow-hidden">
                          <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover object-top" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-xs font-semibold truncate">{t.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              <Badge className="text-[9px] h-3.5 px-1 bg-white/20 text-white border-0">
                                {typeLabel(t.type)}
                              </Badge>
                              <Badge className="text-[9px] h-3.5 px-1 bg-white/20 text-white border-0">
                                {mappings.length} field
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex border-t">
                            <button
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                              onClick={() => { setEditing(t); setEditorOpen(true); }}
                            >
                              <Edit className="h-3 w-3" /> Edit
                            </button>
                            <button
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors border-l"
                              onClick={() => setDeleteId(t.id)}
                            >
                              <Trash2 className="h-3 w-3" /> Hapus
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <TemplateEditorDialog
        open={editorOpen}
        initial={editing ?? undefined}
        onClose={() => { setEditorOpen(false); setEditing(null); }}
        onSave={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus template ini?</AlertDialogTitle>
            <AlertDialogDescription>Template akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
