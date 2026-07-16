import { AppLanguage } from "./language-context";
import en from "@/lang/en.json";
import hi from "@/lang/hi.json";

type MobileRule = {
  pattern: RegExp;
  maxLength: number;
  messageKey: keyof typeof en.mobileValidation;
};

const dictionaries = { en, hi } as const;

const MOBILE_RULES: Record<string, MobileRule> = {
  "+91": {
    pattern: /^[6-9]\d{9}$/,
    maxLength: 10,
    messageKey: "india",
  },
  "+1": {
    pattern: /^[2-9]\d{9}$/,
    maxLength: 10,
    messageKey: "us",
  },
  "+44": {
    pattern: /^7\d{9}$/,
    maxLength: 10,
    messageKey: "uk",
  },
  "+971": {
    pattern: /^5\d{8}$/,
    maxLength: 9,
    messageKey: "uae",
  },
};

const DEFAULT_MAX_LENGTH = 15;

export function getMobileMaxLength(countryCode: string) {
  return MOBILE_RULES[countryCode]?.maxLength || DEFAULT_MAX_LENGTH;
}

export function validateMobileNumber(
  countryCode: string,
  mobile: string,
  language: AppLanguage
) {
  const rule = MOBILE_RULES[countryCode];

  if (!rule) {
    return {
      valid: /^\d{6,15}$/.test(mobile),
      message: dictionaries[language].mobileValidation.generic,
    };
  }

  return {
    valid: rule.pattern.test(mobile),
    message: dictionaries[language].mobileValidation[rule.messageKey],
  };
}
