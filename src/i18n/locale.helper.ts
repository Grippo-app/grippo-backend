import { DEFAULT_LANGUAGE, SupportedLanguage, SUPPORTED_LANGUAGES } from './i18n.types';

export const isSupportedLanguage = (value: string): value is SupportedLanguage =>
    SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);

/**
 * Normalizes arbitrary locale strings to one of the supported language codes.
 * Returns `undefined` when the value cannot be mapped to a supported language.
 */
export const tryNormalizeLocale = (value?: string | null): SupportedLanguage | undefined => {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    const lowercase = trimmed.toLowerCase();
    if (isSupportedLanguage(lowercase)) {
        return lowercase;
    }

    const normalized = trimmed.replace(/_/g, '-');

    let locale: Intl.Locale;
    try {
        locale = new Intl.Locale(normalized);
    } catch {
        return undefined;
    }

    const primary = locale.language?.toLowerCase();

    if (!primary) {
        return undefined;
    }

    if (isSupportedLanguage(primary)) {
        return primary;
    }

    const maximized = locale.maximize();

    const maximizedLanguage = maximized.language?.toLowerCase();
    if (maximizedLanguage && isSupportedLanguage(maximizedLanguage)) {
        return maximizedLanguage;
    }

    const region = maximized.region?.toLowerCase();
    if (region && isSupportedLanguage(region)) {
        return region;
    }

    return undefined;
};

export const normalizeLocale = (
    value?: string | null,
    fallback: SupportedLanguage = DEFAULT_LANGUAGE,
): SupportedLanguage => tryNormalizeLocale(value) ?? fallback;
