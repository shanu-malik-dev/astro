export const ENQUIRY_STATUS = {
  OPEN: 1,
  CLOSED: 2,
} as const;

export const FOLLOW_UP_STATUS = {
  HOT: 1,
  WARM: 2,
  COLD: 3,
} as const;

export const PAYMENT_STATUS = {
  CREATED: 1,
  PENDING: 2,
  PAID: 3,
  FAILED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
} as const;

export const SUPPORT_STATUS = {
  OPEN: 1,
  CLOSED: 2,
} as const;

export const CUSTOMER_CALL_STATUS = {
  NOT_CALLED: 1,
  CALLED: 2,
} as const;

export const CUSTOMER_SEGMENT = {
  PENDING: 0,
  CONSULTATION_PRODUCT: 1,
  CONSULTATION_ONLY: 2,
  OTHER: 3,
} as const;

export const ASTROLOGER_CONSULTATION_STATUS = {
  PENDING: 1,
  CONFIRMED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUS)[keyof typeof ENQUIRY_STATUS];
export type FollowUpStatus = (typeof FOLLOW_UP_STATUS)[keyof typeof FOLLOW_UP_STATUS];
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type SupportStatus = (typeof SUPPORT_STATUS)[keyof typeof SUPPORT_STATUS];
export type CustomerCallStatus =
  (typeof CUSTOMER_CALL_STATUS)[keyof typeof CUSTOMER_CALL_STATUS];
export type CustomerSegment =
  (typeof CUSTOMER_SEGMENT)[keyof typeof CUSTOMER_SEGMENT];
export type AstrologerConsultationStatus =
  (typeof ASTROLOGER_CONSULTATION_STATUS)[keyof typeof ASTROLOGER_CONSULTATION_STATUS];
