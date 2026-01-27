import { Module, forwardRef } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { RiskModule } from '../risk/risk.module';
import { RoutingModule } from '../routing/routing.module';
import { GatewayModule } from '../gateway/gateway.module';
import { RetryModule } from '../retry/retry.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentOrchestratorService } from './services/payment-orchestrator.service';
import { OrchestrationController } from './controllers/orchestration.controller';

@Module({
  imports: [
    forwardRef(() => PaymentsModule),
    RiskModule,
    RoutingModule,
    GatewayModule,
    RetryModule,
    NotificationModule,
  ],
  controllers: [OrchestrationController],
  providers: [PaymentOrchestratorService],
  exports: [PaymentOrchestratorService],
})
export class OrchestrationModule {}
