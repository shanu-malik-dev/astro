import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AstrologerEntity } from '../astrologer/entity/astrologer.entity';
import { RoleEntity } from '../auth/entity/role.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, AstrologerEntity])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
