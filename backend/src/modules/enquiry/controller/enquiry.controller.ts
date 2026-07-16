import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
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
  findAll(@Body() dto: ListEnquiryDto) {
    return this.enquiryService.findAll(dto);
  }

  @Post('close')
  close(@Body() dto: CloseEnquiryDto) {
    return this.enquiryService.close(dto);
  }
}
