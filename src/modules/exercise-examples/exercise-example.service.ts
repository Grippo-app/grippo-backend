import {BadRequestException, ConflictException, Inject, Injectable, NotFoundException} from '@nestjs/common';
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
import {UserProfilesEntity} from '../../entities/user-profiles.entity';
import {ExerciseExampleRulesEntity} from "../../entities/exercise-example-rules.entity";
import {ExerciseRulesRequestDto, ExerciseRulesResponseDto} from "./dto/exercise-rules.dto";

@Injectable()
export class ExerciseExampleService {
    constructor(
        private readonly exerciseExampleI18nService: ExerciseExampleI18nService,
        @Inject('USER_PROFILES_REPOSITORY') private readonly userProfilesRepository: Repository<UserProfilesEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY') private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
        @Inject('EXERCISE_EXAMPLE_BUNDLES_REPOSITORY') private readonly exerciseExampleBundlesRepository: Repository<ExerciseExampleBundlesEntity>,
        @Inject('EXERCISE_EXAMPLES_EQUIPMENTS_REPOSITORY') private readonly exerciseExamplesEquipmentsRepository: Repository<ExerciseExamplesEquipmentsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY') private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY') private readonly excludedMusclesEntity: Repository<ExcludedMusclesEntity>,
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
            .leftJoinAndSelect('exercise_examples.rule', 'exercise_rules')
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
            .andWhere('t.profileId = :profileId', {profileId})
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
        for (const entity of entities) {
            this.attachRulesToExerciseExample(entity);
        }

        return entities.map((entity) => ({
            entity,
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
            .leftJoinAndSelect('exercise_examples.rule', 'exercise_rules')
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
        this.attachRulesToExerciseExample(entity);

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
            rules,
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

        const rule = this.buildRulesEntity(id, rules);

        await this.exerciseExamplesRepository.manager.transaction(async (manager) => {
            await manager.save(ExerciseExamplesEntity, exerciseExample);
            await manager.save(ExerciseExampleBundlesEntity, bundles);
            await manager.save(ExerciseExamplesEquipmentsEntity, equipmentRefsEntities);
            await manager.save(ExerciseExampleRulesEntity, rule);
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
            rules,
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

        const rule = this.buildRulesEntity(id, rules);

        await this.exerciseExamplesRepository.manager.transaction(async (manager) => {
            await manager.delete(ExerciseExampleBundlesEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesEquipmentsEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExampleTranslationEntity, {exerciseExampleId: id});

            await manager.save(ExerciseExamplesEntity, exerciseExample);
            await manager.save(ExerciseExampleBundlesEntity, bundles);
            await manager.save(ExerciseExamplesEquipmentsEntity, equipmentRefsEntities);
            await manager.save(ExerciseExampleRulesEntity, rule);
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
        const existing = await this.exerciseExamplesRepository.findOne({where: {id}});
        if (!existing) {
            throw new NotFoundException(`Exercise example with id ${id} not found`);
        }

        // Guard: example is used by exercises -> block deletion
        const usageCount = await this.exercisesRepository.count({where: {exerciseExampleId: id}});
        if (usageCount > 0) {
            throw new ConflictException(
                `Cannot delete exercise example ${id}: referenced by ${usageCount} exercise(s).`
            );
        }

        // Transactionally delete direct relations, then the example itself
        await this.exerciseExamplesRepository.manager.transaction(async (manager) => {
            await manager.delete(ExerciseExampleBundlesEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesEquipmentsEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesEntity, {id});
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

    private buildRulesEntity(
        exerciseExampleId: string,
        rules: ExerciseRulesRequestDto,
    ): ExerciseExampleRulesEntity {
        this.validateRules(rules);

        const rule = new ExerciseExampleRulesEntity();
        rule.id = exerciseExampleId;
        rule.exerciseExampleId = exerciseExampleId;

        rule.externalWeightRequired = rules.components.externalWeight?.required ?? null;
        rule.bodyWeightMultiplier = rules.components.bodyWeight?.multiplier ?? null;
        rule.extraWeightRequired = rules.components.extraWeight?.required ?? null;
        rule.assistWeightRequired = rules.components.assistWeight?.required ?? null;
        return rule;
    }

    private validateRules(rules: ExerciseRulesRequestDto): void {
        const components = rules.components;

        if (!components) {
            throw new BadRequestException('Rules components are required');
        }

        const {
            externalWeight,
            bodyWeight,
            extraWeight,
            assistWeight,
        } = components;

        if (externalWeight !== null && bodyWeight !== null) {
            throw new BadRequestException('Rules components externalWeight/bodyWeight are mutually exclusive');
        }

        if (extraWeight !== null && bodyWeight === null) {
            throw new BadRequestException('Rules components extraWeight require bodyWeight');
        }

        if (assistWeight !== null && bodyWeight === null) {
            throw new BadRequestException('Rules components assistWeight require bodyWeight');
        }

        if (externalWeight !== null && (extraWeight !== null || assistWeight !== null)) {
            throw new BadRequestException('Rules components externalWeight cannot be combined with extraWeight or assistWeight');
        }

        if (bodyWeight !== null) {
            if (bodyWeight.required !== true) {
                throw new BadRequestException('Rules components bodyWeight required must be true');
            }
            if (typeof bodyWeight.multiplier !== 'number') {
                throw new BadRequestException('Rules components bodyWeight multiplier is required');
            }
            if (bodyWeight.multiplier < 0.05 || bodyWeight.multiplier > 2.0) {
                throw new BadRequestException('Rules components bodyWeight multiplier out of range');
            }
        }

    }

    private buildRulesResponse(rule: ExerciseExampleRulesEntity): ExerciseRulesResponseDto {
        return {
            components: {
                externalWeight: rule.externalWeightRequired === null ? null : {required: rule.externalWeightRequired},
                bodyWeight: rule.bodyWeightMultiplier === null
                    ? null
                    : {required: true, multiplier: rule.bodyWeightMultiplier},
                extraWeight: rule.extraWeightRequired === null ? null : {required: rule.extraWeightRequired},
                assistWeight: rule.assistWeightRequired === null ? null : {required: rule.assistWeightRequired},
            },
        };
    }

    private attachRulesToExerciseExample(example: ExerciseExamplesEntity | null | undefined): void {
        if (!example) {
            return;
        }

        if (!example.rule) {
            throw new BadRequestException('Rules are required for exercise example');
        }

        const rules = this.buildRulesResponse(example.rule);
        (example as ExerciseExamplesEntity & { rules: ExerciseRulesResponseDto }).rules = rules;
        delete (example as ExerciseExamplesEntity & { rule?: ExerciseExampleRulesEntity }).rule;
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
