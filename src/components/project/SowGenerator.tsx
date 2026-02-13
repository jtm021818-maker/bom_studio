'use client';

import { useState, useCallback, useRef } from 'react';
import { JellyButton } from '@/components/shared/JellyButton';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Skeleton } from '@/components/ui/skeleton';

interface SowGeneratorProps {
  projectId: string;
}

export function SowGenerator({ projectId }: SowGeneratorProps) {
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    // Reset state
    setContent('');
    setError('');
    setGenerating(true);

    // Abort previous request if any
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch(`/api/projects/${projectId}/sow`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? 'SOW 생성에 실패했습니다.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6)) as {
              content?: string;
              done: boolean;
              error?: string;
            };

            if (data.error) {
              setError(data.error);
              setGenerating(false);
              return;
            }

            if (data.content) {
              setContent((prev) => prev + data.content);
            }

            if (data.done) {
              setGenerating(false);
              return;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      setGenerating(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled
        setGenerating(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'SOW 생성 중 오류가 발생했습니다.');
      setGenerating(false);
    }
  }, [projectId]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setGenerating(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
  }, [content]);

  return (
    <GlassCard>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle className="text-lg">AI SOW 생성</GlassCardTitle>
          <div className="flex items-center gap-2">
            {generating ? (
              <JellyButton gradient="serenity" onClick={handleCancel} size="sm">
                중단
              </JellyButton>
            ) : (
              <JellyButton onClick={handleGenerate} size="sm">
                {content ? 'SOW 재생성' : 'SOW 생성'}
              </JellyButton>
            )}
            {content && !generating && (
              <JellyButton gradient="serenity" onClick={handleCopy} size="sm" variant="outline">
                복사
              </JellyButton>
            )}
          </div>
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        {error && (
          <p className="text-sm text-destructive mb-3">{error}</p>
        )}

        {generating && !content && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {content && (
          <div className="rounded-lg bg-muted/30 p-4 max-h-[500px] overflow-y-auto">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {content}
              {generating && (
                <span className="inline-block w-2 h-4 bg-peach-400 animate-pulse ml-0.5" />
              )}
            </div>
          </div>
        )}

        {!content && !generating && !error && (
          <p className="text-sm text-muted-foreground text-center py-8">
            AI가 프로젝트 정보를 바탕으로 작업 범위 기술서(SOW)를 자동 생성합니다.
          </p>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
