// Provider factory - extensible for future providers
import { anthropic } from '@ai-sdk/anthropic';
import { getModelConfig, DEFAULT_MODEL } from './models';

export function getModel(modelId: string) {
  const config = getModelConfig(modelId);

  // Fall back to default if model not found
  if (!config) {
    console.warn(`Unknown model: ${modelId}, falling back to ${DEFAULT_MODEL}`);
    return anthropic(DEFAULT_MODEL);
  }

  switch (config.provider) {
    case 'anthropic':
      return anthropic(modelId);
    // Future: case 'openai': return openai(modelId);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
