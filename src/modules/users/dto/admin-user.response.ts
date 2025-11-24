import {ApiProperty} from '@nestjs/swagger';
import {ExperienceEnum} from '../../../lib/experience.enum';
import {UserRoleEnum} from '../../../lib/user-role.enum';

export class AdminUserResponse {
    @ApiProperty({example: '3b828d2f-797f-4a45-9d1d-1d3efe38fb54'})
    id: string;

    @ApiProperty({example: 'user@example.com'})
    email: string;

    @ApiProperty({example: 'John Doe'})
    name: string;

    @ApiProperty({example: 180})
    height: number;

    @ApiProperty({example: ExperienceEnum.PRO, enum: ExperienceEnum, nullable: true})
    experience: ExperienceEnum | null;

    @ApiProperty({example: UserRoleEnum.DEFAULT, enum: UserRoleEnum})
    role: UserRoleEnum;

    @ApiProperty({example: new Date().toISOString()})
    createdAt: Date;

    @ApiProperty({example: new Date().toISOString()})
    updatedAt: Date;
}
