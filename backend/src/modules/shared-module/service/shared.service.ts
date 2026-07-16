import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
import { CountryEntity } from '../entities/country.entity';

@Injectable()
export class SharedService {
  constructor(
    @InjectRepository(CountryEntity)
    private readonly countryRepository: Repository<CountryEntity>,
  ) {}

  async getCounrtyNum() {
    const countries = await this.countryRepository.find({
      select: {
        id: true,
        country_name: true,
        country_code: true,
        mobile_prefix: true,
        logo: true,
      },
      where: { status: 1 },
      order: { country_name: 'ASC' },
    });

    return successResponse(
      'COUNTRY_LIST_FETCHED',
      countries
        .filter((country) => country.mobile_prefix)
        .map((country) => ({
          label: `${country.mobile_prefix}${country.country_code ? ` ${country.country_code}` : ''}`,
          value: country.mobile_prefix,
          country_name: country.country_name,
          country_code: country.country_code,
          mobile_prefix: country.mobile_prefix,
          logo: country.logo,
        })),
    );
  }
}
