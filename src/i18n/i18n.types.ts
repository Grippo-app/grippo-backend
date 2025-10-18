export const SUPPORTED_LANGUAGES = ['en', 'ua', 'ru'] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
