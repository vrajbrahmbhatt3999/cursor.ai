import { Injectable, NotFoundException } from '@nestjs/common';
import { MerchantGatewayConfig } from '../../merchant/entities/merchant-gateway-config.entity';
import { RoutingService, RoutingCriteria, GatewaySelection } from '../services/routing.service';
import { GatewayProvider } from '../../../common/enums/merchant.enum';

@Injectable()
export class SuccessRateStrategy {
  async select(
    criteria: RoutingCriteria,
    availableGateways: MerchantGatewayConfig[],
  ): Promise<GatewaySelection> {
    if (!availableGateways || availableGateways.length === 0) {
      throw new NotFoundException('No active gateway configurations found');
    }

    // Filter active gateways
    const activeGateways = availableGateways.filter((gw) => gw.isActive);

    if (activeGateways.length === 0) {
      throw new NotFoundException('No active gateways available');
    }

    // Sort by success rate (descending)
    const sorted = activeGateways.sort((a, b) => b.successRate - a.successRate);

    // Select the gateway with highest success rate
    const selected = sorted[0];

    return {
      provider: selected.provider,
      config: selected,
      reason: `Highest success rate: ${selected.successRate}%`,
    };
  }
}
