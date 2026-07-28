import { IsEmail, IsOptional, IsString } from 'class-validator';

export class TestEmailNotificationDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
