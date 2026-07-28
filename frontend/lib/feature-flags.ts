export const ADMIN_MODULE_FLAGS = {
  problem: true,
  services: true,
  astrologers: true,
  enquiry: true,
  customers: true,
  followUp: true,
  payments: true,
  support: true,
  roles: true,
  login: false,
} as const;

export const ADMIN_LOGIN_METHOD_FLAGS = {
  emailPassword: true,
  mobileOtp: true,
} as const;
