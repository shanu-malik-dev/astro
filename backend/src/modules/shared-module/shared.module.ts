import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedController } from './controller/shared.controller';
import { CountryEntity } from './entities/country.entity';
import { SharedService } from './service/shared.service';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity])],
  controllers: [SharedController],
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}
