import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { IdempotencyKey } from '../entities/idempotency-key.entity';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepository: Repository<IdempotencyKey>,
  ) {}

  async checkAndStore(
    merchantId: string,
    key: string,
    requestMethod: string,
    requestPath: string,
    requestBody: string,
    ttlSeconds: number = 86400,
  ): Promise<{ isDuplicate: boolean; paymentIntentId?: string; response?: any }> {
    const existing = await this.idempotencyRepository.findOne({
      where: { key },
    });

    if (existing && existing.expiresAt > new Date()) {
      if (existing.responseStatusCode === 200 || existing.responseStatusCode === 201) {
        return {
          isDuplicate: true,
          paymentIntentId: existing.paymentIntentId || undefined,
          response: existing.responseBody ? JSON.parse(existing.responseBody) : undefined,
        };
      }
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

    const idempotencyKey = this.idempotencyRepository.create({
      merchantId,
      key,
      requestMethod,
      requestPath,
      requestBody,
      expiresAt,
    });

    await this.idempotencyRepository.save(idempotencyKey);

    return { isDuplicate: false };
  }

  async updateResponse(
    key: string,
    paymentIntentId: string,
    statusCode: number,
    responseBody: any,
  ): Promise<void> {
    const idempotencyKey = await this.idempotencyRepository.findOne({
      where: { key },
    });

    if (idempotencyKey) {
      idempotencyKey.paymentIntentId = paymentIntentId;
      idempotencyKey.responseStatusCode = statusCode;
      idempotencyKey.responseBody = JSON.stringify(responseBody);
      await this.idempotencyRepository.save(idempotencyKey);
    }
  }

  async cleanupExpired(): Promise<void> {
    await this.idempotencyRepository.delete({
      expiresAt: MoreThan(new Date()),
    });
  }
}
