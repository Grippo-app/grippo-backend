import {ApiProperty} from '@nestjs/swagger';
import {IsEnum} from 'class-validator';
import {UserRoleEnum} from '../../../lib/user-role.enum';

export class AdminSetRoleRequest {
    @ApiProperty({example: UserRoleEnum.ADMIN, enum: UserRoleEnum})
    @IsEnum(UserRoleEnum)
    role: UserRoleEnum;
}
