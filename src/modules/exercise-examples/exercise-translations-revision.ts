import {createHash} from 'crypto';
import {SupportedLanguage, SUPPORTED_LANGUAGES} from '../../i18n/i18n.types';

type StoredExampleText = {
    id: string;
    name: string | null;
    description: string | null;
};

type StoredTranslationText = {
    language: SupportedLanguage;
    name: string | null;
    description: string | null;
};

/** Hash stored text only; child identity and load order are not part of the snapshot. */
export function calculateTranslationsRevision(
    example: StoredExampleText,
    translations: readonly StoredTranslationText[],
): string {
    const rows = [...translations]
        .sort((a, b) => SUPPORTED_LANGUAGES.indexOf(a.language) - SUPPORTED_LANGUAGES.indexOf(b.language))
        .map(translation => [translation.language, translation.name, translation.description]);
    const snapshot = [
        'grippo.exercise-translations.v1',
        example.id,
        [example.name, example.description],
        rows,
    ];
    return createHash('sha256').update(JSON.stringify(snapshot), 'utf8').digest('hex');
}
