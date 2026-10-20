import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsString, Length, Matches, ValidateIf} from 'class-validator';
import {ExerciseExampleRequest} from './exercise-example.request';

export class ExerciseExampleUpdateRequest extends ExerciseExampleRequest {
    @ApiPropertyOptional({
        type: String,
        pattern: '^[a-f0-9]{64}$',
        minLength: 64,
        maxLength: 64,
        description: 'Revision from the stored translations snapshot. Required when Portuguese translations exist or are introduced.',
    })
    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @Length(64, 64)
    @Matches(/^[a-f0-9]{64}$/)
    translationsRevision?: string;
}
