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
import { AstrologerEntity } from './astrologer.entity';

@Entity({ name: DATABASE_TABLES.ASTROLOGER_TRANSLATIONS })
@Index('uq_astrologer_translation_lang', ['astrologer_id', 'lang_code'], {
  unique: true,
})
@Index('idx_astrologer_translation_lang_status', ['lang_code', 'status'])
export class AstrologerTranslationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  astrologer_id: number;

  @Column({ type: 'varchar', length: 10 })
  lang_code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text' })
  expertise: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '1=Active, 0=Inactive',
  })
  status: number;

  @ManyToOne(() => AstrologerEntity, (astrologer) => astrologer.translations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'astrologer_id' })
  astrologer: AstrologerEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
