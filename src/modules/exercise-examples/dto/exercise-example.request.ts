import {ApiProperty} from '@nestjs/swagger';
import {ExerciseCategoryEnum} from "../../../lib/exercise-category.enum";
import {WeightTypeEnum} from "../../../lib/weight-type.enum";
import {ExperienceEnum} from "../../../lib/experience.enum";
import {ForceTypeEnum} from "../../../lib/force-type.enum";
import {
    ArrayNotEmpty,
    IsArray,
    IsDefined,
    IsEnum,
    IsIn,
    IsInt,
    IsObject,
    IsString,
    IsUUID,
    Max,
    Min,
    Validate,
    ValidateIf,
    ValidateNested,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from "class-validator";
import {Type} from "class-transformer";
import {SUPPORTED_LANGUAGES, SupportedLanguage} from "../../../i18n/i18n.types";
import {ExerciseComponentsDto} from "./exercise-components.dto";

@ValidatorConstraint({name: 'exerciseMuscleTotal', async: false})
class ExerciseMuscleTotalConstraint implements ValidatorConstraintInterface {
    validate(bundles: unknown): boolean {
        if (!Array.isArray(bundles)) return false;
        let total = 0;
        for (const bundle of bundles) {
            if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)
                || !Number.isInteger(bundle.percentage) || bundle.percentage < 0 || bundle.percentage > 100) {
                return false;
            }
            total += bundle.percentage;
        }
        return total === 100;
    }

    defaultMessage(): string {
        return 'exerciseExampleBundles percentages must total 100';
    }
}

export class ExerciseExampleBundleRequest {
    @ApiProperty({type: 'string', example: '3a975ded-af6b-4dd2-9a0e-6e3554e8e6dd'})
    @IsUUID()
    muscleId: string;

    @ApiProperty({type: 'integer', example: 20, minimum: 0, maximum: 100, description: 'percentage'})
    @IsInt()
    @Min(0)
    @Max(100)
    percentage: number;
}

export class ExerciseExampleEquipmentRefsRequest {
    @ApiProperty({type: 'string', example: '9896a0c5-0de2-42de-a274-0e3695b1accf'})
    @IsUUID()
    equipmentId: string;
}

export class ExerciseExampleLocalizedTextDto {
    @ApiProperty({enum: SUPPORTED_LANGUAGES, example: 'en'})
    @IsIn(SUPPORTED_LANGUAGES)
    language: SupportedLanguage;

    @ApiProperty({type: 'string', example: 'Bench press', required: false})
    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    value?: string;
}

export class ExerciseExampleRequest {
    id?: string;

    @ApiProperty({type: () => [ExerciseExampleLocalizedTextDto], example: [{language: 'en', value: 'Bench press'}]})
    @ValidateNested({each: true})
    @Type(() => ExerciseExampleLocalizedTextDto)
    @IsArray()
    @ArrayNotEmpty()
    @IsObject({each: true})
    name: ExerciseExampleLocalizedTextDto[];

    @ApiProperty({
        type: () => [ExerciseExampleLocalizedTextDto],
        example: [{language: 'en', value: 'The bench press is a compound strength-training...'}],
    })
    @ValidateNested({each: true})
    @Type(() => ExerciseExampleLocalizedTextDto)
    @IsArray()
    @ArrayNotEmpty()
    @IsObject({each: true})
    description: ExerciseExampleLocalizedTextDto[];

    @ApiProperty({type: 'string', example: WeightTypeEnum.Fixed})
    @IsEnum(WeightTypeEnum)
    weightType: WeightTypeEnum;

    @ApiProperty({type: 'string', example: ExerciseCategoryEnum.Compound})
    @IsEnum(ExerciseCategoryEnum)
    category: ExerciseCategoryEnum;

    @ApiProperty({type: 'string', example: ExperienceEnum.PRO})
    @IsEnum(ExperienceEnum)
    experience: ExperienceEnum;

    @ApiProperty({type: 'string', example: ForceTypeEnum.PUSH})
    @IsEnum(ForceTypeEnum)
    forceType: ForceTypeEnum;

    @ApiProperty({
        type: 'string',
        example:
            'https://static.vecteezy.com/system/resources/thumbnails/022/653/711/small/treadmill-in-modern-gym-toned-image-3d-rendering-generative-ai-free-photo.jpg',
    })
    @IsString()
    imageUrl: string;

    @ApiProperty({type: [ExerciseExampleBundleRequest], minItems: 1, description: 'Muscle contributions with whole-number percentages totaling 100.'})
    @IsArray()
    @ArrayNotEmpty()
    @IsObject({each: true})
    @Validate(ExerciseMuscleTotalConstraint)
    @ValidateNested({each: true})
    @Type(() => ExerciseExampleBundleRequest)
    exerciseExampleBundles: ExerciseExampleBundleRequest[];

    @ApiProperty({type: [ExerciseExampleEquipmentRefsRequest], description: 'Equipment references. An empty array is allowed.'})
    @IsArray()
    @IsObject({each: true})
    @ValidateNested({each: true})
    @Type(() => ExerciseExampleEquipmentRefsRequest)
    equipmentRefs: ExerciseExampleEquipmentRefsRequest[];

    @ApiProperty({type: () => ExerciseComponentsDto})
    @IsDefined()
    @IsObject()
    @ValidateNested()
    @Type(() => ExerciseComponentsDto)
    components: ExerciseComponentsDto;
}
