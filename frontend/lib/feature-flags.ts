export const ADMIN_MODULE_FLAGS = {
  dashboard: true,
  master: true,
  services: true,
  astrologers: true,
  customers: true,
  enquiry: true,
  countryCodes: true,
  users: true,
  followUp: true,
  payments: true,
  shop: false,
  products: true,
  support: true,
  roles: true,
  content: true,
  login: false,
} as const;

export const ADMIN_LOGIN_METHOD_FLAGS = {
  emailPassword: true,
  mobileOtp: true,
} as const;
