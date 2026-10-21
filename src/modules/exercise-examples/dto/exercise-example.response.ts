import {ApiProperty} from '@nestjs/swagger';
import {IsUUID} from 'class-validator';
import {ExerciseComponentsDto} from "./exercise-components.dto";
import {ExerciseCategoryEnum} from '../../../lib/exercise-category.enum';
import {WeightTypeEnum} from '../../../lib/weight-type.enum';
import {ForceTypeEnum} from '../../../lib/force-type.enum';
import {ExperienceEnum} from '../../../lib/experience.enum';
import {MuscleEnum} from '../../../lib/muscle.enum';
import {EquipmentEnum} from '../../../lib/equipment.enum';

export class ExerciseExampleCreateResponse {
    @ApiProperty({
        type: 'string',
        example: "3b828d2f-797f-4a45-9d1d-1d3efe38fb54",
        description: 'Exercise example ID'
    })
    @IsUUID()
    id: string;
}

export class ExerciseExampleMuscleResponseDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({enum: MuscleEnum, nullable: true})
    type: MuscleEnum | null;

    @ApiProperty({type: Number, nullable: true})
    recovery: number | null;

    @ApiProperty({type: Number, nullable: true})
    size: number | null;

    @ApiProperty({type: Number, nullable: true})
    sensitivity: number | null;

    @ApiProperty({type: Date})
    createdAt: Date;

    @ApiProperty({type: Date})
    updatedAt: Date;
}

export class ExerciseExampleEquipmentResponseDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({enum: EquipmentEnum, nullable: true})
    type: EquipmentEnum | null;

    @ApiProperty({type: Date})
    createdAt: Date;

    @ApiProperty({type: Date})
    updatedAt: Date;
}

export class ExerciseExampleBundleResponseDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty({type: 'integer', nullable: true})
    percentage: number | null;

    @ApiProperty({format: 'uuid'})
    exerciseExampleId: string;

    @ApiProperty({type: String, format: 'uuid', nullable: true})
    muscleId: string | null;

    @ApiProperty({type: Date})
    createdAt: Date;

    @ApiProperty({type: Date})
    updatedAt: Date;

    @ApiProperty({type: () => ExerciseExampleMuscleResponseDto, nullable: true})
    muscle: ExerciseExampleMuscleResponseDto | null;
}

export class ExerciseExampleEquipmentRefResponseDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty({format: 'uuid'})
    exerciseExampleId: string;

    @ApiProperty({type: String, format: 'uuid', nullable: true})
    equipmentId: string | null;

    @ApiProperty({type: Date})
    createdAt: Date;

    @ApiProperty({type: Date})
    updatedAt: Date;

    @ApiProperty({type: () => ExerciseExampleEquipmentResponseDto, nullable: true})
    equipment: ExerciseExampleEquipmentResponseDto | null;
}

export class ExerciseExampleResponseDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty({type: String, nullable: true})
    name: string | null;

    @ApiProperty({type: String, nullable: true})
    description: string | null;

    @ApiProperty({type: String, nullable: true})
    imageUrl: string | null;

    @ApiProperty({enum: ExerciseCategoryEnum, nullable: true})
    category: ExerciseCategoryEnum | null;

    @ApiProperty({enum: WeightTypeEnum, nullable: true})
    weightType: WeightTypeEnum | null;

    @ApiProperty({enum: ForceTypeEnum, nullable: true})
    forceType: ForceTypeEnum | null;

    @ApiProperty({enum: ExperienceEnum, nullable: true})
    experience: ExperienceEnum | null;

    @ApiProperty({type: Date})
    createdAt: Date;

    @ApiProperty({type: Date})
    updatedAt: Date;

    @ApiProperty({type: [ExerciseExampleBundleResponseDto], required: false})
    exerciseExampleBundles?: ExerciseExampleBundleResponseDto[];

    @ApiProperty({type: [ExerciseExampleEquipmentRefResponseDto], required: false})
    equipmentRefs?: ExerciseExampleEquipmentRefResponseDto[];

    @ApiProperty({type: () => ExerciseComponentsDto})
    components: ExerciseComponentsDto;
}

export class ExerciseExampleWithStatsResponse {
    @ApiProperty({type: () => ExerciseExampleResponseDto})
    entity!: ExerciseExampleResponseDto; // original entity

    @ApiProperty({type: 'number', example: 12})
    usageCount!: number; // how many times this example was used

    @ApiProperty({type: Date, nullable: true, example: new Date().toISOString()})
    lastUsed!: Date | null; // last usage timestamp or null
}
