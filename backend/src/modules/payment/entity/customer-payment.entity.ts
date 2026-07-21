import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { EnquiryEntity } from '../../enquiry/entity/enquiry.entity';

export type PaymentProvider = 'razorpay' | 'stripe';
export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired';

@Entity({ name: DATABASE_TABLES.CUSTOMER_PAYMENTS })
@Index('idx_customer_payment_enquiry', ['enq_id'])
@Index('idx_customer_payment_provider_id', ['provider', 'provider_payment_id'])
@Index('idx_customer_payment_status', ['payment_status'])
export class CustomerPaymentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  enq_id: number | null;

  @Column({ type: 'varchar', length: 100 })
  customer_name: string;

  @Column({ type: 'varchar', length: 10 })
  country_code: string;

  @Column({ type: 'varchar', length: 20 })
  customer_mobile: string;

  @Column({ type: 'blob' })
  amount: Buffer;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 20 })
  provider: PaymentProvider;

  @Column({ type: 'varchar', length: 150, nullable: true })
  provider_payment_id: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  payment_link: string | null;

  @Column({ type: 'varchar', length: 700, nullable: true })
  qr_code_url: string | null;

  @Column({ type: 'varchar', length: 20, default: 'created' })
  payment_status: PaymentStatus;

  @Column({ type: 'json', nullable: true })
  provider_response: Record<string, unknown> | null;

  @ManyToOne(() => EnquiryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enq_id' })
  enquiry: EnquiryEntity | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
