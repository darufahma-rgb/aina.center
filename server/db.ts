import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const raw = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!raw) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required");
}

const isPooler = raw.includes("pooler.supabase.com") || raw.includes(":6543");
const isExternalDb = raw.includes("supabase") || raw.includes("neon.tech") || raw.includes("sslmode=require") || isPooler;
const isServerless = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

// For PgBouncer (Transaction Pooler), append pgbouncer=true to disable prepared statements
let connectionString = raw;
if (isPooler && !connectionString.includes("pgbouncer=true")) {
  const sep = connectionString.includes("?") ? "&" : "?";
  connectionString = `${connectionString}${sep}pgbouncer=true`;
}

export const pool = new Pool({
  connectionString,
  ...(isExternalDb ? { ssl: { rejectUnauthorized: false } } : {}),
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 20000,
  allowExitOnIdle: true,
});

// Disable prepared statements when using PgBouncer (transaction pooler)
export const db = drizzle(pool, { schema, ...(isPooler ? { logger: false } : {}) });
