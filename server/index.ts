import express from "express";
import session from "express-session";
import { createServer } from "http";
import path from "path";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const app = express();
const server = createServer(app);

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

const MStore = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET ?? "aina-portal-secret-2024",
  resave: false,
  saveUninitialized: false,
  store: new MStore({ checkPeriod: 86400000 }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ── Routes ─────────────────────────────────────────────────────────────────────

registerRoutes(app);

// ── Frontend ───────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  await setupVite(app, server);
}

// ── Seed admin user ────────────────────────────────────────────────────────────

async function seedAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@AINA2024";
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@aina.id";

  const existing = await db.select().from(users).where(eq(users.username, adminUsername));
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(users).values({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: "admin",
      isActive: true,
    });
    console.log(`\n✅ Admin account created:`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   (Change this password after first login)\n`);
  }
}

// ── Start ──────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "5000");

server.listen(PORT, "0.0.0.0", async () => {
  console.log(`AINA Portal running on port ${PORT}`);
  await seedAdmin().catch(console.error);
});
