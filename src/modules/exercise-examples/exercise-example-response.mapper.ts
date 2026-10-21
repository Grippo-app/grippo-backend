import {BadRequestException} from '@nestjs/common';
import {ExerciseExamplesEntity} from '../../entities/exercise-examples.entity';
import {ExerciseExampleResponseDto} from './dto/exercise-example.response';

/** Attach the public weight components and hide their persistence representation. */
export function mapExerciseExampleResponse(example: ExerciseExamplesEntity): ExerciseExamplesEntity & ExerciseExampleResponseDto {
    if (!example.componentsEntity) {
        throw new BadRequestException('Components are required for exercise example');
    }

    const components = example.componentsEntity;
    const response = Object.assign(example, {
        components: {
            externalWeight: components.externalWeightRequired === null ? null : {required: components.externalWeightRequired},
            bodyWeight: components.bodyWeightMultiplier === null
                ? null
                : {required: true as const, multiplier: components.bodyWeightMultiplier},
            extraWeight: components.extraWeightRequired === null ? null : {required: components.extraWeightRequired},
            assistWeight: components.assistWeightRequired === null ? null : {required: components.assistWeightRequired},
        },
    });
    delete response.componentsEntity;
    return response;
}
