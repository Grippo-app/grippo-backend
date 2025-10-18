import { DataSource, EntityTarget } from 'typeorm';

import { UsersEntity } from '../entities/users.entity';
import { ExercisesEntity } from '../entities/exercises.entity';
import { IterationsEntity } from '../entities/iterations.entity';
import { TrainingsEntity } from '../entities/trainings.entity';
import { ExerciseExampleBundlesEntity } from '../entities/exercise-example-bundles.entity';
import { MusclesEntity } from '../entities/muscles.entity';
import { ExerciseExamplesEntity } from '../entities/exercise-examples.entity';
import { MuscleGroupsEntity } from '../entities/muscle-groups.entity';
import { WeightHistoryEntity } from '../entities/weight-history.entity';
import { ExcludedMusclesEntity } from '../entities/excluded-muscles.entity';
import { EquipmentsEntity } from '../entities/equipments.entity';
import { ExcludedEquipmentsEntity } from '../entities/excluded-equipments.entity';
import { EquipmentGroupsEntity } from '../entities/equipment-groups.entity';
import { ExerciseExamplesEquipmentsEntity } from '../entities/exercise-examples-equipments.entity';
import { ExerciseExampleTranslationEntity } from '../entities/exercise-example-translation.entity';

/**
 * 📦 Creates a repository provider for a given entity and token
 */
function createRepositoryProvider(token: string, entity: EntityTarget<any>) {
    return {
        provide: token,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(entity),
        inject: ['DATA_SOURCE'],
    };
}

/**
 * 🗂 List of repository providers for DI registration
 */
export const repositoryProviders = [
    createRepositoryProvider('USERS_REPOSITORY', UsersEntity),
    createRepositoryProvider('WEIGHT_HISTORY_REPOSITORY', WeightHistoryEntity),
    createRepositoryProvider('EXERCISES_REPOSITORY', ExercisesEntity),
    createRepositoryProvider('ITERATIONS_REPOSITORY', IterationsEntity),
    createRepositoryProvider('TRAININGS_REPOSITORY', TrainingsEntity),
    createRepositoryProvider('MUSCLES_REPOSITORY', MusclesEntity),
    createRepositoryProvider('MUSCLE_GROUPS_REPOSITORY', MuscleGroupsEntity),
    createRepositoryProvider('EXCLUDED_MUSCLES_REPOSITORY', ExcludedMusclesEntity),
    createRepositoryProvider('EXCLUDED_EQUIPMENTS_REPOSITORY', ExcludedEquipmentsEntity),
    createRepositoryProvider('EQUIPMENTS_REPOSITORY', EquipmentsEntity),
    createRepositoryProvider('EQUIPMENT_GROUPS_REPOSITORY', EquipmentGroupsEntity),
    createRepositoryProvider('EXERCISE_EXAMPLES_REPOSITORY', ExerciseExamplesEntity),
    createRepositoryProvider('EXERCISE_EXAMPLE_BUNDLES_REPOSITORY', ExerciseExampleBundlesEntity),
    createRepositoryProvider('EXERCISE_EXAMPLES_EQUIPMENTS_REPOSITORY', ExerciseExamplesEquipmentsEntity),
    createRepositoryProvider('EXERCISE_EXAMPLE_TRANSLATIONS_REPOSITORY', ExerciseExampleTranslationEntity),
];
