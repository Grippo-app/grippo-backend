import {ApiProperty} from '@nestjs/swagger';

export class MaxWeightRequest {
    id?: string;

    exerciseExampleId: string;

    exerciseId: string;

    @ApiProperty({type: Date, example: Date.now()})
    createdAt: Date;

    @ApiProperty({type: 'double', example: 100.5, description: 'kg'})
    weight: number;
}

export class MaxRepetitionRequest {
    id?: string;

    exerciseExampleId: string;

    exerciseId: string;

    @ApiProperty({type: Date, example: Date.now()})
    createdAt: Date;

    @ApiProperty({type: 'integer', example: 100, description: 'reps'})
    repetition: number;
}

export class ExerciseVolumeRequest {
    id?: string;

    exerciseExampleId: string;

    @ApiProperty({type: 'double', example: 100.5, description: 'kg'})
    volume: number;

    @ApiProperty({type: Date, example: Date.now()})
    createdAt: Date;
}
