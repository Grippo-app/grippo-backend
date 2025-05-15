import {ApiProperty} from '@nestjs/swagger';

export class LoginResponse {
    @ApiProperty({example: 'string', description: 'User ID'})
    id: string;

    @ApiProperty({example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Access JWT token'})
    accessToken: string;

    @ApiProperty({example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Refresh JWT token'})
    refreshToken: string;
}
