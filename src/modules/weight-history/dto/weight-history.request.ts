import {ApiProperty} from '@nestjs/swagger';
import {IsNumber, Max, Min} from 'class-validator';

export class WeightHistoryRequest {
    @ApiProperty({example: 88})
    @IsNumber()
    @Min(30)
    @Max(300)
    weight: number;
}
