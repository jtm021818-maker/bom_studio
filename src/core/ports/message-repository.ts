import type { MessageData, CreateMessageInput } from '@/core/types/message';

export interface MessageRepository {
  findByProjectId(projectId: string, limit?: number, afterId?: string): Promise<MessageData[]>;
  create(input: CreateMessageInput): Promise<MessageData>;
}
