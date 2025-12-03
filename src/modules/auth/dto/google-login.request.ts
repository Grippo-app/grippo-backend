import {ApiProperty} from '@nestjs/swagger';
import {IsString} from 'class-validator';

export class GoogleLoginRequest {
    @ApiProperty({example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRmN2M1', description: 'Google ID token'})
    @IsString()
    idToken: string;
}
