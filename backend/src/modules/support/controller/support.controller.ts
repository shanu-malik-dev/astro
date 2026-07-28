import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { CreateSupportRequestDto } from '../dto/create-support-request.dto';
import { ListSupportRequestDto } from '../dto/list-support-request.dto';
import { UpdateSupportStatusDto } from '../dto/update-support-status.dto';
import { SupportService } from '../service/support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @IsPublic()
  @Post()
  create(@Body() dto: CreateSupportRequestDto) {
    return this.supportService.create(dto);
  }

  @Post('list')
  findAll(@Body() dto: ListSupportRequestDto) {
    return this.supportService.findAll(dto);
  }

  @Post('status')
  updateStatus(@Body() dto: UpdateSupportStatusDto) {
    return this.supportService.updateStatus(dto);
  }
}
