import {ApiProperty} from '@nestjs/swagger';
import {ExperienceEnum} from '../../../lib/experience.enum';
import {UserRoleEnum} from '../../../lib/user-role.enum';

export class UserProfileResponse {
    @ApiProperty({example: '72a0317f-e321-4da7-9869-91bf23d655bb'})
    id: string;

    @ApiProperty({example: 'Max'})
    name: string;

    @ApiProperty({example: 175})
    height: number;

    @ApiProperty({example: ExperienceEnum.PRO, enum: ExperienceEnum})
    experience: ExperienceEnum;

    @ApiProperty({
        example: 82.5,
        description: 'Last recorded weight in kilograms',
        nullable: true,
    })
    weight: number | null;
}

export class UserResponse {
    @ApiProperty({example: '3b828d2f-797f-4a45-9d1d-1d3efe38fb54'})
    id: string;

    @ApiProperty({example: 'user@example.com'})
    email: string;

    @ApiProperty({example: UserRoleEnum.DEFAULT, enum: UserRoleEnum})
    role: UserRoleEnum;

    @ApiProperty({example: new Date().toISOString()})
    createdAt: Date;

    @ApiProperty({example: new Date().toISOString()})
    updatedAt: Date;

    @ApiProperty({type: () => UserProfileResponse, nullable: true})
    profile: UserProfileResponse | null;
}
