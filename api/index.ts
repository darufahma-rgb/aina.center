import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import path from "path";
import { registerRoutes } from "../server/routes";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const app = express();

app.set("trust proxy", 1);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
const PgSession = connectPgSimple(session);
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

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

registerRoutes(app);

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
  }
}

seedAdmin().catch(console.error);

export default app;
