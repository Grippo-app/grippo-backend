import {BadRequestException, Inject, Injectable} from '@nestjs/common';
import {In, Repository} from 'typeorm';
import {IterationsEntity} from '../../entities/iterations.entity';
import {ExercisesEntity} from '../../entities/exercises.entity';
import {
    BestRepetitionsResponseDto,
    BestTonnageResponseDto,
    BestWeightResponseDto,
    ExerciseAchievementsResponseDto,
    LifetimeVolumeResponseDto,
    PeakIntensityResponseDto,
} from './dto/exercise-metrics.response';

@Injectable()
export class ExerciseMetricsService {
    constructor(
        @Inject('ITERATIONS_REPOSITORY') private readonly iterationsRepository: Repository<IterationsEntity>,
        @Inject('EXERCISES_REPOSITORY') private readonly exercisesRepository: Repository<ExercisesEntity>,
    ) {
    }

    private requireUserId(user: any): string {
        const id = user?.id;
        if (!id || typeof id !== 'string') {
            throw new BadRequestException('User not authenticated');
        }
        return id;
    }

    async getAchievements(exerciseExampleId: string, user: any): Promise<ExerciseAchievementsResponseDto> {
        const userId = this.requireUserId(user);

        const [bestWeight, bestTonnage, maxRepetitions, peakIntensity, lifetimeVolume] = await Promise.all([
            this.findBestWeight(exerciseExampleId, userId),
            this.findBestTonnage(exerciseExampleId, userId),
            this.findMaxRepetitions(exerciseExampleId, userId),
            this.findPeakIntensity(exerciseExampleId, userId),
            this.findLifetimeVolume(exerciseExampleId, userId),
        ]);

        return {
            bestWeight,
            bestTonnage,
            maxRepetitions,
            peakIntensity,
            lifetimeVolume,
        };
    }

    async getRecentExercises(exerciseExampleId: string, user: any): Promise<ExercisesEntity[]> {
        const userId = this.requireUserId(user);
        return this.findRecentExercises(exerciseExampleId, userId);
    }

