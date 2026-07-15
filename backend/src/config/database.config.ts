import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.getOrThrow<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.getOrThrow<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD', ''),
  database: configService.getOrThrow<string>('DB_NAME'),
  autoLoadEntities: true,
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') !== 'production',
});
