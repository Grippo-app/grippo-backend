import {ApiProperty} from '@nestjs/swagger';
import {IsUUID} from 'class-validator';
import {ExerciseExamplesEntity} from "../../../entities/exercise-examples.entity";

export class ExerciseExampleCreateResponse {
    @ApiProperty({
        type: 'string',
        example: "3b828d2f-797f-4a45-9d1d-1d3efe38fb54",
        description: 'Exercise example ID'
    })
    @IsUUID()
    id: string;
}

export class ExerciseExampleWithStatsResponse {
    @ApiProperty({type: () => ExerciseExamplesEntity})
    entity!: ExerciseExamplesEntity; // original entity

    @ApiProperty({type: 'number', example: 12})
    usageCount!: number; // how many times this example was used

    @ApiProperty({type: Date, nullable: true, example: new Date().toISOString()})
    lastUsed!: Date | null; // last usage timestamp or null
}