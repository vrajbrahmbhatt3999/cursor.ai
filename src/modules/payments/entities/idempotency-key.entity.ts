import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('idempotency_keys')
@Index(['key'], { unique: true })
@Index(['merchantId', 'key'])
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 100 })
  requestMethod: string;

  @Column({ type: 'varchar', length: 500 })
  requestPath: string;

  @Column({ type: 'text', nullable: true })
  requestBody: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  paymentIntentId: string;

  @Column({ type: 'integer', default: 0 })
  responseStatusCode: number;

  @Column({ type: 'text', nullable: true })
  responseBody: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
