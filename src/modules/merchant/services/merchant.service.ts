import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../entities/merchant.entity';

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  async findById(id: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id, isActive: true },
      relations: ['gatewayConfigs'],
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }

    return merchant;
  }

  async findActiveGatewayConfigs(merchantId: string) {
    const merchant = await this.findById(merchantId);
    return merchant.gatewayConfigs.filter((config) => config.isActive);
  }
}
