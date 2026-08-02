import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '../auth/entity/role.entity';
import { RoleController } from './controller/role.controller';
import { ModuleEntity } from './entity/module.entity';
import { RoleAdminModuleEntity } from './entity/role-admin-module.entity';
import { RoleService } from './service/role.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      RoleAdminModuleEntity,
      ModuleEntity,
    ]),
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
