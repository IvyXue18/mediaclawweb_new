import { and, count, desc, eq, isNull, like, or, type SQL } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask } from '@/config/db/schema';
import { consume, revoke } from '@/modules/credits/service';
import { getUuid } from '@/lib/hash';

export enum AITaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

/**
 * Create an AI task with optional credit consumption.
 */
export async function createTask(params: {
  userId: string;
  mediaType: string;
  provider: string;
  model: string;
  prompt: string;
  status?: string;
  scene?: string;
  taskId?: string;
  taskInfo?: any;
  taskResult?: any;
  costCredits?: number;
  options?: any;
}): Promise<any> {
  const {
    userId,
    mediaType,
    provider,
    model,
    prompt,
    status,
    scene,
    taskId,
    taskInfo,
    taskResult,
    costCredits,
    options,
  } = params;

  return db().transaction(async (tx: any) => {
    // 1. Insert task
    const taskData: any = {
      id: getUuid(),
      userId,
      mediaType,
      provider,
      model,
      prompt,
      status: status || AITaskStatus.PENDING,
      costCredits: costCredits || 0,
      scene: scene || '',
    };

    if (options !== undefined) {
      taskData.options =
        typeof options === 'string' ? options : JSON.stringify(options);
    }
    if (taskId) taskData.taskId = taskId;
    if (taskInfo !== undefined) {
      taskData.taskInfo =
        typeof taskInfo === 'string' ? taskInfo : JSON.stringify(taskInfo);
    }
    if (taskResult !== undefined) {
      taskData.taskResult =
        typeof taskResult === 'string'
          ? taskResult
          : JSON.stringify(taskResult);
    }

    const [task] = await tx.insert(aiTask).values(taskData).returning();

    // 2. Consume credits if cost > 0
    if (costCredits && costCredits > 0) {
      const result = await consume({
        userId,
        credits: costCredits,
        scene: 'ai_task',
        description: `AI ${mediaType} generation`,
        metadata: JSON.stringify({ taskId: task.id }),
        tx,
      });

      if (!result.success) {
        throw new Error('Insufficient credits');
      }

      // Store consumed credit ID for potential revocation
      if (result.consumedCredit) {
        await tx
          .update(aiTask)
          .set({
            creditId: result.consumedCredit.id,
          })
          .where(eq(aiTask.id, task.id));
      }
    }

    return task;
  });
}

/**
 * Update task status. Revokes credits on failure.
 */
export async function updateTask(params: {
  taskId: string;
  status: AITaskStatus;
  taskInfo?: any;
  taskResult?: any;
}) {
  const { taskId, status, taskInfo, taskResult } = params;

  const [task] = await db()
    .select()
    .from(aiTask)
    .where(eq(aiTask.id, taskId))
    .limit(1);

  if (!task) throw new Error('Task not found');

  // Update task
  const updateData: any = { status };
  if (taskInfo !== undefined) {
    updateData.taskInfo =
      typeof taskInfo === 'string' ? taskInfo : JSON.stringify(taskInfo);
  }
  if (taskResult) {
    updateData.taskResult =
      typeof taskResult === 'string' ? taskResult : JSON.stringify(taskResult);
  }

  await db().update(aiTask).set(updateData).where(eq(aiTask.id, taskId));

  // Revoke credits on failure
  if (status === AITaskStatus.FAILED) {
    if (task.creditId) {
      await revoke(task.creditId);
      return;
    }
    try {
      const info = JSON.parse(task.taskInfo as string);
      if (info.creditId) {
        await revoke(info.creditId);
      }
    } catch {
      // Ignore parse errors
    }
  }
}

export async function updateTaskById(
  taskId: string,
  updateData: {
    status?: string;
    taskId?: string | null;
    taskInfo?: any;
    taskResult?: any;
    creditId?: string | null;
  }
) {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(eq(aiTask.id, taskId))
    .limit(1);

  if (!task) throw new Error('Task not found');

  const values: any = {};
  if (updateData.status !== undefined) values.status = updateData.status;
  if (updateData.taskId !== undefined) values.taskId = updateData.taskId;
  if (updateData.taskInfo !== undefined) {
    values.taskInfo =
      typeof updateData.taskInfo === 'string'
        ? updateData.taskInfo
        : JSON.stringify(updateData.taskInfo);
  }
  if (updateData.taskResult !== undefined) {
    values.taskResult =
      typeof updateData.taskResult === 'string'
        ? updateData.taskResult
        : JSON.stringify(updateData.taskResult);
  }
  if (updateData.creditId !== undefined) values.creditId = updateData.creditId;

  if (
    updateData.status === AITaskStatus.FAILED &&
    (updateData.creditId || task.creditId)
  ) {
    await revoke((updateData.creditId || task.creditId) as string);
  }

  const [result] = await db()
    .update(aiTask)
    .set(values)
    .where(eq(aiTask.id, taskId))
    .returning();

  return result;
}

/**
 * Get tasks for a user.
 */
export async function getTasks(params: {
  userId: string;
  mediaType?: string;
  provider?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    userId,
    mediaType,
    provider,
    status,
    search,
    page = 1,
    limit = 20,
  } = params;

  return db()
    .select()
    .from(aiTask)
    .where(aiTaskWhere({ userId, mediaType, provider, status, search }))
    .orderBy(desc(aiTask.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

export async function getTasksCount(params: {
  userId: string;
  mediaType?: string;
  provider?: string;
  status?: string;
  search?: string;
}) {
  const [result] = await db()
    .select({ count: count() })
    .from(aiTask)
    .where(aiTaskWhere(params));

  return result?.count || 0;
}

/**
 * Find task by ID.
 */
export async function findTask(taskId: string) {
  const [result] = await db()
    .select()
    .from(aiTask)
    .where(eq(aiTask.id, taskId))
    .limit(1);
  return result;
}

function aiTaskWhere({
  userId,
  mediaType,
  provider,
  status,
  search,
}: {
  userId: string;
  mediaType?: string;
  provider?: string;
  status?: string;
  search?: string;
}) {
  const conditions: SQL[] = [
    eq(aiTask.userId, userId),
    isNull(aiTask.deletedAt) as unknown as SQL,
  ];

  if (mediaType && mediaType !== 'all') {
    conditions.push(eq(aiTask.mediaType, mediaType));
  }
  if (provider && provider !== 'all') {
    conditions.push(eq(aiTask.provider, provider));
  }
  if (status && status !== 'all') {
    conditions.push(eq(aiTask.status, status));
  }
  if (search) {
    conditions.push(
      or(
        like(aiTask.prompt, `%${search}%`),
        like(aiTask.model, `%${search}%`),
        like(aiTask.taskId, `%${search}%`)
      )!
    );
  }

  return and(...conditions);
}
