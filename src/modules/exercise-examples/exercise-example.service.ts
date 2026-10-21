import {BadRequestException, ConflictException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {EntityManager, In, Repository} from 'typeorm';
import {v4} from 'uuid';
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";
import {ExerciseExampleBundlesEntity} from "../../entities/exercise-example-bundles.entity";
import {ExerciseExampleLocalizedTextDto, ExerciseExampleRequest} from "./dto/exercise-example.request";
import {ExerciseExampleCreateResponse, ExerciseExampleWithStatsResponse} from "./dto/exercise-example.response";
import {ExerciseExampleTranslationsResponse} from './dto/exercise-example-translations.response';
import {ExerciseExampleUpdateRequest} from './dto/exercise-example-update.request';
import {calculateTranslationsRevision} from './exercise-translations-revision';
import {ExerciseExamplesEquipmentsEntity} from "../../entities/exercise-examples-equipments.entity";
import {ExerciseExampleTranslationEntity} from "../../entities/exercise-example-translation.entity";
import {ExercisesEntity} from "../../entities/exercises.entity";
import {ExerciseExampleI18nService} from "../../i18n/exercise-example-i18n.service";
import {DEFAULT_LANGUAGE, SupportedLanguage, SUPPORTED_LANGUAGES} from "../../i18n/i18n.types";
import {UserProfilesEntity} from '../../entities/user-profiles.entity';
import {ExerciseExampleComponentsEntity} from "../../entities/exercise-example-components.entity";
import {ExerciseComponentsDto} from "./dto/exercise-components.dto";
import {MusclesEntity} from "../../entities/muscles.entity";
import {EquipmentsEntity} from "../../entities/equipments.entity";
import {mapExerciseExampleResponse} from './exercise-example-response.mapper';

@Injectable()
export class ExerciseExampleService {
    constructor(
        private readonly exerciseExampleI18nService: ExerciseExampleI18nService,
        @Inject('USER_PROFILES_REPOSITORY') private readonly userProfilesRepository: Repository<UserProfilesEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY') private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
        @Inject('EXERCISES_REPOSITORY') private readonly exercisesRepository: Repository<ExercisesEntity>,
    ) {
    }

    async getExerciseExamples(user: any, language: SupportedLanguage): Promise<ExerciseExampleWithStatsResponse[]> {
        const profileId = await this.resolveProfileId(user);

        const entities = await this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exerciseExampleBundles')
            .leftJoinAndSelect('exerciseExampleBundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')
            .leftJoinAndSelect('exercise_examples.componentsEntity', 'exercise_example_components')
            .leftJoinAndSelect('exercise_examples.translations', 'translations')
            .orderBy('exercise_examples.createdAt', 'DESC')
            .getMany();

        if (entities.length === 0) return [];

        const ids = entities.map(e => e.id);

        const [statsRows, popularityRows] = await Promise.all([
            this.exercisesRepository
                .createQueryBuilder('ex')
                .leftJoin('ex.training', 't')
                .select('ex.exerciseExampleId', 'example_id')
                .addSelect('COUNT(ex.id)', 'usageCount')
                .addSelect('MAX(ex.createdAt)', 'lastUsed')
                .where('ex.exerciseExampleId IN (:...ids)', {ids})
                .andWhere('t.profileId = :profileId', {profileId})
                .groupBy('ex.exerciseExampleId')
                .getRawMany<{ example_id: string; usageCount: string; lastUsed: Date | null }>(),
            this.exercisesRepository
                .createQueryBuilder('ex')
                .select('ex.exerciseExampleId', 'example_id')
                .addSelect('COUNT(ex.id)', 'usageCount')
                .where('ex.exerciseExampleId IN (:...ids)', {ids})
                .groupBy('ex.exerciseExampleId')
                .getRawMany<{ example_id: string; usageCount: string }>(),
        ]);

        const statsMap = new Map<string, { usageCount: number; lastUsed: Date | null }>();
        for (const r of statsRows) {
            statsMap.set(String(r.example_id), {
                usageCount: Number(r.usageCount) || 0,
                lastUsed: r.lastUsed ?? null,
            });
        }

        const popularityMap = new Map<string, number>();
        for (const r of popularityRows) {
            popularityMap.set(String(r.example_id), Number(r.usageCount) || 0);
        }

        entities.sort((a, b) => {
            const popularityDiff = (popularityMap.get(b.id) ?? 0) - (popularityMap.get(a.id) ?? 0);
            if (popularityDiff !== 0) {
                return popularityDiff;
            }

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        this.exerciseExampleI18nService.translateExamples(entities, language);
        return entities.map((entity) => ({
            entity: mapExerciseExampleResponse(entity),
            usageCount: statsMap.get(entity.id)?.usageCount ?? 0,
            lastUsed: statsMap.get(entity.id)?.lastUsed ?? null,
        }));
    }

    async getExerciseExampleById(id: string, user: any, language: SupportedLanguage): Promise<ExerciseExampleWithStatsResponse | null> {
        const profileId = await this.resolveProfileId(user);

        const entity = await this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .where('exercise_examples.id = :id', {id})
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exercise_example_bundles')
            .leftJoinAndSelect('exercise_example_bundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')
            .leftJoinAndSelect('exercise_examples.componentsEntity', 'exercise_example_components')
            .leftJoinAndSelect('exercise_examples.translations', 'translations')
            .getOne();

        if (!entity) return null;

        const stat = await this.exercisesRepository
            .createQueryBuilder('ex')
            .leftJoin('ex.training', 't')
            .select('COUNT(ex.id)', 'usageCount')
            .addSelect('MAX(ex.createdAt)', 'lastUsed')
            .where('ex.exerciseExampleId = :id', {id})
            .andWhere('t.profileId = :profileId', {profileId})
            .getRawOne<{ usageCount: string; lastUsed: Date | null }>();

        this.exerciseExampleI18nService.translateExample(entity, language);
        return {
            entity: mapExerciseExampleResponse(entity),
            usageCount: Number(stat?.usageCount ?? 0),
            lastUsed: stat?.lastUsed ?? null,
        };
    }

    /** Return stored text without applying locale fallback. */
    async getExerciseExampleTranslations(id: string): Promise<ExerciseExampleTranslationsResponse> {
        const example = await this.exerciseExamplesRepository.findOne({
            where: {id},
            relations: ['translations'],
        });
        if (!example) throw new NotFoundException('Exercise example not found');
        return {
            id: example.id,
            translationsRevision: calculateTranslationsRevision(example, example.translations ?? []),
            base: {name: example.name ?? null, description: example.description ?? null},
            translations: (example.translations ?? []).map(translation => ({
                language: translation.language,
                name: translation.name ?? null,
                description: translation.description ?? null,
            })).sort((a, b) => SUPPORTED_LANGUAGES.indexOf(a.language) - SUPPORTED_LANGUAGES.indexOf(b.language)),
        };
    }

    /**
     * Create a new exercise example
     * @param body Exercise example data
     * @returns Object with exercise example ID
     */
    async createExerciseExample(body: ExerciseExampleRequest): Promise<ExerciseExampleCreateResponse> {
        const {
            exerciseExampleBundles,
            equipmentRefs,
            name,
            description,
            components,
            ...rest
        } = body;
        const id = v4();

        const exerciseExample = new ExerciseExamplesEntity();
        Object.assign(exerciseExample, rest);
        exerciseExample.id = id;
        const nameInput = this.prepareTranslationInput(name);
        const descriptionInput = this.prepareTranslationInput(description);
        exerciseExample.name = nameInput.baseValue;
        exerciseExample.description = descriptionInput.baseValue;

        const translationEntities = this.exerciseExampleI18nService.buildTranslationEntities(
            id,
            nameInput.record,
            descriptionInput.record,
        );

        const bundles = exerciseExampleBundles.map((el) => {
            const entity = new ExerciseExampleBundlesEntity();
            Object.assign(entity, el);
            entity.exerciseExampleId = id;
            return entity;
        });

        const equipmentRefsEntities = equipmentRefs.map((el) => {
            const entity = new ExerciseExamplesEquipmentsEntity();
            entity.equipmentId = el.equipmentId;
            entity.exerciseExampleId = id;
            return entity;
        });

        const componentsEntity = this.buildComponentsEntity(id, components);

        await this.exerciseExamplesRepository.manager.transaction(async (manager) => {
            await this.validateReferences(manager, exerciseExampleBundles, equipmentRefs);
            await manager.save(ExerciseExamplesEntity, exerciseExample);
            await manager.save(ExerciseExampleBundlesEntity, bundles);
            await manager.save(ExerciseExamplesEquipmentsEntity, equipmentRefsEntities);
            await manager.save(ExerciseExampleComponentsEntity, componentsEntity);
            if (translationEntities.length > 0) {
                await manager.save(ExerciseExampleTranslationEntity, translationEntities);
            }
        });

        return {id: id};
    }

    /**
     * Update an existing exercise example
     * @param id Exercise example ID to update
     * @param body Updated exercise example data
     */
    async updateExerciseExample(id: string, body: ExerciseExampleUpdateRequest): Promise<void> {
        await this.exerciseExamplesRepository.manager.transaction('READ COMMITTED', async (manager) => {
            const existingExerciseExample = await manager.findOne(ExerciseExamplesEntity, {
                where: {id},
                lock: {mode: 'pessimistic_write'},
            });

            if (!existingExerciseExample) {
                throw new NotFoundException(`Exercise example with id ${id} not found`);
            }

            const {
                exerciseExampleBundles,
                equipmentRefs,
                name,
                description,
                components,
                translationsRevision,
                ...rest
            } = body;

            const currentTranslations = await manager.find(ExerciseExampleTranslationEntity, {
                where: {exerciseExampleId: id},
            });
            this.validateTranslationsUpdate(
                existingExerciseExample,
                currentTranslations,
                name,
                description,
                translationsRevision,
            );

            const exerciseExample = new ExerciseExamplesEntity();
            Object.assign(exerciseExample, rest);
            exerciseExample.id = id;
            const nameInput = this.prepareTranslationInput(name);
            const descriptionInput = this.prepareTranslationInput(description);
            exerciseExample.name = nameInput.baseValue;
            exerciseExample.description = descriptionInput.baseValue;

            const translationEntities = this.exerciseExampleI18nService.buildTranslationEntities(
                id,
                nameInput.record,
                descriptionInput.record,
            );

            const bundles = exerciseExampleBundles.map((el) => {
                const entity = new ExerciseExampleBundlesEntity();
                Object.assign(entity, el);
                entity.exerciseExampleId = id; // связь
                return entity;
            });

            const equipmentRefsEntities = equipmentRefs.map((el) => {
                const entity = new ExerciseExamplesEquipmentsEntity();
                entity.equipmentId = el.equipmentId;
                entity.exerciseExampleId = id;
                return entity;
            });

            const componentsEntity = this.buildComponentsEntity(id, components);

            await this.validateReferences(manager, exerciseExampleBundles, equipmentRefs);
            await manager.delete(ExerciseExampleBundlesEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesEquipmentsEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExampleTranslationEntity, {exerciseExampleId: id});

            await manager.save(ExerciseExamplesEntity, exerciseExample);
            await manager.save(ExerciseExampleBundlesEntity, bundles);
            await manager.save(ExerciseExamplesEquipmentsEntity, equipmentRefsEntities);
            await manager.save(ExerciseExampleComponentsEntity, componentsEntity);
            if (translationEntities.length > 0) {
                await manager.save(ExerciseExampleTranslationEntity, translationEntities);
            }
        });
    }

    /**
     * Delete an exercise example and its direct relations (bundles, equipment refs).
     * Does NOT delete muscles or equipments themselves.
     * Throws 409 if the example is referenced by existing exercises.
     */
    async deleteExerciseExample(id: string): Promise<void> {
        await this.exerciseExamplesRepository.manager.transaction('READ COMMITTED', async (manager) => {
            // FOR UPDATE also waits for FK writers; the next statement sees their commits.
            const existing = await manager.findOne(ExerciseExamplesEntity, {
                where: {id},
                lock: {mode: 'pessimistic_write'},
            });
            if (!existing) {
                throw new NotFoundException(`Exercise example with id ${id} not found`);
            }

            const usageCount = await manager.count(ExercisesEntity, {where: {exerciseExampleId: id}});
            if (usageCount > 0) {
                throw new ConflictException(
                    `Cannot delete exercise example ${id}: referenced by ${usageCount} exercise(s).`
                );
            }

            await manager.delete(ExerciseExampleBundlesEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesEquipmentsEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesEntity, {id});
        });
    }

    private async validateReferences(
        manager: EntityManager,
        bundles: ExerciseExampleRequest['exerciseExampleBundles'],
        equipmentRefs: ExerciseExampleRequest['equipmentRefs'],
    ): Promise<void> {
        const muscleIds = bundles.map(bundle => bundle.muscleId.toLowerCase());
        const equipmentIds = equipmentRefs.map(ref => ref.equipmentId.toLowerCase());
        if (new Set(muscleIds).size !== muscleIds.length || new Set(equipmentIds).size !== equipmentIds.length) {
            throw new BadRequestException('Muscle and equipment references must not contain duplicate IDs');
        }
        if (muscleIds.length > 0) {
            const muscles = await manager.find(MusclesEntity, {
                select: {id: true},
                where: {id: In(muscleIds)},
                order: {id: 'ASC'},
                lock: {mode: 'for_key_share'},
            });
            if (muscles.length !== muscleIds.length) {
                throw new BadRequestException('One or more muscles not found');
            }
        }

        if (equipmentIds.length > 0) {
            const equipments = await manager.find(EquipmentsEntity, {
                select: {id: true},
                where: {id: In(equipmentIds)},
                order: {id: 'ASC'},
                lock: {mode: 'for_key_share'},
            });
            if (equipments.length !== equipmentIds.length) {
                throw new BadRequestException('One or more equipments not found');
            }
        }
    }

    private validateTranslationsUpdate(
        example: ExerciseExamplesEntity,
        currentTranslations: ExerciseExampleTranslationEntity[],
        name: ExerciseExampleLocalizedTextDto[],
        description: ExerciseExampleLocalizedTextDto[],
        translationsRevision?: string,
    ): void {
        const isPortuguese = (language: SupportedLanguage) => language === 'pt-BR' || language === 'pt-PT';
        const currentPortuguese = currentTranslations.filter(translation => isPortuguese(translation.language));
        const revisionRequired = currentPortuguese.length > 0 || [name, description].some(items => {
            const record = this.prepareTranslationInput(items).record;
            return record['pt-BR'] != null || record['pt-PT'] != null;
        });
        if ((revisionRequired || translationsRevision !== undefined)
            && translationsRevision !== calculateTranslationsRevision(example, currentTranslations)) {
            throw new ConflictException({
                code: 'EXERCISE_TRANSLATIONS_STALE',
                message: 'Exercise translations changed. Reload the stored translations before saving.',
            });
        }

        for (const translation of currentPortuguese) {
            const hasName = (name ?? []).some(item => item?.language === translation.language && typeof item.value === 'string');
            const hasDescription = (description ?? []).some(item => item?.language === translation.language && typeof item.value === 'string');
            if (!hasName || !hasDescription) {
                throw new ConflictException({
                    code: 'EXERCISE_TRANSLATIONS_INCOMPLETE',
                    message: `Both name and description must explicitly include ${translation.language}.`,
                });
            }
        }
    }

    private prepareTranslationInput(
        items?: ExerciseExampleLocalizedTextDto[],
    ): {
        record: Partial<Record<SupportedLanguage, string | null>>;
        baseValue: string | null;
    } {
        const record: Partial<Record<SupportedLanguage, string | null>> = {};
        let firstNonNull: string | null = null;

        for (const item of items ?? []) {
            if (!item) continue;
            const normalized = this.normalizeTranslationValue(item.value);
            if (normalized === undefined) continue;
            record[item.language] = normalized;
            if (firstNonNull === null && normalized !== null) {
                firstNonNull = normalized;
            }
        }

        const defaultValue = record[DEFAULT_LANGUAGE];
        const baseValue = defaultValue !== undefined ? defaultValue : firstNonNull;

        return {
            record,
            baseValue: baseValue ?? null,
        };
    }

    private normalizeTranslationValue(value?: string): string | null | undefined {
        if (value === undefined) {
            return undefined;
        }

        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return null;
        }

        return trimmed;
    }

    private buildComponentsEntity(
        exerciseExampleId: string,
        components: ExerciseComponentsDto,
    ): ExerciseExampleComponentsEntity {
        this.validateComponents(components);

        const componentsEntity = new ExerciseExampleComponentsEntity();
        componentsEntity.id = exerciseExampleId;
        componentsEntity.exerciseExampleId = exerciseExampleId;

        componentsEntity.externalWeightRequired = components.externalWeight?.required ?? null;
        componentsEntity.bodyWeightMultiplier = components.bodyWeight?.multiplier ?? null;
        componentsEntity.extraWeightRequired = components.extraWeight?.required ?? null;
        componentsEntity.assistWeightRequired = components.assistWeight?.required ?? null;
        return componentsEntity;
    }

    private validateComponents(components: ExerciseComponentsDto): void {
        if (!components) {
            throw new BadRequestException('Components are required');
        }

        const {
            externalWeight,
            bodyWeight,
            extraWeight,
            assistWeight,
        } = components;

        if (externalWeight !== null && bodyWeight !== null) {
            throw new BadRequestException('Components externalWeight/bodyWeight are mutually exclusive');
        }

        if (extraWeight !== null && bodyWeight === null) {
            throw new BadRequestException('Components extraWeight require bodyWeight');
        }

        if (assistWeight !== null && bodyWeight === null) {
            throw new BadRequestException('Components assistWeight require bodyWeight');
        }

        if (externalWeight !== null && (extraWeight !== null || assistWeight !== null)) {
            throw new BadRequestException('Components externalWeight cannot be combined with extraWeight or assistWeight');
        }

        if (bodyWeight !== null) {
            if (bodyWeight.required !== true) {
                throw new BadRequestException('Components bodyWeight required must be true');
            }
            if (typeof bodyWeight.multiplier !== 'number') {
                throw new BadRequestException('Components bodyWeight multiplier is required');
            }
            if (bodyWeight.multiplier < 0.05 || bodyWeight.multiplier > 2.0) {
                throw new BadRequestException('Components bodyWeight multiplier out of range');
            }
        }

    }

    private async resolveProfileId(user: any): Promise<string> {
        const userId = typeof user?.id === 'string' && user.id.length > 0 ? user.id : null;
        if (!userId) {
            throw new BadRequestException('User not authenticated');
        }

        const profile = await this.userProfilesRepository.findOne({where: {user: {id: userId}}});
        if (!profile) {
            throw new BadRequestException('User profile not created yet');
        }

        return profile.id;
    }
}
