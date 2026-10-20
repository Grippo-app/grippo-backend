import { SupportedLanguage, SUPPORTED_LANGUAGES } from './i18n.types';

export const isSupportedLanguage = (value: string): value is SupportedLanguage =>
    SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);

export interface LocaleRange {
    languages: readonly SupportedLanguage[];
    specificity: number;
}

/** Explicit primary-language aliases; another language's region never selects a locale. */
export const parseLocaleRange = (value?: string | null): LocaleRange | undefined => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    if (trimmed === '*') return {languages: SUPPORTED_LANGUAGES, specificity: 0};

    const normalized = trimmed.replace(/_/g, '-');
    let locale: Intl.Locale;
    try {
        locale = new Intl.Locale(normalized);
    } catch {
        return undefined;
    }

    switch (locale.language.toLowerCase()) {
        case 'en': return {languages: ['en'], specificity: 1};
        case 'ru': return {languages: ['ru'], specificity: 1};
        case 'uk':
        case 'ua': return {languages: ['ua'], specificity: 1};
        case 'pt':
            // Bare Portuguese can negotiate either edition, preferring Brazilian.
            if (!locale.region) return {languages: ['pt-BR', 'pt-PT'], specificity: 1};
            return {languages: [locale.region.toUpperCase() === 'PT' ? 'pt-PT' : 'pt-BR'], specificity: 2};
        default: return undefined;
    }
};

/** Normalizes a locale to its preferred storage/read code, without likely-subtag inference. */
export const tryNormalizeLocale = (value?: string | null): SupportedLanguage | undefined =>
    value?.trim() === '*' ? undefined : parseLocaleRange(value)?.languages[0];
