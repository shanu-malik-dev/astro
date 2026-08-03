import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteContentController } from './controller/site-content.controller';
import { SiteContentEntity } from './entity/site-content.entity';
import { SiteContentService } from './service/site-content.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContentEntity])],
  controllers: [SiteContentController],
  providers: [SiteContentService],
})
export class SiteContentModule {}
