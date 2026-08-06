import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
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

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 1.5 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: any, @Req() request: Request) {
    return this.astrologerService.uploadImage(file, request);
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
