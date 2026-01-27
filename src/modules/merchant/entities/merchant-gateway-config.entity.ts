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
import { Merchant } from './merchant.entity';
import { GatewayProvider } from '../../../common/enums/merchant.enum';

@Entity('merchant_gateway_configs')
@Index(['merchantId', 'provider'], { unique: true })
export class MerchantGatewayConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.gatewayConfigs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column({
    type: 'enum',
    enum: GatewayProvider,
  })
  provider: GatewayProvider;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isMerchantOwned: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayAccountId: string;

  @Column({ type: 'jsonb' })
  credentials: {
    keyId?: string;
    keySecret?: string;
    apiKey?: string;
    webhookSecret?: string;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  config: {
    supportedMethods?: string[];
    supportedCurrencies?: string[];
    [key: string]: any;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @Column({ type: 'integer', default: 0 })
  totalAttempts: number;

  @Column({ type: 'integer', default: 0 })
  successfulAttempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
