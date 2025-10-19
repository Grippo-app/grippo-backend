import {BadRequestException, ConflictException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {UsersEntity} from '../../entities/users.entity';
import {Repository} from 'typeorm';
import {v4} from 'uuid';
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";
import {ExerciseExampleBundlesEntity} from "../../entities/exercise-example-bundles.entity";
import {ExerciseExampleLocalizedTextDto, ExerciseExampleRequest} from "./dto/exercise-example.request";
import {ExerciseExampleCreateResponse, ExerciseExampleWithStatsResponse} from "./dto/exercise-example.response";
import {ExerciseExamplesEquipmentsEntity} from "../../entities/exercise-examples-equipments.entity";
import {ExerciseExampleTranslationEntity} from "../../entities/exercise-example-translation.entity";
import {ExcludedEquipmentsEntity} from "../../entities/excluded-equipments.entity";
import {ExcludedMusclesEntity} from "../../entities/excluded-muscles.entity";
import {ExercisesEntity} from "../../entities/exercises.entity";
import {ExerciseExampleI18nService} from "../../i18n/exercise-example-i18n.service";
import {DEFAULT_LANGUAGE, SupportedLanguage} from "../../i18n/i18n.types";

@Injectable()
export class ExerciseExampleService {
    constructor(
        private readonly exerciseExampleI18nService: ExerciseExampleI18nService,
        @Inject('USERS_REPOSITORY') private readonly usersRepository: Repository<UsersEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY') private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
        @Inject('EXERCISE_EXAMPLE_BUNDLES_REPOSITORY') private readonly exerciseExampleBundlesRepository: Repository<ExerciseExampleBundlesEntity>,
        @Inject('EXERCISE_EXAMPLES_EQUIPMENTS_REPOSITORY') private readonly exerciseExamplesEquipmentsRepository: Repository<ExerciseExamplesEquipmentsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY') private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY') private readonly excludedMusclesEntity: Repository<ExcludedMusclesEntity>,
        @Inject('EXERCISES_REPOSITORY') private readonly exercisesRepository: Repository<ExercisesEntity>,
    ) {
    }

    async getExerciseExamples(user: any, language: SupportedLanguage): Promise<ExerciseExampleWithStatsResponse[]> {
        const userId = typeof user?.id === 'string' && user.id.length > 0 ? user.id : null;
        if (!userId) throw new BadRequestException('User not authenticated');

        const entities = await this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exerciseExampleBundles')
            .leftJoinAndSelect('exerciseExampleBundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')
            .leftJoinAndSelect('exercise_examples.translations', 'translations')
            .orderBy('exercise_examples.createdAt', 'DESC')
            .getMany();

        if (entities.length === 0) return [];

        const ids = entities.map(e => e.id);

        // Aggregate stats for visible example IDs
        const statsRows = await this.exercisesRepository
            .createQueryBuilder('ex')
            .leftJoin('ex.training', 't')
            .select('ex.exerciseExampleId', 'example_id')
            .addSelect('COUNT(ex.id)', 'usageCount')
            .addSelect('MAX(ex.createdAt)', 'lastUsed')
            .where('ex.exerciseExampleId IN (:...ids)', {ids})
            .andWhere('t.userId = :userId', {userId})
            .groupBy('ex.exerciseExampleId')
            .getRawMany<{ example_id: string; usageCount: string; lastUsed: Date | null }>();

        const statsMap = new Map<string, { usageCount: number; lastUsed: Date | null }>();
        for (const r of statsRows) {
            statsMap.set(String(r.example_id), {
                usageCount: Number(r.usageCount) || 0,
                lastUsed: r.lastUsed ?? null,
            });
        }

        this.exerciseExampleI18nService.translateExamples(entities, language);

        return entities.map((entity) => ({
            entity,
            usageCount: statsMap.get(entity.id)?.usageCount ?? 0,
            lastUsed: statsMap.get(entity.id)?.lastUsed ?? null,
        }));
    }

    async getExerciseExampleById(id: string, user: any, language: SupportedLanguage): Promise<ExerciseExampleWithStatsResponse | null> {
        const userId = typeof user?.id === 'string' && user.id.length > 0 ? user.id : null;
        if (!userId) throw new BadRequestException('User not authenticated');

        const entity = await this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .where('exercise_examples.id = :id', {id})
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exercise_example_bundles')
            .leftJoinAndSelect('exercise_example_bundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')
            .leftJoinAndSelect('exercise_examples.translations', 'translations')
            .getOne();

        if (!entity) return null;

        const stat = await this.exercisesRepository
            .createQueryBuilder('ex')
            .leftJoin('ex.training', 't')
            .select('COUNT(ex.id)', 'usageCount')
            .addSelect('MAX(ex.createdAt)', 'lastUsed')
            .where('ex.exerciseExampleId = :id', {id})
            .andWhere('t.userId = :userId', {userId})
            .getRawOne<{ usageCount: string; lastUsed: Date | null }>();

        this.exerciseExampleI18nService.translateExample(entity, language);

        return {
            entity,
            usageCount: Number(stat?.usageCount ?? 0),
            lastUsed: stat?.lastUsed ?? null,
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
            entity.id = id;
            entity.exerciseExampleId = id;
            return entity;
        });

        const equipmentRefsEntities = equipmentRefs.map((el) => {
            const entity = new ExerciseExamplesEquipmentsEntity();
            entity.equipmentId = el.equipmentId;
            entity.exerciseExampleId = id;
            return entity;
        });


        await this.exerciseExamplesRepository.manager.transaction(async (manager) => {
            await manager.save(ExerciseExamplesEntity, exerciseExample);
            await manager.save(ExerciseExampleBundlesEntity, bundles);
            await manager.save(ExerciseExamplesEquipmentsEntity, equipmentRefsEntities);
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
    async updateExerciseExample(id: string, body: ExerciseExampleRequest): Promise<void> {
        // Check if exercise example exists
        const existingExerciseExample = await this.exerciseExamplesRepository.findOne({
            where: {id},
        });

        if (!existingExerciseExample) {
            throw new NotFoundException(`Exercise example with id ${id} not found`);
        }

        const {
            exerciseExampleBundles,
            equipmentRefs,
            name,
            description,
            ...rest
        } = body;

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


        await this.exerciseExamplesRepository.manager.transaction(async (manager) => {
            await manager.delete(ExerciseExampleBundlesEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesEquipmentsEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExampleTranslationEntity, {exerciseExampleId: id});

            await manager.save(ExerciseExamplesEntity, exerciseExample);
            await manager.save(ExerciseExampleBundlesEntity, bundles);
            await manager.save(ExerciseExamplesEquipmentsEntity, equipmentRefsEntities);
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
        // Check existence
        const existing = await this.exerciseExamplesRepository.findOne({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Exercise example with id ${id} not found`);
        }

        // Guard: example is used by exercises -> block deletion
        const usageCount = await this.exercisesRepository.count({ where: { exerciseExampleId: id } });
        if (usageCount > 0) {
            throw new ConflictException(
                `Cannot delete exercise example ${id}: referenced by ${usageCount} exercise(s).`
            );
        }

        // Transactionally delete direct relations, then the example itself
        await this.exerciseExamplesRepository.manager.transaction(async (manager) => {
            await manager.delete(ExerciseExampleBundlesEntity, { exerciseExampleId: id });
            await manager.delete(ExerciseExamplesEquipmentsEntity, { exerciseExampleId: id });
            await manager.delete(ExerciseExamplesEntity, { id });
        });
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
}
