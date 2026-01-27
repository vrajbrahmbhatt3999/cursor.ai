import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { MerchantGatewayConfig } from '../../merchant/entities/merchant-gateway-config.entity';
import { PaymentIntent } from '../../payments/entities/payment-intent.entity';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { GatewayRegistryService } from '../../gateway/services/gateway-registry.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(MerchantGatewayConfig)
    private readonly gatewayConfigRepository: Repository<MerchantGatewayConfig>,
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepository: Repository<PaymentIntent>,
    private readonly gatewayRegistryService: GatewayRegistryService,
  ) {}

  async getGatewayHealth(): Promise<any> {
    const adapters = this.gatewayRegistryService.listAdapters();
    
    return {
      availableGateways: adapters,
      status: 'operational',
      timestamp: new Date().toISOString(),
    };
  }

  async getMerchantStats(merchantId: string): Promise<any> {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
      relations: ['gatewayConfigs'],
    });

    if (!merchant) {
      throw new Error(`Merchant ${merchantId} not found`);
    }

    const paymentStats = await this.paymentIntentRepository
      .createQueryBuilder('pi')
      .select('pi.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('pi.merchantId = :merchantId', { merchantId })
      .groupBy('pi.status')
      .getRawMany();

    return {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        tier: merchant.tier,
        kycStatus: merchant.kycStatus,
      },
      gatewayConfigs: merchant.gatewayConfigs,
      paymentStats,
    };
  }

  async getSystemStats(): Promise<any> {
    const totalMerchants = await this.merchantRepository.count();
    const activeMerchants = await this.merchantRepository.count({
      where: { isActive: true },
    });

    const totalPayments = await this.paymentIntentRepository.count();
    const successfulPayments = await this.paymentIntentRepository.count({
      where: { status: PaymentStatus.SUCCEEDED },
    });

    return {
      merchants: {
        total: totalMerchants,
        active: activeMerchants,
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
