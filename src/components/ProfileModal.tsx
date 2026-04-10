import { useState, useRef } from "react";
import { X, Upload, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const ACCENT = "#5B21B6";

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName ?? user?.username ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatarUrl ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (user?.displayName ?? user?.username ?? "??").slice(0, 2).toUpperCase();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "File harus berupa gambar", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Ukuran file maksimal 5MB", variant: "destructive" });
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        const res = await fetch("/api/auth/profile/avatar", {
          method: "POST",
          body: form,
          credentials: "include",
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.50)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.22)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-[16px] font-bold text-[#1A1A1A]">Edit Profil</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#999] hover:bg-black/[0.06] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* ── Avatar upload area ─────────────────────────────── */}
          <div className="flex flex-col items-center gap-3">
            {/* Avatar preview circle */}
            <div
              className="h-[96px] w-[96px] rounded-full flex items-center justify-center overflow-hidden shrink-0 relative cursor-pointer group"
              style={{ background: ACCENT }}
              onClick={() => fileInputRef.current?.click()}
              title="Klik untuk ubah foto"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white group-hover:opacity-0 transition-opacity">
                  {initials}
                </span>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Drop zone / upload button */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-2xl px-4 py-3.5 text-center cursor-pointer transition-all"
              style={{
                borderColor: dragOver ? ACCENT : "rgba(0,0,0,0.10)",
                background: dragOver ? "rgba(91,33,182,0.04)" : "transparent",
              }}
            >
              <Upload className="h-4 w-4 mx-auto mb-1.5" style={{ color: dragOver ? ACCENT : "#bbb" }} />
              <p className="text-[12px] font-medium text-[#555]">
                {avatarFile ? (
                  <span style={{ color: ACCENT }}>{avatarFile.name}</span>
                ) : (
                  <>Klik atau seret foto ke sini</>
                )}
              </p>
              <p className="text-[11px] text-[#bbb] mt-0.5">JPG, PNG, WEBP · Maks 5MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {/* ── Display Name ───────────────────────────────────── */}
          <div>
            <label className="block text-[12px] font-semibold text-[#555] mb-1.5">
              Nama Tampilan
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user?.username ?? "Nama kamu"}
              className="w-full h-10 px-3 rounded-xl text-[13px] bg-[#f5f5f5] border-0 text-[#1A1A1A] placeholder:text-[#bbb] focus:outline-none focus:ring-2 transition-all"
              style={{ outline: "none" }}
              onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}33`)}
              onBlur={(e) => (e.target.style.boxShadow = "")}
            />
          </div>

          {/* ── Readonly account info ──────────────────────────── */}
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

          {/* ── Actions ────────────────────────────────────────── */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-[#555] bg-[#f0f0f0] hover:bg-[#e8e8e8] transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: ACCENT }}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
