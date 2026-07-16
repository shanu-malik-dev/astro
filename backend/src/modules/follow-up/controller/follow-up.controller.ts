import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { ListFollowUpDto } from '../dto/list-follow-up.dto';
import { FollowUpService } from '../service/follow-up.service';

@ApiTags('follow-up')
@Controller('follow-up')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  create(@Body() dto: CreateFollowUpDto) {
    return this.followUpService.create(dto);
  }

  @Post('list')
  findAll(@Body() dto: ListFollowUpDto) {
    return this.followUpService.findAll(dto);
  }
}
