import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from './entities/webhook-event.entity';
import { WebhookService } from './services/webhook.service';
import { WebhookController } from './controllers/webhook.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationModule } from '../notification/notification.module';
import { MerchantModule } from '../merchant/merchant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent]),
    GatewayModule,
    PaymentsModule,
    NotificationModule,
    MerchantModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
