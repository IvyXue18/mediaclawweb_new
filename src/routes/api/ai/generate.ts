import { createFileRoute } from '@tanstack/react-router';
import { requireUser } from '@/routes/api/user/-compat';

import { AIMediaType } from '@/core/ai';
import { envConfigs } from '@/config';
import {
  AITaskStatus,
  createTask,
  updateTask,
  updateTaskById,
} from '@/modules/ai-tasks/service';
import { getAIService } from '@/modules/ai/service';
import { getConfig } from '@/modules/config/service';
import { getBalance } from '@/modules/credits/service';
import { respData, respErr } from '@/lib/resp';

function getCostCredits(mediaType: string, scene?: string) {
  if (mediaType === AIMediaType.IMAGE) {
    if (scene === 'image-to-image') return 4;
    if (scene === 'text-to-image') return 2;
    throw new Error('invalid scene');
  }

  if (mediaType === AIMediaType.VIDEO) {
    if (scene === 'text-to-video') return 6;
    if (scene === 'image-to-video') return 8;
    if (scene === 'video-to-video') return 10;
    throw new Error('invalid scene');
  }

  if (mediaType === AIMediaType.MUSIC) return 10;

  throw new Error('invalid mediaType');
}

async function POST({ request }: { request: Request }) {
  try {
    // Legacy template feature. All product features currently live in the
    // browser plugin, so this credit-spending endpoint is disabled unless
    // explicitly enabled via admin config.
    if ((await getConfig('ai_generation_enabled')) !== 'true') {
      return respErr('AI generation is disabled');
    }

    let { provider, mediaType, model, prompt, options, scene } =
      await request.json();

    if (!provider || !mediaType || !model) {
      throw new Error('invalid params');
    }

    if (!prompt && !options) {
      throw new Error('prompt or options is required');
    }

    if (mediaType === AIMediaType.MUSIC) {
      scene = 'text-to-music';
    }

    const aiService = await getAIService();
    if (!aiService.getMediaTypes().includes(mediaType)) {
      throw new Error('invalid mediaType');
    }

    const aiProvider = aiService.getProvider(provider);
    if (!aiProvider) {
      throw new Error('invalid provider');
    }

    const user = await requireUser(request);
    const costCredits = getCostCredits(mediaType, scene);
    const remainingCredits = await getBalance(user.id);
    if (remainingCredits < costCredits) {
      throw new Error('insufficient credits');
    }

    const task = await createTask({
      userId: user.id,
      mediaType,
      provider,
      model,
      prompt,
      scene,
      options,
      status: AITaskStatus.PROCESSING,
      costCredits,
    });

    try {
      const result = await aiProvider.generate({
        params: {
          mediaType,
          model,
          prompt,
          callbackUrl: `${envConfigs.app_url}/api/ai/notify/${provider}`,
          options,
        },
      });

      if (!result?.taskId) {
        throw new Error(
          `ai generate failed, mediaType: ${mediaType}, provider: ${provider}, model: ${model}`
        );
      }

      const updatedTask = await updateTaskById(task.id, {
        status: result.taskStatus,
        taskId: result.taskId,
        taskInfo: result.taskInfo ?? null,
        taskResult: result.taskResult ?? null,
      });

      return respData(updatedTask);
    } catch (error: any) {
      await updateTask({
        taskId: task.id,
        status: AITaskStatus.FAILED,
        taskInfo: { error: error?.message || 'generate failed' },
      }).catch(() => undefined);
      throw error;
    }
  } catch (error: any) {
    console.log('generate failed', error);
    return respErr(error.message || 'generate failed');
  }
}

export const Route = createFileRoute('/api/ai/generate')({
  server: { handlers: { POST } },
});
