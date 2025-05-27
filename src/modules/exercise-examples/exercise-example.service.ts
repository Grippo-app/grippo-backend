import {Inject, Injectable} from '@nestjs/common';
import {UsersEntity} from '../../entities/users.entity';
import {Repository} from 'typeorm';
import {v4} from 'uuid';
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";
import {ExerciseExampleBundlesEntity} from "../../entities/exercise-example-bundles.entity";
import {ExerciseExampleRequest} from "./dto/exercise-example.request";
import {ExerciseExamplesEquipmentsEntity} from "../../entities/exercise-examples-equipments.entity";
import {ExerciseExamplesTutorialsEntity} from "../../entities/exercise-examples-tutorials.entity";
import {ExcludedEquipmentsEntity} from "../../entities/excluded-equipments.entity";
import {ExcludedMusclesEntity} from "../../entities/excluded-muscles.entity";
import {RecommendedRequest} from "./dto/recommended.request";
import {RecommendedUtils} from "../../lib/recommended-utils";
import {ExerciseCategoryEnum} from "../../lib/exercise-category.enum";

@Injectable()
export class ExerciseExampleService {
    constructor(
        @Inject('USERS_REPOSITORY') private readonly usersRepository: Repository<UsersEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY') private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
        @Inject('EXERCISE_EXAMPLE_BUNDLES_REPOSITORY') private readonly exerciseExampleBundlesRepository: Repository<ExerciseExampleBundlesEntity>,
        @Inject('EXERCISE_EXAMPLES_EQUIPMENTS_REPOSITORY') private readonly exerciseExamplesEquipmentsRepository: Repository<ExerciseExamplesEquipmentsEntity>,
        @Inject('EXERCISE_EXAMPLES_TUTORIALS_REPOSITORY') private readonly exerciseExamplesTutorialsEntityRepository: Repository<ExerciseExamplesTutorialsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY') private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY') private excludedMusclesEntity: Repository<ExcludedMusclesEntity>
    ) {
    }

    async getExerciseExamples(): Promise<{ items: ExerciseExamplesEntity[]; total: number }> {
        const items = await this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exerciseExampleBundles')
            .leftJoinAndSelect('exerciseExampleBundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')
            .leftJoinAndSelect('exercise_examples.tutorials', 'tutorials')
            .orderBy('exercise_examples.createdAt', 'DESC')
            .getMany();

        return {items, total: items.length};
    }

    async getExerciseExampleById(id: string): Promise<ExerciseExamplesEntity | null> {
        return await this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .where('exercise_examples.id = :id', {id})
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exercise_example_bundles')
            .leftJoinAndSelect('exercise_example_bundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')
            .leftJoinAndSelect('exercise_examples.tutorials', 'tutorials')
            .getOne();
    }

    async setOrUpdateExerciseExample(body: ExerciseExampleRequest): Promise<ExerciseExamplesEntity | null> {
        const {exerciseExampleBundles, equipmentRefs, tutorials, ...rest} = body;
        const id = body.id ?? v4();

        const exerciseExample = new ExerciseExamplesEntity();
        Object.assign(exerciseExample, rest);
        exerciseExample.id = id;

        const bundles = exerciseExampleBundles.map((el) => {
            const entity = new ExerciseExampleBundlesEntity();
            Object.assign(entity, el);
            entity.id = el.id ?? v4();
            entity.exerciseExampleId = id;
            return entity;
        });

        const equipmentRefsEntities = equipmentRefs.map((el) => {
            const entity = new ExerciseExamplesEquipmentsEntity();
            entity.equipmentId = el.equipmentId;
            entity.exerciseExampleId = id;
            return entity;
        });

        const tutorialEntities = tutorials.map((el) => {
            const entity = new ExerciseExamplesTutorialsEntity();
            entity.value = el.value;
            entity.title = el.title;
            entity.language = el.language;
            entity.author = el.author;
            entity.resourceType = el.resourceType;
            entity.exerciseExampleId = id;
            return entity;
        });

        await this.exerciseExamplesRepository.manager.transaction(async (manager) => {
            await manager.delete(ExerciseExampleBundlesEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesEquipmentsEntity, {exerciseExampleId: id});
            await manager.delete(ExerciseExamplesTutorialsEntity, {exerciseExampleId: id});

            await manager.save(ExerciseExamplesEntity, exerciseExample);
            await manager.save(ExerciseExampleBundlesEntity, bundles);
            await manager.save(ExerciseExamplesEquipmentsEntity, equipmentRefsEntities);
            await manager.save(ExerciseExamplesTutorialsEntity, tutorialEntities);
        });

        return this.getExerciseExampleById(id);
    }

    async getRecommendedExerciseExamples(user, page: number, size: number, body: RecommendedRequest) {
        let recommendations: string[] = [];
        const {targetMuscleId, exerciseExampleIds, exerciseCount} = body;

        const userExperience = await this.usersRepository
            .createQueryBuilder('users')
            .where('users.id = :userId', {userId: user.id})
            .select(['users.experience'])
            .getOne();

        const exercisesBuilder = this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exercise_example_bundles')
            .leftJoinAndSelect('exercise_example_bundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('exercise_examples.tutorials', 'tutorials')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments');

        const trainingExerciseExamples = exerciseExampleIds?.length
            ? await this.exerciseExamplesRepository
                .createQueryBuilder('exercise_examples')
                .andWhere('exercise_examples.id IN (:...exerciseExampleIds)', {exerciseExampleIds})
                .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exercise_example_bundles')
                .leftJoinAndSelect('exercise_example_bundles.muscle', 'muscle')
                .getMany()
            : [];

        const availableExpFilter = RecommendedUtils.getFilterExp(userExperience.experience);
        if (availableExpFilter.length > 0) {
            exercisesBuilder.andWhere('exercise_examples.experience IN (:...availableExpFilter)', {availableExpFilter});
        }

        const excludedUserMuscles = await this.excludedMusclesEntity
            .createQueryBuilder('excluded_muscles')
            .where('excluded_muscles.userId = :userId', {userId: user.id})
            .getMany();

        const excludedUserEquipment = await this.excludedEquipmentsRepository
            .createQueryBuilder('excluded_equipment')
            .where('excluded_equipment.userId = :userId', {userId: user.id})
            .getMany();

        if (excludedUserMuscles.length > 0) {
            const excludedMuscleIds = excludedUserMuscles.map((m) => m.id);
            exercisesBuilder.andWhere('muscle.id NOT IN (:...excludedMuscleIds)', {excludedMuscleIds});
        }

        if (excludedUserEquipment.length > 0) {
            const excludedEquipmentIds = excludedUserEquipment.map((e) => e.id);
            exercisesBuilder.andWhere('equipments.id NOT IN (:...excludedEquipmentIds)', {excludedEquipmentIds});
        }

        if (targetMuscleId) {
            exercisesBuilder
                .andWhere('muscle.id = :targetMuscleId', {targetMuscleId})
                .andWhere('exercise_example_bundles.percentage > :percentage', {percentage: 50});
        }

        const minMaxByTraining = RecommendedUtils.minMaxTrainingExercisesByExp(userExperience.experience);
        if (exerciseCount >= minMaxByTraining[0] && exerciseCount <= minMaxByTraining[1]) {
            recommendations.push(`Optimal count of exercises per training ${minMaxByTraining[0]} - ${minMaxByTraining[1]}, now - ${exerciseCount}`);
        } else if (exerciseCount > minMaxByTraining[1]) {
            recommendations.push(`Optimal count of exercises per training ${minMaxByTraining[0]} - ${minMaxByTraining[1]}, now - ${exerciseCount}`);
        }

        const count = RecommendedUtils.countOfLastMuscleTargetExercises(trainingExerciseExamples);
        const minMaxByMuscle = RecommendedUtils.minMaxMuscleExercisesByExp(userExperience.experience);
        if (count >= minMaxByMuscle[0] && count <= minMaxByMuscle[1]) {
            recommendations.push(`Optimal count of exercises per muscle ${minMaxByMuscle[0]} - ${minMaxByMuscle[1]}, now - ${count}`);
        } else if (count > minMaxByMuscle[1]) {
            recommendations.push(`Optimal count of exercises per muscle ${minMaxByMuscle[0]} - ${minMaxByMuscle[1]}, now - ${count}`);
        }

        const lastTargetCategories = RecommendedUtils.categoryByLastMuscleTarget(trainingExerciseExamples);
        const compoundAndIsolationMap = RecommendedUtils.categoryMapByExp(userExperience.experience);
        const compound = lastTargetCategories.filter((c) => c === ExerciseCategoryEnum.Compound).length;
        const isolation = lastTargetCategories.filter((c) => c === ExerciseCategoryEnum.Isolation).length;

        if (compound < compoundAndIsolationMap[0]) {
            exercisesBuilder.addOrderBy('exercise_examples.category', 'ASC');
            recommendations.push('Recommendation: Compound Exercise');
        }

        if (compound >= compoundAndIsolationMap[0] && isolation > compoundAndIsolationMap[1]) {
            exercisesBuilder.addOrderBy('exercise_examples.category', 'DESC');
            recommendations.push('Recommendation: Isolated Exercise');
        }

        const exercises = await exercisesBuilder
            .skip((page - 1) * size)
            .take(size)
            .getMany();

        return {
            recommendations,
            exercises,
        };
    }
}