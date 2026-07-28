import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportRequestEntity } from '../entity/support-request.entity';

@Injectable()
export class SupportRepository {
  constructor(
    @InjectRepository(SupportRequestEntity)
    private readonly supportRepository: Repository<SupportRequestEntity>,
  ) {}

  getRepository() {
    return this.supportRepository;
  }
}
