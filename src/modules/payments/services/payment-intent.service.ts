import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentIntent } from '../entities/payment-intent.entity';
import { PaymentStatus, PaymentMethod } from '../../../common/enums/payment-status.enum';

@Injectable()
export class PaymentIntentService {
  constructor(
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepository: Repository<PaymentIntent>,
  ) {}

  async create(data: {
    merchantId: string;
    idempotencyKey: string;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    customerId?: string;
    customerEmail?: string;
    customerPhone?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntent> {
    const paymentIntent = this.paymentIntentRepository.create({
      ...data,
      status: PaymentStatus.CREATED,
    });

    return this.paymentIntentRepository.save(paymentIntent);
  }

  async findById(id: string): Promise<PaymentIntent> {
    const paymentIntent = await this.paymentIntentRepository.findOne({
      where: { id },
      relations: ['attempts', 'stateTransitions'],
    });

    if (!paymentIntent) {
      throw new NotFoundException(`PaymentIntent with ID ${id} not found`);
    }

    return paymentIntent;
  }

  async updateStatus(
    id: string,
    newStatus: PaymentStatus,
    metadata?: Record<string, any>,
  ): Promise<PaymentIntent> {
    const paymentIntent = await this.findById(id);
    paymentIntent.status = newStatus;

    if (metadata) {
      Object.assign(paymentIntent, metadata);
    }

    return this.paymentIntentRepository.save(paymentIntent);
  }

  async findByMerchantId(
    merchantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaymentIntent[]> {
    const clampedPage = Math.max(page, 1);
    const clampedLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (clampedPage - 1) * clampedLimit;
    return this.paymentIntentRepository.find({
      where: { merchantId },
      relations: ['attempts', 'stateTransitions'],
      order: { createdAt: 'DESC' },
      take: clampedLimit,
      skip: skip,
    });
  }
}
