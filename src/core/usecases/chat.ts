import type { MessageRepository } from '@/core/ports/message-repository';
import type { MessageData, CreateMessageInput } from '@/core/types/message';

export function createChatUseCases(messageRepo: MessageRepository) {
  return {
    async getMessages(projectId: string, limit?: number, afterId?: string): Promise<MessageData[]> {
      return messageRepo.findByProjectId(projectId, limit, afterId);
    },

    async sendMessage(input: CreateMessageInput): Promise<MessageData> {
      if (!input.content.trim()) {
        throw new Error('메시지 내용을 입력해주세요.');
      }

      if (input.content.length > 5000) {
        throw new Error('메시지는 5000자 이하여야 합니다.');
      }

      return messageRepo.create(input);
    },
  };
}
