import {ApiProperty} from '@nestjs/swagger';
import {IsUUID} from 'class-validator';
import {ExerciseExamplesEntity} from "../../../entities/exercise-examples.entity";
import {ExerciseComponentsDto} from "./exercise-components.dto";

export class ExerciseExampleCreateResponse {
    @ApiProperty({
        type: 'string',
        example: "3b828d2f-797f-4a45-9d1d-1d3efe38fb54",
        description: 'Exercise example ID'
    })
    @IsUUID()
    id: string;
}

export class ExerciseExampleResponseDto extends ExerciseExamplesEntity {
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
