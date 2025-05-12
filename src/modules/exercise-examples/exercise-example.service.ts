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
import {FiltersRequest} from "./dto/filters.request";
import {RecommendedUtils} from "../../lib/recommended-utils";
import {ExerciseCategoryEnum} from "../../lib/exercise-category.enum";

@Injectable()
export class ExerciseExampleService {
    constructor(
        @Inject('USERS_REPOSITORY')
        private readonly usersRepository: Repository<UsersEntity>,
        @Inject('EXERCISE_EXAMPLES_REPOSITORY')
        private readonly exerciseExamplesRepository: Repository<ExerciseExamplesEntity>,
        @Inject('EXERCISE_EXAMPLE_BUNDLES_REPOSITORY')
        private readonly exerciseExampleBundlesRepository: Repository<ExerciseExampleBundlesEntity>,
        @Inject('EXERCISE_EXAMPLES_EQUIPMENTS_REPOSITORY')
        private readonly exerciseExamplesEquipmentsRepository: Repository<ExerciseExamplesEquipmentsEntity>,
        @Inject('EXERCISE_EXAMPLES_TUTORIALS_REPOSITORY')
        private readonly exerciseExamplesTutorialsEntityRepository: Repository<ExerciseExamplesTutorialsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY')
        private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY')
        private excludedMusclesEntity: Repository<ExcludedMusclesEntity>
    ) {
    }

    async getExerciseExamples(page: number, size: number, body: FiltersRequest) {

        const {query, weightType, experience, forceType, category, muscleIds, equipmentIds} = body;

        const queryBuilder = this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exerciseExampleBundles')
            .leftJoinAndSelect('exerciseExampleBundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('exercise_examples.tutorials', 'tutorials')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')

        if (query) {
            queryBuilder.andWhere('exercise_examples.name ILIKE :query', {query: `%${query}%`});
        }

        if (weightType) {
            queryBuilder.andWhere('exercise_examples.weightType = :weightType', {weightType});
        }

        if (experience) {
            queryBuilder.andWhere('exercise_examples.experience = :experience', {experience});
        }

        if (forceType) {
            queryBuilder.andWhere('exercise_examples.forceType = :forceType', {forceType});
        }

        if (category) {
            queryBuilder.andWhere('exercise_examples.category = :category', {category});
        }

        if (muscleIds && muscleIds.length > 0) {
            queryBuilder.andWhere('muscle.id IN (:...muscleIds)', {muscleIds});
        }

        if (equipmentIds && equipmentIds.length > 0) {
            queryBuilder.andWhere('equipments.id IN (:...equipmentIds)', {equipmentIds});
        }

        return await queryBuilder
            .addOrderBy('exercise_examples.createdAt', 'DESC')
            .skip((page - 1) * size)
            .take(size)
            .getMany()
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
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')

        let trainingExerciseExamples = exerciseExampleIds && exerciseExampleIds.length > 0
            ? await this.exerciseExamplesRepository
                .createQueryBuilder('exercise_examples')
                .andWhere('exercise_examples.id IN (:...exerciseExampleIds)', {exerciseExampleIds})
                .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exercise_example_bundles')
                .leftJoinAndSelect('exercise_example_bundles.muscle', 'muscle')
                .getMany() : [];

        //----------------------------------------

        const availableExpFilter = RecommendedUtils
            .getFilterExp(userExperience.experience)

        if (availableExpFilter.length > 0) {
            exercisesBuilder
                .andWhere('exercise_examples.experience IN (:...availableExpFilter)', {availableExpFilter})
        }

        //----------------------------------------

        const excludedUserMuscles = await this.excludedMusclesEntity
            .createQueryBuilder("excluded_muscles")
            .where('excluded_muscles.userId = :userId', {userId: user.id})
            .getMany()

        const excludedUserEquipment = await this.excludedEquipmentsRepository
            .createQueryBuilder("excluded_equipment")
            .where('excluded_equipment.userId = :userId', {userId: user.id})
            .getMany()

        if (excludedUserMuscles.length > 0) {
            const excludedMuscleIds = excludedUserMuscles.map(muscle => muscle.id);
            exercisesBuilder.andWhere('muscle.id NOT IN (:...excludedMuscleIds)', {excludedMuscleIds});
        }

        if (excludedUserEquipment.length > 0) {
            const excludedEquipmentIds = excludedUserEquipment.map(equipment => equipment.id);
            exercisesBuilder.andWhere('equipments.id NOT IN (:...excludedEquipmentIds)', {excludedEquipmentIds});
        }

        //----------------------------------------

        if (targetMuscleId) {
            exercisesBuilder
                .andWhere('muscle.id = :targetMuscleId', {targetMuscleId})
                .andWhere('exercise_example_bundles.percentage > :percentage', {percentage: 50})
        }

        //----------------------------------------

        const minMaxByTraining = RecommendedUtils.minMaxTrainingExercisesByExp(userExperience.experience)

        if (exerciseCount >= minMaxByTraining[0] && exerciseCount <= minMaxByTraining[1]) {
            recommendations.push(`Optimal count of exercises per training ${minMaxByTraining[0]} - ${minMaxByTraining[1]}, now - ${exerciseCount}`)
        } else if (exerciseCount > minMaxByTraining[1]) {
            recommendations.push(`Optimal count of exercises per training ${minMaxByTraining[0]} - ${minMaxByTraining[1]}, now - ${exerciseCount}`)
        }

        //----------------------------------------

        const count = RecommendedUtils.countOfLastMuscleTargetExercises(trainingExerciseExamples)
        const minMaxByMuscle = RecommendedUtils.minMaxMuscleExercisesByExp(userExperience.experience)

        if (count >= minMaxByMuscle[0] && count <= minMaxByMuscle[1]) {
            recommendations.push(`Optimal count of exercises per muscle ${minMaxByMuscle[0]} - ${minMaxByMuscle[1]}, now - ${count}`)
        } else if (count > minMaxByMuscle[1]) {
            recommendations.push(`Optimal count of exercises per muscle ${minMaxByMuscle[0]} - ${minMaxByMuscle[1]}, now - ${count}`)
        }

        //----------------------------------------

        const lastTargetCategories = RecommendedUtils.categoryByLastMuscleTarget(trainingExerciseExamples)
        const compoundAndIsolationMap = RecommendedUtils.categoryMapByExp(userExperience.experience)
        const compound = lastTargetCategories.filter((item) => item == ExerciseCategoryEnum.Compound).length
        const isolation = lastTargetCategories.filter((item) => item == ExerciseCategoryEnum.Isolation).length

        if (compound < compoundAndIsolationMap[0]) {
            exercisesBuilder.addOrderBy(`exercise_examples.category`, "ASC")
            recommendations.push(`Recommendation: Compound Exercise`)
        }

        if (compound >= compoundAndIsolationMap[0] && isolation > compoundAndIsolationMap[1]) {
            exercisesBuilder.addOrderBy(`exercise_examples.category`, "DESC")
            recommendations.push(`Recommendation: Isolated Exercise`)
        }

        //----------------------------------------

        const exercises = await exercisesBuilder
            .skip((page - 1) * size)
            .take(size)
            .getMany()

        return {
            recommendations,
            exercises,
        }
    }

