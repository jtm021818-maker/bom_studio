import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { profileRepository } from '@/adapters/db/repositories/profile';
import { messageRepository } from '@/adapters/db/repositories/message';
import { createChatUseCases } from '@/core/usecases/chat';

const chatUseCases = createChatUseCases(messageRepository);

/**
 * GET /api/messages/[projectId]?after=xxx&limit=50
 * Polling endpoint for chat messages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;
  const afterId = request.nextUrl.searchParams.get('after') ?? undefined;
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10);

  const messages = await chatUseCases.getMessages(projectId, limit, afterId);

  return NextResponse.json({ messages });
}

/**
 * POST /api/messages/[projectId]
 * Send a text message.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { projectId } = await params;
  const body = await request.json() as { content: string };

  try {
    const message = await chatUseCases.sendMessage({
      projectId,
      senderId: profile.id,
      content: body.content,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '메시지 전송 실패';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
