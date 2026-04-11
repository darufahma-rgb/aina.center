import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "../server/routes";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

const PgSession = connectPgSimple(session);
const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
});

async function ensureSessionTable() {
  if (!connectionString) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE)
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);
  } catch (err: any) {
    console.error("[Session Table]", err?.message);
  }
}

app.use(session({
  secret: process.env.SESSION_SECRET ?? "aina-portal-secret-2024",
  resave: false,
  saveUninitialized: false,
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use("/uploads", express.static("/tmp/uploads"));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    const tables = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='session'`);
    res.json({
      status: "ok",
      db: "connected",
      sessionTable: tables.rows.length > 0 ? "exists" : "missing",
      env: {
        hasDbUrl: !!process.env.SUPABASE_DATABASE_URL || !!process.env.DATABASE_URL,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[API Error]", err?.message ?? err);
  res.status(err?.status ?? 500).json({ message: err?.message ?? "Internal server error" });
});

async function seedAdmin() {
  if (!connectionString) return;
  try {
    const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
    const existing = await db.select().from(users).where(eq(users.username, adminUsername));
    if (existing.length === 0) {
      const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@AINA2024";
      const adminEmail = process.env.ADMIN_EMAIL ?? "admin@aina.id";
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await db.insert(users).values({ username: adminUsername, email: adminEmail, passwordHash, role: "admin", isActive: true });
    }
  } catch (err: any) {
    console.error("[Seed Admin]", err?.message);
  }
}

ensureSessionTable();
seedAdmin();

export default app;
