import { LanguageContext } from '../i18n/language-context';
import { getMessage } from '../../lang';

export type ApiResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

export function successResponse<T>(
  messageKey: string,
  data?: T,
): ApiResponse<T> {
  const message = getMessage(messageKey, LanguageContext.getLang());

  return data === undefined
    ? { success: true, message }
    : { success: true, message, data };
}
