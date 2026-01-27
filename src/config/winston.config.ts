import { WinstonModuleOptions } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export const winstonConfig = (
  configService: ConfigService,
): WinstonModuleOptions => {
  const logLevel = configService.get<string>('LOG_LEVEL', 'info');
  const logFormat = configService.get<string>('LOG_FORMAT', 'json');

  const format =
    logFormat === 'json'
      ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        )
      : winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, context, ...meta }) => {
              return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
            },
          ),
        );

  return {
    level: logLevel,
    format,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          format,
        ),
      }),
    ],
  };
};
