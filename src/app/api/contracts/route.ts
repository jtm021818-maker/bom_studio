import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getContractProvider } from '@/adapters/contract';

/** POST /api/contracts - Create electronic contract */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    title: string;
    content: string;
    signers: Array<{ name: string; email: string; role: 'client' | 'creator' }>;
  };

  const provider = getContractProvider();

  try {
    const result = await provider.createDocument(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Contract creation failed' }, { status: 500 });
  }
}

/** GET /api/contracts?documentId=xxx */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const documentId = request.nextUrl.searchParams.get('documentId');
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });

  const provider = getContractProvider();

  try {
    const status = await provider.getDocumentStatus(documentId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
