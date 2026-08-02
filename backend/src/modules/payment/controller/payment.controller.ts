import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { CreatePaymentLinkDto } from '../dto/create-payment-link.dto';
import { ListPaymentDto } from '../dto/list-payment.dto';
import { PaymentService } from '../service/payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('generate-link')
  createPaymentLink(
    @Body() dto: CreatePaymentLinkDto,
    @Req() req: Request & { user?: any },
  ) {
    return this.paymentService.createPaymentLink(dto, req.user);
  }

  @Post('list')
  findAll(@Body() dto: ListPaymentDto, @Req() req: Request & { user?: any }) {
    return this.paymentService.findAll(dto, req.user);
  }

  @IsPublic()
  @Post('webhook')
  webhook(@Req() req: Request & { body: Buffer | Record<string, unknown> }) {
    return this.paymentService.handleRazorpayWebhook(
      this.getRawBody(req),
      this.getHeader(req, 'x-razorpay-signature'),
      this.getHeader(req, 'x-razorpay-event-id'),
    );
  }

  @IsPublic()
  @Post('razorpay-webhook')
  razorpayWebhook(@Req() req: Request & { body: Buffer | Record<string, unknown> }) {
    return this.paymentService.handleRazorpayWebhook(
      this.getRawBody(req),
      this.getHeader(req, 'x-razorpay-signature'),
      this.getHeader(req, 'x-razorpay-event-id'),
    );
  }

  private getRawBody(req: Request & { body: Buffer | Record<string, unknown> }) {
    return Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body || {}));
  }

  private getHeader(req: Request, name: string) {
    const value = req.headers[name];
    return Array.isArray(value) ? value[0] : value;
  }
}
