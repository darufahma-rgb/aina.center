import { useState, useRef } from "react";
import { X, Camera, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const ACCENT = "#5B21B6";

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName ?? user?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [loading, setLoading] = useState(false);

  const initials = (user?.displayName ?? user?.username ?? "??").slice(0, 2).toUpperCase();

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      toast({ title: "Profil berhasil diperbarui" });
      onClose();
    } catch {
      toast({ title: "Gagal memperbarui profil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.20)" }}
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

        {/* Avatar preview */}
        <div className="flex flex-col items-center px-6 pb-5">
          <div
            className="h-[88px] w-[88px] rounded-full flex items-center justify-center overflow-hidden mb-3 shrink-0 relative"
            style={{ background: ACCENT }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-full w-full object-cover"
                onError={() => setAvatarUrl("")}
              />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
          </div>
          <p className="text-[12px] text-[#999]">
            {user?.role === "admin" ? "Administrator" : "Anggota"}
          </p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 space-y-4">
          {/* Display Name */}
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
              style={{ "--tw-ring-color": ACCENT } as any}
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-[12px] font-semibold text-[#555] mb-1.5">
              URL Foto Profil
            </label>
            <div className="relative flex items-center">
              <Camera className="absolute left-3 h-3.5 w-3.5 text-[#bbb] pointer-events-none" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-10 pl-8 pr-3 rounded-xl text-[13px] bg-[#f5f5f5] border-0 text-[#1A1A1A] placeholder:text-[#bbb] focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": ACCENT } as any}
              />
            </div>
            <p className="text-[11px] text-[#bbb] mt-1">Masukkan link URL foto kamu</p>
          </div>

          {/* Readonly info */}
          <div className="bg-[#f5f5f5] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#999]">Username</span>
              <span className="text-[12px] font-semibold text-[#1A1A1A]">{user?.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#999]">Email</span>
              <span className="text-[12px] font-semibold text-[#1A1A1A] truncate max-w-[160px]">{user?.email}</span>
            </div>
          </div>

          {/* Actions */}
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
