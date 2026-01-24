import { Injectable } from '@nestjs/common';
import { ExerciseExamplesEntity } from '../entities/exercise-examples.entity';
import { ExerciseExampleTranslationEntity } from '../entities/exercise-example-translation.entity';
import { DEFAULT_LANGUAGE, SupportedLanguage, SUPPORTED_LANGUAGES } from './i18n.types';
import { tryNormalizeLocale } from './locale.helper';

@Injectable()
export class ExerciseExampleI18nService {
    resolveLanguage(header?: string | string[] | undefined): SupportedLanguage {
        if (Array.isArray(header)) {
            header = header.join(',');
        }

        if (!header) {
            return DEFAULT_LANGUAGE;
        }

        for (const part of header.split(',')) {
            const candidate = part.split(';')[0]?.trim();
            if (!candidate) continue;
            const normalized = tryNormalizeLocale(candidate);
            if (normalized) {
                return normalized;
            }
        }

        return DEFAULT_LANGUAGE;
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
