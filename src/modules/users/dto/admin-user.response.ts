import {ApiProperty} from '@nestjs/swagger';
import {UserRoleEnum} from '../../../lib/user-role.enum';
import {UserProfileResponse} from './user.response';

export enum AdminAuthTypeEnum {
    GOOGLE = 'Google',
    EMAIL = 'Email',
}

export class AdminUserResponse {
    @ApiProperty({example: '3b828d2f-797f-4a45-9d1d-1d3efe38fb54'})
    id: string;

    @ApiProperty({example: 'user@example.com'})
    email: string;

    @ApiProperty({example: '72a0317f-e321-4da7-9869-91bf23d655bb', nullable: true})
    profileId: string | null;

    @ApiProperty({example: UserRoleEnum.DEFAULT, enum: UserRoleEnum})
    role: UserRoleEnum;

    @ApiProperty({example: AdminAuthTypeEnum.EMAIL, enum: AdminAuthTypeEnum})
    authType: AdminAuthTypeEnum;

    @ApiProperty({example: new Date().toISOString()})
    createdAt: Date;

    @ApiProperty({example: new Date().toISOString()})
    updatedAt: Date;

    @ApiProperty({type: () => UserProfileResponse, nullable: true})
    profile: UserProfileResponse | null;
}
