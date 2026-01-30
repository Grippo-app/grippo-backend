import {BadRequestException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {v4} from 'uuid';
import {Repository} from 'typeorm';
import {TrainingsRequest} from './dto/trainings.request';
import {TrainingCreateResponse} from './dto/trainings.response';
import {TrainingsEntity} from '../../entities/trainings.entity';
import {ExercisesEntity} from '../../entities/exercises.entity';
import {IterationsEntity} from '../../entities/iterations.entity';
import moment from 'moment';
import {ExerciseExamplesEntity} from '../../entities/exercise-examples.entity';
import {ExerciseExampleI18nService} from '../../i18n/exercise-example-i18n.service';
import {SupportedLanguage} from '../../i18n/i18n.types';
import {UserProfilesEntity} from '../../entities/user-profiles.entity';
import {ExerciseExampleRulesEntity} from '../../entities/exercise-example-rules.entity';
import {ExerciseRulesResponseDto} from '../exercise-examples/dto/exercise-rules.dto';

@Injectable()
export class TrainingsService {
    constructor(
        private readonly exerciseExampleI18nService: ExerciseExampleI18nService,
        @Inject('USER_PROFILES_REPOSITORY') private readonly userProfilesRepository: Repository<UserProfilesEntity>,
        @Inject('TRAININGS_REPOSITORY') private readonly trainingsRepository: Repository<TrainingsEntity>,
        @Inject('EXERCISES_REPOSITORY') private readonly exercisesRepository: Repository<ExercisesEntity>,
        @Inject('ITERATIONS_REPOSITORY') private readonly iterationsRepository: Repository<IterationsEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY') private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
    ) {
    }

    async getTrainings(user, start, end, language: SupportedLanguage) {
        if (!moment(start).isValid() || !moment(end).isValid()) {
            throw new BadRequestException('Wrong date format');
        }

        const profile = await this.requireProfile(user);

        const trainings = await this.trainingsRepository
            .createQueryBuilder('trainings')
            .where('trainings.profile_id = :profileId', {profileId: profile.id})
            .andWhere('date(:start) <= date(trainings.created_at) and date(:end) >= date(trainings.created_at)', {
                start,
                end,
            })
            .leftJoinAndSelect('trainings.exercises', 'exercises')
            .leftJoinAndSelect('exercises.exerciseExample', 'exerciseExample')
            .leftJoinAndSelect('exerciseExample.rule', 'exercise_rules')
            .leftJoinAndSelect('exerciseExample.translations', 'exerciseExampleTranslations')
            .leftJoinAndSelect('exercises.iterations', 'iterations')
            .orderBy('trainings.created_at', 'ASC')
            .addOrderBy('exercises.order_index', 'ASC')
            .addOrderBy('exercises.created_at', 'ASC')
            .addOrderBy('iterations.order_index', 'ASC')
            .addOrderBy('iterations.created_at', 'ASC')
            .getMany();

        if (trainings.length === 0) {
            return trainings;
        }

        trainings.sort((a, b) => +a.createdAt - +b.createdAt);

        for (const training of trainings) {
            if (!training.exercises) continue;
            this.exerciseExampleI18nService.translateExercisesCollection(training.exercises, language);
            training.exercises.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || (+a.createdAt - +b.createdAt));
            for (const exercise of training.exercises) {
                this.attachRulesToExerciseExample(exercise.exerciseExample);
                if (!exercise.iterations) continue;
                exercise.iterations.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || (+a.createdAt - +b.createdAt));
            }
        }

        return trainings;
    }

    async getTrainingById(id: string, user, language: SupportedLanguage) {
        const profile = await this.requireProfile(user);

        const training = await this.trainingsRepository
            .createQueryBuilder('trainings')
            .where('trainings.id = :id', {id})
            .andWhere('trainings.profile_id = :profileId', {profileId: profile.id})
            .leftJoinAndSelect('trainings.exercises', 'exercises')
            .leftJoinAndSelect('exercises.exerciseExample', 'exerciseExample')
            .leftJoinAndSelect('exerciseExample.exerciseExampleBundles', 'exerciseExampleBundles')
            .leftJoinAndSelect('exerciseExampleBundles.muscle', 'muscle')
            .leftJoinAndSelect('exerciseExample.rule', 'exercise_rules')
            .leftJoinAndSelect('exerciseExample.translations', 'exerciseExampleTranslations')
            .leftJoinAndSelect('exercises.iterations', 'iterations')
            .orderBy('trainings.created_at', 'ASC')
            .addOrderBy('exercises.order_index', 'ASC')
            .addOrderBy('exercises.created_at', 'ASC')
            .addOrderBy('iterations.order_index', 'ASC')
            .addOrderBy('iterations.created_at', 'ASC')
            .getOne();

        if (!training) {
            return training;
        }

        if (training.exercises) {
            this.exerciseExampleI18nService.translateExercisesCollection(training.exercises, language);
            training.exercises.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || (+a.createdAt - +b.createdAt));
            for (const exercise of training.exercises) {
                this.attachRulesToExerciseExample(exercise.exerciseExample);
                if (!exercise.iterations) continue;
                exercise.iterations.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || (+a.createdAt - +b.createdAt));
            }
        }

        return training;
    }

    /**
     * Create a new training for the user
     * @param body Training data
     * @param user Current user
     * @returns Object with training ID
     */
    async createTraining(body: TrainingsRequest, user): Promise<TrainingCreateResponse> {
        const profile = await this.requireProfile(user);

        return await this.trainingsRepository.manager.transaction(async (manager) => {
            const {exercises, ...rest} = body;

            const training = manager.create(TrainingsEntity, {
                ...rest,
                id: v4(),
                profileId: profile.id,
            });

            await manager.save(training);

            for (const [exerciseIndex, el] of exercises.entries()) {
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
                    orderIndex: exerciseIndex,
                });

                await manager.save(exercise);

                for (const [iterationIndex, iter] of iterations.entries()) {
                    const iteration = manager.create(IterationsEntity, {
                        ...iter,
                        id: v4(),
                        exerciseId: exercise.id,
                        orderIndex: iterationIndex,
                    });
                    await manager.save(iteration);
                }
            }

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
        const profile = await this.requireProfile(user);

        return await this.trainingsRepository.manager.transaction(async (manager) => {
            // Check if training exists and belongs to the user
            const existingTraining = await this.trainingsRepository.findOne({
                where: {id, profileId: profile.id}
            });

            if (!existingTraining) {
                throw new NotFoundException(`Training with id ${id} not found or access denied`);
            }

            const {exercises, ...rest} = body;

            // Update training data
            await manager.update(TrainingsEntity, {id}, {
                ...rest,
                profileId: profile.id,
            });

            // Remove existing exercises and iterations (cascade will handle iterations)
            await manager.delete(ExercisesEntity, {trainingId: id});

            // Create new exercises and iterations
            for (const [exerciseIndex, el] of exercises.entries()) {
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
                    orderIndex: exerciseIndex,
                });

                await manager.save(exercise);

                for (const [iterationIndex, iter] of iterations.entries()) {
                    const iteration = manager.create(IterationsEntity, {
                        ...iter,
                        id: v4(),
                        exerciseId: exercise.id,
                        orderIndex: iterationIndex,
                    });
                    await manager.save(iteration);
                }
            }
        });
    }

    private buildRulesResponse(rule: ExerciseExampleRulesEntity): ExerciseRulesResponseDto {
        return {
            components: {
                externalWeight: rule.externalWeightRequired === null ? null : {required: rule.externalWeightRequired},
                bodyWeight: rule.bodyWeightMultiplier === null
                    ? null
                    : {participates: true, multiplier: rule.bodyWeightMultiplier},
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

    /**
     * Delete a training by ID
     * @param id Training ID to delete
     * @param user Current user
     */
    async deleteTraining(id: string, user): Promise<void> {
        const profile = await this.requireProfile(user);
        // Check if training exists and belongs to the user
        const existingTraining = await this.trainingsRepository.findOne({
            where: {id, profileId: profile.id}
        });

        if (!existingTraining) {
            throw new NotFoundException(`Training with id ${id} not found or access denied`);
        }

        // Delete the training (cascade will handle exercises and iterations)
        await this.trainingsRepository.delete({id, profileId: profile.id});
    }

    private async requireProfile(user: any): Promise<UserProfilesEntity> {
        const userId = typeof user?.id === 'string' ? user.id : null;
        if (!userId) {
            throw new BadRequestException('User not authenticated');
        }

        const profile = await this.userProfilesRepository.findOne({where: {user: {id: userId}}});
        if (!profile) {
            throw new BadRequestException('User profile not created yet');
        }

        return profile;
    }
}
