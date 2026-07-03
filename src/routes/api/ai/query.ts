import { createFileRoute } from '@tanstack/react-router';
import { requireUser } from '@/routes/api/user/-compat';

import { type AITaskResult } from '@/core/ai';
import {
  AITaskStatus,
  findTask,
  updateTaskById,
} from '@/modules/ai-tasks/service';
import { getAIService } from '@/modules/ai/service';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  try {
    const { taskId } = await request.json();
    if (!taskId) {
      return respErr('invalid params');
    }

    const user = await requireUser(request);
    const task = await findTask(taskId);
    if (!task || !task.taskId) {
      return respErr('task not found');
    }

    if (task.userId !== user.id) {
      return respErr('no permission');
    }

    const aiService = await getAIService();
    const aiProvider = aiService.getProvider(task.provider);
    if (!aiProvider?.query) {
      return respErr('invalid ai provider');
    }

    const result: AITaskResult | undefined = await aiProvider.query({
      taskId: task.taskId,
      mediaType: task.mediaType,
      model: task.model,
    });

    if (!result?.taskStatus) {
      return respErr('query ai task failed');
    }

    const nextTaskInfo = result.taskInfo
      ? JSON.stringify(result.taskInfo)
      : null;
    const nextTaskResult = result.taskResult
      ? JSON.stringify(result.taskResult)
      : null;
    const shouldPersist =
      result.taskStatus !== task.status ||
      nextTaskInfo !== task.taskInfo ||
      nextTaskResult !== task.taskResult;

    if (shouldPersist) {
      await updateTaskById(task.id, {
        status: result.taskStatus as unknown as AITaskStatus,
        taskInfo: result.taskInfo ?? null,
        taskResult: result.taskResult ?? null,
        creditId: task.creditId,
      });
    }

    return respData({
      ...task,
      status: result.taskStatus,
      taskInfo: nextTaskInfo,
      taskResult: nextTaskResult,
    });
  } catch (error: any) {
    console.log('ai query failed', error);
    return respErr(error.message || 'ai query failed');
  }
}

export const Route = createFileRoute('/api/ai/query')({
  server: { handlers: { POST } },
});
