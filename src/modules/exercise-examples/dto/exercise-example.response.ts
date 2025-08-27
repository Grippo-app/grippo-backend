import {ApiProperty} from '@nestjs/swagger';
import {IsUUID} from 'class-validator';

export class ExerciseExampleCreateResponse {
    @ApiProperty({
        type: 'string',
        example: "3b828d2f-797f-4a45-9d1d-1d3efe38fb54",
        description: 'Exercise example ID'
    })
    @IsUUID()
    id: string;
}
