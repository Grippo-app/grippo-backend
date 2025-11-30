import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, Length} from 'class-validator';
import {Expose} from 'class-transformer';

export class RegisterRequest {
    @ApiProperty({example: 'grippo@mail.com', type: 'string'})
    @IsEmail()
    @Expose()
    email: string;

    @ApiProperty({example: 'qwerty123', type: 'string'})
    @Length(6, 128)
    @Expose()
    password: string;
}
