import { Module } from '@nestjs/common';
import { MerchantModule } from '../merchant/merchant.module';
import { RoutingService } from './services/routing.service';
import { SuccessRateStrategy } from './strategies/success-rate.strategy';
import { CostOptimizationStrategy } from './strategies/cost-optimization.strategy';

@Module({
  imports: [MerchantModule],
  providers: [RoutingService, SuccessRateStrategy, CostOptimizationStrategy],
  exports: [RoutingService],
})
export class RoutingModule {}
