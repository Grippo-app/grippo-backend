import {ApiProperty} from '@nestjs/swagger';

export class BestWeightResponseDto {
    @ApiProperty({format: 'uuid'})
    iterationId!: string;

    @ApiProperty({format: 'uuid', nullable: true})
    exerciseId!: string | null;

    @ApiProperty({format: 'uuid', nullable: true})
    exerciseExampleId!: string | null;

    @ApiProperty({type: 'number', example: 100})
    weight!: number;

    @ApiProperty({type: Date})
    createdAt!: Date;
}

export class BestTonnageResponseDto {
    @ApiProperty({format: 'uuid'})
    exerciseId!: string;

    @ApiProperty({format: 'uuid', nullable: true})
    exerciseExampleId!: string | null;

    @ApiProperty({type: 'number', example: 1000, description: 'Total lifted weight'})
    tonnage!: number;

    @ApiProperty({type: Date})
    createdAt!: Date;
}

export class BestRepetitionsResponseDto {
    @ApiProperty({format: 'uuid'})
    iterationId!: string;

    @ApiProperty({format: 'uuid', nullable: true})
    exerciseId!: string | null;

    @ApiProperty({format: 'uuid', nullable: true})
    exerciseExampleId!: string | null;

    @ApiProperty({type: 'number', example: 12})
    repetitions!: number;

    @ApiProperty({type: Date})
    createdAt!: Date;
}

export class PeakIntensityResponseDto {
    @ApiProperty({format: 'uuid'})
    exerciseId!: string;

    @ApiProperty({format: 'uuid', nullable: true})
    exerciseExampleId!: string | null;

    @ApiProperty({type: 'number', example: 0.85})
    intensity!: number;

    @ApiProperty({type: Date})
    createdAt!: Date;
}

export class LifetimeVolumeResponseDto {
    @ApiProperty({format: 'uuid', nullable: true})
    exerciseExampleId!: string | null;

    @ApiProperty({type: 'number', example: 12500})
    totalVolume!: number;

    @ApiProperty({type: 'number', example: 24})
    sessionsCount!: number;

    @ApiProperty({type: Date})
    firstPerformedAt!: Date;

    @ApiProperty({type: Date})
    lastPerformedAt!: Date;
}

export class ExerciseAchievementsResponseDto {
    @ApiProperty({type: () => BestWeightResponseDto, nullable: true})
    bestWeight!: BestWeightResponseDto | null;

    @ApiProperty({type: () => BestTonnageResponseDto, nullable: true})
    bestTonnage!: BestTonnageResponseDto | null;

    @ApiProperty({type: () => BestRepetitionsResponseDto, nullable: true})
    maxRepetitions!: BestRepetitionsResponseDto | null;

    @ApiProperty({type: () => PeakIntensityResponseDto, nullable: true})
    peakIntensity!: PeakIntensityResponseDto | null;

    @ApiProperty({type: () => LifetimeVolumeResponseDto, nullable: true})
    lifetimeVolume!: LifetimeVolumeResponseDto | null;
}
