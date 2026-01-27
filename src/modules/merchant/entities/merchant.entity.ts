import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { MerchantTier, KYCStatus } from '../../../common/enums/merchant.enum';
import { MerchantGatewayConfig } from './merchant-gateway-config.entity';

@Entity('merchants')
@Index(['apiKeyHash'], { unique: true })
@Index(['email'], { unique: true })
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  apiKey: string;

  @Column({ type: 'varchar', length: 255 })
  apiKeyHash: string;

  @Column({
    type: 'enum',
    enum: MerchantTier,
    default: MerchantTier.BASIC,
  })
  tier: MerchantTier;

  @Column({
    type: 'enum',
    enum: KYCStatus,
    default: KYCStatus.PENDING,
  })
  kycStatus: KYCStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(
    () => MerchantGatewayConfig,
    (gatewayConfig) => gatewayConfig.merchant,
    { cascade: true },
  )
  gatewayConfigs: MerchantGatewayConfig[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
