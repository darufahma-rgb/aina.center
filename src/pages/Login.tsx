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
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "hsl(252,50%,4%)" }}
    >
      {/* Aurora floating orbs */}
      <div
        className="orb-float-1 absolute rounded-full pointer-events-none"
        style={{
          width: 650,
          height: 650,
          top: "-20%",
          right: "-15%",
          background: "radial-gradient(circle at 40% 40%, hsl(265,83%,55%) 0%, hsl(285,75%,45%) 35%, transparent 68%)",
          filter: "blur(85px)",
          opacity: 0.22,
        }}
      />
      <div
        className="orb-float-2 absolute rounded-full pointer-events-none"
        style={{
          width: 550,
          height: 550,
          bottom: "-18%",
          left: "-12%",
          background: "radial-gradient(circle at 60% 60%, hsl(255,80%,60%) 0%, hsl(245,70%,45%) 40%, transparent 68%)",
          filter: "blur(80px)",
          opacity: 0.18,
        }}
      />
      <div
        className="orb-float-3 absolute rounded-full pointer-events-none"
        style={{
          width: 380,
          height: 380,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle at 50% 50%, hsl(280,90%,65%) 0%, transparent 70%)",
          filter: "blur(100px)",
          opacity: 0.10,
        }}
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Form container */}
      <div className="relative w-full max-w-sm animate-scale-in z-10">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="AINA Centre Management"
            className="h-24 w-24 object-contain mb-5"
            style={{
              filter: "drop-shadow(0 0 22px rgba(180,140,255,0.90)) drop-shadow(0 0 8px rgba(124,58,237,0.65))",
            }}
          />
          <h1 className="font-bold text-[26px] text-white tracking-tight">AINA Centre</h1>
          <p className="text-sm mt-1.5 font-medium tracking-[0.22em] uppercase" style={{ color: "rgba(200,180,255,0.45)" }}>
            Management Portal
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(28px) saturate(160%)",
            WebkitBackdropFilter: "blur(28px) saturate(160%)",
            boxShadow: "0 28px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(139,92,246,0.10), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          <div className="mb-6">
            <h2 className="text-[17px] font-bold text-white tracking-tight">Masuk ke Portal</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(200,180,255,0.50)" }}>
              Masukkan kredensial akun Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[13px] font-medium" style={{ color: "rgba(220,200,255,0.75)" }}>
                Username
              </Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "rgba(200,180,255,0.40)" }}
                />
                <input
                  id="username"
                  data-testid="input-username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={submitting}
                  className="flex h-11 w-full rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-purple-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 disabled:opacity-50 transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(139,92,246,0.20)",
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium" style={{ color: "rgba(220,200,255,0.75)" }}>
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "rgba(200,180,255,0.40)" }}
                />
                <input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                  className="flex h-11 w-full rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-purple-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 disabled:opacity-50 transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(139,92,246,0.20)",
                  }}
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
                  : "0 4px 20px rgba(124,58,237,0.45), 0 1px 0 rgba(255,255,255,0.12) inset",
              }}
            >
              {submitting ? "Masuk..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "rgba(180,160,220,0.35)" }}>
          AINA Centre Management — Sistem Portal Internal
        </p>
      </div>
    </div>
  );
}
