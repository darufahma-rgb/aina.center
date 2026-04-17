import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function usePresence() {
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const ping = () => {
      fetch("/api/presence/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ page: pathnameRef.current }),
      }).catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, []);
}
