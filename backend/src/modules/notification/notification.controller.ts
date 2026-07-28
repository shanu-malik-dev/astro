import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/helpers/response.helper';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { TestEmailNotificationDto } from './dto/test-email-notification.dto';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @IsPublic()
  @Post('test-email')
  async sendTestEmail(@Body() dto: TestEmailNotificationDto) {
    const subject = dto.subject || 'Test notification';
    const message =
      dto.message ||
      'This is a test email from Shree Samriddhi Atro notification service.';

    await this.notificationService.sendEmailNotification({
      to: dto.to,
      subject,
      text: message,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
          <h2>${subject}</h2>
          <p>${message}</p>
          <p>Shree Samriddhi Atro</p>
        </div>
      `,
    });

    return successResponse('NOTIFICATION_EMAIL_SENT', {
      sent: true,
      to: dto.to,
    });
  }
}
