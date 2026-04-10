import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, User } from "lucide-react";

export default function Login() {
  const { user, login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      toast({ title: "Login gagal", description: err.message ?? "Coba lagi", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, hsl(265,83%,30%) 0%, hsl(240,60%,14%) 100%)" }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow orb */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 500,
            height: 500,
            top: "-10%",
            right: "-20%",
            background: "radial-gradient(circle, hsl(265,83%,57%) 0%, transparent 70%)",
            filter: "blur(80px)",
            opacity: 0.35,
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="AINA"
            className="h-10 w-10 object-contain"
            style={{ filter: "drop-shadow(0 0 12px rgba(180,140,255,0.80))" }}
          />
          <div>
            <p className="font-bold text-white text-sm tracking-tight">AINA Centre</p>
            <p className="text-[10px] font-semibold tracking-[0.20em] uppercase text-white/40">Management</p>
          </div>
        </div>

        {/* Center text */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Portal Internal<br />AINA Centre
          </h1>
          <p className="text-base text-white/55 leading-relaxed max-w-xs">
            Kelola keuangan, notulensi, agenda, anggota, dan laporan organisasi dalam satu platform terpadu.
          </p>
        </div>

        {/* Bottom */}
        <p className="relative z-10 text-[11px] text-white/30">
          AINA Centre Management — Sistem Portal Internal
        </p>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm animate-scale-in">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <img
              src="/logo.png"
              alt="AINA"
              className="h-16 w-16 object-contain mb-4"
              style={{ filter: "drop-shadow(0 0 14px rgba(139,92,246,0.55))" }}
            />
            <h1 className="font-bold text-xl text-foreground tracking-tight">AINA Centre</h1>
            <p className="text-xs mt-1 font-medium tracking-[0.18em] uppercase text-muted-foreground">Management Portal</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Masuk ke Portal</h2>
            <p className="text-sm mt-1.5 text-muted-foreground">Masukkan kredensial akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[13px] font-medium text-foreground">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="username"
                  data-testid="input-username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={submitting}
                  className="flex h-11 w-full rounded-xl pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40 disabled:opacity-50 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                  className="flex h-11 w-full rounded-xl pl-9 pr-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40 disabled:opacity-50 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="button-login"
              disabled={submitting || !username || !password}
              className="w-full h-11 rounded-xl font-semibold text-sm text-white transition-all duration-200 mt-2 disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98] hover:brightness-110"
              style={{
                background: submitting || !username || !password
                  ? "rgba(124,58,237,0.35)"
                  : "linear-gradient(135deg, hsl(265,83%,57%) 0%, hsl(285,75%,50%) 100%)",
                boxShadow: submitting || !username || !password
                  ? "none"
                  : "0 4px 18px rgba(124,58,237,0.35)",
              }}
            >
              {submitting ? "Masuk..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
