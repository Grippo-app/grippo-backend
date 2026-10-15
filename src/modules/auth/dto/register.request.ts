import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, Length, ValidateBy} from 'class-validator';
import {Expose} from 'class-transformer';

export class RegisterRequest {
    @ApiProperty({example: 'grippo@mail.com', type: 'string'})
    @IsEmail()
    @Expose()
    email: string;

    @ApiProperty({example: 'qwerty123', type: 'string', minLength: 6, maxLength: 72,
        description: 'Password must not exceed 72 UTF-8 bytes'})
    @Length(6, 128)
    @ValidateBy({
        name: 'maxPasswordBytes',
        validator: {
            validate: (value: unknown) => typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72,
            defaultMessage: () => 'password must not exceed 72 UTF-8 bytes',
        },
    })
    @Expose()
    password: string;
}
