import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentIntent } from '../../payments/entities/payment-intent.entity';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepository: Repository<PaymentIntent>,
  ) {}

  async notifyMerchant(
    paymentIntentId: string,
    event: {
      event: string;
      paymentIntentId: string;
      [key: string]: any;
    },
  ): Promise<void> {
    this.logger.log(
      `Notifying merchant for payment intent ${paymentIntentId} - event: ${event.event}`,
    );

    try {
      const paymentIntent = await this.paymentIntentRepository.findOne({
        where: { id: paymentIntentId },
        relations: ['merchant'],
      });

      if (!paymentIntent) {
        this.logger.warn(`Payment intent ${paymentIntentId} not found`);
        return;
      }

      // Get merchant webhook URL from metadata or config
      const webhookUrl = paymentIntent.metadata?.webhookUrl;

      if (!webhookUrl) {
        this.logger.debug(`No webhook URL configured for merchant ${paymentIntent.merchantId}`);
        return;
      }

      // Send webhook notification
      await this.sendWebhook(webhookUrl, {
        ...event,
        paymentIntentId: paymentIntent.id,
        orderId: paymentIntent.orderId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to notify merchant for payment intent ${paymentIntentId}`,
        error.stack,
      );
      // In production, would retry with exponential backoff
    }
  }

  private async sendWebhook(url: string, payload: any): Promise<void> {
    try {
      await axios.post(url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Ethics-Pay/1.0',
        },
      });

      this.logger.log(`Webhook sent successfully to ${url}`);
    } catch (error: any) {
      this.logger.error(`Failed to send webhook to ${url}: ${error.message}`);
      throw error;
    }
  }
}
