import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageMiddleware } from './common/middleware/language.middleware';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { AstrologerModule } from './modules/astrologer/astrologer.module';
import { EnquiryModule } from './modules/enquiry/enquiry.module';
import { FollowUpModule } from './modules/follow-up/follow-up.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProblemModule } from './modules/problem/problem.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ServiceModule } from './modules/service/service.module';
import { SharedModule } from './modules/shared-module/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    AuthModule,
    SharedModule,
    ProblemModule,
    ServiceModule,
    AstrologerModule,
    EnquiryModule,
    FollowUpModule,
    CustomerModule,
    PaymentModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageMiddleware).forRoutes('*');
  }
}
