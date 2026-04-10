# AINA Portal

A secure internal management portal for the AINA organization. Built as a fullstack React + Express application with PostgreSQL. Features a Cloud Dock purple design system, custom two-panel sidebar, and PWA support.

## Design System

**Theme**: Dark purple Cloud Dock — `--primary: 265 83% 57%`, sidebar `hsl(250,53%,7%)`  
**Logo**: `public/logo.png` (AINA Centre Management brand icon)  
**Layout**: Custom two-panel sidebar (56px icon rail + 216px collapsible nav panel); mobile bottom nav bar  
**PWA**: `public/manifest.json` + full PWA meta tags in `index.html`  
**UI Components**: shadcn/ui with neosoft layered shadow tokens (`shadow-neo-*`), purple gradient active pills (`.nav-active-pill`), glassmorphic header (`.glass-header`)

## Architecture

**Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui  
**Backend**: Express.js + TypeScript (tsx)  
**Database**: PostgreSQL via Neon (Drizzle ORM)  
**Auth**: Session-based (express-session + bcryptjs)  
**State**: TanStack Query v5

## Running

The app starts via `npx tsx server/index.ts` which runs Express (port 5000) with Vite as middleware in dev mode.

## Roles

- **Admin**: Full CRUD across all modules, manage visibility, users
- **User**: View-only access to permitted modules

## Default Admin Account

- Username: `admin`  
- Password: `Admin@AINA2024`  
- **Change this after first login**

## Modules

1. **Dashboard** — Summary stats and quick overview
2. **Notulensi** — Meeting notes with participants, decisions, action items
3. **Agenda** — Calendar/schedule management
4. **Keuangan & Sponsor** — Financial transactions (income & expenses) with full field details, plus sponsor tracking with pledged vs received progress bars
5. **FiturTerbaru** — Product feature tracking
6. **Anggota** — Team member management
7. **Relasi** — External relationships/partnerships
8. **Surat** — Document/letter management
9. **Inventaris** — Asset/equipment management
10. **Investor Mode** — Full controlled presentation layer with dual mode: Admin Control Panel (edit content, curate features, configure financial visibility) and a premium full-screen Presentation View. Zero raw internal data exposed. Config stored as `_config` investorContent key (JSON). Features: per-section visibility toggle, FiturTerbaru curation, financial/sponsor toggles, amount-hiding option, non-admin always sees clean view.
11. **AI Report Assistant** (`/ai-report`) — Convert raw notes into structured reports (4 modes: Notulensi, Progress, Investor Summary, Short Summary). Template-based extraction engine in `server/aiReport.ts` with clear LLM integration seam. Supports edit-before-save, copy, save to history, and one-click save to Notulensi module.

## Key Files

- `shared/schema.ts` — Drizzle schema for all tables
- `server/index.ts` — Express entry point + admin seed
- `server/routes.ts` — All API routes
- `server/storage.ts` — Database CRUD (IStorage interface)
- `server/auth.ts` — requireAuth/requireAdmin middleware
- `server/db.ts` — Neon database connection
- `src/contexts/AuthContext.tsx` — Frontend auth state
- `src/lib/queryClient.ts` — TanStack Query client with session credentials

## Database Features

- Timestamps (created_at, updated_at) on all tables
- created_by/updated_by user references
- Soft delete (deleted_at) on important tables
- Full audit log (audit_logs table)

## API Endpoints

- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user
- `GET /api/dashboard` — Dashboard summary
- `GET /api/finance/summary` — Investor-safe finance summary (admins get raw transactions; investors get only aggregates)
- CRUD endpoints for each module (requireAuth or requireAdmin)
- `/api/sponsor` CRUD — Sponsor tracking (admin write, all read)
- `/api/keuangan` CRUD — Income/expense tracking with extended fields (sourceName, sourceType, responsiblePerson, purpose, paymentMethod, proofUrl, notes)
- `/api/users` CRUD — User management (admin only)
- `GET /api/users/map` — UserId→username map for UI RecordMeta display
