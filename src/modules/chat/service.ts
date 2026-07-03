import { and, asc, count, desc, eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { chat, chatMessage } from '@/config/db/schema';

export type Chat = typeof chat.$inferSelect;
export type NewChat = typeof chat.$inferInsert;
export type UpdateChat = Partial<Omit<NewChat, 'id' | 'createdAt'>>;

export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
export type UpdateChatMessage = Partial<
  Omit<NewChatMessage, 'id' | 'createdAt'>
>;

export enum ChatStatus {
  PENDING = 'pending',
  CREATED = 'created',
  DELETED = 'deleted',
}

export enum ChatMessageStatus {
  CREATED = 'created',
  DELETED = 'deleted',
}

export async function createChat(newChat: NewChat): Promise<Chat> {
  const [result] = await db().insert(chat).values(newChat).returning();
  return result;
}

export async function findChatById(id: string): Promise<Chat | undefined> {
  const [result] = await db().select().from(chat).where(eq(chat.id, id));
  return result;
}

export async function updateChat(
  id: string,
  updateChat: UpdateChat
): Promise<Chat> {
  const [result] = await db()
    .update(chat)
    .set(updateChat)
    .where(eq(chat.id, id))
    .returning();
  return result;
}

export async function getChats({
  userId,
  status,
  page = 1,
  limit = 30,
}: {
  userId?: string;
  status?: ChatStatus;
  page?: number;
  limit?: number;
}): Promise<Chat[]> {
  return db()
    .select()
    .from(chat)
    .where(
      and(
        userId ? eq(chat.userId, userId) : undefined,
        status ? eq(chat.status, status) : undefined
      )
    )
    .orderBy(desc(chat.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

export async function getChatsCount({
  userId,
  status,
}: {
  userId?: string;
  status?: ChatStatus;
}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(chat)
    .where(
      and(
        userId ? eq(chat.userId, userId) : undefined,
        status ? eq(chat.status, status) : undefined
      )
    );
  return result?.count || 0;
}

export async function createChatMessage(
  newChatMessage: NewChatMessage
): Promise<ChatMessage> {
  const [result] = await db()
    .insert(chatMessage)
    .values(newChatMessage)
    .returning();
  return result;
}

export async function getChatMessages({
  userId,
  chatId,
  status,
  page = 1,
  limit = 30,
}: {
  userId?: string;
  chatId: string;
  status?: ChatMessageStatus;
  page?: number;
  limit?: number;
}): Promise<ChatMessage[]> {
  return db()
    .select()
    .from(chatMessage)
    .where(
      and(
        userId ? eq(chatMessage.userId, userId) : undefined,
        chatId ? eq(chatMessage.chatId, chatId) : undefined,
        status ? eq(chatMessage.status, status) : undefined
      )
    )
    .orderBy(asc(chatMessage.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

export async function getChatMessagesCount({
  userId,
  chatId,
  status,
}: {
  userId?: string;
  chatId: string;
  status?: ChatMessageStatus;
}): Promise<number> {
  const [result] = await db()
    .select({ count: count() })
    .from(chatMessage)
    .where(
      and(
        userId ? eq(chatMessage.userId, userId) : undefined,
        chatId ? eq(chatMessage.chatId, chatId) : undefined,
        status ? eq(chatMessage.status, status) : undefined
      )
    );
  return result?.count || 0;
}
