'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { MessageData } from '@/core/types/message';

const POLL_INTERVAL = 5000; // 5 seconds

interface ChatPanelProps {
  projectId: string;
  currentUserId?: string;
}

export function ChatPanel({ projectId, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | undefined>(undefined);

  // Fetch messages
  const fetchMessages = useCallback(async (afterId?: string) => {
    try {
      const params = new URLSearchParams();
      if (afterId) params.set('after', afterId);

      const res = await fetch(`/api/messages/${projectId}?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json() as { messages: MessageData[] };

      if (afterId && data.messages.length > 0) {
        // Append new messages
        setMessages((prev) => [...prev, ...data.messages.reverse()]);
      } else if (!afterId) {
        // Initial load — messages come in DESC order, reverse for display
        setMessages(data.messages.reverse());
      }

      // Track last message ID for polling
      const lastMsg = data.messages[0]; // Newest message (DESC order)
      if (lastMsg) {
        lastMessageIdRef.current = lastMsg.id;
      }
    } catch {
      // Silently fail on polling errors
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  // Polling
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchMessages(lastMessageIdRef.current);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput('');

    try {
      const res = await fetch(`/api/messages/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const msg = await res.json() as MessageData;
        setMessages((prev) => [...prev, msg]);
        lastMessageIdRef.current = msg.id;
      }
    } catch {
      // Re-add input text on failure
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <GlassCard className="flex flex-col h-[500px]">
      <GlassCardHeader className="pb-2 shrink-0">
        <GlassCardTitle className="text-lg">프로젝트 채팅</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              아직 메시지가 없습니다. 첫 메시지를 보내보세요!
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMine
                      ? 'bg-gradient-to-r from-peach-400 to-peach-500 text-white'
                      : 'bg-white/80 border border-border'
                  }`}
                >
                  {!isMine && msg.senderName && (
                    <p className="text-xs font-medium mb-0.5 opacity-70">{msg.senderName}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input area */}
        <div className="flex gap-2 shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            maxLength={5000}
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? '...' : '전송'}
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
