# Architectural Decisions - 봄결 스튜디오 MVP

## [2026-02-12T02:20:06Z] Initial Decisions
- **Auth**: Better Auth (NOT Supabase Auth) with Drizzle adapter
- **UUID**: `crypto.randomUUID()` for Supabase FK compatibility
- **RLS**: `withUserContext()` wrapper, SET LOCAL app.current_user_id/role
- **Chat**: Polling-based (5s), NO Supabase Realtime
- **DI**: Module-level singletons, NO ioctopus/containers
- **Theme**: Tailwind v4 CSS-first (@theme inline), tw-animate-css
- **AI Model**: Env-configurable, default gpt-4o-mini, mock fallback
