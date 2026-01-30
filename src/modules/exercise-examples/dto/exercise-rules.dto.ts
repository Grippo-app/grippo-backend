import {IsBoolean, IsEmpty, IsEnum, IsNumber, Max, Min, ValidateIf, ValidateNested,} from 'class-validator';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {
    ExerciseRulesEntryTypeEnum,
    ExerciseRulesLoadTypeEnum,
    ExerciseRulesMissingBodyWeightBehaviorEnum,
} from '../../../lib/exercise-rules.enum';

export class ExerciseRulesEntryDto {
    @ApiProperty({enum: ExerciseRulesEntryTypeEnum})
    @IsEnum(ExerciseRulesEntryTypeEnum)
    type: ExerciseRulesEntryTypeEnum;
}

export class ExerciseRulesLoadDto {
    @ApiProperty({enum: ExerciseRulesLoadTypeEnum})
    @IsEnum(ExerciseRulesLoadTypeEnum)
    type: ExerciseRulesLoadTypeEnum;

    @ApiPropertyOptional({type: 'number', example: 1.0})
    @ValidateIf((obj: ExerciseRulesLoadDto) => obj.type === ExerciseRulesLoadTypeEnum.BodyWeightMultiplier)
    @IsNumber({allowInfinity: false, allowNaN: false})
    @Min(0.05)
    @Max(2.0)
    @ValidateIf((obj: ExerciseRulesLoadDto) => obj.type !== ExerciseRulesLoadTypeEnum.BodyWeightMultiplier)
    @IsEmpty()
    multiplier?: number;
}

export class ExerciseRulesOptionsDto {
    @ApiProperty({type: 'boolean', example: false})
    @IsBoolean()
    canAddExtraWeight: boolean;

    @ApiProperty({type: 'boolean', example: false})
    @IsBoolean()
    canUseAssistance: boolean;
}

export class ExerciseRulesRequestDto {
    @ApiProperty({type: () => ExerciseRulesEntryDto})
    @ValidateNested()
    @Type(() => ExerciseRulesEntryDto)
    entry: ExerciseRulesEntryDto;

    @ApiProperty({type: () => ExerciseRulesLoadDto})
    @ValidateNested()
    @Type(() => ExerciseRulesLoadDto)
    load: ExerciseRulesLoadDto;

    @ApiProperty({type: () => ExerciseRulesOptionsDto})
    @ValidateNested()
    @Type(() => ExerciseRulesOptionsDto)
    options: ExerciseRulesOptionsDto;

    @ApiProperty({enum: ExerciseRulesMissingBodyWeightBehaviorEnum})
    @IsEnum(ExerciseRulesMissingBodyWeightBehaviorEnum)
    missingBodyWeightBehavior: ExerciseRulesMissingBodyWeightBehaviorEnum;


    @ApiProperty({type: 'boolean'})
    @IsBoolean()
    requiresEquipment: boolean;
}

export class ExerciseRulesResponseDto {
    @ApiProperty({type: () => ExerciseRulesEntryDto})
    entry: ExerciseRulesEntryDto;

    @ApiProperty({type: () => ExerciseRulesLoadDto})
    load: ExerciseRulesLoadDto;

    @ApiProperty({type: () => ExerciseRulesOptionsDto})
    options: ExerciseRulesOptionsDto;

    @ApiProperty({enum: ExerciseRulesMissingBodyWeightBehaviorEnum})
    missingBodyWeightBehavior: ExerciseRulesMissingBodyWeightBehaviorEnum;


    @ApiProperty({type: 'boolean'})
    requiresEquipment: boolean;
}
