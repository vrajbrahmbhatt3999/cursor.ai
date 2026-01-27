import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent, WebhookEventStatus, WebhookEventType } from '../entities/webhook-event.entity';
import { GatewayRegistryService } from '../../gateway/services/gateway-registry.service';
import { PaymentIntentService } from '../../payments/services/payment-intent.service';
import { PaymentAttemptService } from '../../payments/services/payment-attempt.service';
import { PaymentStateService } from '../../payments/services/payment-state.service';
import { NotificationService } from '../../notification/services/notification.service';
import { MerchantGatewayConfigService } from '../../merchant/services/merchant-gateway-config.service';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { GatewayProvider } from '../../../common/enums/merchant.enum';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepository: Repository<WebhookEvent>,
    private readonly gatewayRegistryService: GatewayRegistryService,
    private readonly paymentIntentService: PaymentIntentService,
    private readonly paymentAttemptService: PaymentAttemptService,
    private readonly paymentStateService: PaymentStateService,
    private readonly notificationService: NotificationService,
    private readonly gatewayConfigService: MerchantGatewayConfigService,
  ) {}

  async processWebhook(
    merchantId: string,
    gateway: GatewayProvider | string,
    payload: any,
    signature?: string,
  ): Promise<WebhookEvent> {
    this.logger.log(`Processing webhook from ${gateway} for merchant ${merchantId}`);

    // Get gateway adapter
    const adapter = this.gatewayRegistryService.getAdapter(gateway);

    // Verify signature if provided
    if (signature) {
      const gatewayConfig = await this.getGatewayConfig(merchantId, gateway);
      const isValid = adapter.verifyWebhookSignature(
        JSON.stringify(payload),
        signature,
        gatewayConfig.credentials.webhookSecret || '',
      );

      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    // Normalize webhook payload
    const normalized = adapter.normalizeWebhook({
      eventId: payload.id || payload.event?.id || '',
      eventType: payload.event || payload.type || 'unknown',
      transactionId: payload.transaction_id || payload.data?.object?.id || '',
      status: 'unknown',
      payload,
      signature,
    });

    // Check for duplicate webhook
    const existingEvent = await this.webhookEventRepository.findOne({
      where: { gatewayEventId: normalized.transactionId },
    });

    if (existingEvent) {
      this.logger.warn(`Duplicate webhook event: ${normalized.transactionId}`);
      return existingEvent;
    }

    // Create webhook event
    const webhookEvent = this.webhookEventRepository.create({
      merchantId,
      gateway: gateway.toString(),
      gatewayEventId: normalized.transactionId,
      eventType: this.mapEventType(normalized.eventType),
      status: WebhookEventStatus.PENDING,
      payload,
      signature,
      isVerified: !!signature,
    });

    await this.webhookEventRepository.save(webhookEvent);

    // Process webhook asynchronously
    this.processWebhookAsync(webhookEvent.id, normalized).catch((error) => {
      this.logger.error(`Failed to process webhook ${webhookEvent.id}`, error.stack);
    });

    return webhookEvent;
  }

  private async processWebhookAsync(
    webhookEventId: string,
    normalized: any,
  ): Promise<void> {
    const webhookEvent = await this.webhookEventRepository.findOne({
      where: { id: webhookEventId },
    });

    if (!webhookEvent) {
      return;
    }

    webhookEvent.status = WebhookEventStatus.PROCESSING;
    webhookEvent.processingAttempts += 1;
    await this.webhookEventRepository.save(webhookEvent);

    try {
      // Find payment intent by gateway transaction ID
      const paymentAttempt = await this.findPaymentAttemptByGatewayTransactionId(
        normalized.transactionId,
      );

      if (!paymentAttempt) {
        this.logger.warn(`Payment attempt not found for transaction ${normalized.transactionId}`);
        webhookEvent.status = WebhookEventStatus.FAILED;
        webhookEvent.errorMessage = 'Payment attempt not found';
        await this.webhookEventRepository.save(webhookEvent);
        return;
      }

      const paymentIntent = await this.paymentIntentService.findById(
        paymentAttempt.paymentIntentId,
      );

      // Update payment intent status
      const newStatus = this.mapWebhookStatusToPaymentStatus(normalized.status);
      const oldStatus = paymentIntent.status;

      if (newStatus !== oldStatus) {
        await this.paymentIntentService.updateStatus(paymentIntent.id, newStatus);
        await this.paymentStateService.createTransition(
          paymentIntent.id,
          oldStatus,
          newStatus,
          'webhook',
          'gateway_webhook',
          { webhookEventId: webhookEvent.id },
        );

        // Notify merchant
        await this.notificationService.notifyMerchant(paymentIntent.id, {
          event: `payment.${newStatus.toLowerCase()}`,
          paymentIntentId: paymentIntent.id,
          status: newStatus,
        });
      }

      webhookEvent.paymentIntentId = paymentIntent.id;
      webhookEvent.status = WebhookEventStatus.PROCESSED;
      webhookEvent.processedAt = new Date();
      await this.webhookEventRepository.save(webhookEvent);
    } catch (error: any) {
      this.logger.error(`Error processing webhook ${webhookEventId}`, error.stack);
      webhookEvent.status = WebhookEventStatus.FAILED;
      webhookEvent.errorMessage = error.message;
      await this.webhookEventRepository.save(webhookEvent);
    }
  }

  private mapEventType(eventType: string): WebhookEventType {
    const eventTypeMap: Record<string, WebhookEventType> = {
      'payment.captured': WebhookEventType.PAYMENT_SUCCESS,
      'payment.succeeded': WebhookEventType.PAYMENT_SUCCESS,
      'payment.failed': WebhookEventType.PAYMENT_FAILED,
      'payment.pending': WebhookEventType.PAYMENT_PENDING,
      'refund.succeeded': WebhookEventType.REFUND_SUCCESS,
      'refund.failed': WebhookEventType.REFUND_FAILED,
    };

    return eventTypeMap[eventType.toLowerCase()] || WebhookEventType.PAYMENT_PENDING;
  }

  private mapWebhookStatusToPaymentStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.SUCCEEDED,
      success: PaymentStatus.SUCCEEDED,
      failed: PaymentStatus.FAILED,
      failure: PaymentStatus.FAILED,
      pending: PaymentStatus.PENDING,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
    };

    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  private async findPaymentAttemptByGatewayTransactionId(
    transactionId: string,
  ): Promise<any> {
    // Query PaymentAttempt by gatewayTransactionId
    // Note: This requires PaymentAttemptService to expose this method
    // For now, return null - this should be implemented in PaymentAttemptService
    return null;
  }

  private async getGatewayConfig(merchantId: string, gateway: string): Promise<any> {
    const config = await this.gatewayConfigService.findByMerchantAndProvider(
      merchantId,
      gateway as any,
    );
    return config || { credentials: {} };
  }
}
