export type PaymentLinkResult = {
  providerPaymentId: string;
  paymentLink: string;
  raw: Record<string, unknown>;
};

export type PaymentLinkOptions = {
  expireBy?: number;
};

export type PaymentLinkCustomer = {
  id: number;
  customer_name: string;
  country_code: string;
  mobile: string;
};
