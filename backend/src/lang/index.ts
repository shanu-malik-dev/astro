import { en } from './en';
import { hi } from './hi';

export const messages = {
  en,
  hi,
} as const;

export type SupportedLang = keyof typeof messages;
export type MessageKey = keyof typeof en;

export function resolveLang(acceptLanguage?: string | string[]): SupportedLang {
  const header = Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage;
  const rawLang = header?.split(',')[0]?.trim().toLowerCase();
  const lang = rawLang?.split('-')[0] as SupportedLang | undefined;

  return lang && lang in messages ? lang : 'en';
}

export function getMessage(key: string, lang?: SupportedLang): string {
  const selectedLang = lang || 'en';
  const messageKey = key as MessageKey;

  return messages[selectedLang][messageKey] || messages.en[messageKey] || key;
}
