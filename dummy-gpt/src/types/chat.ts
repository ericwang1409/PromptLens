export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  provider?: string;
  model?: string;
  usage?: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  provider: 'anthropic'; // Only Anthropic for now
  // provider: 'openai' | 'anthropic' | 'xai'; // Commented out other providers
  // apiKey: string; // Removed - now using environment variable
  userId?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ChatResponse {
  response: string;
  provider?: string;
  model?: string;
  usage?: Record<string, unknown>;
}