    private async findBestWeight(exerciseExampleId: string, userId: string): Promise<BestWeightResponseDto | null> {
        const iteration = await this.iterationsRepository
            .createQueryBuilder('iteration')
            .innerJoinAndSelect('iteration.exercise', 'exercise')
            .innerJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId})
            .andWhere('exercise.exerciseExampleId = :exerciseExampleId', {exerciseExampleId})
            .andWhere('iteration.weight IS NOT NULL')
            .orderBy('iteration.weight', 'DESC')
            .addOrderBy('iteration.createdAt', 'DESC')
            .getOne();

        if (!iteration) {
            return null;
        }

        return {
            iterationId: iteration.id,
            exerciseId: iteration.exercise?.id ?? null,
            exerciseExampleId: iteration.exercise?.exerciseExampleId ?? null,
            weight: iteration.weight ?? 0,
            createdAt: iteration.createdAt,
        };
    }

    private async findBestTonnage(exerciseExampleId: string, userId: string): Promise<BestTonnageResponseDto | null> {
        const exercise = await this.exercisesRepository
            .createQueryBuilder('exercise')
            .innerJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId})
            .andWhere('exercise.exerciseExampleId = :exerciseExampleId', {exerciseExampleId})
            .andWhere('exercise.volume IS NOT NULL')
            .orderBy('exercise.volume', 'DESC')
            .addOrderBy('exercise.createdAt', 'DESC')
            .getOne();

        if (!exercise) {
            return null;
        }

        return {
            exerciseId: exercise.id,
            exerciseExampleId: exercise.exerciseExampleId,
            tonnage: exercise.volume ?? 0,
            createdAt: exercise.createdAt,
        };
    }

    private async findMaxRepetitions(exerciseExampleId: string, userId: string): Promise<BestRepetitionsResponseDto | null> {
        const iteration = await this.iterationsRepository
            .createQueryBuilder('iteration')
            .innerJoinAndSelect('iteration.exercise', 'exercise')
            .innerJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId})
            .andWhere('exercise.exerciseExampleId = :exerciseExampleId', {exerciseExampleId})
            .andWhere('iteration.repetitions IS NOT NULL')
            .orderBy('iteration.repetitions', 'DESC')
            .addOrderBy('iteration.createdAt', 'DESC')
            .getOne();

        if (!iteration) {
            return null;
        }

        return {
            iterationId: iteration.id,
            exerciseId: iteration.exercise?.id ?? null,
            exerciseExampleId: iteration.exercise?.exerciseExampleId ?? null,
            repetitions: iteration.repetitions ?? 0,
            createdAt: iteration.createdAt,
        };
    }

    private async findPeakIntensity(exerciseExampleId: string, userId: string): Promise<PeakIntensityResponseDto | null> {
        const exercise = await this.exercisesRepository
            .createQueryBuilder('exercise')
            .innerJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId})
            .andWhere('exercise.exerciseExampleId = :exerciseExampleId', {exerciseExampleId})
            .andWhere('exercise.intensity IS NOT NULL')
            .orderBy('exercise.intensity', 'DESC')
            .addOrderBy('exercise.createdAt', 'DESC')
            .getOne();

        if (!exercise) {
            return null;
        }

        return {
            exerciseId: exercise.id,
            exerciseExampleId: exercise.exerciseExampleId,
            intensity: exercise.intensity ?? 0,
            createdAt: exercise.createdAt,
        };
    }

    private async findLifetimeVolume(exerciseExampleId: string, userId: string): Promise<LifetimeVolumeResponseDto | null> {
        const raw = await this.exercisesRepository
            .createQueryBuilder('exercise')
            .select('COALESCE(SUM(exercise.volume), 0)', 'totalVolume')
            .addSelect('COUNT(exercise.id)', 'sessionsCount')
            .addSelect('MIN(exercise.createdAt)', 'firstPerformedAt')
            .addSelect('MAX(exercise.createdAt)', 'lastPerformedAt')
            .innerJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId})
            .andWhere('exercise.exerciseExampleId = :exerciseExampleId', {exerciseExampleId})
            .getRawOne<{ totalVolume: string | null; sessionsCount: string; firstPerformedAt: string | null; lastPerformedAt: string | null }>();

        if (!raw) {
            return null;
        }

        const sessionsCount = Number(raw.sessionsCount ?? 0);
        if (sessionsCount === 0) {
            return null;
        }

        return {
            exerciseExampleId,
            totalVolume: parseFloat(raw.totalVolume ?? '0') || 0,
            sessionsCount,
            firstPerformedAt: raw.firstPerformedAt ? new Date(raw.firstPerformedAt) : new Date(0),
            lastPerformedAt: raw.lastPerformedAt ? new Date(raw.lastPerformedAt) : new Date(0),
        };
    }

    private async findRecentExercises(exerciseExampleId: string, userId: string): Promise<ExercisesEntity[]> {
        const exercises = await this.exercisesRepository
            .createQueryBuilder('exercise')
            .innerJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId})
            .andWhere('exercise.exerciseExampleId = :exerciseExampleId', {exerciseExampleId})
            .orderBy('exercise.createdAt', 'DESC')
            .take(5)
            .getMany();

        if (exercises.length === 0) {
            return [];
        }

        const iterationMap = new Map<string, IterationsEntity[]>();

        const iterations = await this.iterationsRepository.find({
            where: {exerciseId: In(exercises.map((exercise) => exercise.id))},
            order: {createdAt: 'DESC'},
        });

        for (const iteration of iterations) {
            if (!iteration.exerciseId) continue;
            const bucket = iterationMap.get(iteration.exerciseId) ?? [];
            bucket.push(iteration);
            iterationMap.set(iteration.exerciseId, bucket);
        }

        for (const exercise of exercises) {
            exercise.iterations = iterationMap.get(exercise.id) ?? [];
        }

        return exercises;
    }
}
