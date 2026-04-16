import { useState, useEffect } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "pwa_install_dismissed_at";
const COOLDOWN_DAYS = 7;

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|mercury/i.test(ua);
  return isIos && isSafari;
}

function isInStandaloneMode(): boolean {
  return (
    ("standalone" in navigator && (navigator as any).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function shouldShow(): boolean {
  if (!isIosSafari()) return false;
  if (isInStandaloneMode()) return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const dismissedAt = parseInt(raw, 10);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince >= COOLDOWN_DAYS;
  } catch {
    return true;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}

export function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!shouldShow()) return;
    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  function handleDismiss() {
    setAnimateIn(false);
    dismiss();
    setTimeout(() => setVisible(false), 380);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[200] px-3 lg:hidden"
      style={{
        bottom: `calc(env(safe-area-inset-bottom) + 76px)`,
        transition: "transform 0.38s cubic-bezier(0.32,0.72,0,1), opacity 0.32s ease",
        transform: animateIn ? "translateY(0)" : "translateY(120%)",
        opacity: animateIn ? 1 : 0,
      }}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a0845 0%, #2d0b7a 50%, #1e0654 100%)",
          border: "1px solid rgba(167,139,250,0.30)",
          boxShadow: "0 8px 40px rgba(62,15,163,0.45), 0 2px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Glow orb */}
        <div
          className="absolute -top-8 -right-8 h-32 w-32 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)" }}
        />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 h-6 w-6 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)" }}
          aria-label="Tutup"
        >
          <X className="h-3.5 w-3.5 text-white/70" />
        </button>

        <div className="flex gap-3.5 px-4 pt-4 pb-4 pr-10">
          {/* App icon */}
          <div
            className="shrink-0 h-12 w-12 rounded-2xl overflow-hidden"
            style={{ border: "1.5px solid rgba(167,139,250,0.25)", boxShadow: "0 4px 16px rgba(62,15,163,0.35)" }}
          >
            <img src="/pwa-192.png" alt="App icon" className="h-full w-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white mb-0.5 leading-tight">
              Pasang di Home Screen
            </p>
            <p className="text-[11px] text-[#C4B5FD]/75 leading-relaxed mb-3">
              Akses portal lebih cepat — tanpa buka browser.
            </p>

            {/* Steps */}
            <div className="flex flex-col gap-1.5">
              <Step number={1}>
                Tap ikon{" "}
                <ShareIcon className="inline-block mx-0.5 align-middle" />
                {" "}<span className="font-semibold text-white/90">Bagikan</span> di toolbar Safari
              </Step>
              <Step number={2}>
                Pilih{" "}
                <span className="font-semibold text-white/90">&ldquo;Tambahkan ke Layar Utama&rdquo;</span>
              </Step>
              <Step number={3}>
                Tap <span className="font-semibold text-white/90">Tambahkan</span> — selesai!
              </Step>
            </div>
          </div>
        </div>

        {/* Bottom arrow indicator pointing down toward bottom bar */}
        <div className="flex justify-center pb-2.5">
          <div className="flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1 rounded-full"
                style={{
                  width: i === 1 ? 16 : 6,
                  background: i === 1 ? "rgba(167,139,250,0.80)" : "rgba(167,139,250,0.30)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
        style={{ background: "rgba(139,92,246,0.55)", border: "1px solid rgba(167,139,250,0.35)" }}
      >
        {number}
      </span>
      <p className="text-[11px] text-[#C4B5FD]/80 leading-relaxed">{children}</p>
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline", width: 13, height: 13, color: "#a78bfa", verticalAlign: "middle" }}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
