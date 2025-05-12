import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum, IsInt, IsNumber, IsString, IsUUID, Length,} from 'class-validator';
import {ExperienceEnum} from '../../../lib/experience.enum';
import {Expose, Type} from 'class-transformer';

export class RegisterRequest {
    @ApiProperty({example: 'user@mail.com', type: 'string'})
    @IsEmail()
    @Expose()
    email: string;

    @ApiProperty({example: 'password', type: 'string'})
    @Length(6, 128)
    @Expose()
    password: string;

    @ApiProperty({example: 'Max', type: 'string'})
    @IsString()
    @Expose()
    name: string;

    @ApiProperty({
        example: 82.5,
        type: 'number',
        description: 'Weight in kilograms (e.g., 82.5)',
    })
    @IsNumber({maxDecimalPlaces: 1})
    @Expose()
    weight: number;

    @ApiProperty({example: 175, type: 'number', description: '175 = 175cm'})
    @IsInt()
    @Expose()
    height: number;

    @ApiProperty({
        example: ExperienceEnum.PRO,
        type: 'enum',
        description: 'user experience',
    })
    @IsEnum(ExperienceEnum)
    @Expose()
    experience: ExperienceEnum;

    @ApiProperty({
        example: ['2e0faf2b-31a5-4c63-ac15-454be132796f'],
        type: 'array',
        description: 'excluded muscle ids',
    })
    @IsUUID('all', {each: true})
    @Type(() => String)
    @Expose()
    excludeMuscleIds: string[];

    @ApiProperty({
        example: ['b17ae8af-2d78-4e77-b45b-39253c28247a'],
        type: 'array',
        description: 'excluded equipment ids',
    })
    @IsUUID('all', {each: true})
    @Type(() => String)
    @Expose()
    excludeEquipmentIds: string[];
}