import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListCustomerDto } from '../dto/list-customer.dto';
import { UpdateCustomerCallStatusDto } from '../dto/update-customer-call-status.dto';
import { CustomerService } from '../service/customer.service';

@ApiTags('customer')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('list')
  findAll(@Body() dto: ListCustomerDto) {
    return this.customerService.findAll(dto);
  }

  @Post('call-status')
  updateCallStatus(@Body() dto: UpdateCustomerCallStatusDto) {
    return this.customerService.updateCallStatus(dto);
  }
}
