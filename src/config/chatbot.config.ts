import { registerAs } from '@nestjs/config';
import { env } from './env';

export const chatbotConfig = registerAs('chatbot', () => ({
  chatContextLength: env.CHAT_CONTEXT_LENGTH,
  chatExpirationTimeoutSeconds: env.CHAT_EXP_TIMEOUT_SECONDS,
}));
