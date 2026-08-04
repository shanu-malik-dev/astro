import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ENQUIRY_STATUS, CustomerSegment } from '../../../common/constants/status.constant';
import { AstrologerConsultCountEntity } from '../../astrologer/entity/astrologer-consult-count.entity';
import { AstrologerEntity } from '../../astrologer/entity/astrologer.entity';
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
    @InjectRepository(AstrologerConsultCountEntity)
    private readonly consultCountRepository: Repository<AstrologerConsultCountEntity>,
    @InjectRepository(AstrologerEntity)
    private readonly astrologerRepository: Repository<AstrologerEntity>,
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

  findActiveUserByMobile(countryCode: string, mobile: string) {
    return this.userRepository.findOne({
      where: {
        country_code: countryCode,
        mobile,
        is_delete: 0,
      },
    });
  }

  findActiveUserById(id: number) {
    return this.userRepository.findOne({
      where: {
        id,
        is_delete: 0,
      },
    });
  }

  findActiveAstrologerById(id: number) {
    return this.astrologerRepository.findOne({
      where: {
        id,
        is_delete: 0,
        status: 1,
      },
    });
  }

  createCustomerUser(dto: CreateEnquiryDto) {
    return this.userRepository.save(
      this.userRepository.create({
        role_id: 3,
        name: dto.customer_name.trim(),
        country_code: dto.country_code,
        mobile: dto.mobile,
        email: null,
        password_hash: null,
        status: 1,
        is_delete: 0,
      }),
    );
  }

  updateCustomerSegment(customerId: number, customerSegment: CustomerSegment) {
    return this.userRepository.update(customerId, {
      customer_segment: customerSegment,
    });
  }

  async upsertAstrologerConsultCount(astrologerId: number, customerId: number) {
    const existing = await this.consultCountRepository.findOne({
      where: {
        astrologer_id: astrologerId,
        customer_id: customerId,
      },
    });

    if (existing) {
      await this.consultCountRepository.increment({ id: existing.id }, 'consult_count', 1);
      return;
    }

    await this.consultCountRepository.save(
      this.consultCountRepository.create({
        astrologer_id: astrologerId,
        customer_id: customerId,
        consult_count: 1,
      }),
    );
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
