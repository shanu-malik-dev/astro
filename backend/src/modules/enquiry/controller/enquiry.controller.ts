import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { CheckMobileDto } from '../dto/check-mobile.dto';
import { CloseEnquiryDto } from '../dto/close-enquiry.dto';
import { CreateEnquiryDto } from '../dto/create-enquiry.dto';
import { ListEnquiryDto } from '../dto/list-enquiry.dto';
import { EnquiryService } from '../service/enquiry.service';

@ApiTags('enquiry')
@Controller('enquiry')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @IsPublic()
  @Post()
  create(@Body() dto: CreateEnquiryDto) {
    return this.enquiryService.create(dto);
  }

  @Post('list')
  findAll(@Body() dto: ListEnquiryDto, @Req() req: Request & { user?: any }) {
    return this.enquiryService.findAll(dto, req.user);
  }

  @Post('export')
  exportCsv(@Body() dto: ListEnquiryDto, @Req() req: Request & { user?: any }) {
    return this.enquiryService.exportCsv(dto, req.user);
  }

  @IsPublic()
  @Post('mobile-check')
  checkMobile(@Body() dto: CheckMobileDto) {
    return this.enquiryService.checkMobile(dto);
  }

  @Post('close')
  close(@Body() dto: CloseEnquiryDto, @Req() req: Request & { user?: any }) {
    return this.enquiryService.close(dto, req.user);
  }
}
