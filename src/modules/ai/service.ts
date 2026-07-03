import {
  AIManager,
  FalProvider,
  GeminiProvider,
  KieProvider,
  ReplicateProvider,
} from '@/core/ai';
import { getAllConfigs, type ConfigMap } from '@/modules/config/service';

export function getAIManagerWithConfigs(configs: ConfigMap) {
  const manager = new AIManager();

  if (configs.kie_api_key) {
    manager.addProvider(
      new KieProvider({
        apiKey: configs.kie_api_key,
        customStorage: configs.kie_custom_storage === 'true',
      })
    );
  }

  if (configs.replicate_api_token) {
    manager.addProvider(
      new ReplicateProvider({
        apiToken: configs.replicate_api_token,
        customStorage: configs.replicate_custom_storage === 'true',
      })
    );
  }

  if (configs.fal_api_key) {
    manager.addProvider(
      new FalProvider({
        apiKey: configs.fal_api_key,
        customStorage: configs.fal_custom_storage === 'true',
      })
    );
  }

  if (configs.gemini_api_key) {
    manager.addProvider(
      new GeminiProvider({
        apiKey: configs.gemini_api_key,
      })
    );
  }

  return manager;
}

export async function getAIService(configs?: ConfigMap) {
  return getAIManagerWithConfigs(configs ?? (await getAllConfigs()));
}
