import {ApiProperty} from '@nestjs/swagger';
import {IsInt, IsNumber, IsOptional, IsString, IsUUID, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';

export class ExerciseIterationRequest {
    id?: string;

    @ApiProperty({type: 'number', example: 100.5, description: 'Weight in kg (1 decimal)'})
    @IsNumber({maxDecimalPlaces: 1})
    weight: number;

    @ApiProperty({type: 'number', example: 10})
    @IsInt()
    repetitions: number;
}

export class TrainingExerciseRequest {
    id?: string;

    @ApiProperty({type: 'string', example: 'bench press'})
    @IsString()
    name: string;

    @ApiProperty({type: 'number', example: 2000.5, description: 'Volume in kg (1 decimal)'})
    @IsNumber({maxDecimalPlaces: 1})
    volume: number;

    @ApiProperty({type: 'number', example: 50})
    @IsInt()
    repetitions: number;

    @ApiProperty({type: 'number', example: 60, description: 'Intensity % (2 decimals allowed)'})
    @IsNumber({maxDecimalPlaces: 2})
    intensity: number;

    @ApiProperty({type: [ExerciseIterationRequest]})
    @ValidateNested({each: true})
    @Type(() => ExerciseIterationRequest)
    iterations: ExerciseIterationRequest[];

    @ApiProperty({
        type: 'string',
        example: "3b828d2f-797f-4a45-9d1d-1d3efe38fb54",
        description: 'Exercise example ID',
        required: false
    })
    @IsUUID()
    @IsOptional()
    exerciseExampleId?: string;
}

export class TrainingsRequest {
    id?: string;

    @ApiProperty({type: 'number', example: 25, description: 'Duration in minutes'})
    @IsInt()
    duration: number;

    @ApiProperty({type: 'number', example: 20000.5, description: 'Total volume in kg (1 decimal)'})
    @IsNumber({maxDecimalPlaces: 1})
    volume: number;

    @ApiProperty({type: 'number', example: 150})
    @IsInt()
    repetitions: number;

    @ApiProperty({type: 'number', example: 60, description: 'Intensity % (2 decimals allowed)'})
    @IsNumber({maxDecimalPlaces: 2})
    intensity: number;

    @ApiProperty({type: [TrainingExerciseRequest]})
    @ValidateNested({each: true})
    @Type(() => TrainingExerciseRequest)
    exercises: TrainingExerciseRequest[];
}