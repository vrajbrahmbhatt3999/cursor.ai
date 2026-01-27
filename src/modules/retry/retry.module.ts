import { Module, forwardRef } from '@nestjs/common';
import { RetryManagerService } from './services/retry-manager.service';
import { PaymentsModule } from '../payments/payments.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [forwardRef(() => PaymentsModule), GatewayModule],
  providers: [RetryManagerService],
  exports: [RetryManagerService],
})
export class RetryModule {}
