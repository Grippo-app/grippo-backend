import {ApiProperty} from '@nestjs/swagger';
import {IsArray, IsInt, IsOptional, IsUUID} from "class-validator";

export class RecommendedRequest {
    @ApiProperty({ type: 'string', example: null })
    @IsOptional()
    @IsUUID()
    targetMuscleId?: string;

    @ApiProperty({ type: 'int', example: 1, description: 'current exercise count' })
    @IsInt()
    exerciseCount: number;

    @ApiProperty({ example: [] })
    @IsArray()
    @IsUUID('all', { each: true })
    exerciseExampleIds: string[];
}

