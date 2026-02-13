import { sql } from 'drizzle-orm';
import { db } from './client';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Execute a callback within a DB transaction that sets RLS user context.
 *
 * ALL user-scoped Drizzle queries MUST use this wrapper for RLS to work correctly.
 * The wrapper sets `app.current_user_id` and `app.current_user_role` via `SET LOCAL`,
 * which scopes these settings to the current transaction only.
 *
 * @param userId - The authenticated user's profile ID (UUID)
 * @param role - The user's role ('client' | 'creator' | 'admin')
 * @param callback - Function to execute within the RLS context
 * @returns The result of the callback
 *
 * @example
 * ```typescript
 * const profile = await withUserContext(userId, 'client', async (tx) => {
 *   return tx.query.profiles.findFirst({ where: eq(profiles.id, userId) });
 * });
 * ```
 */
export async function withUserContext<T>(
  userId: string,
  role: string,
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set RLS context variables (scoped to this transaction via SET LOCAL)
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    await tx.execute(sql`SELECT set_config('app.current_user_role', ${role}, true)`);
    return callback(tx);
  });
}
