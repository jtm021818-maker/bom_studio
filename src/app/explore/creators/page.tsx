'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JellyButton } from '@/components/shared/JellyButton';
import { Skeleton } from '@/components/ui/skeleton';
import type { SearchCreatorsResult } from '@/core/types/search';

export default function ExploreCreatorsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchCreatorsResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({ type: 'creators' });
      if (query) params.set('q', query);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json() as { results: SearchCreatorsResult[] };
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSearch();
    }
  };

  const AVAILABILITY_LABELS: Record<string, { label: string; className: string }> = {
    available: { label: '작업 가능', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    busy: { label: '작업 중', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    unavailable: { label: '작업 불가', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">크리에이터 탐색</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI 영상 제작 전문 크리에이터를 찾아보세요.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색어 입력 (예: 사이버펑크, 모션그래픽, Runway)"
            className="flex-1"
          />
          <JellyButton onClick={handleSearch} disabled={loading}>
            {loading ? '검색 중...' : '검색'}
          </JellyButton>
        </div>

        {/* Results */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i}>
                <GlassCardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <GlassCard>
            <GlassCardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                검색 결과가 없습니다.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                다른 키워드로 검색해보세요.
              </p>
            </GlassCardContent>
          </GlassCard>
        )}

        {!loading && results.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((creator) => {
              const availConfig = AVAILABILITY_LABELS[creator.availability];
              return (
                <Link key={creator.profileId} href={`/creator/${creator.profileId}`} className="group">
                  <GlassCard className="h-full transition-all group-hover:shadow-lg group-hover:scale-[1.01]">
                    <GlassCardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <GlassCardTitle className="text-base">{creator.name}</GlassCardTitle>
                        {availConfig && (
                          <Badge variant="outline" className={`text-xs ${availConfig.className}`}>
                            {availConfig.label}
                          </Badge>
                        )}
                      </div>
                      <GlassCardDescription className="line-clamp-2 text-xs">
                        {creator.intro}
                      </GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent className="pt-0 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {creator.skills.slice(0, 4).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {creator.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{creator.skills.length - 4}</Badge>
                        )}
                      </div>
                      {creator.hourlyRate && (
                        <p className="text-xs text-muted-foreground">{creator.hourlyRate}</p>
                      )}
                      {creator.similarity !== null && (
                        <p className="text-xs text-muted-foreground">
                          매칭도: {Math.round(creator.similarity * 100)}%
                        </p>
                      )}
                    </GlassCardContent>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}

        {!searched && (
          <GlassCard>
            <GlassCardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                검색어를 입력하거나 바로 검색 버튼을 눌러 모든 크리에이터를 확인하세요.
              </p>
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
