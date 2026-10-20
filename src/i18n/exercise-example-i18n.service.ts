import { Injectable } from '@nestjs/common';
import { ExerciseExamplesEntity } from '../entities/exercise-examples.entity';
import { ExerciseExampleTranslationEntity } from '../entities/exercise-example-translation.entity';
import { DEFAULT_LANGUAGE, SupportedLanguage, SUPPORTED_LANGUAGES } from './i18n.types';
import { parseLocaleRange } from './locale.helper';

@Injectable()
export class ExerciseExampleI18nService {
    resolveLanguage(header?: string | string[] | undefined): SupportedLanguage {
        if (Array.isArray(header)) {
            header = header.join(',');
        }

        if (!header) {
            return DEFAULT_LANGUAGE;
        }

        const candidates = new Map<SupportedLanguage, {quality: number; specificity: number; position: number}>();
        header.split(',').forEach((part, position) => {
            const [tag, ...parameters] = part.split(';').map(value => value.trim());
            const range = parseLocaleRange(tag);
            if (!range || parameters.length > 1) return;

            let quality = 1;
            if (parameters.length) {
                const match = /^q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/i.exec(parameters[0]);
                if (!match) return; // Ignore the entire malformed/unknown parameter member.
                quality = Number(match[1]);
            }

            for (const language of range.languages) {
                const current = candidates.get(language);
                if (!current || range.specificity > current.specificity
                    || (range.specificity === current.specificity && current.quality !== 0
                        && (quality === 0 || quality > current.quality))) {
                    candidates.set(language, {quality, specificity: range.specificity, position});
                }
            }
        });

        let selected: SupportedLanguage = DEFAULT_LANGUAGE;
        let bestQuality = 0;
        let bestPosition = Infinity;
        for (const language of SUPPORTED_LANGUAGES) {
            const candidate = candidates.get(language);
            if (candidate && candidate.quality > 0
                && (candidate.quality > bestQuality
                    || (candidate.quality === bestQuality && candidate.position < bestPosition))) {
                selected = language;
                bestQuality = candidate.quality;
                bestPosition = candidate.position;
            }
        }

        return selected;
    }

    translateExample<T extends ExerciseExamplesEntity | null | undefined>(
        example: T,
        language: SupportedLanguage,
    ): T {
        if (!example) {
            return example;
        }

        const translations = example.translations ?? [];
        const directTranslation = translations.find((t) => t.language === language);
        const defaultTranslation =
            language === DEFAULT_LANGUAGE
                ? directTranslation
                : translations.find((t) => t.language === DEFAULT_LANGUAGE);

        const selectedTranslation = directTranslation ?? defaultTranslation ?? null;
        const fallbackName = example.name ?? null;
        const fallbackDescription = example.description ?? null;
        if (selectedTranslation) {
            example.name = selectedTranslation.name ?? fallbackName;
            example.description = selectedTranslation.description ?? fallbackDescription;
        }

        if (example.translations) {
            delete (example as any).translations;
        }

        return example;
    }

    translateExamples(
        examples: ExerciseExamplesEntity[],
        language: SupportedLanguage,
    ): ExerciseExamplesEntity[] {
        for (const example of examples) {
            this.translateExample(example, language);
        }
        return examples;
    }

    translateExercisesCollection<T extends { exerciseExample?: ExerciseExamplesEntity | null | undefined }>(
        items: T[],
        language: SupportedLanguage,
    ): T[] {
        for (const item of items) {
            if (item.exerciseExample) {
                this.translateExample(item.exerciseExample, language);
            }
        }
        return items;
    }

    buildTranslationEntities(
        exerciseExampleId: string,
        nameTranslations?: Partial<Record<SupportedLanguage, string | null>>,
        descriptionTranslations?: Partial<Record<SupportedLanguage, string | null>>,
    ): ExerciseExampleTranslationEntity[] {
        const result: ExerciseExampleTranslationEntity[] = [];

        for (const language of SUPPORTED_LANGUAGES) {
            const nameUpdate = this.normalizeInput(nameTranslations?.[language]);
            const descriptionUpdate = this.normalizeInput(descriptionTranslations?.[language]);

            if (nameUpdate === undefined && descriptionUpdate === undefined) {
                continue;
            }

            if ((nameUpdate ?? null) === null && (descriptionUpdate ?? null) === null) {
                continue; // drop translation when both fields are null/empty
            }

            const entity = new ExerciseExampleTranslationEntity();
            entity.exerciseExampleId = exerciseExampleId;
            entity.language = language;
            entity.name = nameUpdate ?? null;
            entity.description = descriptionUpdate ?? null;
            result.push(entity);
        }

        return result;
    }

    private normalizeInput(value?: string | null): string | null | undefined {
        if (value === undefined) {
            return undefined;
        }

        if (value === null) {
            return null;
        }

        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
}
