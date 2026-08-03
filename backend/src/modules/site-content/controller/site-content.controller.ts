import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { SaveSiteContentDto } from '../dto/save-site-content.dto';
import { SiteContentService } from '../service/site-content.service';

@ApiTags('site-content')
@Controller('site-content')
export class SiteContentController {
  constructor(private readonly siteContentService: SiteContentService) {}

  @IsPublic()
  @Get('public')
  publicContent() {
    return this.siteContentService.publicContent();
  }

  @Get('admin')
  adminContent() {
    return this.siteContentService.adminContent();
  }

  @Post('save')
  save(@Body() dto: SaveSiteContentDto) {
    return this.siteContentService.save(dto);
  }
}
