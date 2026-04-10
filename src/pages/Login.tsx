import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      style={{ background: "linear-gradient(145deg, hsl(250,55%,7%) 0%, hsl(265,60%,12%) 50%, hsl(285,55%,10%) 100%)" }}
    >
      {/* Background glow orbs */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-25"
        style={{ background: "radial-gradient(circle, hsl(265,83%,57%) 0%, transparent 65%)" }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none opacity-15"
        style={{ background: "radial-gradient(circle, hsl(285,75%,55%) 0%, transparent 65%)" }}
      />
      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(hsl(265,83%,70%) 1px, transparent 1px), linear-gradient(90deg, hsl(265,83%,70%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm animate-scale-in z-10">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="AINA Centre Management"
            className="h-24 w-24 object-contain mb-4"
            style={{ filter: "drop-shadow(0 0 20px rgba(180,140,255,0.85)) drop-shadow(0 0 8px rgba(124,58,237,0.60))" }}
          />
          <h1 className="font-bold text-2xl text-white tracking-tight">AINA Centre</h1>
          <p className="text-sm mt-1 font-medium tracking-widest uppercase" style={{ color: "rgba(200,180,255,0.55)" }}>
            Management Portal
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(124,58,237,0.20)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 60px rgba(10,5,30,0.50), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Masuk ke Portal</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(200,180,255,0.55)" }}>
              Masukkan kredensial akun Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium" style={{ color: "rgba(220,200,255,0.80)" }}>
                Username
              </Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "rgba(200,180,255,0.50)" }}
                />
                <input
                  id="username"
                  data-testid="input-username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={submitting}
                  className="flex h-11 w-full rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-purple-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(124,58,237,0.25)",
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: "rgba(220,200,255,0.80)" }}>
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "rgba(200,180,255,0.50)" }}
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
                  className="flex h-11 w-full rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-purple-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(124,58,237,0.25)",
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              data-testid="button-login"
              disabled={submitting || !username || !password}
              className="w-full h-11 rounded-xl font-semibold text-sm text-white transition-all duration-150 mt-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: submitting || !username || !password
                  ? "rgba(124,58,237,0.4)"
                  : "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,75%,50%))",
                boxShadow: submitting || !username || !password
                  ? "none"
                  : "0 4px 16px rgba(124,58,237,0.40), 0 2px 6px rgba(124,58,237,0.25)",
              }}
            >
              {submitting ? "Masuk..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "rgba(180,160,220,0.40)" }}>
          AINA Centre Management — Sistem Portal Internal
        </p>
      </div>
    </div>
  );
}
