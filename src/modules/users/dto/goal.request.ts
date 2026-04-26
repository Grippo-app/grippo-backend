import {ApiProperty} from '@nestjs/swagger';
import {IsArray, IsDateString, IsEnum, IsOptional} from 'class-validator';
import {GoalPersonalizationKeyEnum, GoalPrimaryGoalEnum, GoalSecondaryGoalEnum,} from '../../../lib/goal.enum';

export class GoalRequest {
    @ApiProperty({
        example: GoalPrimaryGoalEnum.BUILD_MUSCLE,
        enum: GoalPrimaryGoalEnum,
    })
    @IsEnum(GoalPrimaryGoalEnum)
    primaryGoal: GoalPrimaryGoalEnum;

    @ApiProperty({
        example: GoalSecondaryGoalEnum.GET_STRONGER,
        enum: GoalSecondaryGoalEnum,
        nullable: true,
        required: false,
    })
    @IsEnum(GoalSecondaryGoalEnum)
    @IsOptional()
    secondaryGoal?: GoalSecondaryGoalEnum | null;

    @ApiProperty({example: new Date().toISOString(), nullable: true, required: false})
    @IsDateString()
    @IsOptional()
    target?: string | null;

    @ApiProperty({
        example: ['low_frequency', 'sport_grappling', 'lower_back_care'],
        enum: GoalPersonalizationKeyEnum,
        isArray: true,
        required: false,
        default: [],
    })
    @IsArray()
    @IsEnum(GoalPersonalizationKeyEnum, {each: true})
    @IsOptional()
    personalizations?: GoalPersonalizationKeyEnum[];
}
