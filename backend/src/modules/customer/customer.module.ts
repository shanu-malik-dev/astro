import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entity/user.entity';
import { CustomerController } from './controller/customer.controller';
import { CustomerRepository } from './repository/customer.repository';
import { CustomerService } from './service/customer.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerRepository],
})
export class CustomerModule {}
