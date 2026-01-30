import {
    Equals,
    IsBoolean,
    IsDefined,
    IsNumber,
    Max,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import {ApiProperty, ApiPropertyOptional, getSchemaPath} from '@nestjs/swagger';
import {Type} from 'class-transformer';

export class ExerciseRulesInputExternalWeightDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseRulesInputBodyWeightDto {
    @ApiProperty({type: 'boolean', example: true})
    @Equals(true)
    participates: true;

    @ApiProperty({type: 'number', example: 1.0})
    @IsNumber({allowInfinity: false, allowNaN: false})
    @Min(0.05)
    @Max(2.0)
    multiplier: number;
}

export class ExerciseRulesInputExtraWeightDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseRulesInputAssistanceDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseRulesInputsDto {
    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseRulesInputExternalWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseRulesInputExternalWeightDto)
    externalWeight: ExerciseRulesInputExternalWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseRulesInputBodyWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseRulesInputBodyWeightDto)
    bodyWeight: ExerciseRulesInputBodyWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseRulesInputExtraWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseRulesInputExtraWeightDto)
    extraWeight: ExerciseRulesInputExtraWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseRulesInputAssistanceDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseRulesInputAssistanceDto)
    assistance: ExerciseRulesInputAssistanceDto | null;
}

export class ExerciseRulesRequestDto {
    @ApiProperty({type: () => ExerciseRulesInputsDto})
    @IsDefined()
    @ValidateNested()
    @Type(() => ExerciseRulesInputsDto)
    inputs: ExerciseRulesInputsDto;
}

export class ExerciseRulesResponseDto {
    @ApiProperty({type: () => ExerciseRulesInputsDto})
    inputs: ExerciseRulesInputsDto;
}
