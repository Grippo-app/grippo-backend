import 'express-serve-static-core';
import { SupportedLanguage } from '../i18n/i18n.types';

declare module 'express-serve-static-core' {
    interface Request {
        locale?: SupportedLanguage;
    }
}
