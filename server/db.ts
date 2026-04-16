import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required");
}

const isExternalDb =
  connectionString.includes("supabase") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("sslmode=require") ||
  connectionString.includes("pooler.supabase.com");

const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString,
  ...(isExternalDb ? { ssl: { rejectUnauthorized: false } } : {}),
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 10000 : 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
