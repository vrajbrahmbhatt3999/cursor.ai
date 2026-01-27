import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantGatewayConfig } from '../entities/merchant-gateway-config.entity';
import { GatewayProvider } from '../../../common/enums/merchant.enum';

@Injectable()
export class MerchantGatewayConfigService {
  constructor(
    @InjectRepository(MerchantGatewayConfig)
    private readonly gatewayConfigRepository: Repository<MerchantGatewayConfig>,
  ) {}

  async findByMerchantAndProvider(
    merchantId: string,
    provider: GatewayProvider,
  ): Promise<MerchantGatewayConfig | null> {
    return this.gatewayConfigRepository.findOne({
      where: { merchantId, provider, isActive: true },
    });
  }

  async findByMerchant(merchantId: string): Promise<MerchantGatewayConfig[]> {
    return this.gatewayConfigRepository.find({
      where: { merchantId, isActive: true },
    });
  }

  async updateSuccessRate(
    configId: string,
    success: boolean,
  ): Promise<void> {
    const config = await this.gatewayConfigRepository.findOne({
      where: { id: configId },
    });

    if (!config) {
      return;
    }

    config.totalAttempts += 1;
    if (success) {
      config.successfulAttempts += 1;
    }

    config.successRate =
      (config.successfulAttempts / config.totalAttempts) * 100;

    await this.gatewayConfigRepository.save(config);
  }
}
