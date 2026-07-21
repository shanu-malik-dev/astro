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
  createPaymentLink(@Body() dto: CreatePaymentLinkDto) {
    return this.paymentService.createPaymentLink(dto);
  }

  @Post('list')
  findAll(@Body() dto: ListPaymentDto) {
    return this.paymentService.findAll(dto);
  }

  @IsPublic()
  @Post('webhook')
  webhook(@Req() req: Request & { body: Buffer | Record<string, unknown> }) {
    return this.paymentService.handleWebhook(
      {},
      Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body || {})),
    );
  }
}
