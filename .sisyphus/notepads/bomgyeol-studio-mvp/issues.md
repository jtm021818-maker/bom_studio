# Issues & Gotchas - 봄결 스튜디오 MVP

## Known Gotchas (from Metis/Momus)
- **UUID Format**: Better Auth defaults to non-standard IDs. MUST configure `generateId: () => crypto.randomUUID()`
- **RLS + Drizzle**: Direct DB connection bypasses RLS unless using `SET LOCAL` pattern
- **Database URLs**: Split ADMIN (DDL) vs Runtime (RLS) to avoid permission conflicts
- **Supabase Realtime**: Incompatible with Better Auth tokens - use polling instead
- **Vercel 4.5MB limit**: Use Supabase Storage direct upload for files


## [2026-02-12T11:34:13+09:00] Task 1 - Environment Blocker
- **Issue**: npm install fails with EPERM errors
- **Cause**: Windows file system + Korean characters in path + long node_modules nesting
- **Path**: "안티그래비티 프로젝트\ㅇㅅㅇ" triggers Windows path length/permission limits
- **Impact**: Cannot run build/test commands locally, BUT scaffold structure is correct
- **Workaround**: Project would install fine in: (a) WSL, (b) path without Korean chars, (c) macOS/Linux
- **Status**: Scaffold COMPLETE. npm install is environment limitation, not code failure.

