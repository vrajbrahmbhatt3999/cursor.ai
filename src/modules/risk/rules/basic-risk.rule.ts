import { Injectable } from '@nestjs/common';
import {
  RiskEngineService,
  RiskEvaluationRequest,
  RiskEvaluationResult,
} from '../services/risk-engine.service';

@Injectable()
export class BasicRiskRule {
  private readonly MAX_AMOUNT = 1000000; // 10 Lakh INR
  private readonly MIN_SCORE = 30;

  async evaluate(request: RiskEvaluationRequest): Promise<RiskEvaluationResult> {
    const reasons: string[] = [];
    let score = 100;

    // Amount check
    if (request.amount > this.MAX_AMOUNT) {
      score -= 50;
      reasons.push(`Amount exceeds maximum limit: ${this.MAX_AMOUNT}`);
    }

    // Payment method check
    if (!request.paymentMethod) {
      score -= 20;
      reasons.push('Payment method is required');
    }

    // Customer information check
    if (!request.customerId && !request.customerEmail) {
      score -= 10;
      reasons.push('Customer identification missing');
    }

    const passed = score >= this.MIN_SCORE;

    return {
      passed,
      score,
      reasons,
    };
  }
}
