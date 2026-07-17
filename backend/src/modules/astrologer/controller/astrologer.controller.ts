import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { CreateAstrologerDto } from '../dto/create-astrologer.dto';
import { DeleteAstrologerDto } from '../dto/delete-astrologer.dto';
import { ListAstrologerDto } from '../dto/list-astrologer.dto';
import { UpdateAstrologerStatusDto } from '../dto/update-astrologer-status.dto';
import { UpdateAstrologerDto } from '../dto/update-astrologer.dto';
import { AstrologerService } from '../service/astrologer.service';

@ApiTags('astrologer')
@Controller('astrologer')
export class AstrologerController {
  constructor(private readonly astrologerService: AstrologerService) {}

  @Post()
  create(@Body() dto: CreateAstrologerDto) {
    return this.astrologerService.create(dto);
  }

  @Post('list')
  findAll(@Body() dto: ListAstrologerDto) {
    return this.astrologerService.findAll(dto);
  }

  @IsPublic()
  @Post('public-list')
  publicList(@Body() dto: ListAstrologerDto) {
    return this.astrologerService.publicList(dto);
  }

  @Post('update')
  update(@Body() dto: UpdateAstrologerDto) {
    return this.astrologerService.update(dto);
  }

  @Post('status')
  updateStatus(@Body() dto: UpdateAstrologerStatusDto) {
    return this.astrologerService.updateStatus(dto);
  }

  @Post('delete')
  delete(@Body() dto: DeleteAstrologerDto) {
    return this.astrologerService.delete(dto);
  }
}
