import {ApiProperty} from '@nestjs/swagger';
import {IsUUID} from 'class-validator';

export class TrainingCreateResponse {
    @ApiProperty({
        type: 'string',
        example: "3b828d2f-797f-4a45-9d1d-1d3efe38fb54",
        description: 'Training ID'
    })
    @IsUUID()
    id: string;
}
