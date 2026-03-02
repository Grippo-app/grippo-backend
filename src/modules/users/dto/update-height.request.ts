import {ApiProperty} from '@nestjs/swagger';
import {IsInt} from 'class-validator';

export class UpdateHeightRequest {
    @ApiProperty({
        example: 175,
        description: 'New height in centimeters',
    })
    @IsInt()
    height: number;
}
