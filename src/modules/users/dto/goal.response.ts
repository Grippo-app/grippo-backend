import {ApiProperty} from '@nestjs/swagger';
import {GoalPersonalizationKeyEnum, GoalPrimaryGoalEnum, GoalSecondaryGoalEnum,} from '../../../lib/goal.enum';

export class GoalResponse {
    @ApiProperty({
        example: GoalPrimaryGoalEnum.BUILD_MUSCLE,
        enum: GoalPrimaryGoalEnum,
    })
    primaryGoal: GoalPrimaryGoalEnum;

    @ApiProperty({
        example: GoalSecondaryGoalEnum.GET_STRONGER,
        enum: GoalSecondaryGoalEnum,
        nullable: true,
    })
    secondaryGoal: GoalSecondaryGoalEnum | null;

    @ApiProperty({example: new Date().toISOString(), nullable: true})
    target: Date | null;

    @ApiProperty({
        example: [GoalPersonalizationKeyEnum.MINUTES_90_120],
        enum: GoalPersonalizationKeyEnum,
        isArray: true,
    })
    personalizations: GoalPersonalizationKeyEnum[];

    @ApiProperty({example: 0.9, minimum: 0, maximum: 1})
    confidence: number;

    @ApiProperty({example: new Date().toISOString()})
    createdAt: Date;

    @ApiProperty({example: new Date().toISOString()})
    updatedAt: Date;

    @ApiProperty({example: new Date().toISOString(), nullable: true})
    lastConfirmedAt: Date | null;
}
