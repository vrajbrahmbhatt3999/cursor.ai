import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentAttempt } from '../entities/payment-attempt.entity';
import { PaymentAttemptStatus } from '../../../common/enums/payment-status.enum';

@Injectable()
export class PaymentAttemptService {
  constructor(
    @InjectRepository(PaymentAttempt)
    private readonly paymentAttemptRepository: Repository<PaymentAttempt>,
  ) {}

  async create(data: {
    paymentIntentId: string;
    gateway: string;
    attemptNumber: number;
    requestPayload?: Record<string, any>;
  }): Promise<PaymentAttempt> {
    const attempt = this.paymentAttemptRepository.create({
      ...data,
      status: PaymentAttemptStatus.INITIATED,
      initiatedAt: new Date(),
    });

    return this.paymentAttemptRepository.save(attempt);
  }

  async updateStatus(
    id: string,
    status: PaymentAttemptStatus,
    data?: {
      gatewayTransactionId?: string;
      responsePayload?: Record<string, any>;
      errorCode?: string;
      errorMessage?: string;
    },
  ): Promise<PaymentAttempt> {
    const attempt = await this.paymentAttemptRepository.findOne({
      where: { id },
    });

    if (!attempt) {
      throw new Error(`PaymentAttempt with ID ${id} not found`);
    }

    attempt.status = status;
    attempt.completedAt = new Date();

    if (data) {
      Object.assign(attempt, data);
    }

    return this.paymentAttemptRepository.save(attempt);
  }

  async getLatestAttempt(paymentIntentId: string): Promise<PaymentAttempt | null> {
    return this.paymentAttemptRepository.findOne({
      where: { paymentIntentId },
      order: { attemptNumber: 'DESC' },
    });
  }
}
