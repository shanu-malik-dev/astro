export const AUTH_CONSTANTS = {
  DEFAULT_ROLE: 'Customer',
  LOGIN_TYPE: 'OTP',
  TOKEN_TYPE: 'Bearer',
} as const;

export const MOBILE_VALIDATION_RULES = {
  '+91': {
    country: 'India',
    pattern: /^[6-9]\d{9}$/,
    message: 'Mobile number must be a valid 10-digit Indian mobile number.',
  },
  '+1': {
    country: 'United States',
    pattern: /^[2-9]\d{9}$/,
    message: 'Mobile number must be a valid 10-digit US mobile number.',
  },
  '+44': {
    country: 'United Kingdom',
    pattern: /^7\d{9}$/,
    message: 'Mobile number must be a valid 10-digit UK mobile number starting with 7.',
  },
  '+971': {
    country: 'United Arab Emirates',
    pattern: /^5\d{8}$/,
    message: 'Mobile number must be a valid 9-digit UAE mobile number starting with 5.',
  },
} as const;

export const SUPPORTED_COUNTRY_CODES = Object.keys(MOBILE_VALIDATION_RULES);
export const USER_STATUS={
  ACTIVE: 1,
  INACTIVE: 0
}
