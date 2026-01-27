import { Injectable, Logger } from '@nestjs/common';
import { BasicRiskRule } from '../rules/basic-risk.rule';

export interface RiskEvaluationRequest {
  merchantId: string;
  amount: number;
  paymentMethod: string;
  customerId?: string;
  customerEmail?: string;
}

export interface RiskEvaluationResult {
  passed: boolean;
  score: number;
  reasons: string[];
}

@Injectable()
export class RiskEngineService {
  private readonly logger = new Logger(RiskEngineService.name);

  constructor(private readonly basicRiskRule: BasicRiskRule) {}

  async evaluateRisk(request: RiskEvaluationRequest): Promise<RiskEvaluationResult> {
    this.logger.log(`Evaluating risk for merchant ${request.merchantId}`, 'evaluateRisk');

    const results: RiskEvaluationResult[] = [];

    // Run all risk rules
    results.push(await this.basicRiskRule.evaluate(request));

    // Aggregate results
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const allReasons = results.flatMap((r) => r.reasons);
    const passed = results.every((r) => r.passed);

    const result: RiskEvaluationResult = {
      passed,
      score: totalScore / results.length,
      reasons: allReasons,
    };

    this.logger.log(
      `Risk evaluation result: ${passed ? 'PASSED' : 'FAILED'} (score: ${result.score})`,
      'evaluateRisk',
    );

    return result;
  }
}
