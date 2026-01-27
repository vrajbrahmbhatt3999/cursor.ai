import { Injectable, Logger } from '@nestjs/common';
import { PaymentAttemptService } from '../../payments/services/payment-attempt.service';
import { PaymentIntentService } from '../../payments/services/payment-intent.service';
import { GatewayRegistryService } from '../../gateway/services/gateway-registry.service';
import { PaymentAttemptStatus } from '../../../common/enums/payment-status.enum';

@Injectable()
export class RetryManagerService {
  private readonly logger = new Logger(RetryManagerService.name);
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor(
    private readonly paymentAttemptService: PaymentAttemptService,
    private readonly paymentIntentService: PaymentIntentService,
    private readonly gatewayRegistryService: GatewayRegistryService,
  ) {}

  async scheduleRetry(paymentIntentId: string, failedAttemptId: string): Promise<void> {
    this.logger.log(`Scheduling retry for payment intent ${paymentIntentId}`);

    const paymentIntent = await this.paymentIntentService.findById(paymentIntentId);
    const latestAttempt = await this.paymentAttemptService.getLatestAttempt(paymentIntentId);

    if (!latestAttempt) {
      this.logger.warn(`No attempt found for payment intent ${paymentIntentId}`);
      return;
    }

    const nextAttemptNumber = latestAttempt.attemptNumber + 1;

    if (nextAttemptNumber > this.MAX_RETRY_ATTEMPTS) {
      this.logger.warn(
        `Max retry attempts reached for payment intent ${paymentIntentId}`,
      );
      return;
    }

    // In production, this would use a job queue (Bull, BullMQ, etc.)
    // For MVP, we'll retry immediately with exponential backoff simulation
    setTimeout(async () => {
      await this.retryPayment(paymentIntentId, latestAttempt.gateway, nextAttemptNumber);
    }, this.calculateBackoffDelay(nextAttemptNumber));
  }

  private async retryPayment(
    paymentIntentId: string,
    gateway: string,
    attemptNumber: number,
  ): Promise<void> {
    this.logger.log(
      `Retrying payment ${paymentIntentId} via ${gateway} (attempt ${attemptNumber})`,
    );

    try {
      const paymentIntent = await this.paymentIntentService.findById(paymentIntentId);
      const adapter = this.gatewayRegistryService.getAdapter(gateway);

      // Create new attempt
      const attempt = await this.paymentAttemptService.create({
        paymentIntentId,
        gateway,
        attemptNumber,
        requestPayload: {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          orderId: paymentIntent.orderId,
        },
      });

      // Retry payment (simplified - would need gateway config)
      // const response = await adapter.initiatePayment({...});

      this.logger.log(`Retry attempt ${attemptNumber} initiated for ${paymentIntentId}`);
    } catch (error: any) {
      this.logger.error(
        `Retry failed for payment intent ${paymentIntentId}`,
        error.stack,
      );
    }
  }

  private calculateBackoffDelay(attemptNumber: number): number {
    // Exponential backoff: 2^attempt seconds
    return Math.pow(2, attemptNumber) * 1000;
  }
}
