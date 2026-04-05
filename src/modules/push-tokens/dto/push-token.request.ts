import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class PushTokenRequest {
    @ApiProperty({example: 'fcm-token-abc123'})
    @IsString()
    @IsNotEmpty()
    token: string;
}
