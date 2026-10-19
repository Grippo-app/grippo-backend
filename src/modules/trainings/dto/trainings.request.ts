import {ApiProperty} from '@nestjs/swagger';
import {IsArray, IsDefined, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min, ValidateBy, ValidateNested,} from 'class-validator';
import {Transform, Type} from 'class-transformer';

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const VOLUME_MAX = 999999999.9;
const INTENSITY_MAX = 999.99;
const WEIGHT_MAX = 9999.9;
const BODY_MULTIPLIER_MAX = 99.99;

function RoundAggregate(decimalPlaces: number, maximum: number): PropertyDecorator {
    return Transform(({value}) => {
        // Preserve invalid input so validation checks its original type and range.
        if (typeof value !== 'number' || !Number.isFinite(value) || value < -maximum || value > maximum) {
            return value;
        }
        return Number(value.toFixed(decimalPlaces));
    }, {toClassOnly: true});
}

// Keep decimal validation safe for numbers serialized in scientific notation.
function IsNumberWithPrecision(maxDecimalPlaces: number): PropertyDecorator {
    return ValidateBy({
        name: 'isNumber',
        constraints: [{maxDecimalPlaces}],
        validator: {
            validate: (value) => typeof value === 'number'
                && Number.isFinite(value)
                && Number(value.toFixed(maxDecimalPlaces)) === value,
            defaultMessage: () => '$property must be a number conforming to the specified constraints',
        },
    });
}

export class ExerciseIterationRequest {
    id?: string;

    @ApiProperty({type: 'number', example: 20, nullable: true, required: false, minimum: -WEIGHT_MAX, maximum: WEIGHT_MAX})
    @IsNumberWithPrecision(1)
    @Min(-WEIGHT_MAX)
    @Max(WEIGHT_MAX)
    @IsOptional()
    assistWeight?: number | null;

    @ApiProperty({type: 'number', example: 100.5, nullable: true, required: false, minimum: -WEIGHT_MAX, maximum: WEIGHT_MAX})
    @IsNumberWithPrecision(1)
    @Min(-WEIGHT_MAX)
    @Max(WEIGHT_MAX)
    @IsOptional()
    externalWeight?: number | null;

    @ApiProperty({type: 'number', example: 10, nullable: true, required: false, minimum: -WEIGHT_MAX, maximum: WEIGHT_MAX})
    @IsNumberWithPrecision(1)
    @Min(-WEIGHT_MAX)
    @Max(WEIGHT_MAX)
    @IsOptional()
    extraWeight?: number | null;

    @ApiProperty({type: 'number', example: 82.5, nullable: true, required: false, minimum: -WEIGHT_MAX, maximum: WEIGHT_MAX})
    @IsNumberWithPrecision(1)
    @Min(-WEIGHT_MAX)
    @Max(WEIGHT_MAX)
    @IsOptional()
    bodyWeight?: number | null;

    @ApiProperty({type: 'number', example: 1.0, nullable: true, required: false, minimum: -BODY_MULTIPLIER_MAX, maximum: BODY_MULTIPLIER_MAX})
    @IsNumberWithPrecision(2)
    @Min(-BODY_MULTIPLIER_MAX)
    @Max(BODY_MULTIPLIER_MAX)
    @IsOptional()
    bodyMultiplier?: number | null;

    @ApiProperty({type: 'number', example: 10, minimum: INT_MIN, maximum: INT_MAX})
    @IsInt()
    @Min(INT_MIN)
    @Max(INT_MAX)
    repetitions: number;
}

export class TrainingExerciseRequest {
    id?: string;

    @ApiProperty({type: 'string', example: 'bench press'})
    @IsString()
    name: string;

    @ApiProperty({type: 'number', example: 2000.5, description: 'Volume in kg, rounded to 1 decimal', minimum: -VOLUME_MAX, maximum: VOLUME_MAX})
    @RoundAggregate(1, VOLUME_MAX)
    @IsNumberWithPrecision(1)
    @Min(-VOLUME_MAX)
    @Max(VOLUME_MAX)
    volume: number;

    @ApiProperty({type: 'number', example: 50, minimum: INT_MIN, maximum: INT_MAX})
    @IsInt()
    @Min(INT_MIN)
    @Max(INT_MAX)
    repetitions: number;

    @ApiProperty({type: 'number', example: 60, description: 'Intensity %, rounded to 2 decimals', minimum: -INTENSITY_MAX, maximum: INTENSITY_MAX})
    @RoundAggregate(2, INTENSITY_MAX)
    @IsNumberWithPrecision(2)
    @Min(-INTENSITY_MAX)
    @Max(INTENSITY_MAX)
    intensity: number;

    @ApiProperty({type: [ExerciseIterationRequest]})
    @IsDefined()
    @IsArray()
    @IsObject({each: true})
    @ValidateNested({each: true})
    @Type(() => ExerciseIterationRequest)
    iterations: ExerciseIterationRequest[];

    @ApiProperty({
        type: 'string',
        example: "3b828d2f-797f-4a45-9d1d-1d3efe38fb54",
        description: 'Exercise example ID',
        required: false
    })
    @IsUUID()
    @IsOptional()
    exerciseExampleId?: string;
}

export class TrainingsRequest {
    @ApiProperty({type: 'number', example: 25, description: 'Duration in minutes', minimum: INT_MIN, maximum: INT_MAX})
    @IsInt()
    @Min(INT_MIN)
    @Max(INT_MAX)
    duration: number;

    @ApiProperty({type: 'number', example: 20000.5, description: 'Total volume in kg, rounded to 1 decimal', minimum: -VOLUME_MAX, maximum: VOLUME_MAX})
    @RoundAggregate(1, VOLUME_MAX)
    @IsNumberWithPrecision(1)
    @Min(-VOLUME_MAX)
    @Max(VOLUME_MAX)
    volume: number;

    @ApiProperty({type: 'number', example: 150, minimum: INT_MIN, maximum: INT_MAX})
    @IsInt()
    @Min(INT_MIN)
    @Max(INT_MAX)
    repetitions: number;

    @ApiProperty({type: 'number', example: 60, description: 'Intensity %, rounded to 2 decimals', minimum: -INTENSITY_MAX, maximum: INTENSITY_MAX})
    @RoundAggregate(2, INTENSITY_MAX)
    @IsNumberWithPrecision(2)
    @Min(-INTENSITY_MAX)
    @Max(INTENSITY_MAX)
    intensity: number;

    @ApiProperty({type: [TrainingExerciseRequest]})
    @IsDefined()
    @IsArray()
    @IsObject({each: true})
    @ValidateNested({each: true})
    @Type(() => TrainingExerciseRequest)
    exercises: TrainingExerciseRequest[];
}
