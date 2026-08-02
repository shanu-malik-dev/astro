import { SetMetadata } from '@nestjs/common';

export const ADMIN_MODULE_KEY = 'admin_module';

export const AdminModule = (...modules: string[]) =>
  SetMetadata(ADMIN_MODULE_KEY, modules);
