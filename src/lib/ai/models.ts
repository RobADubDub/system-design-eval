// Model manifest - update this file when new models are released
export type Provider = 'anthropic' | 'openai' | 'local';

export interface ModelConfig {
  id: string;           // e.g., 'claude-haiku-4-5-20251001'
  name: string;         // e.g., 'Claude Haiku 4.5'
  provider: Provider;
  description: string;
  maxTokens: number;
  costTier: 'low' | 'medium' | 'high';
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: 'Fastest model with near-frontier intelligence',
    maxTokens: 8192,
    costTier: 'low',
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Smart model for complex agents and coding',
    maxTokens: 8192,
    costTier: 'medium',
  },
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    description: 'Maximum intelligence with practical performance',
    maxTokens: 8192,
    costTier: 'high',
  },
];

export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}
