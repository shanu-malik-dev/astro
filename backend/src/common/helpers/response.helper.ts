import { LanguageContext } from '../i18n/language-context';
import { getMessage } from '../../lang';

export type ApiResponse<T = undefined> = {
  success: boolean;
  statusCode?: number;
  message: string;
  data?: T;
};

export function successResponse<T>(
  messageKey: string,
  data?: T,
  statusCode: number = 200,
): ApiResponse<T> {
  const message = getMessage(messageKey, LanguageContext.getLang());

  const response = statusCode
    ? { success: true, statusCode, message }
    : { success: true, message };

  return data === undefined ? response : { ...response, data };
}
