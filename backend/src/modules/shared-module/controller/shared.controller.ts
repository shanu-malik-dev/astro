import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { SharedService } from '../service/shared.service';

@ApiTags('shared')
@Controller('shared')
export class SharedController {
  constructor(private readonly sharedService: SharedService) {}

  @IsPublic()
  @Get('get-country-num')
  getCounrtyNum() {
    return this.sharedService.getCounrtyNum();
  }
}
