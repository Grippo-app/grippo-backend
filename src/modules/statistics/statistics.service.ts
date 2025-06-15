import {Inject, Injectable} from '@nestjs/common';
import {UsersEntity} from '../../entities/users.entity';
import {Repository} from 'typeorm';
import {TrainingsEntity} from '../../entities/trainings.entity';
import {ExercisesEntity} from '../../entities/exercises.entity';
import {IterationsEntity} from '../../entities/iterations.entity';
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";
import {ExerciseVolumeRequest, MaxRepetitionRequest, MaxWeightRequest} from "./dto/exercise.response";

@Injectable()
export class StatisticsService {
    constructor(
        @Inject('USERS_REPOSITORY')
        private readonly usersRepository: Repository<UsersEntity>,
        @Inject('TRAININGS_REPOSITORY')
        private readonly trainingsRepository: Repository<TrainingsEntity>,
        @Inject('EXERCISES_REPOSITORY')
        private readonly exercisesRepository: Repository<ExercisesEntity>,
        @Inject('ITERATIONS_REPOSITORY')
        private readonly iterationsRepository: Repository<IterationsEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY')
        private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
    ) {
    }

    async getExerciseExampleAchievements(id: string, user, size: number) {
        const maxWeight = await this.iterationsRepository
            .createQueryBuilder("iterations")
            .leftJoin('iterations.exercise', 'exercise')
            .leftJoin('exercise.exerciseExample', 'exerciseExample')
            .leftJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId: user.id})
            .andWhere('exercise.exerciseExampleId = :id', {id})
            .select([
                'iterations.id',
                'iterations.createdAt',
                'exercise.id',
                'exerciseExample.id',
                'iterations.weight',
            ])
            .orderBy('iterations.weight', "DESC")
            .getOne();

        const maxRepetition = await this.iterationsRepository
            .createQueryBuilder("iterations")
            .leftJoin('iterations.exercise', 'exercise')
            .leftJoin('exercise.exerciseExample', 'exerciseExample')
            .leftJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId: user.id})
            .andWhere('exercise.exerciseExampleId = :id', {id})
            .select([
                'iterations.id',
                'iterations.createdAt',
                'iterations.repetitions',
                'exercise.id',
                'exerciseExample.id',
            ])
            .orderBy('iterations.repetitions', "DESC")
            .getOne();

        const maxVolume = await this.exercisesRepository
            .createQueryBuilder("exercise")
            .leftJoin('exercise.exerciseExample', 'exerciseExample')
            .leftJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId: user.id})
            .andWhere('exercise.exerciseExampleId = :id', {id})
            .select([
                'exercise.id',
                'exercise.volume',
                'exercise.createdAt',
                'exerciseExample.id',
            ])
            .orderBy('exercise.volume', "DESC")
            .getOne();

        const lastVolumes = await this.exercisesRepository
            .createQueryBuilder("exercise")
            .leftJoin('exercise.exerciseExample', 'exerciseExample')
            .leftJoin('exercise.training', 'training')
            .where('training.userId = :userId', {userId: user.id})
            .andWhere('exercise.exerciseExampleId = :id', {id})
            .select([
                'exercise.id',
                'exercise.volume',
                'exercise.createdAt',
                'exerciseExample.id',
            ])
            .orderBy('exercise.createdAt', "DESC")
            .take(size)
            .getMany();

        const lastVolumesResponse = lastVolumes.map(entry => {
            const exerciseResult = new ExerciseVolumeRequest();
            exerciseResult.id = entry.id;
            exerciseResult.volume = entry.volume;
            exerciseResult.createdAt = entry.createdAt;
            exerciseResult.exerciseExampleId = entry.exerciseExample.id;
            return exerciseResult;
        });

        const maxVolumeResponse = new ExerciseVolumeRequest();
        maxVolumeResponse.id = maxVolume.id;
        maxVolumeResponse.volume = maxVolume.volume;
        maxVolumeResponse.createdAt = maxVolume.createdAt;
        maxVolumeResponse.exerciseExampleId = maxVolume.exerciseExample.id;

        const maxWeightResponse = new MaxWeightRequest();
        maxWeightResponse.id = maxWeight.id;
        maxWeightResponse.exerciseId = maxWeight.exercise.id;
        maxWeightResponse.weight = maxWeight.weight;
        maxWeightResponse.createdAt = maxWeight.createdAt;
        maxWeightResponse.exerciseExampleId = maxWeight.exercise.exerciseExample.id;

        const maxRepetitionResponse = new MaxRepetitionRequest();
        maxRepetitionResponse.id = maxRepetition.id;
        maxRepetitionResponse.exerciseId = maxRepetition.exercise.id;
        maxRepetitionResponse.createdAt = maxRepetition.createdAt;
        maxRepetitionResponse.repetition = maxRepetition.repetitions;
        maxRepetitionResponse.exerciseExampleId = maxRepetition.exercise.exerciseExample.id;

        return {
            maxWeight: maxWeightResponse,
            maxRepetition: maxRepetitionResponse,
            maxVolume: maxVolumeResponse,
            lastVolumes: lastVolumesResponse
        }
    }
}
