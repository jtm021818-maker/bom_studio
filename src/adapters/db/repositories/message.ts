import { eq, desc, gt, and } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { messages } from '@/adapters/db/schema/communication';
import { profiles } from '@/adapters/db/schema/profiles';
import type { MessageRepository } from '@/core/ports/message-repository';
import type { MessageData, CreateMessageInput } from '@/core/types/message';

export const messageRepository: MessageRepository = {
  async findByProjectId(projectId: string, limit = 50, afterId?: string): Promise<MessageData[]> {
    if (afterId) {
      // Get messages newer than afterId for polling
      const results = await db
        .select({
          id: messages.id,
          projectId: messages.projectId,
          senderId: messages.senderId,
          senderName: profiles.name,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .leftJoin(profiles, eq(profiles.id, messages.senderId))
        .where(
          and(
            eq(messages.projectId, projectId),
            gt(messages.id, afterId)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit);

      return results.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        senderId: r.senderId,
        senderName: r.senderName ?? undefined,
        content: r.content,
        createdAt: r.createdAt,
      }));
    }

    const results = await db
      .select({
        id: messages.id,
        projectId: messages.projectId,
        senderId: messages.senderId,
        senderName: profiles.name,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(profiles, eq(profiles.id, messages.senderId))
      .where(eq(messages.projectId, projectId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      senderId: r.senderId,
      senderName: r.senderName ?? undefined,
      content: r.content,
      createdAt: r.createdAt,
    }));
  },

  async create(input: CreateMessageInput): Promise<MessageData> {
    const [result] = await db.insert(messages).values({
      projectId: input.projectId,
      senderId: input.senderId,
      content: input.content,
    }).returning();
    if (!result) throw new Error('Failed to create message');
    return {
      id: result.id,
      projectId: result.projectId,
      senderId: result.senderId,
      content: result.content,
      createdAt: result.createdAt,
    };
  },
};
