import { Module } from '@nestjs/common';
import { CsvController } from './controller/csv.controller';
import { CsvService } from './service/csv.service';

@Module({
  controllers: [CsvController],
  providers: [CsvService],
  exports: [CsvService],
})
export class CsvModule {}
