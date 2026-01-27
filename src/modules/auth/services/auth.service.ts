import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { MerchantContext } from '../../../common/decorators/merchant.decorator';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  async validateApiKey(apiKey: string): Promise<MerchantContext> {
    const apiKeyHash = this.hashApiKey(apiKey);
    const merchant = await this.merchantRepository.findOne({
      where: { apiKeyHash, isActive: true },
    });

    if (!merchant) {
      throw new UnauthorizedException('Invalid API key');
    }

    return {
      id: merchant.id,
      name: merchant.name,
      tier: merchant.tier,
      kycStatus: merchant.kycStatus,
    };
  }

  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }
}
