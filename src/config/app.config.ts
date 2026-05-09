import { registerAs } from '@nestjs/config';
import { env } from './env';

export const appConfig = registerAs('app', () => ({
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  corsOrigin: env.CORS_ORIGIN,
  swaggerEnabled: env.SWAGGER_ENABLED,
  resendApiKey: env.RESEND_API_KEY,
  clientUrl: env.CLIENT_URL,
  allowedRedirectOrigins: env.ALLOWED_REDIRECT_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
}));
