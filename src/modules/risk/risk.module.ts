import { Module } from '@nestjs/common';
import { RiskEngineService } from './services/risk-engine.service';
import { BasicRiskRule } from './rules/basic-risk.rule';

@Module({
  providers: [RiskEngineService, BasicRiskRule],
  exports: [RiskEngineService],
})
export class RiskModule {}
