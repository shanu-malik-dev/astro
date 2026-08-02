import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
import { ADMIN_MODULE_KEY } from '../decorators/admin-module.decorator';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';

type AuthUser = {
  sub?: string | number;
};

const ADMIN_ROLE_ID = 1;

@Injectable()
export class AdminModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredModules = this.reflector.getAllAndOverride<string[]>(
      ADMIN_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredModules?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const userId = Number(request.user?.sub);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ForbiddenException('Module access denied.');
    }

    const user = await this.dataSource
      .createQueryBuilder()
      .select(['user.id AS id', 'user.role_id AS role_id'])
      .from(DATABASE_TABLES.USERS, 'user')
      .where('user.id = :userId', { userId })
      .andWhere('user.is_delete = :isDelete', { isDelete: 0 })
      .andWhere('user.status = :status', { status: 1 })
      .getRawOne<{ id: string | number; role_id: string | number }>();

    const roleId = Number(user?.role_id);
    if (roleId === ADMIN_ROLE_ID) return true;
    if (!Number.isFinite(roleId) || roleId <= 0) {
      throw new ForbiddenException('Module access denied.');
    }

    const allowed = await this.dataSource
      .createQueryBuilder()
      .select('1')
      .from(DATABASE_TABLES.ROLE_ADMIN_MODULES, 'roleModule')
      .innerJoin(
        DATABASE_TABLES.MODULES,
        'module',
        'module.id = roleModule.module_id AND module.status = :status',
        { status: 1 },
      )
      .where('roleModule.role_id = :roleId', { roleId })
      .andWhere('module.module_key IN (:...modules)', {
        modules: requiredModules,
      })
      .limit(1)
      .getRawOne();

    if (!allowed) {
      throw new ForbiddenException('Module access denied.');
    }

    return true;
  }
}
