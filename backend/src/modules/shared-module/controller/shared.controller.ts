import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { DeleteCountryDto } from '../dto/delete-country.dto';
import { ListCountryDto } from '../dto/list-country.dto';
import { SaveCountryDto } from '../dto/save-country.dto';
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

  @Post('countries/list')
  listCountries(@Body() dto: ListCountryDto) {
    return this.sharedService.listCountries(dto);
  }

  @Post('countries/save')
  saveCountry(@Body() dto: SaveCountryDto) {
    return this.sharedService.saveCountry(dto);
  }

  @Post('countries/delete')
  deleteCountry(@Body() dto: DeleteCountryDto) {
    return this.sharedService.deleteCountry(dto);
  }
}
