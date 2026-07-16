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
import { ProblemEntity } from './problem.entity';

@Entity({ name: DATABASE_TABLES.PROBLEM_TRANSLATIONS })
@Index('uq_problem_translation_lang', ['problem_id', 'lang_code'], {
  unique: true,
})
@Index('idx_problem_translation_lang_status', ['lang_code', 'status'])
export class ProblemTranslationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  problem_id: number;

  @Column({ type: 'varchar', length: 10 })
  lang_code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '1=Active, 0=Inactive',
  })
  status: number;

  @ManyToOne(() => ProblemEntity, (problem) => problem.translations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'problem_id' })
  problem: ProblemEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
