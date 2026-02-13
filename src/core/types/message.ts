/**
 * Message types for project-scoped chat.
 * Uses polling (5s interval), NOT WebSocket/Realtime (per constraints).
 */

export interface MessageData {
  id: string;
  projectId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: Date;
}

export interface CreateMessageInput {
  projectId: string;
  senderId: string;
  content: string;
}
