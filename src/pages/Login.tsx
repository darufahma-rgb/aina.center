import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import ainaInternalLogo from "@assets/aina_center_internal_logo_1776425398825.png";

function AinaLoginLogo({ variant }: { variant: "mobile" | "desktop" }) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${isMobile ? "mb-8" : ""}`}
      style={{
        height: isMobile ? 170 : 40,
        width: isMobile ? 170 : 40,
      }}
    >
      <img
        src={ainaInternalLogo}
        alt="AINA Centre Internal"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export default function Login() {
  const { user, login, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <>
      {/* ════════════════════════════════════════
          MOBILE layout  (< lg)
      ════════════════════════════════════════ */}
      <div
        className="lg:hidden relative flex flex-col overflow-hidden"
        style={{ height: "100dvh", background: "#0A0118" }}
      >
        {/* Wallpaper */}
        <div
          className="absolute inset-0 wallpaper-animate"
          style={{
            backgroundImage: "url('/login-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Bottom dark fade — makes form readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 20%, rgba(8,1,24,0.65) 55%, rgba(8,1,24,0.94) 80%)",
          }}
        />

        {/* ── Logo + Form — centered together ── */}
        <div
          className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 w-full"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          {/* Logo */}
          <AinaLoginLogo variant="mobile" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 w-full">
            {/* Username */}
            <div
              className="flex items-center gap-3 h-[52px] px-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(12px)",
              }}
            >
              <User className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.45)" }} />
              <input
                id="username-m"
                data-testid="input-username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={submitting}
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div
              className="flex items-center gap-3 h-[52px] px-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Lock className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.45)" }} />
              <input
                id="password-m"
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" style={{ color: "rgba(255,255,255,0.45)" }} />
                  : <Eye className="h-4 w-4" style={{ color: "rgba(255,255,255,0.45)" }} />
                }
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              data-testid="button-login"
              disabled={submitting || !username || !password}
              className="w-full font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                height: 52,
                borderRadius: 100,
                background: "linear-gradient(135deg, #6D28D9, #3E0FA3)",
                color: "#fff",
                fontSize: 15,
                letterSpacing: "-0.01em",
                boxShadow: "0 4px 24px rgba(109,40,217,0.5)",
              }}
            >
              {submitting ? "Masuk..." : "Login"}
            </button>
          </form>
        </div>

        {/* ── Footer keterangan ── */}
        <div
          className="relative z-10 px-6 text-center"
          style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
        >
          <div className="h-px w-16 mx-auto mb-3" style={{ background: "rgba(255,255,255,0.15)" }} />
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(200,170,255,0.6)" }}>
            AINA Internal Center
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.32)" }}>
            Manajemen Internal AINA Centre
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          DESKTOP layout  (lg+)  — untouched
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex min-h-screen bg-background">
        {/* Left panel — wallpaper */}
        <div
          className="flex flex-col w-[44%] relative overflow-hidden"
          style={{ overflow: "hidden" }}
        >
          {/* Animated wallpaper */}
          <div
            className="absolute inset-0 wallpaper-animate"
            style={{
              backgroundImage: "url(/login-bg.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none login-panel-overlay"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.75) 30%, rgba(0,0,0,0.40) 55%, rgba(0,0,0,0.08) 100%)",
            }}
          />

          <div className="relative z-10 flex items-center gap-3 p-10 login-logo-enter">
            <AinaLoginLogo variant="desktop" />
            <div>
              <p className="font-semibold text-white text-sm tracking-tight">AINA Centre</p>
              <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/45">Management</p>
            </div>
          </div>

          <div className="relative z-10 px-10" style={{ marginTop: "10%" }}>
            <p
              className="text-[11px] font-semibold tracking-[0.28em] uppercase mb-5 login-label-enter"
              style={{ color: "rgba(167,139,250,0.95)" }}
            >
              Portal Internal
            </p>
            <h1
              className="text-[40px] leading-[1.12] font-bold text-white mb-5 login-h1-enter"
              style={{ letterSpacing: "-0.02em" }}
            >
              Satu tempat<br />
              untuk semua<br />
              urusan organisasi.
            </h1>
            <p
              className="text-[15px] leading-[1.75] max-w-xs login-desc-enter"
              style={{ color: "rgba(255,255,255,0.60)", fontWeight: 400 }}
            >
              Kelola keuangan, notulensi, agenda, dan anggota AINA Centre dalam satu platform yang terpadu dan aman.
            </p>
            <div className="mt-8 flex items-center gap-3 login-footer-enter">
              <div className="h-px max-w-[48px] w-12" style={{ background: "rgba(255,255,255,0.25)" }} />
              <p className="text-[11px] text-white/35 font-medium">AINA Centre Management</p>
            </div>
          </div>
        </div>

        {/* Right panel — login form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm animate-scale-in">
            <div className="mb-8">
              <h2
                className="text-[28px] font-bold text-foreground leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Masuk ke Portal
              </h2>
              <p className="text-[14px] mt-2 text-muted-foreground leading-relaxed">
                Masukkan kredensial akun Anda untuk melanjutkan.
              </p>
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
                disabled={submitting || !username || !password}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 mt-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{
                  background: submitting || !username || !password ? "rgba(28,28,28,0.35)" : "#1C1C1C",
                  color: submitting || !username || !password ? "#aaa" : "#A78BFA",
                  boxShadow: submitting || !username || !password ? "none" : "0 4px 18px rgba(0,0,0,0.18)",
                }}
              >
                {submitting ? "Masuk..." : "Masuk"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
