import {ExerciseExamplesEntity} from "../entities/exercise-examples.entity";
import {ExperienceEnum} from "./experience.enum";

export class RecommendedUtils {

    // Get count of last exercise examples with the same muscle target
    static countOfLastMuscleTargetExercises(exerciseExamples: ExerciseExamplesEntity[]) {

        if (!exerciseExamples || exerciseExamples.length == 0) {
            return 0
        }

        const lastTarget = exerciseExamples.map((item) =>
            item.exerciseExampleBundles.reduce((maxBundle, bundle) =>
                bundle.percentage > maxBundle.percentage ? bundle : maxBundle, item.exerciseExampleBundles[0])
        ).pop();

        if (!lastTarget) {
            return 0
        }

        return exerciseExamples.filter((item) => {
            item.exerciseExampleBundles.includes(lastTarget)
        }).length
    }

    // Get Massive of categories from last muscle target
    static categoryByLastMuscleTarget(exerciseExamples: ExerciseExamplesEntity[]) {
        if (!exerciseExamples || exerciseExamples.length == 0) {
            return []
        }

        const lastTarget = exerciseExamples.map((item) =>
            item.exerciseExampleBundles.reduce((maxBundle, bundle) =>
                bundle.percentage > maxBundle.percentage ? bundle : maxBundle, item.exerciseExampleBundles[0])
        ).pop();

        if (!lastTarget) {
            return []
        }

        return exerciseExamples
            .filter((item) => {
                item.exerciseExampleBundles.includes(lastTarget)
            }).map((item) => {
                return item.category
            })
    }

    // Get minimal a maximal count of exercises per training for different experience
    static minMaxTrainingExercisesByExp(experience: ExperienceEnum) {
        switch (experience) {
            case ExperienceEnum.BEGINNER: {
                return [3, 6]
            }
            case ExperienceEnum.INTERMEDIATE: {
                return [4, 8]
            }
            case ExperienceEnum.ADVANCED: {
                return [6, 10]
            }
            case ExperienceEnum.PRO: {
                return [8, 12]
            }
        }
    }

    // Get minimal a maximal count of exercises per one muscle for different experience
    static minMaxMuscleExercisesByExp(experience: ExperienceEnum) {
        switch (experience) {
            case ExperienceEnum.BEGINNER: {
                return [1, 2]
            }
            case ExperienceEnum.INTERMEDIATE: {
                return [2, 3]
            }
            case ExperienceEnum.ADVANCED: {
                return [3, 4]
            }
            case ExperienceEnum.PRO: {
                return [4, 5]
            }
        }
    }

    // Get Compound and Isolation count of exercises per one muscle for different experience
    static categoryMapByExp(experience: ExperienceEnum) {
        switch (experience) {
            case ExperienceEnum.BEGINNER: {
                return [1, 1]
            }
            case ExperienceEnum.INTERMEDIATE: {
                return [2, 1]
            }
            case ExperienceEnum.ADVANCED: {
                return [2, 2]
            }
            case ExperienceEnum.PRO: {
                return [2, 3]
            }
        }
    }

    static getFilterExp(userExperience: ExperienceEnum): ExperienceEnum[] {
        switch (userExperience) {
            case ExperienceEnum.BEGINNER:
                return [ExperienceEnum.BEGINNER];
            case ExperienceEnum.INTERMEDIATE:
                return [ExperienceEnum.BEGINNER, ExperienceEnum.INTERMEDIATE];
            case ExperienceEnum.ADVANCED:
                return [ExperienceEnum.BEGINNER, ExperienceEnum.INTERMEDIATE, ExperienceEnum.ADVANCED];
            case ExperienceEnum.PRO:
                // Assuming PRO includes all levels
                return Object.values(ExperienceEnum);
            default:
                return [];
        }
    }
}