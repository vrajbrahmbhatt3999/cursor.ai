import { Injectable, Logger } from '@nestjs/common';

/**
 * LedgerService - MVP Stub
 * 
 * This service is a placeholder for future Payment Aggregator functionality.
 * 
 * TODO: When upgrading to Payment Aggregator:
 * - Implement double-entry bookkeeping
 * - Track escrow balances per merchant
 * - Handle settlements and payouts
 * - Implement reconciliation logic
 * - Add ledger entries for all transactions
 * 
 * Current implementation: No-op (funds flow directly Gateway → Merchant)
 */
@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  /**
   * Record a payment transaction in the ledger
   * Currently a no-op as we don't hold funds
   */
  async recordPayment(paymentIntentId: string, amount: number): Promise<void> {
    this.logger.debug(
      `[LEDGER STUB] Would record payment ${paymentIntentId} for amount ${amount}`,
    );
    // TODO: Implement when upgrading to aggregator
  }

  /**
   * Record a refund transaction in the ledger
   * Currently a no-op as we don't hold funds
   */
  async recordRefund(paymentIntentId: string, refundAmount: number): Promise<void> {
    this.logger.debug(
      `[LEDGER STUB] Would record refund for ${paymentIntentId} of amount ${refundAmount}`,
    );
    // TODO: Implement when upgrading to aggregator
  }

  /**
   * Get merchant balance
   * Currently returns 0 as we don't hold funds
   */
  async getMerchantBalance(merchantId: string): Promise<number> {
    this.logger.debug(`[LEDGER STUB] Would return balance for merchant ${merchantId}`);
    return 0; // No escrow in orchestration mode
  }

  /**
   * Initiate settlement
   * Currently a no-op
   */
  async initiateSettlement(merchantId: string): Promise<void> {
    this.logger.debug(`[LEDGER STUB] Would initiate settlement for merchant ${merchantId}`);
    // TODO: Implement when upgrading to aggregator
  }
}
