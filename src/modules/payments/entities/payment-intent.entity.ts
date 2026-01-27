import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PaymentStatus, PaymentMethod } from '../../../common/enums/payment-status.enum';
import { PaymentAttempt } from './payment-attempt.entity';
import { PaymentStateTransition } from './payment-state-transition.entity';

@Entity('payment_intents')
@Index(['merchantId', 'createdAt'])
@Index(['status'])
@Index(['idempotencyKey'], { unique: true })
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 100 })
  orderId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.CREATED,
  })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerPhone: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  selectedGateway: string;

  @Column({ type: 'jsonb', nullable: true })
  riskCheckResult: {
    passed: boolean;
    score?: number;
    reasons?: string[];
  };

  @OneToMany(
    () => PaymentAttempt,
    (attempt) => attempt.paymentIntent,
    { cascade: true },
  )
  attempts: PaymentAttempt[];

  @OneToMany(
    () => PaymentStateTransition,
    (transition) => transition.paymentIntent,
    { cascade: true },
  )
  stateTransitions: PaymentStateTransition[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
