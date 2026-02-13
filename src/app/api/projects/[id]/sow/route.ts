import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { projectRepository, videoBriefRepository } from '@/adapters/db/repositories/project';
import { getAiProvider } from '@/adapters/ai';
import { createSowUseCases } from '@/core/usecases/sow';
import type { SowGenerationInput } from '@/core/types/sow';

/**
 * GET /api/projects/[id]/sow
 * SSE endpoint: streams AI-generated SOW for the given project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Fetch project
  const project = await projectRepository.findById(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Fetch video brief (optional)
  const videoBrief = await videoBriefRepository.findByProjectId(id);

  // Build SOW input
  const sowInput: SowGenerationInput = {
    projectTitle: project.title,
    projectDescription: project.description,
    category: project.category,
    budgetMin: project.budgetMin,
    budgetMax: project.budgetMax,
    deadline: project.deadline.toISOString().split('T')[0] ?? '',
    videoBrief: videoBrief
      ? {
          channel: videoBrief.channel,
          duration: videoBrief.duration,
          resolution: videoBrief.resolution,
          aspectRatio: videoBrief.aspectRatio,
          fps: videoBrief.fps,
          style: videoBrief.style,
          prohibitedElements: videoBrief.prohibitedElements ?? undefined,
          referenceUrls: videoBrief.referenceUrls ?? undefined,
        }
      : undefined,
  };

  // Create SSE stream
  const aiProvider = getAiProvider();
  const sowUseCases = createSowUseCases(aiProvider);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of sowUseCases.generateSowStream(sowInput)) {
          if (chunk.done) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          } else {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk.content, done: false })}\n\n`)
            );
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Generation failed';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message, done: true })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
