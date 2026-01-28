import type { Hono } from 'hono';
import type { LLMAdapterEnv } from './types/env';
import { registerChatRoutes } from './routes/chatRoute';

export function registerLLMRoutes<T extends LLMAdapterEnv>(app: Hono<T>) {
  registerChatRoutes(app);
}
