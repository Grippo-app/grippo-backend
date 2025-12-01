import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID} from 'class-validator';
import {ExperienceEnum} from '../../../lib/experience.enum';
import {Expose, Type} from 'class-transformer';

export class CreateUserProfileRequest {
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
        description: 'User experience',
    })
    @IsEnum(ExperienceEnum)
    @Expose()
    experience: ExperienceEnum;

    @ApiProperty({
        example: ['2e0faf2b-31a5-4c63-ac15-454be132796f'],
        type: 'array',
        description: 'Excluded muscle ids',
        required: false,
    })
    @IsUUID('all', {each: true})
    @IsOptional()
    @Type(() => String)
    @Expose()
    excludeMuscleIds?: string[];

    @ApiProperty({
        example: ['b17ae8af-2d78-4e77-b45b-39253c28247a'],
        type: 'array',
        description: 'Excluded equipment ids',
        required: false,
    })
    @IsUUID('all', {each: true})
    @IsOptional()
    @Type(() => String)
    @Expose()
    excludeEquipmentIds?: string[];
}
