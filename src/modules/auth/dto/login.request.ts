import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginRequest {
  @ApiProperty({ example: 'grippo@mail.com', type: 'string' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'qwerty123', type: 'string' })
  @IsString()
  password: string;
}
