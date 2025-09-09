import {BadRequestException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {Repository} from 'typeorm';
import {TrainingsEntity} from '../../entities/trainings.entity';
import {ExercisesEntity} from '../../entities/exercises.entity';
import {IterationsEntity} from '../../entities/iterations.entity';
import {ExerciseExamplesEntity} from '../../entities/exercise-examples.entity';
import {MusclesEntity} from '../../entities/muscles.entity';
import {MuscleGroupsEntity} from '../../entities/muscle-groups.entity';
import {
    ExerciseExampleAchievementsDto,
    FrequentExerciseDto,
    PersonalRecordDto,
    RecentExerciseDto,
    WorkoutSummaryDto,
} from './dto/exercise.response';

@Injectable()
export class StatisticsService {
    constructor(
        @Inject('TRAININGS_REPOSITORY') private readonly trainingsRepository: Repository<TrainingsEntity>,
        @Inject('EXERCISES_REPOSITORY') private readonly exercisesRepository: Repository<ExercisesEntity>,
        @Inject('ITERATIONS_REPOSITORY') private readonly iterationsRepository: Repository<IterationsEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY') private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
        @Inject('MUSCLES_REPOSITORY') private readonly musclesRepository: Repository<MusclesEntity>,
        @Inject('MUSCLE_GROUPS_REPOSITORY') private readonly muscleGroupsRepository: Repository<MuscleGroupsEntity>,
    ) {
    }

    /** Extracts and validates userId from arbitrary user object. */
    private requireUserId(user: any): string {
        const id = user?.id;
        if (!id || typeof id !== 'string') {
            throw new BadRequestException('User not authenticated');
        }
        return id;
    }

    /** Clamp helper for defensive service-level validation. */
    private clampNumber(n: number, min = 1, max = 100, fallback = 10): number {
        const num = Number(n);
        if (!Number.isFinite(num)) return fallback;
        return Math.max(min, Math.min(max, num));
    }

    // ---------- Achievements by exercise example ----------
    async getExerciseExampleAchievements(id: string, user: any, size: number): Promise<ExerciseExampleAchievementsDto> {
        const userId = this.requireUserId(user);
        size = this.clampNumber(size);

        const exerciseExample = await this.exerciseExamplesRepository.findOne({where: {id}});
        if (!exerciseExample) throw new NotFoundException(`Exercise example with ID ${id} not found`);

        const maxWeightRaw = await this.iterationsRepository
            .createQueryBuilder('it')
            .leftJoin('it.exercise', 'ex')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId = :id', {id})
            .select([
                'it.id AS iteration_id',
                'it.createdAt AS createdAt',
                'it.weight AS weight',
                'ex.id AS exercise_id',
                'ex.exerciseExampleId AS exerciseExample_id',
            ])
            .orderBy('it.weight', 'DESC')
            .addOrderBy('it.createdAt', 'DESC')
            .getRawOne();

        const maxRepetitionRaw = await this.iterationsRepository
            .createQueryBuilder('it')
            .leftJoin('it.exercise', 'ex')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId = :id', {id})
            .select([
                'it.id AS iteration_id',
                'it.createdAt AS createdAt',
                'it.repetitions AS repetitions',
                'ex.id AS exercise_id',
                'ex.exerciseExampleId AS exerciseExample_id',
            ])
            .orderBy('it.repetitions', 'DESC')
            .addOrderBy('it.createdAt', 'DESC')
            .getRawOne();

        const maxVolumeRaw = await this.exercisesRepository
            .createQueryBuilder('ex')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId = :id', {id})
            .select([
                'ex.id AS exercise_id',
                'ex.volume AS volume',
                'ex.createdAt AS createdAt',
                'ex.exerciseExampleId AS exerciseExample_id',
            ])
            .orderBy('ex.volume', 'DESC')
            .addOrderBy('ex.createdAt', 'DESC')
            .getRawOne();

        const lastVolumesRaw = await this.exercisesRepository
            .createQueryBuilder('ex')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId = :id', {id})
            .select([
                'ex.id AS exercise_id',
                'ex.volume AS volume',
                'ex.createdAt AS createdAt',
                'ex.exerciseExampleId AS exerciseExample_id',
            ])
            .orderBy('ex.createdAt', 'DESC')
            .take(size)
            .getRawMany();

        const response = new ExerciseExampleAchievementsDto();

        response.maxWeight = maxWeightRaw
            ? {
                id: String(maxWeightRaw.iteration_id),
                exerciseExampleId: String(maxWeightRaw.exerciseExample_id),
                exerciseId: String(maxWeightRaw.exercise_id),
                createdAt: maxWeightRaw.createdAt,
                weight: Number(maxWeightRaw.weight),
            }
            : null;

        response.maxRepetition = maxRepetitionRaw
            ? {
                id: String(maxRepetitionRaw.iteration_id),
                exerciseExampleId: String(maxRepetitionRaw.exerciseExample_id),
                exerciseId: String(maxRepetitionRaw.exercise_id),
                createdAt: maxRepetitionRaw.createdAt,
                repetition: Number(maxRepetitionRaw.repetitions),
            }
            : null;

        response.maxVolume = maxVolumeRaw
            ? {
                id: String(maxVolumeRaw.exercise_id),
                exerciseExampleId: String(maxVolumeRaw.exerciseExample_id),
                createdAt: maxVolumeRaw.createdAt,
                volume: Number(maxVolumeRaw.volume),
            }
            : null;

        response.lastVolumes = lastVolumesRaw.map((r) => ({
            id: String(r.exercise_id),
            exerciseExampleId: String(r.exerciseExample_id),
            createdAt: r.createdAt,
            volume: Number(r.volume),
        }));

        return response;
    }

    // ---------- Personal records ----------
    async getPersonalRecords(user: any): Promise<PersonalRecordDto[]> {
        const userId = this.requireUserId(user);

        const examples = await this.exerciseExamplesRepository
            .createQueryBuilder('ee')
            .innerJoin('ee.exercises', 'ex')
            .innerJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .select(['ee.id AS id', 'ee.name AS name'])
            .groupBy('ee.id')
            .addGroupBy('ee.name')
            .getRawMany<{ id: string; name: string }>();

        if (examples.length === 0) return [];

        const maxWeightRows = await this.iterationsRepository
            .createQueryBuilder('it')
            .leftJoin('it.exercise', 'ex')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId IS NOT NULL')
            .select([
                'ex.exerciseExampleId AS example_id',
                'it.id AS iteration_id',
                'it.weight AS weight',
                'it.createdAt AS createdAt',
            ])
            .distinctOn(['ex.exerciseExampleId'])
            .orderBy('ex.exerciseExampleId', 'ASC')
            .addOrderBy('it.weight', 'DESC')
            .addOrderBy('it.createdAt', 'DESC')
            .getRawMany();

        const maxRepRows = await this.iterationsRepository
            .createQueryBuilder('it')
            .leftJoin('it.exercise', 'ex')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId IS NOT NULL')
            .select([
                'ex.exerciseExampleId AS example_id',
                'it.id AS iteration_id',
                'it.repetitions AS repetitions',
                'it.createdAt AS createdAt',
            ])
            .distinctOn(['ex.exerciseExampleId'])
            .orderBy('ex.exerciseExampleId', 'ASC')
            .addOrderBy('it.repetitions', 'DESC')
            .addOrderBy('it.createdAt', 'DESC')
            .getRawMany();

        const maxVolRows = await this.exercisesRepository
            .createQueryBuilder('ex')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId IS NOT NULL')
            .select([
                'ex.exerciseExampleId AS example_id',
                'ex.volume AS volume',
                'ex.createdAt AS createdAt',
            ])
            .distinctOn(['ex.exerciseExampleId'])
            .orderBy('ex.exerciseExampleId', 'ASC')
            .addOrderBy('ex.volume', 'DESC')
            .addOrderBy('ex.createdAt', 'DESC')
            .getRawMany();

        const byId = new Map<string, PersonalRecordDto>();
        for (const e of examples) {
            byId.set(e.id, {exerciseExampleId: e.id, exerciseExampleName: e.name});
        }

        for (const r of maxWeightRows) {
            const dto = byId.get(String(r.example_id));
            if (dto) {
                dto.maxWeight = r.weight != null ? Number(r.weight) : undefined;
                dto.maxWeightDate = r.createdAt;
            }
        }
        for (const r of maxRepRows) {
            const dto = byId.get(String(r.example_id));
            if (dto) {
                dto.maxRepetitions = r.repetitions != null ? Number(r.repetitions) : undefined;
                dto.maxRepetitionsDate = r.createdAt;
            }
        }
        for (const r of maxVolRows) {
            const dto = byId.get(String(r.example_id));
            if (dto) {
                dto.maxVolume = r.volume != null ? Number(r.volume) : undefined;
                dto.maxVolumeDate = r.createdAt;
            }
        }

        return Array.from(byId.values());
    }

    // ---------- Workout summary ----------
    async getWorkoutSummary(user: any): Promise<WorkoutSummaryDto> {
        const userId = this.requireUserId(user);

        const qb = this.trainingsRepository.createQueryBuilder('t');

        const totalExercisesSub = qb
            .subQuery()
            .select('COUNT(DISTINCT ex.id)')
            .from(ExercisesEntity, 'ex')
            .innerJoin('ex.training', 't2')
            .where('t2.userId = :userId')
            .getQuery();

        const summary = await qb
            .where('t.userId = :userId', {userId})
            .select([
                'COUNT(DISTINCT t.id) AS "totalWorkouts"',
                'COALESCE(SUM(t.volume), 0) AS "totalVolume"',
                'COALESCE(SUM(t.duration), 0) AS "totalDuration"',
                'COALESCE(AVG(t.intensity), 0) AS "avgIntensity"',
                'MIN(t.createdAt) AS "firstWorkoutDate"',
                'MAX(t.createdAt) AS "lastWorkoutDate"',
                `${totalExercisesSub} AS "totalExercises"`,
            ])
            .setParameter('userId', userId)
            .getRawOne();

        const dto = new WorkoutSummaryDto();
        dto.totalWorkouts = Number(summary?.totalWorkouts) || 0;
        dto.totalVolume = Number(summary?.totalVolume) || 0;
        dto.totalDuration = Number(summary?.totalDuration) || 0;
        dto.averageIntensity = Number(summary?.avgIntensity) || 0;
        dto.totalExercises = Number(summary?.totalExercises) || 0;
        dto.firstWorkoutDate = summary?.firstWorkoutDate ?? null;
        dto.lastWorkoutDate = summary?.lastWorkoutDate ?? null;

        return dto;
    }

    // ---------- By muscle: recent (distinct) ----------
    async getRecentExercises(
        user: any,
        limit = 10,
        filters?: { muscleId?: string; muscleGroupId?: string },
    ): Promise<RecentExerciseDto[]> {
        const userId = this.requireUserId(user);
        limit = this.clampNumber(limit);

        // validate filters only if provided (unified endpoint allows optional filters)
        if (filters?.muscleId) {
            const muscle = await this.musclesRepository.findOne({where: {id: filters.muscleId}});
            if (!muscle) throw new NotFoundException(`Muscle with ID ${filters.muscleId} not found`);
        }
        if (filters?.muscleGroupId) {
            const group = await this.muscleGroupsRepository.findOne({where: {id: filters.muscleGroupId}});
            if (!group) throw new NotFoundException(`Muscle group with ID ${filters.muscleGroupId} not found`);
        }

        const qb = this.exercisesRepository
            .createQueryBuilder('ex')
            .leftJoin('ex.exerciseExample', 'ee')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId IS NOT NULL');

        // join muscles only when needed
        if (filters?.muscleId || filters?.muscleGroupId) {
            qb.leftJoin('ee.exerciseExampleBundles', 'b')
                .leftJoin('b.muscle', 'm')
                .leftJoin('m.muscleGroup', 'mg');

            if (filters.muscleId) qb.andWhere('m.id = :muscleId', {muscleId: filters.muscleId});
            if (filters.muscleGroupId) qb.andWhere('mg.id = :muscleGroupId', {muscleGroupId: filters.muscleGroupId});
        }

        const rows = await qb
            .select([
                'ee.id AS exerciseExample_id',
                'ee.name AS exerciseExample_name',
                'ex.createdAt AS lastUsedAt',
                'ex.volume AS lastVolume',
                'ex.repetitions AS lastRepetitions',
            ])
            .distinctOn(['ee.id'])
            .orderBy('ee.id', 'ASC')
            .addOrderBy('ex.createdAt', 'DESC')
            .take(limit)
            .getRawMany();

        return rows.map((r) => ({
            exerciseExampleId: String(r.exerciseExample_id),
            exerciseExampleName: String(r.exerciseExample_name),
            lastUsedAt: r.lastUsedAt,
            lastVolume: r.lastVolume != null ? Number(r.lastVolume) : undefined,
            lastRepetitions: r.lastRepetitions != null ? Number(r.lastRepetitions) : undefined,
        }));
    }


    // ---------- By muscle: frequent ----------
    async getFrequentExercises(
        user: any,
        limit = 10,
        filters?: { muscleId?: string; muscleGroupId?: string },
    ): Promise<FrequentExerciseDto[]> {
        const userId = this.requireUserId(user);
        limit = this.clampNumber(limit);

        if (filters?.muscleId) {
            const muscle = await this.musclesRepository.findOne({where: {id: filters.muscleId}});
            if (!muscle) throw new NotFoundException(`Muscle with ID ${filters.muscleId} not found`);
        }
        if (filters?.muscleGroupId) {
            const group = await this.muscleGroupsRepository.findOne({where: {id: filters.muscleGroupId}});
            if (!group) throw new NotFoundException(`Muscle group with ID ${filters.muscleGroupId} not found`);
        }

        const qb = this.exercisesRepository
            .createQueryBuilder('ex')
            .leftJoin('ex.exerciseExample', 'ee')
            .leftJoin('ex.training', 't')
            .where('t.userId = :userId', {userId})
            .andWhere('ex.exerciseExampleId IS NOT NULL');

        if (filters?.muscleId || filters?.muscleGroupId) {
            qb.leftJoin('ee.exerciseExampleBundles', 'b')
                .leftJoin('b.muscle', 'm')
                .leftJoin('m.muscleGroup', 'mg');

            if (filters.muscleId) qb.andWhere('m.id = :muscleId', {muscleId: filters.muscleId});
            if (filters.muscleGroupId) qb.andWhere('mg.id = :muscleGroupId', {muscleGroupId: filters.muscleGroupId});
        }

        const rows = await qb
            .select([
                'ee.id AS exerciseExample_id',
                'ee.name AS exerciseExample_name',
                'COUNT(ex.id) AS usageCount',
                'AVG(ex.volume) AS avgVolume',
                'MAX(ex.createdAt) AS lastUsedAt',
            ])
            .groupBy('ee.id')
            .addGroupBy('ee.name')
            .orderBy('usageCount', 'DESC')
            .addOrderBy('lastUsedAt', 'DESC')
            .take(limit)
            .getRawMany();

        return rows.map((r) => ({
            exerciseExampleId: String(r.exerciseExample_id),
            exerciseExampleName: String(r.exerciseExample_name),
            usageCount: Number(r.usageCount) || 0,
            averageVolume: r.avgVolume != null ? Number(r.avgVolume) : undefined,
            lastUsedAt: r.lastUsedAt,
        }));
    }
}
