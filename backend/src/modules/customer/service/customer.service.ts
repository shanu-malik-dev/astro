import { Injectable, NotFoundException } from '@nestjs/common';
import { successResponse } from '../../../common/helpers/response.helper';
import { UserEntity } from '../../auth/entity/user.entity';
import { ListCustomerDto } from '../dto/list-customer.dto';
import { UpdateCustomerCallStatusDto } from '../dto/update-customer-call-status.dto';
import { CustomerRepository } from '../repository/customer.repository';

const CUSTOMER_ROLE_ID = 3;

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async findAll(query: ListCustomerDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const queryBuilder = this.customerRepository
      .getRepository()
      .createQueryBuilder('user')
      .where('user.role_id = :roleId', { roleId: CUSTOMER_ROLE_ID })
      .andWhere('user.is_delete = :isDelete', { isDelete: 0 });

    if (query.range === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      queryBuilder.andWhere('user.created_at BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    if (query.call_status) {
      queryBuilder.andWhere('user.call_status = :callStatus', {
        callStatus: query.call_status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.mobile LIKE :search OR user.country_code LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [customers, total] = await queryBuilder
      .orderBy('user.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('CUSTOMER_LIST_FETCHED', {
      records: customers.map((customer) => this.formatCustomer(customer)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async updateCallStatus(dto: UpdateCustomerCallStatusDto) {
    const customer = await this.customerRepository.getRepository().findOne({
      where: {
        id: dto.id,
        role_id: CUSTOMER_ROLE_ID,
        is_delete: 0,
      },
    });

    if (!customer) throw new NotFoundException('Customer not found.');

    await this.customerRepository.getRepository().update(dto.id, {
      call_status: dto.call_status,
    });

    const updated = await this.customerRepository.getRepository().findOne({
      where: { id: dto.id },
    });

    return successResponse('CUSTOMER_CALL_STATUS_UPDATED', this.formatCustomer(updated));
  }

  private formatCustomer(customer?: UserEntity | null) {
    if (!customer) return null;

    return {
      id: customer.id,
      name: customer.name,
      country_code: customer.country_code,
      mobile: customer.mobile,
      customer_mobile: `${customer.country_code} ${customer.mobile}`,
      status: customer.status,
      call_status: customer.call_status || 'not_called',
      created_at: customer.created_at,
      updated_at: customer.updated_at,
    };
  }
}
