import {ApiProperty} from '@nestjs/swagger';
import {IsEnum} from 'class-validator';
import {ExperienceEnum} from '../../../lib/experience.enum';

export class UpdateExperienceRequest {
    @ApiProperty({
        example: ExperienceEnum.PRO,
        enum: ExperienceEnum,
        description: 'New experience level for the user profile',
    })
    @IsEnum(ExperienceEnum)
    experience: ExperienceEnum;
}
