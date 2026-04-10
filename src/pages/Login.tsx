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
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(145deg, hsl(215,40%,96%) 0%, hsl(215,35%,93%) 50%, hsl(220,40%,91%) 100%)",
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(221,80%,70%) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(199,89%,60%) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-neo-primary)" }}
          >
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div>
            <h1 className="font-bold text-2xl leading-none text-foreground">AINA Portal</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Internal Management System</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-7"
          style={{ boxShadow: "var(--shadow-neo-lg)" }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">Masuk ke Portal</h2>
            <p className="text-sm text-muted-foreground mt-1">Masukkan kredensial akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="username"
                  data-testid="input-username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={submitting}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold mt-2"
              data-testid="button-login"
              disabled={submitting || !username || !password}
              style={{ boxShadow: submitting ? "none" : "var(--shadow-neo-primary)" }}
            >
              {submitting ? "Masuk..." : "Masuk"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          AINA — Sistem Portal Internal
        </p>
      </div>
    </div>
  );
}
