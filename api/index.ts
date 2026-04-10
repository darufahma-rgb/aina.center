import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "../server/routes";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
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

registerRoutes(app);

export default app;
