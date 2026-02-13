/**
 * Port for file storage operations.
 * Implementations: Supabase Storage (real) or local/dummy fallback.
 */
export interface StorageProvider {
  /**
   * Upload a file to the private bucket.
   * @returns The storage path (NOT a public URL — use getSignedUrl for access)
   */
  upload(bucket: string, path: string, file: Uint8Array, contentType: string): Promise<string>;

  /**
   * Generate a signed URL for private file access.
   * @param expiresIn - Seconds until expiration (default 3600 = 1 hour)
   */
  getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;

  /**
   * Delete a file from storage.
   */
  delete(bucket: string, path: string): Promise<void>;
}
