import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PaymentIntentService } from '../../payments/services/payment-intent.service';
import { PaymentAttemptService } from '../../payments/services/payment-attempt.service';
import { IdempotencyService } from '../../payments/services/idempotency.service';
import { PaymentStateService } from '../../payments/services/payment-state.service';
import { RiskEngineService } from '../../risk/services/risk-engine.service';
import { RoutingService } from '../../routing/services/routing.service';
import { GatewayRegistryService } from '../../gateway/services/gateway-registry.service';
import { RetryManagerService } from '../../retry/services/retry-manager.service';
import { NotificationService } from '../../notification/services/notification.service';
import { PaymentStatus, PaymentAttemptStatus } from '../../../common/enums/payment-status.enum';
import { CreatePaymentIntentDto } from '../../payments/dto/create-payment-intent.dto';

@Injectable()
export class PaymentOrchestratorService {
  private readonly logger = new Logger(PaymentOrchestratorService.name);

  constructor(
    private readonly paymentIntentService: PaymentIntentService,
    private readonly paymentAttemptService: PaymentAttemptService,
    private readonly idempotencyService: IdempotencyService,
    private readonly paymentStateService: PaymentStateService,
    private readonly riskEngineService: RiskEngineService,
    private readonly routingService: RoutingService,
    private readonly gatewayRegistryService: GatewayRegistryService,
    private readonly retryManagerService: RetryManagerService,
    private readonly notificationService: NotificationService,
  ) {}

