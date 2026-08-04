import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHash,
  createHmac,
  timingSafeEqual,
} from 'crypto';
import { DATABASE_TABLES } from '../../../common/constants/database.constant';
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
import { PaymentLogEntity } from '../entity/payment-log.entity';
import { PaymentRepository } from '../repository/payment.repository';

type AuthUser = {
  sub?: string | number;
  role_id?: string | number;
};

const ADMIN_ROLE_ID = 1;

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly configService: ConfigService,
    private readonly razorpayService: RazorpayService,
    private readonly stripeService: StripeService,
  ) {}

  async createPaymentLink(dto: CreatePaymentLinkDto, authUser?: AuthUser) {
    const enquiry = await this.paymentRepository.findAssignedEnquiry(
      dto.enq_id,
      this.getExecutiveId(authUser),
    );
    if (!enquiry) throw new NotFoundException('Enquiry not found.');

    const provider = this.getProvider(enquiry.country_code);
    const currency = (dto.currency || (provider === 'razorpay' ? 'INR' : 'USD')).toUpperCase();
    const amount = Number(dto.amount.toFixed(2));
    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero.');
    const paymentLinkExpiry = this.getPaymentLinkExpiry(provider);
    const paymentLinkOptions = {
      expireBy: paymentLinkExpiry.expireBy,
    };
    

    const providerResult =
      provider === 'razorpay'
        ? await this.razorpayService.createPaymentLink(enquiry, amount, currency, paymentLinkOptions)
        : await this.stripeService.createCheckoutLink(enquiry, amount, currency);

    const paymentInsert = await this.paymentRepository
      .getRepository()
      .createQueryBuilder()
      .insert()
      .into(CustomerPaymentEntity)
      .values({
        enq_id: enquiry.id,
        customer_name: enquiry.customer_name,
        country_code: enquiry.country_code,
        customer_mobile: enquiry.mobile,
        amount: () => 'AES_ENCRYPT(:amount, :amountKey)' as any,
        currency,
        provider,
        provider_payment_id: providerResult.providerPaymentId,
        payment_link: providerResult.paymentLink,
        qr_code_url: this.createQrCodeUrl(providerResult.paymentLink),
        payment_status: PAYMENT_STATUS.PENDING,
        provider_response: providerResult.raw as any,
        expires_at: paymentLinkExpiry.expiresAt,
      })
      .setParameters({
        amount: String(amount),
        amountKey: this.getMysqlAesKey(),
      })
      .execute();

    const payment = await this.paymentRepository.getRepository().findOne({
      where: { id: Number(paymentInsert.identifiers[0]?.id) },
    });

    return successResponse('PAYMENT_LINK_CREATED', this.formatPayment(payment, amount));
  }

  async findAll(query: ListPaymentDto, authUser?: AuthUser) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;
    const queryBuilder = this.paymentRepository
      .getRepository()
      .createQueryBuilder('payment');

    const executiveId = this.getExecutiveId(authUser);
    if (executiveId) {
      queryBuilder
        .innerJoin(
          DATABASE_TABLES.ENQUIRY_ASSIGNMENTS,
          'assignment',
          'assignment.enq_id = payment.enq_id AND assignment.is_active = :assignmentActive',
          { assignmentActive: 1 },
        )
        .andWhere('assignment.executive_id = :executiveId', { executiveId });
    }

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

    queryBuilder.addSelect(
      'CAST(AES_DECRYPT(payment.amount, :amountKey) AS CHAR)',
      'decrypted_amount',
    );
    queryBuilder.setParameter('amountKey', this.getMysqlAesKey());

    const { entities: payments, raw } = await queryBuilder
      .orderBy('payment.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawAndEntities();
    const total = await queryBuilder.getCount();
    const amountMap = this.toAmountMap(raw);

    return successResponse('PAYMENT_LIST_FETCHED', {
      records: payments.map((payment) =>
        this.formatPayment(payment, amountMap.get(String(payment.id))),
      ),
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

  async handleRazorpayWebhook(rawBody: Buffer, signature?: string, eventId?: string) {
    if (!rawBody?.length) {
      throw new BadRequestException('Webhook payload is required.');
    }

    const rawPayload = rawBody.toString('utf8');
    const signatureVerified = this.verifyRazorpayWebhookSignature(
      rawPayload,
      signature,
    );

    let body: Record<string, any>;
    try {
      body = JSON.parse(rawPayload) as Record<string, any>;
    } catch {
      throw new BadRequestException('Invalid webhook payload.');
    }

    const parsed = this.parseRazorpayWebhookPayload(body);
    const payment = parsed.paymentId
      ? await this.paymentRepository.findByProviderPaymentId('razorpay', parsed.paymentId)
      : null;
    const logEnquiryId =
      payment?.enq_id ||
      (parsed.enquiryId && (await this.paymentRepository.enquiryExists(parsed.enquiryId))
        ? parsed.enquiryId
        : null);

    await this.paymentRepository.getLogRepository().save(
      this.paymentRepository.getLogRepository().create({
        enq_id: logEnquiryId,
        customer_payment_id: payment?.id || null,
        provider: 'razorpay',
        provider_payment_id: parsed.paymentId || null,
        provider_event_id: eventId || null,
        provider_event: parsed.event || null,
        payment_status: parsed.status,
        signature_verified: signatureVerified ? 1 : 0,
        payload: body,
        raw_body: rawPayload,
      }),
    );

    if (!signatureVerified) {
      throw new BadRequestException('Invalid Razorpay webhook signature.');
    }

    if (!payment || !parsed.paymentId) {
      throw new NotFoundException('Payment not found.');
    }

    await this.paymentRepository.getRepository().update(payment.id, {
      payment_status: parsed.status,
      provider_response: body,
    });

    return successResponse('PAYMENT_STATUS_UPDATED', {
      id: payment.id,
      enq_id: payment.enq_id,
      provider: 'razorpay',
      provider_payment_id: parsed.paymentId,
      payment_status: parsed.status,
      event: parsed.event,
      event_id: eventId || null,
    });
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

  private parseRazorpayWebhookPayload(body: Record<string, any>) {
    const paymentLink = body.payload?.payment_link?.entity;
    const payment = body.payload?.payment?.entity;
    const order = body.payload?.order?.entity;
    const event = String(body.event || '');

    const paymentId =
      paymentLink?.id ||
      payment?.payment_link_id ||
      payment?.id ||
      order?.id ||
      body.payment_id ||
      '';

    const rawStatus =
      paymentLink?.status ||
      payment?.status ||
      order?.status ||
      body.status ||
      event;

    return {
      event,
      enquiryId: Number(paymentLink?.notes?.enq_id || payment?.notes?.enq_id || 0) || null,
      paymentId: paymentId ? String(paymentId) : '',
      status: this.normalizePaymentStatus(String(rawStatus || 'pending')),
    };
  }

  private verifyRazorpayWebhookSignature(rawPayload: string, signature?: string) {
    const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret || !signature) return false;

    const expected = createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    const receivedBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    return (
      receivedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(receivedBuffer, expectedBuffer)
    );
  }

  private normalizePaymentStatus(status: string): PaymentStatus {
    if (['paid', 'captured', 'complete'].includes(status)) return PAYMENT_STATUS.PAID;
    if (['failed'].includes(status)) return PAYMENT_STATUS.FAILED;
    if (['cancelled', 'canceled'].includes(status)) return PAYMENT_STATUS.CANCELLED;
    if (['expired'].includes(status)) return PAYMENT_STATUS.EXPIRED;
    if (['created'].includes(status)) return PAYMENT_STATUS.CREATED;
    return PAYMENT_STATUS.PENDING;
  }

  private getMysqlAesKey() {
    return (
      this.configService.get<string>('MYSQL_PAYMENT_AES_KEY') ||
      this.configService.get<string>('PAYMENT_AES_KEY') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'astronova-payment-secret'
    );
  }

  private getPaymentLinkExpiry(provider?: PaymentProvider) {
    const expiryDuration = this.configService.get<string>(
      'PAYMENT_LINK_EXPIRY_MINUTES',
    );
    const parsedDurationMs = this.parseExpiryDurationMs(expiryDuration);

    if (!parsedDurationMs || !Number.isFinite(parsedDurationMs)) {
      return { expireBy: undefined, expiresAt: null };
    }

    const durationMs = parsedDurationMs;
    const maxDurationMs = 180 * 24 * 60 * 60 * 1000;
    const providerBufferMs = provider === 'razorpay' ? 60 * 1000 : 0;
    const expiresAt = new Date(
      Date.now() + Math.min(durationMs + providerBufferMs, maxDurationMs),
    );
    

    return {
      expireBy: Math.floor(expiresAt.getTime() / 1000),
      expiresAt,
    };
  }

  private parseExpiryDurationMs(value?: string | null) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return null;

    const match = /^(\d+(?:\.\d+)?)(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|y|yr|yrs|year|years)?$/.exec(raw);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2] || 'm';
    if (!Number.isFinite(amount) || amount <= 0) return null;

    if (['s', 'sec', 'secs', 'second', 'seconds'].includes(unit)) {
      return Math.floor(amount * 1000);
    }
    if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(unit)) {
      return Math.floor(amount * 60 * 60 * 1000);
    }
    if (['d', 'day', 'days'].includes(unit)) {
      return Math.floor(amount * 24 * 60 * 60 * 1000);
    }
    if (['y', 'yr', 'yrs', 'year', 'years'].includes(unit)) {
      return Math.floor(amount * 365 * 24 * 60 * 60 * 1000);
    }

    return Math.floor(amount * 60 * 1000);
  }

  private createQrCodeUrl(paymentLink: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&ecc=H&qzone=4&data=${encodeURIComponent(paymentLink)}`;
  }

  private formatPayment(payment?: CustomerPaymentEntity | null, decryptedAmount?: unknown) {
    if (!payment) return null;

    return {
      id: payment.id,
      enq_id: payment.enq_id,
      customer_name: payment.customer_name,
      country_code: payment.country_code,
      customer_mobile: `${payment.country_code} ${payment.customer_mobile}`,
      amount: Number(decryptedAmount) || 0,
      currency: payment.currency,
      provider: payment.provider,
      provider_payment_id: payment.provider_payment_id,
      payment_link: payment.payment_link,
      qr_code_url: payment.qr_code_url,
      payment_status: this.getDisplayPaymentStatus(payment),
      expires_at: payment.expires_at,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    };
  }

  private getDisplayPaymentStatus(payment: CustomerPaymentEntity) {
    if (
      payment.expires_at &&
      payment.expires_at <= new Date() &&
      (payment.payment_status === PAYMENT_STATUS.CREATED ||
        payment.payment_status === PAYMENT_STATUS.PENDING)
    ) {
      return PAYMENT_STATUS.EXPIRED;
    }

    return payment.payment_status;
  }

  private toAmountMap(rawRows: Array<Record<string, unknown>>) {
    return rawRows.reduce<Map<string, unknown>>((map, row) => {
      const paymentId = row.payment_id;
      if (paymentId !== undefined && paymentId !== null) {
        map.set(String(paymentId), row.decrypted_amount);
      }
      return map;
    }, new Map<string, unknown>());
  }

  private getExecutiveId(authUser?: AuthUser) {
    const userId = Number(authUser?.sub);
    const roleId = Number(authUser?.role_id);
    if (!Number.isFinite(userId) || userId <= 0 || roleId === ADMIN_ROLE_ID) {
      return undefined;
    }
    return userId;
  }
}
