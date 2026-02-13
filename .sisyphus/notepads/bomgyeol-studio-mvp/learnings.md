# Learnings - 봄결 스튜디오 MVP

## [2026-02-12T02:20:06Z] Session Start
- Plan: bomgyeol-studio-mvp (24 tasks, 7 waves)
- Strategy: TDD (Vitest + Playwright + pgTAP)
- Critical: RLS context via `SET LOCAL app.current_user_id`
- DB URLs: DATABASE_URL_ADMIN (DDL) + DATABASE_URL (runtime, RLS)


## [2026-02-12T11:34:09+09:00] Task 1 Complete
- Project scaffold successfully created
- Ports/Adapters structure in place
- TypeScript strict mode configured
- TDD tests written first (RED-GREEN pattern)
- All config files created: vitest, playwright, drizzle
- .env.example with 19 variables complete

## [2026-02-12T11:36:00+09:00] Task 1 — Scaffold Learnings
- `create-next-app@latest` now creates Next.js 16.1.6 (not 15) — this is the latest stable
- Next.js 16 uses Turbopack by default for both dev and build
- Tailwind v4 CSS-first: `@import "tailwindcss"` + `@theme inline {}` in globals.css, NO tailwind.config.ts
- tsconfig.json from create-next-app already has `"strict": true` — only needed to add `"noUncheckedIndexedAccess": true`
- Vitest v4 runs with zero additional config for Node.js filesystem tests
- On Windows, `rm -rf node_modules` can fail with permission errors — may need to close processes first
- create-next-app copies node_modules that reference absolute paths; moving project dir requires `npm install` fresh
- drizzle.config.ts uses `DATABASE_URL_ADMIN` (superuser) for migrations, runtime uses `DATABASE_URL` (app role w/ RLS)
- Package versions installed: next@16.1.6, react@19.2.3, vitest@4.0.18, drizzle-orm@0.45.1, better-auth@1.4.18, zod@4.3.6

## [2026-02-12T12:14:42+09:00] Task 2 Complete - Database Schema

**Deliverables Created**:
- 7 Drizzle schema files (profiles, projects, interactions, communication, feedback, audit, index)
- 4 SQL migration files (000_roles, 001_schema, 002_rls, 003_functions)
- 3 pgTAP RLS test files (rls_profiles, rls_projects, rls_messages)

**Key Patterns Implemented**:
- All tables: uuid PK, timestamps, soft delete (deleted_at)
- Vector columns: 1536 dimensions for OpenAI embeddings
- HNSW indexes on creator_profiles.embedding, video_briefs.embedding
- RLS policies using current_setting('app.current_user_id', true)::uuid
- Admin bypass via current_setting('app.current_user_role', true) = 'admin'
- App role (bomgyeol_app) created WITHOUT bypassrls privilege

**Tables Created** (17 total):
1. profiles, 2. creator_profiles, 3. projects, 4. video_briefs
5. storyboard_items, 6. shotlist_items, 7. proposals, 8. contracts
9. milestones, 10. deliveries, 11. payments, 12. messages
13. attachments, 14. reviews, 15. disputes, 16. embeddings_audit

**Hybrid Search Functions**:
- hybrid_search_creators(query_embedding, filters) - Vector + hard filters
- hybrid_search_projects(query_embedding, filters) - Project discovery
- get_creator_stats(creator_id) - Aggregated stats for re-ranking

**TypeScript Compilation**: ✅ PASS (no errors)

**Note**: Subagent delegation failed 3 times (30min timeout, zero output). Orchestrator created files directly to unblock progress.

## [2026-02-12T12:46:39+09:00] Task 3 Complete - Design System
- globals.css: Pastel Aura @theme inline with 30+ CSS variables
- UI components: button, input, card, badge, textarea, skeleton, separator, label, table (9 files)
- Shared components: StatusBadge, GlassCard, JellyButton, RoleBadge, MoneyDisplay, FileUploader, TimelineGate, AppShell (8 files)
- lib/utils.ts: cn() helper + formatKRW() currency formatter
- Tests: money-display.test.ts, status-badge.test.ts
- Dependencies needed: clsx, tailwind-merge, class-variance-authority, lucide-react, @radix-ui/* (cannot npm install due to Korean path)
- TypeScript compilation: PASS

## [2026-02-12T13:04:41+09:00] Task 4 Complete - Better Auth + Drizzle + Middleware
- auth.ts: Better Auth with Drizzle adapter, Google OAuth, email/password
- CRITICAL FIX: generateId lives at advanced.database.generateId, not advanced.generateId
- Setting 'uuid' uses gen_random_uuid() on Postgres automatically
- auth-client.ts: Client-side auth utilities (signIn, signUp, signOut, useSession)
- API route: /api/auth/[...all]/route.ts with toNextJsHandler
- middleware.ts: Route protection via session cookie check (better-auth.session_token)
- db/client.ts: Runtime Drizzle client (DATABASE_URL, app role with RLS)
- db/with-user-context.ts: RLS context wrapper using SET LOCAL via set_config
- TypeScript compilation: PASS

## [2026-02-12T13:14:43+09:00] Task 5 Complete - Auth Pages + Profile CRUD
- Auth page: login/signup with Google OAuth + email/password
- Role selection: client/creator toggle on signup form
- Profile types: core/types/profile.ts (ProfileData, CreatorProfileData)
- Profile ports: core/ports/profile-repository.ts (interface)
- Profile usecases: core/usecases/profile.ts (CRUD operations)
- Profile repository: adapters/db/repositories/profile.ts (Drizzle impl)
- API route: /api/profiles (GET profile, PATCH update)
- Dashboard placeholders: /dashboard/client, /dashboard/creator
- GOTCHA: Must import from schema/profiles directly, NOT from schema/index (re-export fails with vector type)
- GOTCHA: Use db.select().from() instead of db.query.X.findFirst() when schema re-export fails
- TypeScript compilation: PASS
