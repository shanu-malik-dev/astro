import { Module } from '@nestjs/common';
import { ThirdPartyHttpService } from './http/third-party-http.service';
import { RazorpayService } from './razorpay/razorpay.service';
import { StripeService } from './stripe/stripe.service';

@Module({
  providers: [ThirdPartyHttpService, RazorpayService, StripeService],
  exports: [ThirdPartyHttpService, RazorpayService, StripeService],
})
export class ThirdPartyModule {}
