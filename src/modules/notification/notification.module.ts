import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentIntent } from '../payments/entities/payment-intent.entity';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentIntent])],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
