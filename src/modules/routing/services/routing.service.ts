import { Injectable, Logger } from '@nestjs/common';
import { MerchantGatewayConfigService } from '../../merchant/services/merchant-gateway-config.service';
import { SuccessRateStrategy } from '../strategies/success-rate.strategy';
import { CostOptimizationStrategy } from '../strategies/cost-optimization.strategy';
import { GatewayProvider } from '../../../common/enums/merchant.enum';

export interface RoutingCriteria {
  merchantId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface GatewaySelection {
  provider: GatewayProvider;
  config: any;
  reason: string;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    private readonly gatewayConfigService: MerchantGatewayConfigService,
    private readonly successRateStrategy: SuccessRateStrategy,
    private readonly costOptimizationStrategy: CostOptimizationStrategy,
  ) {}

  async selectGateway(criteria: RoutingCriteria): Promise<GatewaySelection> {
    this.logger.log(`Selecting gateway for merchant ${criteria.merchantId}`, 'selectGateway');

    const availableGateways = await this.gatewayConfigService.findByMerchant(
      criteria.merchantId,
    );

    // For now, use success rate strategy
    // In production, this could be configurable per merchant
    const selected = await this.successRateStrategy.select(
      criteria,
      availableGateways,
    );

    this.logger.log(
      `Selected gateway: ${selected.provider} for merchant ${criteria.merchantId}`,
      'selectGateway',
    );

    return selected;
  }
}
