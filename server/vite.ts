import type { Express } from "express";
import type { Server } from "http";
import express from "express";
import path from "path";
import fs from "fs";

export async function setupVite(app: Express, server: Server) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve("dist");
  if (!fs.existsSync(distPath)) {
    console.warn("dist/ not found, run npm run build first");
    return;
  }
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
