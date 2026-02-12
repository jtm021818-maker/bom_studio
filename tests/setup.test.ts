import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Project Setup', () => {
  it('should have package.json with required deps', () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    );
    expect(pkg.dependencies['next']).toBeDefined();
    expect(pkg.dependencies['drizzle-orm']).toBeDefined();
    expect(pkg.dependencies['better-auth']).toBeDefined();
    expect(pkg.dependencies['openai']).toBeDefined();
    expect(pkg.dependencies['zod']).toBeDefined();
    expect(pkg.dependencies['@supabase/supabase-js']).toBeDefined();
  });

  it('should have strict TypeScript config', () => {
    const tsconfig = JSON.parse(
      readFileSync(join(process.cwd(), 'tsconfig.json'), 'utf-8')
    );
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.noUncheckedIndexedAccess).toBe(true);
  });

  it('should have Ports/Adapters directory structure', () => {
    // Core layer
    expect(existsSync(join(process.cwd(), 'src/core/types'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/core/ports'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/core/usecases'))).toBe(true);
    // Adapter layer
    expect(existsSync(join(process.cwd(), 'src/adapters/db'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/adapters/ai'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/adapters/payment'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/adapters/contract'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/adapters/storage'))).toBe(true);
    // Infrastructure
    expect(existsSync(join(process.cwd(), 'src/lib'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/components'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/app'))).toBe(true);
    // External
    expect(existsSync(join(process.cwd(), 'supabase'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'tests'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'e2e'))).toBe(true);
  });

  it('should have .env.example with all required variables', () => {
    const envExample = readFileSync(
      join(process.cwd(), '.env.example'),
      'utf-8'
    );
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
      'DATABASE_URL_ADMIN',
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'OPENAI_API_KEY',
      'OPENAI_EMBEDDING_MODEL',
      'OPENAI_CHAT_MODEL',
      'TOSS_PAYMENTS_SECRET_KEY',
      'TOSS_PAYMENTS_CLIENT_KEY',
      'TOSS_PAYMENTS_WEBHOOK_SECRET',
      'MODUSIGN_API_KEY',
      'MODUSIGN_WEBHOOK_SECRET',
      'ADMIN_EMAILS',
      'NEXT_PUBLIC_APP_URL',
    ];

    for (const v of requiredVars) {
      expect(envExample).toContain(v);
    }
  });

  it('should have drizzle.config.ts pointing to DATABASE_URL_ADMIN', () => {
    const drizzleConfig = readFileSync(
      join(process.cwd(), 'drizzle.config.ts'),
      'utf-8'
    );
    expect(drizzleConfig).toContain('DATABASE_URL_ADMIN');
  });

  it('should NOT have tailwind.config.ts (Tailwind v4 CSS-first)', () => {
    expect(existsSync(join(process.cwd(), 'tailwind.config.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'tailwind.config.js'))).toBe(false);
  });
});
