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

export class ExerciseRulesComponentsExternalWeightDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseRulesComponentsBodyWeightDto {
    @ApiProperty({type: 'boolean', example: true})
    @Equals(true)
    required: true;

    @ApiProperty({type: 'number', example: 1.0})
    @IsNumber({allowInfinity: false, allowNaN: false})
    @Min(0.05)
    @Max(2.0)
    multiplier: number;
}

export class ExerciseRulesComponentsExtraWeightDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseRulesComponentsAssistWeightDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseRulesComponentsDto {
    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseRulesComponentsExternalWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseRulesComponentsExternalWeightDto)
    externalWeight: ExerciseRulesComponentsExternalWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseRulesComponentsBodyWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseRulesComponentsBodyWeightDto)
    bodyWeight: ExerciseRulesComponentsBodyWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseRulesComponentsExtraWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseRulesComponentsExtraWeightDto)
    extraWeight: ExerciseRulesComponentsExtraWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseRulesComponentsAssistWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseRulesComponentsAssistWeightDto)
    assistWeight: ExerciseRulesComponentsAssistWeightDto | null;
}

export class ExerciseRulesRequestDto {
    @ApiProperty({type: () => ExerciseRulesComponentsDto})
    @IsDefined()
    @ValidateNested()
    @Type(() => ExerciseRulesComponentsDto)
    components: ExerciseRulesComponentsDto;
}

export class ExerciseRulesResponseDto {
    @ApiProperty({type: () => ExerciseRulesComponentsDto})
    components: ExerciseRulesComponentsDto;
}
