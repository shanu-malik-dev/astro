export const DATABASE_TABLES = {
  ROLES: 'roles',
  ROLE_ADMIN_MODULES: 'role_admin_modules',
  USERS: 'users',
  LOGIN_LOGS: 'login_logs',
  COUNTRIES: 'countries',
  PROBLEMS: 'problems',
  PROBLEM_TRANSLATIONS: 'problem_translation',
  SERVICES: 'services',
  SERVICE_TRANSLATIONS: 'service_translation',
  PRODUCTS: 'products',
  PRODUCT_TRANSLATIONS: 'product_translation',
  ASTROLOGERS: 'astrologers',
  ASTROLOGER_TRANSLATIONS: 'astrologers_translations',
  ASTROLOGER_RATINGS: 'astrologer_ratings',
  ASTROLOGER_CONSULTATIONS: 'astrologer_consultations',
  ENQUIRIES: 'enquiries',
  FOLLOW_UPS: 'follow_ups',
  CUSTOMER_PAYMENTS: 'customer_payment',
  SUPPORT_REQUESTS: 'support_requests',
} as const;

export const DATABASE_CONSTANTS = DATABASE_TABLES;
