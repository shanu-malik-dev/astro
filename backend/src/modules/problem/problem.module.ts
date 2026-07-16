import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemController } from './controller/problem.controller';
import { ProblemTranslationEntity } from './entity/problem-translation.entity';
import { ProblemEntity } from './entity/problem.entity';
import { ProblemRepository } from './repository/problem.repository';
import { ProblemService } from './service/problem.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProblemEntity, ProblemTranslationEntity])],
  controllers: [ProblemController],
  providers: [ProblemService, ProblemRepository],
  exports: [ProblemService],
})
export class ProblemModule {}
