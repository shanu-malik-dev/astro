import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'api_logs' })
@Index('idx_api_logs_request_id', ['request_id'])
@Index('idx_api_logs_path_created', ['path', 'created_at'])
export class ApiLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 64 })
  request_id: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar', length: 500 })
  path: string;

  @Column({ type: 'int', nullable: true })
  status_code: number | null;

  @Column({ type: 'int', default: 0 })
  response_time_ms: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  user_id: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  tenant_id: string | null;

  @Column({ type: 'json', nullable: true })
  request_headers: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  request_query: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  request_body: unknown;

  @Column({ type: 'json', nullable: true })
  response_body: unknown;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'int', default: 0 })
  query_count: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
