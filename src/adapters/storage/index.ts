import type { StorageProvider } from '@/core/ports/storage-provider';
import { createSupabaseStorageProvider } from './supabase';
import { createDummyStorageProvider } from './dummy';

let _cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_cachedProvider) return _cachedProvider;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    _cachedProvider = createSupabaseStorageProvider(supabaseUrl, serviceRoleKey);
  } else {
    console.warn('[Storage] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — using dummy storage');
    _cachedProvider = createDummyStorageProvider();
  }

  return _cachedProvider;
}

/** Private bucket name for portfolio files */
export const PORTFOLIO_BUCKET = 'portfolio';
