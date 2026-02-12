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

