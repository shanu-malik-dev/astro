import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiLogEntity } from './api-log.entity';

@Entity({ name: 'api_query_logs' })
@Index('idx_api_query_logs_api_log_id', ['api_log_id'])
export class ApiQueryLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  api_log_id: number;

  @Column({ type: 'longtext' })
  query_text: string;

  @Column({ type: 'json', nullable: true })
  query_params: unknown[] | null;

  @Column({ type: 'json', nullable: true })
  query_response: unknown;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'int', default: 0 })
  response_time_ms: number;

  @ManyToOne(() => ApiLogEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'api_log_id' })
  api_log: ApiLogEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
