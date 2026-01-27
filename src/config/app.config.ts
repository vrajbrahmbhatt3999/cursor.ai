import { registerAs } from '@nestjs/config';

export const config = registerAs('app', () => ({
  name: process.env.APP_NAME || 'Ethics Pay',
  version: process.env.APP_VERSION || '1.0.0',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
}));
