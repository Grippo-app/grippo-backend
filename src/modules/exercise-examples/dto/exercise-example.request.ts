import {ApiProperty} from '@nestjs/swagger';
import {ExerciseCategoryEnum} from "../../../lib/exercise-category.enum";
import {WeightTypeEnum} from "../../../lib/weight-type.enum";
import {ExperienceEnum} from "../../../lib/experience.enum";
import {ForceTypeEnum} from "../../../lib/force-type.enum";
import {ResourceTypeEnum} from "../../../lib/resource-type.enum";
import {IsEnum, IsInt, IsString, IsUUID, ValidateNested} from "class-validator";
import {Type} from "class-transformer";

export class ExerciseExampleBundleRequest {
    id?: string;

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

export class ExerciseExampleTutorialRequest {
    @ApiProperty({ type: 'string', example: 'tutorialId1' })
    @IsString()
    id: string;

    @ApiProperty({ type: 'string', example: 'Introduction to Bench Press' })
    @IsString()
    title: string;

    @ApiProperty({ type: 'string', example: 'Detailed explanation of the bench press exercise.' })
    @IsString()
    value: string;

    @ApiProperty({ type: 'string', example: 'en' })
    @IsString()
    language: string;

    @ApiProperty({ type: 'string', example: 'https://example.com/tutorial-video' })
    @IsString()
    author: string;

    @ApiProperty({ type: 'string', example: ResourceTypeEnum.YOUTUBE_VIDEO })
    @IsEnum(ResourceTypeEnum)
    resourceType: ResourceTypeEnum;
}

export class ExerciseExampleRequest {
    id?: string;

    @ApiProperty({ type: 'string', example: 'bench press' })
    @IsString()
    name: string;

    @ApiProperty({ type: 'string', example: 'The bench press is a compound strength-training...' })
    @IsString()
    description: string;

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

    @ApiProperty({ type: [ExerciseExampleTutorialRequest] })
    @ValidateNested({ each: true })
    @Type(() => ExerciseExampleTutorialRequest)
    tutorials: ExerciseExampleTutorialRequest[];
}