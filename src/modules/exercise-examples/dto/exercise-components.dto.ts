import {Equals, IsBoolean, IsDefined, IsNumber, Max, Min, ValidateIf, ValidateNested,} from 'class-validator';
import {ApiProperty, ApiPropertyOptional, getSchemaPath} from '@nestjs/swagger';
import {Type} from 'class-transformer';

export class ExerciseComponentsExternalWeightDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseComponentsBodyWeightDto {
    @ApiProperty({type: 'boolean', example: true})
    @Equals(true)
    required: true;

    @ApiProperty({type: 'number', example: 1.0})
    @IsNumber({allowInfinity: false, allowNaN: false})
    @Min(0.05)
    @Max(2.0)
    multiplier: number;
}

export class ExerciseComponentsExtraWeightDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseComponentsAssistWeightDto {
    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    required: boolean;
}

export class ExerciseComponentsDto {
    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseComponentsExternalWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseComponentsExternalWeightDto)
    externalWeight: ExerciseComponentsExternalWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseComponentsBodyWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseComponentsBodyWeightDto)
    bodyWeight: ExerciseComponentsBodyWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseComponentsExtraWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseComponentsExtraWeightDto)
    extraWeight: ExerciseComponentsExtraWeightDto | null;

    @ApiPropertyOptional({
        oneOf: [{type: 'null'}, {$ref: getSchemaPath(ExerciseComponentsAssistWeightDto)}],
        nullable: true,
    })
    @IsDefined()
    @ValidateIf((_, value) => value !== null)
    @ValidateNested()
    @Type(() => ExerciseComponentsAssistWeightDto)
    assistWeight: ExerciseComponentsAssistWeightDto | null;
}
