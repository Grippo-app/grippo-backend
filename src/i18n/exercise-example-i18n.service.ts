import { Injectable } from '@nestjs/common';
import { ExerciseExamplesEntity } from '../entities/exercise-examples.entity';
import { ExerciseExampleTranslationEntity } from '../entities/exercise-example-translation.entity';
import { DEFAULT_LANGUAGE, SupportedLanguage, SUPPORTED_LANGUAGES } from './i18n.types';

@Injectable()
export class ExerciseExampleI18nService {
    resolveLanguage(header?: string | string[] | undefined): SupportedLanguage {
        if (Array.isArray(header)) {
            header = header.join(',');
        }

        if (!header) {
            return DEFAULT_LANGUAGE;
        }

        const candidates = header
            .split(',')
            .map((part) => part.split(';')[0]?.trim().toLowerCase())
            .filter((part): part is string => Boolean(part));

        for (const candidate of candidates) {
            for (const supported of SUPPORTED_LANGUAGES) {
                if (candidate === supported || candidate.startsWith(`${supported}-`)) {
                    return supported;
                }
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
        const defaultTranslation = translations.find((t) => t.language === DEFAULT_LANGUAGE);

        const fallbackName = example.name ?? null;
        const fallbackDescription = example.description ?? null;

        example.name = directTranslation?.name ?? defaultTranslation?.name ?? fallbackName;
        example.description = directTranslation?.description ?? defaultTranslation?.description ?? fallbackDescription;

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
        existing: ExerciseExampleTranslationEntity[] | undefined,
        nameTranslations?: Partial<Record<SupportedLanguage, string>>,
        descriptionTranslations?: Partial<Record<SupportedLanguage, string>>,
    ): ExerciseExampleTranslationEntity[] {
        const byLanguage = new Map<SupportedLanguage, ExerciseExampleTranslationEntity>();

        for (const translation of existing ?? []) {
            const entity = new ExerciseExampleTranslationEntity();
            entity.exerciseExampleId = exerciseExampleId;
            entity.language = translation.language;
            entity.name = translation.name;
            entity.description = translation.description;
            byLanguage.set(translation.language, entity);
        }

        for (const language of SUPPORTED_LANGUAGES) {
            const nameUpdate = this.normalizeInput(nameTranslations?.[language]);
            const descriptionUpdate = this.normalizeInput(descriptionTranslations?.[language]);

            if (nameUpdate === undefined && descriptionUpdate === undefined) {
                continue;
            }

            const entity = byLanguage.get(language) ?? new ExerciseExampleTranslationEntity();
            entity.exerciseExampleId = exerciseExampleId;
            entity.language = language;

            if (nameUpdate !== undefined) {
                entity.name = nameUpdate;
            }

            if (descriptionUpdate !== undefined) {
                entity.description = descriptionUpdate;
            }

            if ((entity.name ?? null) === null && (entity.description ?? null) === null) {
                byLanguage.delete(language);
            } else {
                byLanguage.set(language, entity);
            }
        }

        return Array.from(byLanguage.values());
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
