import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from './entities/merchant.entity';
import { MerchantGatewayConfig } from './entities/merchant-gateway-config.entity';
import { MerchantService } from './services/merchant.service';
import { MerchantController } from './controllers/merchant.controller';
import { MerchantGatewayConfigService } from './services/merchant-gateway-config.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, MerchantGatewayConfig]),
    AuthModule,
  ],
  controllers: [MerchantController],
  providers: [MerchantService, MerchantGatewayConfigService],
  exports: [MerchantService, MerchantGatewayConfigService],
})
export class MerchantModule {}
