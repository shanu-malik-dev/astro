import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThirdPartyHttpService } from '../http/third-party-http.service';
import {
  PaymentLinkCustomer,
  PaymentLinkResult,
} from '../types/payment-link-result.type';

type StripeCheckoutSessionResponse = Record<string, unknown> & {
  id?: string;
  url?: string;
};

@Injectable()
export class StripeService {
  private readonly checkoutSessionUrl =
    'https://api.stripe.com/v1/checkout/sessions';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: ThirdPartyHttpService,
  ) {}

  async createCheckoutLink(
    enquiry: PaymentLinkCustomer,
    amount: number,
    currency: string,
  ): Promise<PaymentLinkResult> {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) throw new BadRequestException('Stripe secret key is not configured.');

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${frontendUrl}/admin?payment=success`);
    params.set('cancel_url', `${frontendUrl}/admin?payment=cancelled`);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', currency.toLowerCase());
    params.set(
      'line_items[0][price_data][unit_amount]',
      String(Math.round(amount * 100)),
    );
    params.set(
      'line_items[0][price_data][product_data][name]',
      `Astro consultation enquiry #${enquiry.id}`,
    );
    params.set('metadata[enq_id]', String(enquiry.id));
    params.set('metadata[customer_mobile]', `${enquiry.country_code}${enquiry.mobile}`);

    const response = await this.httpService.post<StripeCheckoutSessionResponse>(
      this.checkoutSessionUrl,
      params,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return {
      providerPaymentId: String(response.data.id || ''),
      paymentLink: String(response.data.url || ''),
      raw: response.data,
    };
  }
}
