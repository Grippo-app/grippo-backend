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
