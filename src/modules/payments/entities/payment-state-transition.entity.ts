import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { PaymentIntent } from './payment-intent.entity';

@Entity('payment_state_transitions')
@Index(['paymentIntentId', 'createdAt'])
export class PaymentStateTransition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentIntentId: string;

  @ManyToOne(() => PaymentIntent, (intent) => intent.stateTransitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentIntentId' })
  paymentIntent: PaymentIntent;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  fromStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  toStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  triggeredBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  triggerSource: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
