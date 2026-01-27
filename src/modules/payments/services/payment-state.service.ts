import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStateTransition } from '../entities/payment-state-transition.entity';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

@Injectable()
export class PaymentStateService {
  constructor(
    @InjectRepository(PaymentStateTransition)
    private readonly stateTransitionRepository: Repository<PaymentStateTransition>,
  ) {}

  async createTransition(
    paymentIntentId: string,
    fromStatus: PaymentStatus,
    toStatus: PaymentStatus,
    triggeredBy: string,
    triggerSource: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentStateTransition> {
    const transition = this.stateTransitionRepository.create({
      paymentIntentId,
      fromStatus,
      toStatus,
      triggeredBy,
      triggerSource,
      metadata,
    });

    return this.stateTransitionRepository.save(transition);
  }

  async getTransitionHistory(paymentIntentId: string): Promise<PaymentStateTransition[]> {
    return this.stateTransitionRepository.find({
      where: { paymentIntentId },
      order: { createdAt: 'ASC' },
    });
  }
}
