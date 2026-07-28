export const ENQUIRY_STATUS = {
  OPEN: 1,
  CLOSED: 2,
} as const;

export const ENQUIRY_STATUS_LABELS: Record<number, string> = {
  [ENQUIRY_STATUS.OPEN]: "Open",
  [ENQUIRY_STATUS.CLOSED]: "Closed",
};

export const FOLLOW_UP_STATUS = {
  HOT: 1,
  WARM: 2,
  COLD: 3,
} as const;

export const FOLLOW_UP_STATUS_LABELS: Record<number, string> = {
  [FOLLOW_UP_STATUS.HOT]: "Hot",
  [FOLLOW_UP_STATUS.WARM]: "Warm",
  [FOLLOW_UP_STATUS.COLD]: "Cold",
};

export const PAYMENT_STATUS = {
  CREATED: 1,
  PENDING: 2,
  PAID: 3,
  FAILED: 4,
  CANCELLED: 5,
  EXPIRED: 6,
} as const;

export const PAYMENT_STATUS_LABELS: Record<number, string> = {
  [PAYMENT_STATUS.CREATED]: "Created",
  [PAYMENT_STATUS.PENDING]: "Pending",
  [PAYMENT_STATUS.PAID]: "Paid",
  [PAYMENT_STATUS.FAILED]: "Failed",
  [PAYMENT_STATUS.CANCELLED]: "Cancelled",
  [PAYMENT_STATUS.EXPIRED]: "Expired",
};

export const SUPPORT_STATUS = {
  OPEN: 1,
  CLOSED: 2,
} as const;

export const SUPPORT_STATUS_LABELS: Record<number, string> = {
  [SUPPORT_STATUS.OPEN]: "Open",
  [SUPPORT_STATUS.CLOSED]: "Closed",
};

export const CUSTOMER_CALL_STATUS = {
  NOT_CALLED: 1,
  CALLED: 2,
} as const;

export const CUSTOMER_CALL_STATUS_LABELS: Record<number, string> = {
  [CUSTOMER_CALL_STATUS.NOT_CALLED]: "Not called",
  [CUSTOMER_CALL_STATUS.CALLED]: "Called",
};
