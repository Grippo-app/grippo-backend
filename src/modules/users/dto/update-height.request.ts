import {ApiProperty} from '@nestjs/swagger';
import {IsInt, Max, Min} from 'class-validator';

export class UpdateHeightRequest {
    @ApiProperty({
        example: 175,
        type: 'integer',
        minimum: 1,
        maximum: 2147483647,
        description: 'New height in centimeters',
    })
    @IsInt()
    @Min(1)
    @Max(2147483647)
    height: number;
}
