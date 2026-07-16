import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateServiceDto } from '../dto/create-service.dto';
import { DeleteServiceDto } from '../dto/delete-service.dto';
import { ListServiceDto } from '../dto/list-service.dto';
import { UpdateServiceStatusDto } from '../dto/update-service-status.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceService } from '../service/service.service';

@ApiTags('service')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  @Post('list')
  findAll(@Body() dto: ListServiceDto) {
    return this.serviceService.findAll(dto);
  }

  @Post('update')
  update(@Body() dto: UpdateServiceDto) {
    return this.serviceService.update(dto);
  }

  @Post('status')
  updateStatus(@Body() dto: UpdateServiceStatusDto) {
    return this.serviceService.updateStatus(dto);
  }

  @Post('delete')
  delete(@Body() dto: DeleteServiceDto) {
    return this.serviceService.delete(dto);
  }
}