  async initiatePayment(
    merchantId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<any> {
    this.logger.log(`Initiating payment for merchant ${merchantId}`, 'initiatePayment');

    // Step 1: Check idempotency
    const idempotencyCheck = await this.idempotencyService.checkAndStore(
      merchantId,
      dto.idempotencyKey,
      'POST',
      '/api/v1/payments/initiate',
      JSON.stringify(dto),
    );

    if (idempotencyCheck.isDuplicate) {
      this.logger.warn(`Duplicate idempotency key: ${dto.idempotencyKey}`);
      throw new ConflictException('Duplicate idempotency key');
    }

    // Step 2: Create PaymentIntent
    const paymentIntent = await this.paymentIntentService.create({
      merchantId,
      idempotencyKey: dto.idempotencyKey,
      orderId: dto.orderId,
      amount: dto.amount,
      currency: dto.currency || 'INR',
      paymentMethod: dto.paymentMethod,
      customerId: dto.customerId,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      description: dto.description,
      metadata: dto.metadata,
    });

    await this.paymentStateService.createTransition(
      paymentIntent.id,
      PaymentStatus.CREATED,
      PaymentStatus.CREATED,
      'system',
      'payment_initiation',
    );

    // Step 3: Run risk checks
    const riskResult = await this.riskEngineService.evaluateRisk({
      merchantId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      customerId: dto.customerId,
      customerEmail: dto.customerEmail,
    });

    paymentIntent.riskCheckResult = riskResult;
    await this.paymentIntentService.updateStatus(paymentIntent.id, PaymentStatus.CREATED, {
      riskCheckResult: riskResult,
    });

    if (!riskResult.passed) {
      await this.paymentIntentService.updateStatus(
        paymentIntent.id,
        PaymentStatus.FAILED,
      );
      await this.paymentStateService.createTransition(
        paymentIntent.id,
        PaymentStatus.CREATED,
        PaymentStatus.FAILED,
        'system',
        'risk_check',
        { reason: 'Risk check failed', riskResult },
      );

      await this.idempotencyService.updateResponse(
        dto.idempotencyKey,
        paymentIntent.id,
        400,
        { error: 'Risk check failed', riskResult },
      );

      return {
        id: paymentIntent.id,
        status: PaymentStatus.FAILED,
        reason: 'Risk check failed',
        riskResult,
      };
    }

    // Step 4: Select gateway
    const selectedGateway = await this.routingService.selectGateway({
      merchantId,
      amount: dto.amount,
      currency: dto.currency || 'INR',
      paymentMethod: dto.paymentMethod,
    });

    paymentIntent.selectedGateway = selectedGateway.provider;
    await this.paymentIntentService.updateStatus(paymentIntent.id, PaymentStatus.PENDING, {
      selectedGateway: selectedGateway.provider,
    });

    await this.paymentStateService.createTransition(
      paymentIntent.id,
      PaymentStatus.CREATED,
      PaymentStatus.PENDING,
      'system',
      'gateway_selection',
      { gateway: selectedGateway.provider },
    );

    // Step 5: Initiate payment via gateway (async)
    this.initiateGatewayPayment(paymentIntent.id, selectedGateway, dto).catch((error) => {
      this.logger.error(
        `Failed to initiate gateway payment for ${paymentIntent.id}`,
        error.stack,
      );
    });

    await this.idempotencyService.updateResponse(
      dto.idempotencyKey,
      paymentIntent.id,
      201,
      {
        id: paymentIntent.id,
        status: PaymentStatus.PENDING,
        gateway: selectedGateway.provider,
      },
    );

    return {
      id: paymentIntent.id,
      status: PaymentStatus.PENDING,
      gateway: selectedGateway.provider,
    };
  }

  private async initiateGatewayPayment(
    paymentIntentId: string,
    gatewayConfig: any,
    dto: CreatePaymentIntentDto,
  ): Promise<void> {
    const paymentIntent = await this.paymentIntentService.findById(paymentIntentId);

    // Create payment attempt
    const attempt = await this.paymentAttemptService.create({
      paymentIntentId: paymentIntent.id,
      gateway: gatewayConfig.provider,
      attemptNumber: 1,
      requestPayload: {
        amount: dto.amount,
        currency: dto.currency || 'INR',
        orderId: dto.orderId,
      },
    });

    try {
      const adapter = this.gatewayRegistryService.getAdapter(gatewayConfig.provider);
      const gatewayResponse = await adapter.initiatePayment({
        amount: dto.amount,
        currency: dto.currency || 'INR',
        orderId: dto.orderId,
        customerId: dto.customerId,
        customerEmail: dto.customerEmail,
        metadata: dto.metadata,
        credentials: gatewayConfig.credentials,
      });

      const attemptStatus = this.mapGatewayStatusToAttemptStatus(gatewayResponse.status);
      await this.paymentAttemptService.updateStatus(attempt.id, attemptStatus, {
        gatewayTransactionId: gatewayResponse.transactionId,
        responsePayload: gatewayResponse,
      });

      if (gatewayResponse.status === 'SUCCEEDED') {
        await this.paymentIntentService.updateStatus(
          paymentIntentId,
          PaymentStatus.SUCCEEDED,
        );
        await this.paymentStateService.createTransition(
          paymentIntentId,
          PaymentStatus.PENDING,
          PaymentStatus.SUCCEEDED,
          'gateway',
          'payment_success',
        );

        // Notify merchant
        await this.notificationService.notifyMerchant(paymentIntentId, {
          event: 'payment.succeeded',
          paymentIntentId,
          amount: dto.amount,
        });
      } else if (gatewayResponse.status === 'FAILED') {
        await this.paymentIntentService.updateStatus(
          paymentIntentId,
          PaymentStatus.FAILED,
        );
        await this.paymentStateService.createTransition(
          paymentIntentId,
          PaymentStatus.PENDING,
          PaymentStatus.FAILED,
          'gateway',
          'payment_failed',
        );

        // Notify merchant
        await this.notificationService.notifyMerchant(paymentIntentId, {
          event: 'payment.failed',
          paymentIntentId,
          reason: gatewayResponse.errorMessage,
        });
      }
    } catch (error: any) {
      this.logger.error(`Gateway payment failed for ${paymentIntentId}`, error?.stack || String(error));
      await this.paymentAttemptService.updateStatus(attempt.id, PaymentAttemptStatus.FAILED, {
        errorCode: 'GATEWAY_ERROR',
        errorMessage: error?.message || String(error),
      });

      // Retry logic
      await this.retryManagerService.scheduleRetry(paymentIntentId, attempt.id);
    }
  }

  private mapGatewayStatusToAttemptStatus(status: string): PaymentAttemptStatus {
    const statusMap: Record<string, PaymentAttemptStatus> = {
      'SUCCEEDED': PaymentAttemptStatus.SUCCEEDED,
      'FAILED': PaymentAttemptStatus.FAILED,
      'PENDING': PaymentAttemptStatus.PENDING,
    };
    return statusMap[status] || PaymentAttemptStatus.PENDING;
  }
}
