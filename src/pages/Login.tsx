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
      {/* ── Left panel — wallpaper ── */}
      <div
        className="hidden lg:flex flex-col w-[44%] relative overflow-hidden"
        style={{
          backgroundImage: "url(/wallpaper-login.png)",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Top fade — strong dark at top for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.75) 30%, rgba(0,0,0,0.40) 55%, rgba(0,0,0,0.08) 100%)",
          }}
        />

        {/* Logo — top left */}
        <div className="relative z-10 flex items-center gap-3 p-10">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <img src="/logo.png" alt="AINA" className="h-5 w-5 object-contain" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm tracking-tight">AINA Centre</p>
            <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/45">Management</p>
          </div>
        </div>

        {/* Main text — upper section, well above the dense wallpaper bottom */}
        <div className="relative z-10 px-10" style={{ marginTop: "10%" }}>
          <p
            className="text-[11px] font-semibold tracking-[0.28em] uppercase mb-5"
            style={{ color: "rgba(167,139,250,0.95)" }}
          >
            Portal Internal
          </p>

          <h1
            className="text-[40px] leading-[1.12] font-bold text-white mb-5"
            style={{ letterSpacing: "-0.02em" }}
          >
            Satu tempat<br />
            untuk semua<br />
            urusan organisasi.
          </h1>

          <p
            className="text-[15px] leading-[1.75] max-w-xs"
            style={{ color: "rgba(255,255,255,0.60)", fontWeight: 400 }}
          >
            Kelola keuangan, notulensi, agenda, dan anggota AINA Centre dalam satu platform yang terpadu dan aman.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px max-w-[48px] w-12" style={{ background: "rgba(255,255,255,0.25)" }} />
            <p className="text-[11px] text-white/35 font-medium">AINA Centre Management</p>
          </div>
        </div>
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
  );
}
