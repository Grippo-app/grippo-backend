import {BadRequestException, Inject, Injectable} from '@nestjs/common';
import {In, Repository} from 'typeorm';
import {IterationsEntity} from '../../entities/iterations.entity';
import {ExercisesEntity} from '../../entities/exercises.entity';
import {BestTonnageResponseDto, BestWeightResponseDto} from './dto/exercise-metrics.response';

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

    async getBestWeight(exerciseExampleId: string, user: any): Promise<BestWeightResponseDto | null> {
        const userId = this.requireUserId(user);

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

    async getBestTonnage(exerciseExampleId: string, user: any): Promise<BestTonnageResponseDto | null> {
        const userId = this.requireUserId(user);

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

    async getRecentExercises(exerciseExampleId: string, user: any): Promise<ExercisesEntity[]> {
        const userId = this.requireUserId(user);

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
