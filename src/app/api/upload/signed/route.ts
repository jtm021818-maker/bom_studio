import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getStorageProvider, PORTFOLIO_BUCKET } from '@/adapters/storage';

/**
 * GET /api/upload/signed?path=xxx&bucket=yyy
 * Returns a signed URL for private file access.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path');
  const bucket = request.nextUrl.searchParams.get('bucket') ?? PORTFOLIO_BUCKET;

  if (!path) {
    return NextResponse.json({ error: 'path parameter required' }, { status: 400 });
  }

  const storage = getStorageProvider();

  try {
    const signedUrl = await storage.getSignedUrl(bucket, path, 3600);
    return NextResponse.json({ signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate signed URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
