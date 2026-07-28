import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { successResponse } from '../../../common/helpers/response.helper';
import { RoleEntity } from '../../auth/entity/role.entity';
import { ListRoleDto } from '../dto/list-role.dto';
import { SaveRoleDto } from '../dto/save-role.dto';
import { RoleAdminModuleEntity } from '../entity/role-admin-module.entity';

export const ADMIN_MODULE_KEYS = [
  'problem',
  'services',
  'astrologers',
  'enquiry',
  'customers',
  'followUp',
  'payments',
  'support',
  'roles',
] as const;

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(RoleAdminModuleEntity)
    private readonly roleAdminModuleRepository: Repository<RoleAdminModuleEntity>,
  ) {}

  async findAll(query: ListRoleDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    if (query.search) {
      queryBuilder.andWhere('role.name LIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const [roles, total] = await queryBuilder
      .orderBy('role.id', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const moduleMap = await this.getModulesByRoleIds(roles.map((role) => role.id));

    return successResponse('ROLE_LIST_FETCHED', {
      records: roles.map((role) => this.formatRole(role, moduleMap.get(Number(role.id)) || [])),
      available_modules: ADMIN_MODULE_KEYS,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async save(dto: SaveRoleDto) {
    const moduleKeys = this.normalizeModules(dto.modules);
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
    await this.replaceModules(saved.id, moduleKeys);

    return successResponse('ROLE_SAVED', this.formatRole(saved, moduleKeys));
  }

  async getModulesForRole(roleId: number) {
    if (Number(roleId) === 1) return [...ADMIN_MODULE_KEYS];

    const modules = await this.roleAdminModuleRepository.find({
      where: { role_id: roleId },
      select: ['module_key'],
    });

    return modules.map((module) => module.module_key);
  }

  private normalizeModules(modules: string[]) {
    const valid = new Set<string>(ADMIN_MODULE_KEYS);
    const normalized = modules.filter((module) => valid.has(module));

    if (normalized.length !== modules.length) {
      throw new BadRequestException('Invalid admin module selected.');
    }

    return normalized;
  }

  private async replaceModules(roleId: number, modules: string[]) {
    await this.roleAdminModuleRepository.delete({ role_id: roleId });
    if (modules.length === 0) return;

    await this.roleAdminModuleRepository.save(
      modules.map((moduleKey) =>
        this.roleAdminModuleRepository.create({
          role_id: roleId,
          module_key: moduleKey,
        }),
      ),
    );
  }

  private async getModulesByRoleIds(roleIds: number[]) {
    const map = new Map<number, string[]>();
    if (roleIds.length === 0) return map;

    const modules = await this.roleAdminModuleRepository.find({
      where: { role_id: In(roleIds) },
    });

    modules.forEach((module) => {
      const roleModules = map.get(Number(module.role_id)) || [];
      roleModules.push(module.module_key);
      map.set(Number(module.role_id), roleModules);
    });

    if (roleIds.includes(1)) {
      map.set(1, [...ADMIN_MODULE_KEYS]);
    }

    return map;
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
