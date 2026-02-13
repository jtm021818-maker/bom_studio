import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getStorageProvider, PORTFOLIO_BUCKET } from '@/adapters/storage';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/**
 * POST /api/upload
 * Upload a file to private storage. Returns the storage path.
 * The client must use GET /api/upload/signed?path=xxx to get a signed URL for access.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const bucket = (formData.get('bucket') as string) ?? PORTFOLIO_BUCKET;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Generate unique storage path: userId/timestamp-filename
  const ext = file.name.split('.').pop() ?? 'bin';
  const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const storage = getStorageProvider();
  const buffer = new Uint8Array(await file.arrayBuffer());

  try {
    const path = await storage.upload(bucket, storagePath, buffer, file.type);
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

    return NextResponse.json({
      path,
      mediaType,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
