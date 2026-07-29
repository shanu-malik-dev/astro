import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
import { DeleteCountryDto } from '../dto/delete-country.dto';
import { ListCountryDto } from '../dto/list-country.dto';
import { SaveCountryDto } from '../dto/save-country.dto';
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

  async listCountries(query: ListCountryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const sortOrder = query.sort_order === 'desc' ? 'DESC' : 'ASC';
    const queryBuilder = this.countryRepository.createQueryBuilder('country');

    if (query.search) {
      queryBuilder.where(
        '(country.country_name LIKE :search OR country.country_code LIKE :search OR country.mobile_prefix LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.date_from) {
      queryBuilder.andWhere('country.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('country.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    const [countries, total] = await queryBuilder
      .orderBy('country.country_name', sortOrder)
      .addOrderBy('country.id', sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('COUNTRY_LIST_FETCHED', {
      records: countries.map((country) => this.formatCountry(country)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async saveCountry(dto: SaveCountryDto) {
    const countryName = dto.country_name.trim();
    const countryCode = dto.country_code.trim().toUpperCase();
    const mobilePrefix = dto.mobile_prefix.trim();
    const country = dto.id
      ? await this.countryRepository.findOne({ where: { id: dto.id } })
      : this.countryRepository.create();

    if (!country) throw new NotFoundException('Country not found.');
    await this.ensureUniqueCountryFields({
      id: dto.id,
      countryCode,
      mobilePrefix,
    });

    country.country_name = countryName;
    country.country_code = countryCode;
    country.mobile_prefix = mobilePrefix;
    country.logo = dto.logo?.trim() || null;
    country.status = dto.status === 0 ? 0 : 1;

    const saved = await this.countryRepository.save(country);

    return successResponse('COUNTRY_SAVED', this.formatCountry(saved));
  }

  async deleteCountry(dto: DeleteCountryDto) {
    const country = await this.countryRepository.findOne({ where: { id: dto.id } });
    if (!country) throw new NotFoundException('Country not found.');

    await this.countryRepository.delete({ id: dto.id });

    return successResponse('COUNTRY_DELETED');
  }

  private async ensureUniqueCountryFields(input: {
    id?: number;
    countryCode: string;
    mobilePrefix: string;
  }) {
    const codeQuery = this.countryRepository
      .createQueryBuilder('country')
      .where('country.country_code = :countryCode', {
        countryCode: input.countryCode,
      });
    const prefixQuery = this.countryRepository
      .createQueryBuilder('country')
      .where('country.mobile_prefix = :mobilePrefix', {
        mobilePrefix: input.mobilePrefix,
      });

    if (input.id) {
      codeQuery.andWhere('country.id != :id', { id: input.id });
      prefixQuery.andWhere('country.id != :id', { id: input.id });
    }

    const [codeExists, prefixExists] = await Promise.all([
      codeQuery.getExists(),
      prefixQuery.getExists(),
    ]);

    if (codeExists) throw new ConflictException('Country code already exists.');
    if (prefixExists) throw new ConflictException('Mobile prefix already exists.');
  }

  private formatCountry(country: CountryEntity) {
    return {
      id: country.id,
      country_name: country.country_name,
      country_code: country.country_code,
      mobile_prefix: country.mobile_prefix,
      logo: country.logo,
      status: country.status,
      created_at: country.created_at,
      updated_at: country.updated_at,
    };
  }
}
