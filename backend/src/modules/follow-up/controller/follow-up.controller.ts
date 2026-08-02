import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { ListFollowUpDto } from '../dto/list-follow-up.dto';
import { FollowUpService } from '../service/follow-up.service';

@ApiTags('follow-up')
@Controller('follow-up')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  create(@Body() dto: CreateFollowUpDto, @Req() req: Request & { user?: any }) {
    return this.followUpService.create(dto, req.user);
  }

  @Post('list')
  findAll(@Body() dto: ListFollowUpDto, @Req() req: Request & { user?: any }) {
    return this.followUpService.findAll(dto, req.user);
  }
}
