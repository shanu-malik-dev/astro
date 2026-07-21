export const DATABASE_TABLES = {
  ROLES: 'roles',
  USERS: 'users',
  LOGIN_LOGS: 'login_logs',
  COUNTRIES: 'countries',
  PROBLEMS: 'problems',
  PROBLEM_TRANSLATIONS: 'problem_translation',
  SERVICES: 'services',
  SERVICE_TRANSLATIONS: 'service_translation',
  ASTROLOGERS: 'astrologers',
  ASTROLOGER_TRANSLATIONS: 'astrologers_translations',
  ASTROLOGER_RATINGS: 'astrologer_ratings',
  ASTROLOGER_CONSULTATIONS: 'astrologer_consultations',
  ENQUIRIES: 'enquiries',
  FOLLOW_UPS: 'follow_ups',
  CUSTOMER_PAYMENTS: 'customer_payment',
} as const;

export const DATABASE_CONSTANTS = DATABASE_TABLES;
