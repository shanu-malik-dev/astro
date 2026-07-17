import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { AstrologerConsultationEntity } from './astrologer-consultation.entity';
import { AstrologerRatingEntity } from './astrologer-rating.entity';
import { AstrologerTranslationEntity } from './astrologer-translation.entity';

@Entity({ name: DATABASE_TABLES.ASTROLOGERS })
@Index('idx_astrologers_status_delete', ['status', 'is_delete'])
export class AstrologerEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50 })
  experience: string;

  @Column({ type: 'text' })
  languages: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 1,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  rating: number;

  @Column({ type: 'varchar', length: 50, default: '0' })
  consultations: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '1=Active, 0=Inactive',
  })
  status: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '1=Deleted, 0=Not Deleted',
  })
  is_delete: number;

  @OneToMany(
    () => AstrologerTranslationEntity,
    (translation) => translation.astrologer,
  )
  translations: AstrologerTranslationEntity[];

  @OneToMany(() => AstrologerRatingEntity, (rating) => rating.astrologer)
  ratings: AstrologerRatingEntity[];

  @OneToMany(
    () => AstrologerConsultationEntity,
    (consultation) => consultation.astrologer,
  )
  consultation_records: AstrologerConsultationEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
