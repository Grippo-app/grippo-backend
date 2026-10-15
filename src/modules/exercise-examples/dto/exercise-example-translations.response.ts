import {ApiProperty} from '@nestjs/swagger';
import {SupportedLanguage, SUPPORTED_LANGUAGES} from '../../../i18n/i18n.types';

export class ExerciseExampleBaseTextResponse {
    @ApiProperty({type: String, nullable: true, description: 'Stored base name without locale fallback'})
    name: string | null;

    @ApiProperty({type: String, nullable: true, description: 'Stored base description without locale fallback'})
    description: string | null;
}

export class ExerciseExampleStoredTranslationResponse {
    @ApiProperty({enum: SUPPORTED_LANGUAGES, example: 'en'})
    language: SupportedLanguage;

    @ApiProperty({type: String, nullable: true})
    name: string | null;

    @ApiProperty({type: String, nullable: true})
    description: string | null;
}

export class ExerciseExampleTranslationsResponse {
    @ApiProperty({type: String, format: 'uuid'})
    id: string;

    @ApiProperty({type: () => ExerciseExampleBaseTextResponse})
    base: ExerciseExampleBaseTextResponse;

    @ApiProperty({type: () => [ExerciseExampleStoredTranslationResponse], description: 'Actual stored rows only; absent languages are not synthesized'})
    translations: ExerciseExampleStoredTranslationResponse[];
}
