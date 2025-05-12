import {ApiProperty} from '@nestjs/swagger';
import {WeightTypeEnum} from "../../../lib/weight-type.enum";
import {ExperienceEnum} from "../../../lib/experience.enum";
import {ForceTypeEnum} from "../../../lib/force-type.enum";
import {ExerciseCategoryEnum} from "../../../lib/exercise-category.enum";
import {IsArray, IsEnum, IsOptional, IsUUID} from "class-validator";

export class FiltersRequest {
    @ApiProperty({ type: 'string', example: '', required: false })
    @IsOptional()
    query?: string;

    @ApiProperty({ type: 'string', enum: WeightTypeEnum, required: false })
    @IsOptional()
    @IsEnum(WeightTypeEnum)
    weightType?: WeightTypeEnum;

    @ApiProperty({ type: 'string', enum: ExperienceEnum, required: false })
    @IsOptional()
    @IsEnum(ExperienceEnum)
    experience?: ExperienceEnum;

    @ApiProperty({ type: 'string', enum: ForceTypeEnum, required: false })
    @IsOptional()
    @IsEnum(ForceTypeEnum)
    forceType?: ForceTypeEnum;

    @ApiProperty({ type: 'string', enum: ExerciseCategoryEnum, required: false })
    @IsOptional()
    @IsEnum(ExerciseCategoryEnum)
    category?: ExerciseCategoryEnum;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    muscleIds?: string[];

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    equipmentIds?: string[];
}

