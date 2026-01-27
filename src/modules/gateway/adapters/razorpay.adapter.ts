import { Injectable, Logger } from '@nestjs/common';
import { GatewayAdapter, GatewayPaymentRequest, GatewayPaymentResponse, GatewayWebhookPayload } from '../interfaces/gateway-adapter.interface';
import axios from 'axios';
import { createHmac } from 'crypto';

@Injectable()
export class RazorpayAdapter implements GatewayAdapter {
  private readonly logger = new Logger(RazorpayAdapter.name);

  async initiatePayment(request: GatewayPaymentRequest): Promise<GatewayPaymentResponse> {
    this.logger.log(`Initiating Razorpay payment for order ${request.orderId}`);

    try {
      const razorpay = require('razorpay');
      const instance = new razorpay({
        key_id: request.credentials.keyId,
        key_secret: request.credentials.keySecret,
      });

      const order = await instance.orders.create({
        amount: Math.round(request.amount * 100), // Convert to paise
        currency: request.currency,
        receipt: request.orderId,
        notes: request.metadata || {},
      });

      return {
        transactionId: order.id,
        status: 'PENDING',
        gatewayResponse: order,
      };
    } catch (error: any) {
      this.logger.error(`Razorpay payment initiation failed: ${error.message}`);
      return {
        transactionId: '',
        status: 'FAILED',
        gatewayResponse: {},
        errorCode: 'RAZORPAY_ERROR',
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
      const hmac = createHmac('sha256', secret);
      hmac.update(payload);
      const generatedSignature = hmac.digest('hex');
      return generatedSignature === signature;
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
    const razorpayPayload = payload.payload;
    
    return {
      transactionId: razorpayPayload.payload?.payment?.entity?.id || payload.transactionId,
      status: this.mapRazorpayStatus(razorpayPayload.payload?.payment?.entity?.status),
      eventType: payload.eventType,
      metadata: razorpayPayload.payload || {},
    };
  }

  private mapRazorpayStatus(status: string): string {
    const statusMap: Record<string, string> = {
      created: 'PENDING',
      authorized: 'SUCCEEDED',
      captured: 'SUCCEEDED',
      refunded: 'REFUNDED',
      failed: 'FAILED',
    };

    return statusMap[status?.toLowerCase()] || 'PENDING';
  }
}
