import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './supabase/migrations',
  schema: './src/adapters/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // DDL/migrations용 — superuser 역할 (RLS 우회)
    // 런타임에는 DATABASE_URL (앱 역할, RLS 적용)을 사용
    url: process.env.DATABASE_URL_ADMIN!,
  },
});
