import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChatUseCases } from '@/core/usecases/chat';
import type { MessageRepository } from '@/core/ports/message-repository';
import type { MessageData } from '@/core/types/message';

// ─── Mock Data ───
const NOW = new Date('2026-02-12T00:00:00Z');

const mockMessage: MessageData = {
  id: 'msg-1',
  projectId: 'proj-1',
  senderId: 'user-1',
  senderName: '홍길동',
  content: '안녕하세요, 프로젝트에 관해 문의드립니다.',
  createdAt: NOW,
};

const mockMessage2: MessageData = {
  ...mockMessage,
  id: 'msg-2',
  senderId: 'user-2',
  senderName: '김크리',
  content: '네, 궁금하신 점 말씀해주세요!',
  createdAt: new Date('2026-02-12T00:01:00Z'),
};

// ─── Mock Repository ───
function createMockMessageRepo(): MessageRepository {
  return {
    findByProjectId: vi.fn(),
    create: vi.fn(),
  };
}

describe('createChatUseCases', () => {
  let messageRepo: ReturnType<typeof createMockMessageRepo>;
  let useCases: ReturnType<typeof createChatUseCases>;

  beforeEach(() => {
    messageRepo = createMockMessageRepo();
    useCases = createChatUseCases(messageRepo);
  });

  // ─── getMessages ───
  describe('getMessages', () => {
    it('returns messages for a project', async () => {
      vi.mocked(messageRepo.findByProjectId).mockResolvedValue([mockMessage, mockMessage2]);

      const result = await useCases.getMessages('proj-1');

      expect(result).toHaveLength(2);
      expect(messageRepo.findByProjectId).toHaveBeenCalledWith('proj-1', undefined, undefined);
    });

    it('supports limit and afterId parameters', async () => {
      vi.mocked(messageRepo.findByProjectId).mockResolvedValue([mockMessage2]);

      const result = await useCases.getMessages('proj-1', 10, 'msg-1');

      expect(result).toHaveLength(1);
      expect(messageRepo.findByProjectId).toHaveBeenCalledWith('proj-1', 10, 'msg-1');
    });

    it('returns empty array when no messages', async () => {
      vi.mocked(messageRepo.findByProjectId).mockResolvedValue([]);

      const result = await useCases.getMessages('proj-no-msgs');

      expect(result).toEqual([]);
    });
  });

  // ─── sendMessage ───
  describe('sendMessage', () => {
    it('creates message with valid input', async () => {
      const input = {
        projectId: 'proj-1',
        senderId: 'user-1',
        content: '안녕하세요!',
      };
      vi.mocked(messageRepo.create).mockResolvedValue(mockMessage);

      const result = await useCases.sendMessage(input);

      expect(result).toEqual(mockMessage);
      expect(messageRepo.create).toHaveBeenCalledWith(input);
    });

    it('rejects empty message', async () => {
      const input = {
        projectId: 'proj-1',
        senderId: 'user-1',
        content: '   ',
      };

      await expect(useCases.sendMessage(input)).rejects.toThrow('메시지 내용을 입력해주세요.');
      expect(messageRepo.create).not.toHaveBeenCalled();
    });

    it('rejects message over 5000 characters', async () => {
      const input = {
        projectId: 'proj-1',
        senderId: 'user-1',
        content: 'a'.repeat(5001),
      };

      await expect(useCases.sendMessage(input)).rejects.toThrow('메시지는 5000자 이하여야 합니다.');
      expect(messageRepo.create).not.toHaveBeenCalled();
    });

    it('accepts message at exactly 5000 characters', async () => {
      const input = {
        projectId: 'proj-1',
        senderId: 'user-1',
        content: 'a'.repeat(5000),
      };
      vi.mocked(messageRepo.create).mockResolvedValue({
        ...mockMessage,
        content: input.content,
      });

      const result = await useCases.sendMessage(input);

      expect(result.content).toHaveLength(5000);
    });
  });
});
