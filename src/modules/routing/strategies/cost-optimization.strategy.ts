import { Injectable } from '@nestjs/common';
import { MerchantGatewayConfig } from '../../merchant/entities/merchant-gateway-config.entity';
import { RoutingCriteria, GatewaySelection } from '../services/routing.service';
import { GatewayProvider } from '../../../common/enums/merchant.enum';

@Injectable()
export class CostOptimizationStrategy {
  async select(
    criteria: RoutingCriteria,
    availableGateways: MerchantGatewayConfig[],
  ): Promise<GatewaySelection> {
    // TODO: Implement cost-based routing
    // This would consider gateway fees, interchange rates, etc.
    // For MVP, fallback to success rate strategy
    
    const activeGateways = availableGateways.filter((gw) => gw.isActive);
    const selected = activeGateways[0];

    return {
      provider: selected.provider,
      config: selected,
      reason: 'Cost optimization (not yet implemented)',
    };
  }
}
