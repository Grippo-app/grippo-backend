import {ApiProperty} from '@nestjs/swagger';
import {MuscleEnum} from "../../../lib/muscle.enum";
import {MuscleGroupEnum} from "../../../lib/muscle-group.enum";

export class MuscleResponse {
    @ApiProperty({type: 'string', example: '4289bf91-51d8-40b0-9aca-66780584a4eb'})
    id: string;

    @ApiProperty({type: 'string', example: 'biceps'})
    name: string;

    @ApiProperty({type: 'string', example: 'bf12ab34-cde5-40a7-b911-09d09cb32456'})
    muscleGroupId: string;

    @ApiProperty({ type: Number, example: 48, required: false })
    recovery: number;

    @ApiProperty({ type: Number, example: 1.10, required: false })
    size: number;

    @ApiProperty({enum: MuscleEnum, example: MuscleEnum.BICEPS})
    type: MuscleEnum;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    updatedAt: Date;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    createdAt: Date;
}

export class MuscleGroupsResponse {
    @ApiProperty({type: 'string', example: '1a2b3c4d-5e6f-7890-abcd-1234567890ef'})
    id: string;

    @ApiProperty({type: 'string', example: 'Back Muscles'})
    name: string;

    @ApiProperty({enum: MuscleGroupEnum, example: MuscleGroupEnum.BACK_MUSCLES})
    type: MuscleGroupEnum;

    @ApiProperty({type: [MuscleResponse]})
    muscles: MuscleResponse[];

    @ApiProperty({type: Date, example: new Date().toISOString()})
    updatedAt: Date;

    @ApiProperty({type: Date, example: new Date().toISOString()})
    createdAt: Date;
}
