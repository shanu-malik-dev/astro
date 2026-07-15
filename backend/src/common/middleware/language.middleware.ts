import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LanguageContext } from '../i18n/language-context';
import { resolveLang } from '../../lang';

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const lang = resolveLang(req.headers['accept-language']);
    LanguageContext.run(lang, next);
  }
}
