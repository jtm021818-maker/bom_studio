import { describe, it, expect } from 'vitest';

describe('Auth configuration', () => {
  it('.env.example has all required auth variables', async () => {
    const fs = await import('fs');
    const envExample = fs.readFileSync('.env.example', 'utf-8');

    const requiredVars = [
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'DATABASE_URL',
      'DATABASE_URL_ADMIN',
      'ADMIN_EMAILS',
    ];

    for (const v of requiredVars) {
      expect(envExample).toContain(v);
    }
  });

  it('auth module exports auth instance', async () => {
    // Verify the file exists and exports correctly (static analysis)
    const fs = await import('fs');
    const authFile = fs.readFileSync('src/lib/auth.ts', 'utf-8');

    expect(authFile).toContain('betterAuth');
    expect(authFile).toContain('drizzleAdapter');
    expect(authFile).toContain("generateId: 'uuid'");
    expect(authFile).toContain('nextCookies');
    expect(authFile).toContain('export const auth');
  });

  it('auth-client module exports client utilities', async () => {
    const fs = await import('fs');
    const clientFile = fs.readFileSync('src/lib/auth-client.ts', 'utf-8');

    expect(clientFile).toContain('createAuthClient');
    expect(clientFile).toContain('signIn');
    expect(clientFile).toContain('signUp');
    expect(clientFile).toContain('signOut');
    expect(clientFile).toContain('useSession');
  });

  it('middleware protects correct routes', async () => {
    const fs = await import('fs');
    const middlewareFile = fs.readFileSync('src/middleware.ts', 'utf-8');

    expect(middlewareFile).toContain('/dashboard');
    expect(middlewareFile).toContain('/project/new');
    expect(middlewareFile).toContain('/admin');
    expect(middlewareFile).toContain('/auth');
    expect(middlewareFile).toContain('ADMIN_EMAILS');
  });

  it('withUserContext sets RLS context', async () => {
    const fs = await import('fs');
    const wucFile = fs.readFileSync('src/adapters/db/with-user-context.ts', 'utf-8');

    expect(wucFile).toContain('app.current_user_id');
    expect(wucFile).toContain('app.current_user_role');
    expect(wucFile).toContain('set_config');
    expect(wucFile).toContain('db.transaction');
  });

  it('db client uses DATABASE_URL (not ADMIN)', async () => {
    const fs = await import('fs');
    const clientFile = fs.readFileSync('src/adapters/db/client.ts', 'utf-8');

    expect(clientFile).toContain('DATABASE_URL');
    // Runtime client uses DATABASE_URL (not ADMIN) for the drizzle() call
    expect(clientFile).toContain("process.env.DATABASE_URL!");
    expect(clientFile).not.toContain("process.env.DATABASE_URL_ADMIN");
  });
});
