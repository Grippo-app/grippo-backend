import {BadRequestException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {UsersEntity} from '../../entities/users.entity';
import {v4} from 'uuid';
import {Repository} from 'typeorm';
import {TrainingsRequest} from './dto/trainings.request';
import {TrainingCreateResponse} from './dto/trainings.response';
import {TrainingsEntity} from '../../entities/trainings.entity';
import {ExercisesEntity} from '../../entities/exercises.entity';
import {IterationsEntity} from '../../entities/iterations.entity';
import * as moment from 'moment'
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";

@Injectable()
export class TrainingsService {
    constructor(
        @Inject('USERS_REPOSITORY') private readonly usersRepository: Repository<UsersEntity>,
        @Inject('TRAININGS_REPOSITORY') private readonly trainingsRepository: Repository<TrainingsEntity>,
        @Inject('EXERCISES_REPOSITORY') private readonly exercisesRepository: Repository<ExercisesEntity>,
        @Inject('ITERATIONS_REPOSITORY') private readonly iterationsRepository: Repository<IterationsEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY') private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
    ) {
    }

    async getAllTrainings(user, start, end) {
        if (!moment(start).isValid() || !moment(end).isValid()) {
            throw new BadRequestException('Wrong date format');
        }

        return this.trainingsRepository
            .createQueryBuilder('trainings')
            .where('trainings.user_id = :userId', {userId: user.id})
            .andWhere('date(:start) <= date(trainings.created_at) and date(:end) >= date(trainings.created_at)', {
                start,
                end,
            })
            .leftJoinAndSelect('trainings.exercises', 'exercises')
            .leftJoinAndSelect('exercises.exerciseExample', 'exerciseExample')
            .leftJoinAndSelect('exercises.iterations', 'iterations')
            .addOrderBy('trainings.created_at', 'DESC')
            .getMany();
    }

    async getTrainingById(id: string, user) {
        return this.trainingsRepository
            .createQueryBuilder('trainings')
            .where('trainings.id = :id', {id})
            .andWhere('trainings.user_id = :userId', {userId: user.id})
            .leftJoinAndSelect('trainings.exercises', 'exercises')
            .leftJoinAndSelect('exercises.exerciseExample', 'exerciseExample')
            .leftJoinAndSelect('exerciseExample.exerciseExampleBundles', 'exerciseExampleBundles')
            .leftJoinAndSelect('exerciseExampleBundles.muscle', 'muscle')
            .leftJoinAndSelect('exercises.iterations', 'iterations')
            .addOrderBy('trainings.created_at', 'DESC')
            .getOne();
    }

    /**
     * Create a new training for the user
     * @param body Training data
     * @param user Current user
     * @returns Object with training ID
     */
    async createTraining(body: TrainingsRequest, user): Promise<TrainingCreateResponse> {
        return await this.trainingsRepository.manager.transaction(async (manager) => {
            const {exercises, ...rest} = body;

            const training = manager.create(TrainingsEntity, {
                ...rest,
                id: v4(),
                userId: user.id,
            });

            const exerciseEntities: ExercisesEntity[] = [];
            const iterationEntities: IterationsEntity[] = [];

            for (const el of exercises) {
                const {iterations, exerciseExampleId, ...exerciseData} = el;

                if (exerciseExampleId) {
                    const exists = await this.exerciseExamplesRepository.findOneBy({id: exerciseExampleId});
                    if (!exists) {
                        throw new BadRequestException(`Invalid exerciseExampleId: ${exerciseExampleId}`);
                    }
                }

                const exercise = manager.create(ExercisesEntity, {
                    ...exerciseData,
                    id: v4(),
                    trainingId: training.id,
                    exerciseExampleId: exerciseExampleId || null,
                });

                exerciseEntities.push(exercise);

                for (const iter of iterations) {
                    const iteration = manager.create(IterationsEntity, {
                        ...iter,
                        id: v4(),
                        exerciseId: exercise.id,
                    });
                    iterationEntities.push(iteration);
                }
            }

            await manager.save(training);
            await manager.save(exerciseEntities);
            await manager.save(iterationEntities);

            return {id: training.id};
        });
    }

    /**
     * Update an existing training
     * @param id Training ID to update
     * @param body Updated training data
     * @param user Current user
     */
    async updateTraining(id: string, body: TrainingsRequest, user): Promise<void> {
        return await this.trainingsRepository.manager.transaction(async (manager) => {
            // Check if training exists and belongs to the user
            const existingTraining = await this.trainingsRepository.findOne({
                where: {id, userId: user.id}
            });

            if (!existingTraining) {
                throw new NotFoundException(`Training with id ${id} not found or access denied`);
            }

            const {exercises, ...rest} = body;

            // Update training data
            await manager.update(TrainingsEntity, {id}, {
                ...rest,
                userId: user.id,
            });

            // Remove existing exercises and iterations (cascade will handle iterations)
            await manager.delete(ExercisesEntity, {trainingId: id});

            // Create new exercises and iterations
            const exerciseEntities: ExercisesEntity[] = [];
            const iterationEntities: IterationsEntity[] = [];

            for (const el of exercises) {
                const {iterations, exerciseExampleId, ...exerciseData} = el;

                if (exerciseExampleId) {
                    const exists = await this.exerciseExamplesRepository.findOneBy({id: exerciseExampleId});
                    if (!exists) {
                        throw new BadRequestException(`Invalid exerciseExampleId: ${exerciseExampleId}`);
                    }
                }

                const exercise = manager.create(ExercisesEntity, {
                    ...exerciseData,
                    id: v4(),
                    trainingId: id,
                    exerciseExampleId: exerciseExampleId || null,
                });

                exerciseEntities.push(exercise);

                for (const iter of iterations) {
                    const iteration = manager.create(IterationsEntity, {
                        ...iter,
                        id: v4(),
                        exerciseId: exercise.id,
                    });
                    iterationEntities.push(iteration);
                }
            }

            await manager.save(exerciseEntities);
            await manager.save(iterationEntities);
        });
    }

    /**
     * Delete a training by ID
     * @param id Training ID to delete
     * @param user Current user
     */
    async deleteTraining(id: string, user): Promise<void> {
        // Check if training exists and belongs to the user
        const existingTraining = await this.trainingsRepository.findOne({
            where: {id, userId: user.id}
        });

        if (!existingTraining) {
            throw new NotFoundException(`Training with id ${id} not found or access denied`);
        }

        // Delete the training (cascade will handle exercises and iterations)
        await this.trainingsRepository.delete({id, userId: user.id});
    }
}