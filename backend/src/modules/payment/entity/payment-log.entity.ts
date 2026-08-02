import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { PaymentStatus } from '../../../common/constants/status.constant';
import { EnquiryEntity } from '../../enquiry/entity/enquiry.entity';
import { CustomerPaymentEntity, PaymentProvider } from './customer-payment.entity';

@Entity({ name: DATABASE_TABLES.PAYMENT_LOGS })
@Index('idx_payment_logs_enquiry', ['enq_id'])
@Index('idx_payment_logs_customer_payment', ['customer_payment_id'])
@Index('idx_payment_logs_provider_payment', ['provider', 'provider_payment_id'])
@Index('idx_payment_logs_event_id', ['provider_event_id'])
export class PaymentLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  enq_id: number | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  customer_payment_id: number | null;

  @Column({ type: 'varchar', length: 20 })
  provider: PaymentProvider;

  @Column({ type: 'varchar', length: 150, nullable: true })
  provider_payment_id: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  provider_event_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider_event: string | null;

  @Column({ type: 'tinyint' })
  payment_status: PaymentStatus;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  signature_verified: number;

  @Column({ type: 'json', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'longtext', nullable: true })
  raw_body: string | null;

  @ManyToOne(() => EnquiryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enq_id' })
  enquiry: EnquiryEntity | null;

  @ManyToOne(() => CustomerPaymentEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_payment_id' })
  customerPayment: CustomerPaymentEntity | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
