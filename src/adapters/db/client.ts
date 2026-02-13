import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

/**
 * Runtime Drizzle client.
 * Uses DATABASE_URL which connects as the `bomgyeol_app` role (NO bypassrls).
 * RLS policies are enforced on all queries through this client.
 *
 * For DDL/migrations, use DATABASE_URL_ADMIN in drizzle.config.ts instead.
 */
export const db = drizzle(process.env.DATABASE_URL!, { schema });
