import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { successResponse } from '../../../common/helpers/response.helper';
import { CreatePaymentLinkDto } from '../dto/create-payment-link.dto';
import { ListPaymentDto } from '../dto/list-payment.dto';
import { PaymentWebhookDto } from '../dto/payment-webhook.dto';
import {
  CustomerPaymentEntity,
  PaymentProvider,
  PaymentStatus,
} from '../entity/customer-payment.entity';
import { PaymentRepository } from '../repository/payment.repository';

type ProviderLinkResult = {
  providerPaymentId: string;
  paymentLink: string;
  raw: Record<string, unknown>;
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly configService: ConfigService,
  ) {}

  async createPaymentLink(dto: CreatePaymentLinkDto) {
    const enquiry = await this.paymentRepository.findEnquiry(dto.enq_id);
    if (!enquiry) throw new NotFoundException('Enquiry not found.');

    const provider = this.getProvider(enquiry.country_code);
    const currency = (dto.currency || (provider === 'razorpay' ? 'INR' : 'USD')).toUpperCase();
    const amount = Number(dto.amount.toFixed(2));
    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero.');

    const providerResult =
      provider === 'razorpay'
        ? await this.createRazorpayLink(enquiry, amount, currency)
        : await this.createStripeCheckoutLink(enquiry, amount, currency);

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
        payment_status: 'pending',
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

  private async createRazorpayLink(
    enquiry: { id: number; customer_name: string; country_code: string; mobile: string },
    amount: number,
    currency: string,
  ): Promise<ProviderLinkResult> {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new BadRequestException('Razorpay keys are not configured.');
    }

    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        accept_partial: false,
        description: `Astro consultation enquiry #${enquiry.id}`,
        customer: {
          name: enquiry.customer_name,
          contact: `${enquiry.country_code}${enquiry.mobile}`,
        },
        notify: { sms: true, email: false },
        notes: { enq_id: String(enquiry.id) },
      }),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new BadRequestException(
        this.getProviderError(data, 'Unable to create Razorpay payment link.'),
      );
    }

    return {
      providerPaymentId: String(data.id || ''),
      paymentLink: String(data.short_url || ''),
      raw: data,
    };
  }

  private async createStripeCheckoutLink(
    enquiry: { id: number; customer_name: string; country_code: string; mobile: string },
    amount: number,
    currency: string,
  ): Promise<ProviderLinkResult> {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) throw new BadRequestException('Stripe secret key is not configured.');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${frontendUrl}/admin?payment=success`);
    params.set('cancel_url', `${frontendUrl}/admin?payment=cancelled`);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', currency.toLowerCase());
    params.set('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100)));
    params.set('line_items[0][price_data][product_data][name]', `Astro consultation enquiry #${enquiry.id}`);
    params.set('metadata[enq_id]', String(enquiry.id));
    params.set('metadata[customer_mobile]', `${enquiry.country_code}${enquiry.mobile}`);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      throw new BadRequestException(
        this.getProviderError(data, 'Unable to create Stripe payment link.'),
      );
    }

    return {
      providerPaymentId: String(data.id || ''),
      paymentLink: String(data.url || ''),
      raw: data,
    };
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
    if (['paid', 'captured', 'complete'].includes(status)) return 'paid';
    if (['failed'].includes(status)) return 'failed';
    if (['cancelled', 'canceled'].includes(status)) return 'cancelled';
    if (['expired'].includes(status)) return 'expired';
    if (['created'].includes(status)) return 'created';
    return 'pending';
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

  private createQrCodeUrl(paymentLink: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentLink)}`;
  }

  private getProviderError(data: Record<string, unknown>, fallback: string) {
    const error = data.error as { description?: string; message?: string } | undefined;
    return error?.description || error?.message || fallback;
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
