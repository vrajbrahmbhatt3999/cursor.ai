import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';
import { WinstonModule } from 'nest-winston';
import * as redisStore from 'cache-manager-redis-store';
import { config } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { winstonConfig } from './config/winston.config';

// Core Modules
import { AuthModule } from './modules/auth/auth.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrchestrationModule } from './modules/orchestration/orchestration.module';
import { RoutingModule } from './modules/routing/routing.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { RiskModule } from './modules/risk/risk.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { RetryModule } from './modules/retry/retry.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD'),
        ttl: configService.get<number>('REDIS_TTL', 3600),
      }),
      inject: [ConfigService],
    }),

    // Logging
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: winstonConfig,
      inject: [ConfigService],
    }),

    // Health Checks
    TerminusModule,
    HealthModule,

    // Domain Modules
    AuthModule,
    MerchantModule,
    PaymentsModule,
    OrchestrationModule,
    RoutingModule,
    GatewayModule,
    RiskModule,
    WebhookModule,
    RetryModule,
    LedgerModule,
    NotificationModule,
    AdminModule,
  ],
})
export class AppModule {}
