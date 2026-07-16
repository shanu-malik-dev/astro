export const DATABASE_TABLES = {
  ROLES: 'roles',
  USERS: 'users',
  LOGIN_LOGS: 'login_logs',
  COUNTRIES: 'countries',
  PROBLEMS: 'problems',
  PROBLEM_TRANSLATIONS: 'problem_translation',
  SERVICES: 'services',
  SERVICE_TRANSLATIONS: 'service_translation',
  ENQUIRIES: 'enquiries',
  FOLLOW_UPS: 'follow_ups',
} as const;

export const DATABASE_CONSTANTS = DATABASE_TABLES;
