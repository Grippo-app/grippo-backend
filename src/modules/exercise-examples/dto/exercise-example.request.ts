import {ApiProperty} from '@nestjs/swagger';
import {ExerciseCategoryEnum} from "../../../lib/exercise-category.enum";
import {WeightTypeEnum} from "../../../lib/weight-type.enum";
import {ExperienceEnum} from "../../../lib/experience.enum";
import {ForceTypeEnum} from "../../../lib/force-type.enum";
import {IsEnum, IsInt, IsOptional, IsString, IsUUID, ValidateNested} from "class-validator";
import {Type} from "class-transformer";

export class ExerciseExampleBundleRequest {
    @ApiProperty({ type: 'string', example: '3a975ded-af6b-4dd2-9a0e-6e3554e8e6dd' })
    @IsUUID()
    muscleId: string;

    @ApiProperty({ type: 'int', example: 20, description: 'percentage' })
    @IsInt()
    percentage: number;
}

export class ExerciseExampleEquipmentRefsRequest {
    @ApiProperty({ type: 'string', example: '9896a0c5-0de2-42de-a274-0e3695b1accf' })
    @IsUUID()
    equipmentId: string;
}

export class ExerciseExampleTranslationDto {
    @ApiProperty({ type: 'string', example: 'Bench press', required: false })
    @IsOptional()
    @IsString()
    en?: string;

    @ApiProperty({ type: 'string', example: 'Жим лежачи', required: false })
    @IsOptional()
    @IsString()
    ua?: string;

    @ApiProperty({ type: 'string', example: 'Жим лежа', required: false })
    @IsOptional()
    @IsString()
    ru?: string;
}

export class ExerciseExampleRequest {
    id?: string;

    @ApiProperty({ type: 'string', example: 'bench press' })
    @IsString()
    name: string;

    @ApiProperty({ type: 'string', example: 'The bench press is a compound strength-training...' })
    @IsString()
    description: string;

    @ApiProperty({ type: () => ExerciseExampleTranslationDto, required: false })
    @ValidateNested()
    @Type(() => ExerciseExampleTranslationDto)
    @IsOptional()
    nameTranslations?: ExerciseExampleTranslationDto;

    @ApiProperty({ type: () => ExerciseExampleTranslationDto, required: false })
    @ValidateNested()
    @Type(() => ExerciseExampleTranslationDto)
    @IsOptional()
    descriptionTranslations?: ExerciseExampleTranslationDto;

    @ApiProperty({ type: 'string', example: WeightTypeEnum.Fixed })
    @IsEnum(WeightTypeEnum)
    weightType: WeightTypeEnum;

    @ApiProperty({ type: 'string', example: ExerciseCategoryEnum.Compound })
    @IsEnum(ExerciseCategoryEnum)
    category: ExerciseCategoryEnum;

    @ApiProperty({ type: 'string', example: ExperienceEnum.PRO })
    @IsEnum(ExperienceEnum)
    experience: ExperienceEnum;

    @ApiProperty({ type: 'string', example: ForceTypeEnum.PUSH })
    @IsEnum(ForceTypeEnum)
    forceType: ForceTypeEnum;

    @ApiProperty({
        type: 'string',
        example:
            'https://static.vecteezy.com/system/resources/thumbnails/022/653/711/small/treadmill-in-modern-gym-toned-image-3d-rendering-generative-ai-free-photo.jpg',
    })
    @IsString()
    imageUrl: string;

    @ApiProperty({ type: [ExerciseExampleBundleRequest] })
    @ValidateNested({ each: true })
    @Type(() => ExerciseExampleBundleRequest)
    exerciseExampleBundles: ExerciseExampleBundleRequest[];

    @ApiProperty({ type: [ExerciseExampleEquipmentRefsRequest] })
    @ValidateNested({ each: true })
    @Type(() => ExerciseExampleEquipmentRefsRequest)
    equipmentRefs: ExerciseExampleEquipmentRefsRequest[];
}
