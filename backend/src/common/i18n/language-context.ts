import { AsyncLocalStorage } from 'async_hooks';
import { SupportedLang } from '../../lang';

type LanguageStore = {
  lang: SupportedLang;
};

const languageStorage = new AsyncLocalStorage<LanguageStore>();

export class LanguageContext {
  static run<T>(lang: SupportedLang, callback: () => T): T {
    return languageStorage.run({ lang }, callback);
  }

  static getLang(): SupportedLang {
    return languageStorage.getStore()?.lang || 'en';
  }
}
