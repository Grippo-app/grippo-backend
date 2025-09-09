import {ApiProperty} from '@nestjs/swagger';
import {IsInt, IsOptional, IsUUID, Max, Min} from 'class-validator';
import {Type} from 'class-transformer';

// -------- Query DTOs (validated & transformed) --------
export class LimitQueryDto {
    @ApiProperty({required: false, minimum: 1, maximum: 100, default: 10})
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}

export class AchievementsQueryDto {
    @ApiProperty({required: false, minimum: 1, maximum: 100, default: 10, description: 'Number of latest volumes'})
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    size?: number = 10;
}

export class MuscleFilterQueryDto extends LimitQueryDto {
    @ApiProperty({required: false, description: 'Filter by muscle ID (UUID)'})
    @IsOptional()
    @IsUUID()
    muscleId?: string;

    @ApiProperty({required: false, description: 'Filter by muscle group ID (UUID)'})
    @IsOptional()
    @IsUUID()
    muscleGroupId?: string;
}

// -------- Response DTOs --------
export class MaxWeightDto {
    @ApiProperty({required: false})
    id?: string;

    @ApiProperty()
    exerciseExampleId!: string;

    @ApiProperty()
    exerciseId!: string;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    createdAt!: Date;

    @ApiProperty({type: 'number', example: 100.5, description: 'kg'})
    weight!: number;
}

export class MaxRepetitionDto {
    @ApiProperty({required: false})
    id?: string;

    @ApiProperty()
    exerciseExampleId!: string;

    @ApiProperty()
    exerciseId!: string;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    createdAt!: Date;

    @ApiProperty({type: 'number', example: 100, description: 'reps'})
    repetition!: number;
}

export class ExerciseVolumeDto {
    @ApiProperty({required: false})
    id?: string;

    @ApiProperty()
    exerciseExampleId!: string;

    @ApiProperty({type: 'number', example: 100.5, description: 'kg'})
    volume!: number;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    createdAt!: Date;
}

export class RecentExerciseDto {
    @ApiProperty()
    exerciseExampleId!: string;

    @ApiProperty()
    exerciseExampleName!: string;

    @ApiProperty({type: Date})
    lastUsedAt!: Date;

    @ApiProperty({type: 'number', nullable: true})
    lastVolume?: number;

    @ApiProperty({type: 'number', nullable: true})
    lastRepetitions?: number;
}

export class FrequentExerciseDto {
    @ApiProperty()
    exerciseExampleId!: string;

    @ApiProperty()
    exerciseExampleName!: string;

    @ApiProperty({type: 'number'})
    usageCount!: number;

    @ApiProperty({type: 'number', nullable: true})
    averageVolume?: number;

    @ApiProperty({type: Date})
    lastUsedAt!: Date;
}

export class PersonalRecordDto {
    @ApiProperty()
    exerciseExampleId!: string;

    @ApiProperty()
    exerciseExampleName!: string;

    @ApiProperty({type: 'number', nullable: true})
    maxWeight?: number;

    @ApiProperty({type: 'number', nullable: true})
    maxRepetitions?: number;

    @ApiProperty({type: 'number', nullable: true})
    maxVolume?: number;

    @ApiProperty({type: Date, nullable: true})
    maxWeightDate?: Date;

    @ApiProperty({type: Date, nullable: true})
    maxRepetitionsDate?: Date;

    @ApiProperty({type: Date, nullable: true})
    maxVolumeDate?: Date;
}

export class WorkoutSummaryDto {
    @ApiProperty({type: 'number'})
    totalWorkouts!: number;

    @ApiProperty({type: 'number'})
    totalVolume!: number;

    @ApiProperty({type: 'number'})
    totalDuration!: number;

    @ApiProperty({type: 'number'})
    averageIntensity!: number;

    @ApiProperty({type: 'number'})
    totalExercises!: number;

    @ApiProperty({type: Date, nullable: true})
    firstWorkoutDate?: Date;

    @ApiProperty({type: Date, nullable: true})
    lastWorkoutDate?: Date;
}

export class ExerciseIdsResponseDto {
    @ApiProperty({type: [String]})
    exerciseExampleIds!: string[];
}

export class ExerciseExampleAchievementsDto {
    @ApiProperty({type: MaxWeightDto, nullable: true})
    maxWeight: MaxWeightDto | null = null;

    @ApiProperty({type: MaxRepetitionDto, nullable: true})
    maxRepetition: MaxRepetitionDto | null = null;

    @ApiProperty({type: ExerciseVolumeDto, nullable: true})
    maxVolume: ExerciseVolumeDto | null = null;

    @ApiProperty({type: [ExerciseVolumeDto]})
    lastVolumes: ExerciseVolumeDto[] = [];
}
