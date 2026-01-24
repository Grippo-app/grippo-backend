import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class AppleLoginRequest {
    @ApiProperty({
        example: 'c2FtcGxlX2F1dGhjb2Rl',
        description: 'Apple authorization code',
    })
    @IsString()
    @IsNotEmpty()
    code: string;
}
