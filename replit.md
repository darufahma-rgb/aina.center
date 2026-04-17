# AINA Portal

A secure internal management portal for the AINA organization. Built as a fullstack React + Express application with PostgreSQL. Features a Cloud Dock purple design system, custom two-panel sidebar, and PWA support.

## Key Features
- **Asisten AINA (JARVIS-level)**: AI command engine at `/asisten`; 10 tools: `create_agenda`, `create_notulensi`, `update_agenda_status`, `create_keuangan`, `add_relasi`, `save_surat_template`, `search_portal`, `get_full_briefing`, `generate_document_report`, `add_anggota`; GPT-4o Vision analyzes uploaded surat template images to detect fields automatically; animated thinking dots + status cycling; suggestion chips after each AI response; "Briefing Harian" one-click portal status; gpt-4o-mini for text, gpt-4o for vision
- **Anggota**: Member management with photo support; "Import dari AINA Web" button syncs team from ainalabs.pro/about (14 members); anggota table now has nullable `email` and `photo_url` columns; members displayed grouped by division; admin can create, link, reset, unlink, and delete portal accounts from each member profile, with deleted accounts deactivated and detached so a fresh account can be created again
- **Dashboard**: Progress cards show finalNotulensi/totalNotulensi and agendaCompletedThisCalMonth/agendaThisCalMonth; data from current calendar month; third card replaced with **GitHubChangesCard** — fetches latest 20 commits from GitHub, shows unread badge per-user (via `commit_reads` table), badge disappears after user opens the popover; popover lists commits with unread dot indicators
- **Agenda Berita AIGYPT**: Fetches live news from AIGYPT Supabase (`masisir_news` table); requires `AIGYPT_SUPABASE_URL` + `AIGYPT_SUPABASE_ANON_KEY` env vars
- **Surat Template**: Visual click-to-place field editor on PNG images; canvas overlay print preview; `surat_templates` DB table
- **Keuangan Proof**: Bukti pembayaran now supports PNG/JPG file upload via `POST /api/keuangan/upload-proof`; uploads to Supabase Storage (`keuangan-proofs` bucket) or local `/uploads`; image thumbnail shown inline in transaction list; URL input still supported for Google Drive links
- **api/index.js**: Must be rebuilt (`npm run build:api`) after any backend changes for Vercel deployment

## Design System

**Theme**: DoDo-inspired — warm gray background (`hsl(60,8%,88%)`), white sidebar + white main card, dark purple primary (`#5B21B6`), very dark purple (`#1E0A3C`) for help card  
**Logo**: `public/logo.png` (AINA Centre Management brand icon, white on purple background)  
**Layout**: Fixed sidebar (200px, always visible, floating pill style with 12px margin); main content is a white rounded card to the right; sidebar has user profile (purple avatar, clickable to edit profile), nav with purple active pills, and dismissible dark help/logout card at bottom  
**Login**: Split-panel (dark `#1C1C1C` left with purple accent glows + warm gray right form panel)  
**Dashboard**: DoDo-style — greeting with purple word highlight, 3 progress ring cards, agenda cards (dark), notulensi table rows, right panel with summary + calendar + finance (admin)  
**PWA**: `public/manifest.json`, full PWA meta tags in `index.html`, and a production service worker at `public/sw.js`  
**UI Components**: shadcn/ui with `.neo-card`, `.dark-card`, `.nav-active`, `.chip-*` utility classes; dark purple as primary, dark card is very dark purple  
**Profile**: Users can edit display name and avatar URL via ProfileModal (click avatar or Settings icon); stored in `display_name` and `avatar_url` columns in the users table; API: `PATCH /api/auth/profile`  
**Help card**: Dismissible via X button; state stored in `localStorage`; when dismissed, a simple logout button row is shown instead

## Architecture

**Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui  
**Backend**: Express.js + TypeScript (tsx)  
**Database**: PostgreSQL via Replit Database or external Postgres (Drizzle ORM)  
**Auth**: Session-based (express-session + bcryptjs)  
**State**: TanStack Query v5

## Running

The Replit workflow runs `npm start`, which starts `tsx server/index.ts` on port 5000. In development, Express serves Vite as middleware and accepts the Replit preview host. The database schema has been synced to the Replit PostgreSQL database using `npm run db:push`.

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
5. **FiturTerbaru** — Product feature tracking; admin can delete both manually curated feature cards and auto-generated update cards. Hidden auto-generated cards are persisted in `investor_content` under `hidden_auto_fitur`.
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
- `server/db.ts` — PostgreSQL connection using `SUPABASE_DATABASE_URL` or `DATABASE_URL`
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
