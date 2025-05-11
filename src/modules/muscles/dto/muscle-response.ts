import {ApiProperty} from '@nestjs/swagger';
import {MuscleEnum} from "../../../lib/muscle.enum";
import {MuscleStatusEnum} from "../../../lib/muscle-status.enum";
import {MuscleGroupEnum} from "../../../lib/muscle-group.enum";
import {MuscleLoadEnum} from "../../../lib/muscle-load.enum";

export class MuscleResponse {
    id?: string;

    @ApiProperty({type: 'string', example: 'biceps'})
    name: string;

    @ApiProperty({type: 'string', example: '4289bf91-51d8-40b0-9aca-66780584a4eb'})
    muscleGroupId: string;

    @ApiProperty({type: 'enum', enum: MuscleEnum, example: MuscleEnum.BICEPS})
    type: MuscleEnum;

    @ApiProperty({type: Date, example: Date.now()})
    updatedAt: Date;

    @ApiProperty({type: Date, example: Date.now()})
    createdAt: Date;
}

export class MuscleGroupsResponse {
    id?: string;

    @ApiProperty({type: 'string', example: 'Back Muscles'})
    name: string;

    @ApiProperty({type: 'enum', enum: MuscleGroupEnum, example: MuscleGroupEnum.BACK_MUSCLES})
    type: MuscleGroupEnum;

    @ApiProperty({type: [MuscleResponse]})
    muscles: MuscleResponse[];

    @ApiProperty({type: Date, example: Date.now()})
    updatedAt: Date;

    @ApiProperty({type: Date, example: Date.now()})
    createdAt: Date;
}