    async getExerciseExampleById(id: string) {
        return await this.exerciseExamplesRepository
            .createQueryBuilder('exercise_examples')
            .where('exercise_examples.id = :id', {id})
            .leftJoinAndSelect('exercise_examples.exerciseExampleBundles', 'exercise_example_bundles')
            .leftJoinAndSelect('exercise_example_bundles.muscle', 'muscle')
            .leftJoinAndSelect('exercise_examples.equipmentRefs', 'equipment_refs')
            .leftJoinAndSelect('exercise_examples.tutorials', 'tutorials')
            .leftJoinAndSelect('equipment_refs.equipment', 'equipments')
            .addOrderBy('exercise_examples.createdAt', 'DESC')
            .getOne();
    }

    async setOrUpdateExerciseExample(body: ExerciseExampleRequest) {
        const {exerciseExampleBundles, ...rest} = body;

        const exerciseExample = new ExerciseExamplesEntity();
        Object.assign(exerciseExample, rest);
        exerciseExample.id = !exerciseExample.id ? v4() : exerciseExample.id;

        const exerciseEquipment = []
        const tutorials = []

        body.equipmentRefs.forEach((el) => {
            const exerciseExamplesEquipmentsEntity = new ExerciseExamplesEquipmentsEntity();
            exerciseExamplesEquipmentsEntity.equipmentId = el.equipmentId
            exerciseExamplesEquipmentsEntity.exerciseExampleId = exerciseExample.id
            exerciseEquipment.push(exerciseExamplesEquipmentsEntity);
        });

        const exerciseExampleBundlesEntities = [];

        exerciseExampleBundles.forEach((el) => {
            const exerciseExampleBundles = new ExerciseExampleBundlesEntity();
            Object.assign(exerciseExampleBundles, el);
            exerciseExampleBundles.id = !exerciseExampleBundles.id ? v4() : exerciseExampleBundles.id;
            exerciseExampleBundles.muscleId = el.muscleId;
            exerciseExampleBundles.exerciseExampleId = exerciseExample.id;
            exerciseExampleBundlesEntities.push(exerciseExampleBundles);
        });

        body.tutorials.forEach((el) => {
            const tutorial = new ExerciseExamplesTutorialsEntity();
            tutorial.value = el.value
            tutorial.title = el.title
            tutorial.language = el.language
            tutorial.author = el.author
            tutorial.resourceType = el.resourceType
            tutorial.exerciseExampleId = exerciseExample.id
            tutorials.push(tutorial);
        });

        await this.exerciseExampleBundlesRepository.delete({exerciseExampleId: exerciseExample.id});
        await this.exerciseExamplesRepository.save(exerciseExample);
        await this.exerciseExampleBundlesRepository.save(exerciseExampleBundlesEntities);
        await this.exerciseExamplesEquipmentsRepository.save(exerciseEquipment)
        await this.exerciseExamplesTutorialsEntityRepository.save(tutorials);

        return this.getExerciseExampleById(exerciseExample.id);
    }
}
