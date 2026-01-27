import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PaymentAttemptStatus } from '../../../common/enums/payment-status.enum';
import { PaymentIntent } from './payment-intent.entity';

@Entity('payment_attempts')
@Index(['paymentIntentId', 'createdAt'])
@Index(['gatewayTransactionId'])
export class PaymentAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentIntentId: string;

  @ManyToOne(() => PaymentIntent, (intent) => intent.attempts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentIntentId' })
  paymentIntent: PaymentIntent;

  @Column({ type: 'varchar', length: 100 })
  gateway: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayTransactionId: string;

  @Column({
    type: 'enum',
    enum: PaymentAttemptStatus,
    default: PaymentAttemptStatus.INITIATED,
  })
  status: PaymentAttemptStatus;

  @Column({ type: 'integer', default: 1 })
  attemptNumber: number;

  @Column({ type: 'jsonb', nullable: true })
  requestPayload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responsePayload: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorCode: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  initiatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
