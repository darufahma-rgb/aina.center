import { useState, useRef, useCallback } from "react";
import { X, Upload, Camera, ZoomIn, ZoomOut, RotateCcw, Check, Eye } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "profile" | "crop" | "view";

const ACCENT = "#5B21B6";

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0, size, size,
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas is empty")); return; }
          resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg", 0.92,
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("profile");
  const [displayName, setDisplayName] = useState(user?.displayName ?? user?.username ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatarUrl ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [rawImage, setRawImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = (user?.displayName ?? user?.username ?? "??").slice(0, 2).toUpperCase();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "File harus berupa gambar", variant: "destructive" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Ukuran file maksimal 5MB", variant: "destructive" }); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImage(e.target?.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setStep("crop");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const confirmCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(rawImage, croppedAreaPixels);
      const url = URL.createObjectURL(croppedFile);
      setAvatarPreview(url);
      setAvatarFile(croppedFile);
      setStep("profile");
    } catch {
      toast({ title: "Gagal memproses gambar", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        const res = await fetch("/api/auth/profile/avatar", {
          method: "POST", body: form, credentials: "include",
        });
        if (!res.ok) throw new Error("Upload foto gagal");
        const updated = await res.json();
        queryClient.setQueryData(["/api/auth/me"], updated);
      }
      if (displayName.trim()) {
        await updateProfile({ displayName: displayName.trim() });
      }
      toast({ title: "Profil berhasil diperbarui" });
      onClose();
    } catch (err: any) {
      toast({ title: err.message ?? "Gagal memperbarui profil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("profile");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget && step === "profile") handleClose(); }}
    >
      {/* ── CROP STEP ─────────────────────────────────────────────── */}
      {step === "crop" && (
        <div
          className="bg-[#111] rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col"
          style={{ maxWidth: 440, maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h2 className="text-[15px] font-bold text-white">Crop Foto Profil</h2>
              <p className="text-[11px] text-white/45 mt-0.5">Geser & pinch untuk posisikan foto</p>
            </div>
            <button
              onClick={() => setStep("profile")}
              className="h-8 w-8 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Crop area */}
          <div className="relative" style={{ height: 340, background: "#000" }}>
            <Cropper
              image={rawImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { borderRadius: 0 },
                cropAreaStyle: { border: "2.5px solid #A78BFA" },
              }}
            />
          </div>

          {/* Zoom slider */}
          <div className="px-5 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <ZoomOut className="h-4 w-4 text-white/40 shrink-0" />
              <input
                type="range"
                min={1} max={3} step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: ACCENT }}
              />
              <ZoomIn className="h-4 w-4 text-white/40 shrink-0" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                onClick={confirmCrop}
                className="flex-1 h-9 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: ACCENT }}
              >
                <Check className="h-4 w-4" />
                Gunakan Foto Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW STEP ─────────────────────────────────────────────── */}
      {step === "view" && (
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <h2 className="text-[15px] font-bold text-[#1A1A1A]">Foto Profil</h2>
            <button
              onClick={() => setStep("profile")}
              className="h-8 w-8 rounded-full flex items-center justify-center text-[#999] hover:bg-black/[0.06] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5 flex flex-col items-center gap-4">
            <div
              className="h-48 w-48 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: ACCENT }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-white">{initials}</span>
              )}
            </div>

            <div className="w-full flex gap-2">
              <button
                onClick={() => { fileInputRef.current?.click(); }}
                className="flex-1 h-9 rounded-xl text-[13px] font-semibold border border-[#5B21B6]/30 text-[#5B21B6] hover:bg-[#F5F3FF] transition-all flex items-center justify-center gap-1.5"
              >
                <Camera className="h-3.5 w-3.5" /> Ganti Foto
              </button>
              <button
                onClick={() => setStep("profile")}
                className="flex-1 h-9 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: ACCENT }}
              >
                Selesai
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />
        </div>
      )}

      {/* ── PROFILE STEP ──────────────────────────────────────────── */}
      {step === "profile" && (
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-[16px] font-bold text-[#1A1A1A]">Edit Profil</h2>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-full flex items-center justify-center text-[#999] hover:bg-black/[0.06] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* ── Avatar section ──────────────────────────────────── */}
            <div className="flex flex-col items-center gap-3">
              {/* Avatar preview circle */}
              <div className="relative group">
                <div
                  className="h-[96px] w-[96px] rounded-full flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                  style={{ background: ACCENT }}
                  onClick={() => setStep("view")}
                  title="Klik untuk lihat foto"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-[12px] font-semibold border transition-all hover:bg-[#F5F3FF]"
                  style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
                >
                  <Camera className="h-3.5 w-3.5" /> Ganti Foto
                </button>
                {avatarPreview && (
                  <button
                    onClick={() => setStep("view")}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-[12px] font-semibold text-[#888] border border-black/[0.08] hover:bg-black/[0.03] transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed rounded-2xl px-4 py-3 text-center cursor-pointer transition-all"
                style={{
                  borderColor: dragOver ? ACCENT : "rgba(0,0,0,0.10)",
                  background: dragOver ? "rgba(91,33,182,0.04)" : "transparent",
                }}
              >
                <Upload className="h-4 w-4 mx-auto mb-1" style={{ color: dragOver ? ACCENT : "#ccc" }} />
                <p className="text-[12px] font-medium text-[#777]">
                  {avatarFile ? (
                    <span style={{ color: ACCENT }}>Foto siap diupload · Akan dicrop bulat</span>
                  ) : (
                    <>Seret foto ke sini atau <span style={{ color: ACCENT }}>pilih file</span></>
                  )}
                </p>
                <p className="text-[11px] text-[#bbb] mt-0.5">JPG, PNG, WEBP · Maks 5MB</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
            </div>

            {/* ── Display Name ──────────────────────────────────────── */}
            <div>
              <label className="block text-[12px] font-semibold text-[#555] mb-1.5">
                Nama Tampilan
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user?.username ?? "Nama kamu"}
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-[#f5f5f5] border-0 text-[#1A1A1A] placeholder:text-[#bbb] focus:outline-none transition-all"
                onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}33`)}
                onBlur={(e) => (e.target.style.boxShadow = "")}
              />
            </div>

            {/* ── Account info ──────────────────────────────────────── */}
            <div className="bg-[#f8f8f8] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#999]">Username</span>
                <span className="text-[12px] font-semibold text-[#1A1A1A]">{user?.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#999]">Email</span>
                <span className="text-[12px] font-semibold text-[#1A1A1A] truncate max-w-[160px]">{user?.email}</span>
              </div>
            </div>

            {/* ── Actions ───────────────────────────────────────────── */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-[#555] bg-[#f0f0f0] hover:bg-[#e8e8e8] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-10 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: ACCENT }}
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
