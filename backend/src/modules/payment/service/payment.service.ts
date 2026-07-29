import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { PAYMENT_STATUS, PaymentStatus } from '../../../common/constants/status.constant';
import { successResponse } from '../../../common/helpers/response.helper';
import { RazorpayService } from '../../third-party/razorpay/razorpay.service';
import { StripeService } from '../../third-party/stripe/stripe.service';
import { CreatePaymentLinkDto } from '../dto/create-payment-link.dto';
import { ListPaymentDto } from '../dto/list-payment.dto';
import { PaymentWebhookDto } from '../dto/payment-webhook.dto';
import {
  CustomerPaymentEntity,
  PaymentProvider,
} from '../entity/customer-payment.entity';
import { PaymentRepository } from '../repository/payment.repository';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly configService: ConfigService,
    private readonly razorpayService: RazorpayService,
    private readonly stripeService: StripeService,
  ) {}

  async createPaymentLink(dto: CreatePaymentLinkDto) {
    const enquiry = await this.paymentRepository.findEnquiry(dto.enq_id);
    if (!enquiry) throw new NotFoundException('Enquiry not found.');

    const provider = this.getProvider(enquiry.country_code);
    const currency = (dto.currency || (provider === 'razorpay' ? 'INR' : 'USD')).toUpperCase();
    const amount = Number(dto.amount.toFixed(2));
    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero.');
    const paymentLinkOptions = {
      expireBy: this.getPaymentLinkExpireBy(),
    };

    const providerResult =
      provider === 'razorpay'
        ? await this.razorpayService.createPaymentLink(enquiry, amount, currency, paymentLinkOptions)
        : await this.stripeService.createCheckoutLink(enquiry, amount, currency);

    const payment = await this.paymentRepository.getRepository().save(
      this.paymentRepository.getRepository().create({
        enq_id: enquiry.id,
        customer_name: enquiry.customer_name,
        country_code: enquiry.country_code,
        customer_mobile: enquiry.mobile,
        amount: this.encryptAmount(amount),
        currency,
        provider,
        provider_payment_id: providerResult.providerPaymentId,
        payment_link: providerResult.paymentLink,
        qr_code_url: this.createQrCodeUrl(providerResult.paymentLink),
        payment_status: PAYMENT_STATUS.PENDING,
        provider_response: providerResult.raw,
      }),
    );

    return successResponse('PAYMENT_LINK_CREATED', this.formatPayment(payment));
  }

  async findAll(query: ListPaymentDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const queryBuilder = this.paymentRepository
      .getRepository()
      .createQueryBuilder('payment');

    if (query.provider) {
      queryBuilder.andWhere('payment.provider = :provider', {
        provider: query.provider,
      });
    }

    if (query.payment_status) {
      queryBuilder.andWhere('payment.payment_status = :status', {
        status: query.payment_status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(payment.customer_name LIKE :search OR payment.customer_mobile LIKE :search OR payment.country_code LIKE :search OR payment.provider_payment_id LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.date_from) {
      queryBuilder.andWhere('payment.created_at >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('payment.created_at <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    const [payments, total] = await queryBuilder
      .orderBy('payment.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return successResponse('PAYMENT_LIST_FETCHED', {
      records: payments.map((payment) => this.formatPayment(payment)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }

  async handleWebhook(dto: PaymentWebhookDto, rawBody?: Buffer) {
    const parsed = this.parseWebhookPayload(dto, rawBody);
    if (!parsed.paymentId) {
      throw new BadRequestException('Payment id is required.');
    }

    const queryBuilder = this.paymentRepository
      .getRepository()
      .createQueryBuilder()
      .update(CustomerPaymentEntity)
      .set({ payment_status: parsed.status })
      .where('provider_payment_id = :paymentId', { paymentId: parsed.paymentId });

    if (parsed.provider) {
      queryBuilder.andWhere('provider = :provider', { provider: parsed.provider });
    }

    const result = await queryBuilder.execute();
    if (!result.affected) throw new NotFoundException('Payment not found.');

    const payment = await this.paymentRepository.getRepository().findOne({
      where: { provider_payment_id: parsed.paymentId },
    });

    return successResponse('PAYMENT_STATUS_UPDATED', this.formatPayment(payment));
  }

  private getProvider(countryCode: string): PaymentProvider {
    return countryCode.trim() === '+91' ? 'razorpay' : 'stripe';
  }

  private parseWebhookPayload(dto: PaymentWebhookDto, rawBody?: Buffer) {
    const body: Record<string, any> =
      rawBody && rawBody.length
        ? (JSON.parse(rawBody.toString('utf8')) as Record<string, any>)
        : { ...dto };

    const provider = (dto.provider || body.provider) as PaymentProvider | undefined;
    const stripeSession = body.data?.object;
    const razorpayPaymentLink = body.payload?.payment_link?.entity;
    const razorpayPayment = body.payload?.payment?.entity;

    const paymentId =
      dto.payment_id ||
      body.payment_id ||
      stripeSession?.id ||
      razorpayPaymentLink?.id ||
      razorpayPayment?.payment_link_id;

    const rawStatus =
      dto.status ||
      body.status ||
      stripeSession?.payment_status ||
      razorpayPaymentLink?.status ||
      razorpayPayment?.status;

    return {
      provider,
      paymentId: paymentId ? String(paymentId) : '',
      status: this.normalizePaymentStatus(String(rawStatus || 'pending')),
    };
  }

  private normalizePaymentStatus(status: string): PaymentStatus {
    if (['paid', 'captured', 'complete'].includes(status)) return PAYMENT_STATUS.PAID;
    if (['failed'].includes(status)) return PAYMENT_STATUS.FAILED;
    if (['cancelled', 'canceled'].includes(status)) return PAYMENT_STATUS.CANCELLED;
    if (['expired'].includes(status)) return PAYMENT_STATUS.EXPIRED;
    if (['created'].includes(status)) return PAYMENT_STATUS.CREATED;
    return PAYMENT_STATUS.PENDING;
  }

  private encryptAmount(amount: number) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getAesKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(String(amount), 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]);
  }

  private decryptAmount(encryptedAmount: Buffer) {
    const iv = encryptedAmount.subarray(0, 12);
    const authTag = encryptedAmount.subarray(12, 28);
    const encrypted = encryptedAmount.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.getAesKey(), iv);
    decipher.setAuthTag(authTag);
    return Number(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'),
    );
  }

  private getAesKey() {
    const secret =
      this.configService.get<string>('PAYMENT_AES_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'astronova-payment-secret';
    return createHash('sha256').update(secret).digest();
  }

  private getPaymentLinkExpireBy() {
    const enabled =
      this.configService.get<string>('PAYMENT_LINK_EXPIRY_ENABLED', 'false') === 'true';
    if (!enabled) return undefined;

    const minutes = Number(
      this.configService.get<string>('PAYMENT_LINK_EXPIRY_MINUTES', '60'),
    );
    if (!Number.isFinite(minutes) || minutes <= 0) return undefined;

    const cappedMinutes = Math.min(minutes, 60 * 24 * 180);
    return Math.floor(Date.now() / 1000) + Math.floor(cappedMinutes * 60);
  }

  private createQrCodeUrl(paymentLink: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&ecc=H&qzone=4&data=${encodeURIComponent(paymentLink)}`;
  }

  private formatPayment(payment?: CustomerPaymentEntity | null) {
    if (!payment) return null;

    return {
      id: payment.id,
      enq_id: payment.enq_id,
      customer_name: payment.customer_name,
      country_code: payment.country_code,
      customer_mobile: `${payment.country_code} ${payment.customer_mobile}`,
      amount: this.decryptAmount(payment.amount),
      currency: payment.currency,
      provider: payment.provider,
      provider_payment_id: payment.provider_payment_id,
      payment_link: payment.payment_link,
      qr_code_url: payment.qr_code_url,
      payment_status: payment.payment_status,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    };
  }
}
