import type { StorageProvider } from '@/core/ports/storage-provider';

/**
 * Dummy storage provider for development when Supabase is not configured.
 * Returns placeholder URLs for signed URLs.
 */
export function createDummyStorageProvider(): StorageProvider {
  const store = new Map<string, { data: Uint8Array; contentType: string }>();

  return {
    async upload(bucket, path, file, contentType) {
      store.set(`${bucket}/${path}`, {
        data: file,
        contentType,
      });
      return path;
    },

    async getSignedUrl(bucket, path, _expiresIn = 3600) {
      // Return a placeholder URL for dummy mode
      return `https://placeholder.storage.local/${bucket}/${path}?signed=dummy`;
    },

    async delete(bucket, path) {
      store.delete(`${bucket}/${path}`);
    },
  };
}
