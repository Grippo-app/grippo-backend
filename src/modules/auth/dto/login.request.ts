import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginRequest {
  @ApiProperty({ example: 'user@mail.com', type: 'string' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password', type: 'string' })
  @IsString()
  password: string;
}
