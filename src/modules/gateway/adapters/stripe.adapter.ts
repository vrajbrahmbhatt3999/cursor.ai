import { Injectable, Logger } from '@nestjs/common';
import { GatewayAdapter, GatewayPaymentRequest, GatewayPaymentResponse, GatewayWebhookPayload } from '../interfaces/gateway-adapter.interface';
import axios from 'axios';

@Injectable()
export class StripeAdapter implements GatewayAdapter {
  private readonly logger = new Logger(StripeAdapter.name);

  async initiatePayment(request: GatewayPaymentRequest): Promise<GatewayPaymentResponse> {
    this.logger.log(`Initiating Stripe payment for order ${request.orderId}`);

    try {
      const stripe = require('stripe')(request.credentials.apiKey);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency.toLowerCase(),
        metadata: {
          orderId: request.orderId,
          ...(request.metadata || {}),
        },
      });

      return {
        transactionId: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status) as 'SUCCEEDED' | 'FAILED' | 'PENDING',
        gatewayResponse: paymentIntent,
      };
    } catch (error: any) {
      this.logger.error(`Stripe payment initiation failed: ${error.message}`);
      return {
        transactionId: '',
        status: 'FAILED',
        gatewayResponse: {},
        errorCode: 'STRIPE_ERROR',
        errorMessage: error.message,
      };
    }
  }

  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const stripe = require('stripe')(secret);
      stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  normalizeWebhook(payload: GatewayWebhookPayload): {
    transactionId: string;
    status: string;
    eventType: string;
    metadata: Record<string, any>;
  } {
    const stripePayload = payload.payload;
    const paymentIntent = stripePayload.data?.object;

    return {
      transactionId: paymentIntent?.id || payload.transactionId,
      status: this.mapStripeStatus(paymentIntent?.status),
      eventType: payload.eventType,
      metadata: stripePayload || {},
    };
  }

  private mapStripeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      requires_payment_method: 'PENDING',
      requires_confirmation: 'PENDING',
      requires_action: 'PENDING',
      processing: 'PENDING',
      requires_capture: 'PENDING',
      canceled: 'FAILED',
      succeeded: 'SUCCEEDED',
    };

    return statusMap[status?.toLowerCase()] || 'PENDING';
  }
}
