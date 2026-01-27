export interface GatewayPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerId?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
  credentials: Record<string, any>;
}

export interface GatewayPaymentResponse {
  transactionId: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
  gatewayResponse: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
}

export interface GatewayWebhookPayload {
  eventId: string;
  eventType: string;
  transactionId: string;
  status: string;
  payload: Record<string, any>;
  signature?: string;
}

export interface GatewayAdapter {
  /**
   * Initialize a payment with the gateway
   */
  initiatePayment(request: GatewayPaymentRequest): Promise<GatewayPaymentResponse>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean;

  /**
   * Normalize webhook payload to standard format
   */
  normalizeWebhook(payload: GatewayWebhookPayload): {
    transactionId: string;
    status: string;
    eventType: string;
    metadata: Record<string, any>;
  };
}
