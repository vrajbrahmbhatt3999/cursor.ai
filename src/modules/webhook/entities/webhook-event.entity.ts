import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookEventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum WebhookEventType {
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  REFUND_SUCCESS = 'REFUND_SUCCESS',
  REFUND_FAILED = 'REFUND_FAILED',
}

@Entity('webhook_events')
@Index(['merchantId', 'createdAt'])
@Index(['paymentIntentId'])
@Index(['gatewayEventId'], { unique: true })
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  paymentIntentId!: string | null;

  @Column({ type: 'varchar', length: 100 })
  gateway!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  gatewayEventId!: string;

  @Column({
    type: 'enum',
    enum: WebhookEventType,
  })
  eventType!: WebhookEventType;

  @Column({
    type: 'enum',
    enum: WebhookEventStatus,
    default: WebhookEventStatus.PENDING,
  })
  status!: WebhookEventStatus;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  signature!: string | null;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'integer', default: 0 })
  processingAttempts!: number;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
