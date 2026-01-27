import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from '../merchant/entities/merchant.entity';
import { MerchantGatewayConfig } from '../merchant/entities/merchant-gateway-config.entity';
import { PaymentIntent } from '../payments/entities/payment-intent.entity';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, MerchantGatewayConfig, PaymentIntent]),
    GatewayModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
