import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProblemEntity } from '../../problem/entity/problem.entity';
import { CreateEnquiryDto } from '../dto/create-enquiry.dto';
import { EnquiryEntity } from '../entity/enquiry.entity';

@Injectable()
export class EnquiryRepository {
  constructor(
    @InjectRepository(EnquiryEntity)
    private readonly enquiryRepository: Repository<EnquiryEntity>,
    @InjectRepository(ProblemEntity)
    private readonly problemRepository: Repository<ProblemEntity>,
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
        status: 'open',
        is_delete: 0,
      },
    });
  }

  findProblemById(problemId: number) {
    return this.problemRepository.findOne({
      where: { id: problemId, is_delete: 0, status: 1 },
      relations: { translations: true },
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
        status: 'open',
        is_delete: 0,
      }),
    );
  }
}
