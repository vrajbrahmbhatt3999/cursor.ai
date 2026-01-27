import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentAttempt } from './entities/payment-attempt.entity';
import { PaymentStateTransition } from './entities/payment-state-transition.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { PaymentIntentService } from './services/payment-intent.service';
import { PaymentAttemptService } from './services/payment-attempt.service';
import { IdempotencyService } from './services/idempotency.service';
import { PaymentStateService } from './services/payment-state.service';
import { PaymentsController } from './controllers/payments.controller';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentIntent,
      PaymentAttempt,
      PaymentStateTransition,
      IdempotencyKey,
    ]),
    forwardRef(() => OrchestrationModule),
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentIntentService,
    PaymentAttemptService,
    IdempotencyService,
    PaymentStateService,
  ],
  exports: [
    PaymentIntentService,
    PaymentAttemptService,
    IdempotencyService,
    PaymentStateService,
  ],
})
export class PaymentsModule {}
