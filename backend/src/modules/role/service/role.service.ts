import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
import { RoleEntity } from '../../auth/entity/role.entity';
import { ListRoleDto } from '../dto/list-role.dto';
import { SaveRoleDto } from '../dto/save-role.dto';
import { ModuleEntity } from '../entity/module.entity';
import { RoleAdminModuleEntity } from '../entity/role-admin-module.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(RoleAdminModuleEntity)
    private readonly roleAdminModuleRepository: Repository<RoleAdminModuleEntity>,
    @InjectRepository(ModuleEntity)
    private readonly moduleRepository: Repository<ModuleEntity>,
  ) {}

  async findAll(query: ListRoleDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const sortOrder = query.sort_order === 'desc' ? 'DESC' : 'ASC';
    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    queryBuilder
      .where('role.id != :adminRoleId', { adminRoleId: 1 })
      .andWhere('LOWER(role.name) NOT IN (:...hiddenRoles)', {
        hiddenRoles: ['admin', 'customer'],
      });

    if (query.search) {
      queryBuilder.andWhere('role.name LIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.date_from) {
      queryBuilder.andWhere('role.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('role.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    const [roles, total] = await queryBuilder
      .orderBy('role.name', sortOrder)
      .addOrderBy('role.id', sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const [moduleMap, availableModules] = await Promise.all([
      this.getModulesByRoleIds(roles.map((role) => role.id)),
      this.getActiveModules(),
    ]);

    return successResponse('ROLE_LIST_FETCHED', {
      records: roles.map((role) => this.formatRole(role, moduleMap.get(Number(role.id)) || [])),
      available_modules: availableModules.map((module) => module.module_key),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async save(dto: SaveRoleDto) {
    const moduleMap = await this.getModuleMap();
    const moduleKeys = this.normalizeModules(dto.modules, moduleMap);
    const status = dto.status === 0 ? 0 : 1;
    const role = dto.id
      ? await this.roleRepository.findOne({ where: { id: dto.id } })
      : this.roleRepository.create();

    if (!role) throw new NotFoundException('Role not found.');
    if (Number(role.id) === 1 && status === 0) {
      throw new BadRequestException('Admin role cannot be disabled.');
    }

    role.name = dto.name.trim();
    role.status = status;
    const saved = await this.roleRepository.save(role);
    await this.replaceModules(saved.id, moduleKeys, moduleMap);

    return successResponse('ROLE_SAVED', this.formatRole(saved, moduleKeys));
  }

  async getModulesForRole(roleId: number) {
    if (Number(roleId) === 1) {
      return (await this.getActiveModules()).map((module) => module.module_key);
    }

    const modules = await this.roleAdminModuleRepository.find({
      where: { role_id: roleId },
      relations: ['module'],
    });

    return modules
      .filter((roleModule) => roleModule.module?.status === 1)
      .map((roleModule) => roleModule.module.module_key);
  }

  private normalizeModules(modules: string[], moduleMap: Map<string, ModuleEntity>) {
    const normalized = modules.filter((module) => moduleMap.has(module));

    if (normalized.length !== modules.length) {
      throw new BadRequestException('Invalid admin module selected.');
    }

    return normalized;
  }

  private async replaceModules(
    roleId: number,
    modules: string[],
    moduleMap: Map<string, ModuleEntity>,
  ) {
    await this.roleAdminModuleRepository.delete({ role_id: roleId });
    if (modules.length === 0) return;

    await this.roleAdminModuleRepository.save(
      modules.map((moduleKey) =>
        this.roleAdminModuleRepository.create({
          role_id: roleId,
          module_id: moduleMap.get(moduleKey)!.id,
        }),
      ),
    );
  }

  private async getModulesByRoleIds(roleIds: number[]) {
    const map = new Map<number, string[]>();
    if (roleIds.length === 0) return map;

    const modules = await this.roleAdminModuleRepository.find({
      where: { role_id: In(roleIds) },
      relations: ['module'],
    });

    modules.forEach((module) => {
      if (!module.module || module.module.status !== 1) return;
      const roleModules = map.get(Number(module.role_id)) || [];
      roleModules.push(module.module.module_key);
      map.set(Number(module.role_id), roleModules);
    });

    if (roleIds.includes(1)) {
      const adminModules = await this.getActiveModules();
      map.set(1, adminModules.map((module) => module.module_key));
    }

    return map;
  }

  private getActiveModules() {
    return this.moduleRepository.find({
      where: { status: 1 },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
  }

  private async getModuleMap() {
    const modules = await this.getActiveModules();
    return modules.reduce<Map<string, ModuleEntity>>((map, module) => {
      map.set(module.module_key, module);
      return map;
    }, new Map<string, ModuleEntity>());
  }

  private formatRole(role: RoleEntity, modules: string[]) {
    return {
      id: role.id,
      name: role.name,
      status: role.status,
      modules,
      created_at: role.created_at,
      updated_at: role.updated_at,
    };
  }
}
