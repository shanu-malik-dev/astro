import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThirdPartyHttpService } from '../http/third-party-http.service';
import {
  PaymentLinkOptions,
  PaymentLinkCustomer,
  PaymentLinkResult,
} from '../types/payment-link-result.type';

type RazorpayPaymentLinkResponse = Record<string, unknown> & {
  id?: string;
  short_url?: string;
};

@Injectable()
export class RazorpayService {
  private readonly paymentLinksUrl = 'https://api.razorpay.com/v1/payment_links';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: ThirdPartyHttpService,
  ) {}

  async createPaymentLink(
    enquiry: PaymentLinkCustomer,
    amount: number,
    currency: string,
    options: PaymentLinkOptions = {},
  ): Promise<PaymentLinkResult> {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new BadRequestException('Razorpay keys are not configured.');
    }

    const payload: Record<string, unknown> = {
      amount: Math.round(amount * 100),
      currency,
      accept_partial: false,
      description: options.description || `Astro consultation enquiry #${enquiry.id}`,
      notify: { sms: true, email: false },
      notes: options.notes || { enq_id: String(enquiry.id) },
    };

    if (enquiry.mobile) {
      payload.customer = {
        name: enquiry.customer_name,
        contact: `${enquiry.country_code}${enquiry.mobile}`,
      };
    }

    if (
      this.configService.get<string>(
        'RAZORPAY_RESTRICT_PAYMENT_METHODS',
        'true',
      ) === 'true'
    ) {
      payload.options = {
        checkout: {
          method: {
            upi: true,
            card: true,
            netbanking: false,
            wallet: false,
            emi: false,
            paylater: false,
            bank_transfer: false,
          },
        },
      };
    }

    if (currency === 'INR' && this.configService.get<string>('RAZORPAY_UPI_LINK_ENABLED', 'false') === 'true') {
      payload.upi_link = true;
    }

    if (options.expireBy) {
      payload.expire_by = options.expireBy;
    }

    const response = await this.httpService.post<RazorpayPaymentLinkResponse>(
      this.paymentLinksUrl,
      payload,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      providerPaymentId: String(response.data.id || ''),
      paymentLink: String(response.data.short_url || ''),
      raw: response.data,
    };
  }
}
