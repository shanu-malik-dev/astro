import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AdminModuleGuard } from './modules/auth/guards/admin-module.guard';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.set('trust proxy', 1);
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
  });

  const publicRoot = getPublicRoot();
  app.useStaticAssets(publicRoot);
  app.use('/api/uploads', express.static(join(publicRoot, 'uploads')));

  app.use('/api/payments/razorpay-webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalGuards(app.get(JwtAuthGuard), app.get(AdminModuleGuard));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('AstroNova API')
    .setDescription('Multi-tenant astrology consultation platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`AstroNova backend running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

function getPublicRoot() {
  const configuredUploadRoot = process.env.PUBLIC_UPLOAD_ROOT?.trim();
  if (configuredUploadRoot) return configuredUploadRoot;

  const frontendPublicRoot = join(process.cwd(), '..', 'frontend', 'public');
  if (existsSync(frontendPublicRoot)) return frontendPublicRoot;

  return join(process.cwd(), 'public');
}

bootstrap();
