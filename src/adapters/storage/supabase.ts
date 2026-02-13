import type { StorageProvider } from '@/core/ports/storage-provider';

/**
 * Supabase Storage adapter.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Uses REST API directly (no supabase-js dependency needed for storage).
 */
export function createSupabaseStorageProvider(
  supabaseUrl: string,
  serviceRoleKey: string
): StorageProvider {
  const storageUrl = `${supabaseUrl}/storage/v1`;

  return {
    async upload(bucket, path, file, contentType) {
      const blob = new Blob([file.buffer as ArrayBuffer], { type: contentType });
      const response = await fetch(`${storageUrl}/object/${bucket}/${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: blob,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Storage upload failed: ${response.status} - ${error}`);
      }

      return path;
    },

    async getSignedUrl(bucket, path, expiresIn = 3600) {
      const response = await fetch(`${storageUrl}/object/sign/${bucket}/${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Signed URL generation failed: ${response.status} - ${error}`);
      }

      const data = await response.json() as { signedURL: string };
      return `${supabaseUrl}${data.signedURL}`;
    },

    async delete(bucket, path) {
      const response = await fetch(`${storageUrl}/object/${bucket}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: [path] }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Storage delete failed: ${response.status} - ${error}`);
      }
    },
  };
}
