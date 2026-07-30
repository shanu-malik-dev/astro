import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ENQUIRY_STATUS } from '../../../common/constants/status.constant';
import { UserEntity } from '../../auth/entity/user.entity';
import { ServiceEntity } from '../../service/entity/service.entity';
import { CreateEnquiryDto } from '../dto/create-enquiry.dto';
import { EnquiryEntity } from '../entity/enquiry.entity';

@Injectable()
export class EnquiryRepository {
  constructor(
    @InjectRepository(EnquiryEntity)
    private readonly enquiryRepository: Repository<EnquiryEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  getRepository() {
    return this.enquiryRepository;
  }

  existsOpenEnquiry(dto: CreateEnquiryDto) {
    return this.enquiryRepository.exist({
      where: {
        country_code: dto.country_code,
        mobile: dto.mobile,
        problem_id: dto.problem_id,
        status: ENQUIRY_STATUS.OPEN,
        is_delete: 0,
      },
    });
  }

  findServiceById(serviceId: number) {
    return this.serviceRepository.findOne({
      where: { id: serviceId, is_delete: 0, status: 1 },
      relations: { translations: true },
    });
  }

  mobileExists(countryCode: string, mobile: string) {
    return this.userRepository.exist({
      where: {
        country_code: countryCode,
        mobile,
        is_delete: 0,
        status: 1,
      },
    });
  }

  createEnquiry(dto: CreateEnquiryDto, problemName: string) {
    return this.enquiryRepository.save(
      this.enquiryRepository.create({
        customer_id: dto.customer_id || null,
        customer_name: dto.customer_name.trim(),
        country_code: dto.country_code,
        mobile: dto.mobile,
        problem_id: dto.problem_id,
        problem_name: problemName,
        status: ENQUIRY_STATUS.OPEN,
        is_delete: 0,
      }),
    );
  }
}
