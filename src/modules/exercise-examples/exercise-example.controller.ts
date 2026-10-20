import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiExtraModels,
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {Response} from 'express';
import {ExerciseExampleService} from './exercise-example.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {ExerciseExampleResponseDto, ExerciseExampleWithStatsResponse} from "./dto/exercise-example.response";
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";
import {ExerciseExampleI18nService} from "../../i18n/exercise-example-i18n.service";
import {
    ExerciseComponentsAssistWeightDto,
    ExerciseComponentsBodyWeightDto,
    ExerciseComponentsDto,
    ExerciseComponentsExternalWeightDto,
    ExerciseComponentsExtraWeightDto,
} from "./dto/exercise-components.dto";

@Controller('exercise-examples')
@ApiTags('exercise-examples')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class ExerciseExampleController {
    constructor(
        private readonly exerciseExamplesService: ExerciseExampleService,
        private readonly exerciseExampleI18nService: ExerciseExampleI18nService,
    ) {
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'List exercise examples with per-user stats (usageCount, lastUsed)'})
    @ApiHeader({name: 'Accept-Language', required: false, description: 'Preferred language ranges with optional q weights. Locales: en, ua (uk alias), ru, pt-BR, pt-PT; bare pt defaults to pt-BR.'})
    @ApiOkResponse({status: 200, description: 'List returned successfully', type: [ExerciseExampleWithStatsResponse], headers: {Vary: {description: 'Includes Accept-Language for localized responses', schema: {type: 'string', example: 'Accept-Language'}}}})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiBearerAuth('access-token')
    @ApiExtraModels(
        ExerciseExamplesEntity,
        ExerciseExampleWithStatsResponse,
        ExerciseExampleResponseDto,
        ExerciseComponentsDto,
        ExerciseComponentsExternalWeightDto,
        ExerciseComponentsBodyWeightDto,
        ExerciseComponentsExtraWeightDto,
        ExerciseComponentsAssistWeightDto,
    )
    async getExerciseExamples(
        @Req() req: any,
        @Res({passthrough: true}) res: Response,
    ): Promise<ExerciseExampleWithStatsResponse[]> {
        res.vary('Accept-Language');
        const language = req.locale ?? this.exerciseExampleI18nService.resolveLanguage();
        return this.exerciseExamplesService.getExerciseExamples(req.user, language);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get exercise example by ID with per-user stats (usageCount, lastUsed)'})
    @ApiHeader({name: 'Accept-Language', required: false, description: 'Preferred language ranges with optional q weights. Locales: en, ua (uk alias), ru, pt-BR, pt-PT; bare pt defaults to pt-BR.'})
    @ApiParam({name: 'id', description: 'Exercise example ID (UUID)', type: String, required: true})
    @ApiOkResponse({status: 200, description: 'Exercise example returned', type: ExerciseExampleWithStatsResponse, headers: {Vary: {description: 'Includes Accept-Language for localized responses', schema: {type: 'string', example: 'Accept-Language'}}}})
    @ApiBadRequestResponse({description: 'Invalid ID format'})
    @ApiNotFoundResponse({description: 'Exercise example not found'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiBearerAuth('access-token')
    @ApiExtraModels(
        ExerciseExamplesEntity,
        ExerciseExampleWithStatsResponse,
        ExerciseExampleResponseDto,
        ExerciseComponentsDto,
        ExerciseComponentsExternalWeightDto,
        ExerciseComponentsBodyWeightDto,
        ExerciseComponentsExtraWeightDto,
        ExerciseComponentsAssistWeightDto,
    )
    async getExerciseExampleById(
        @Req() req: any,
        @Param('id', new ParseUUIDPipe()) id: string,
        @Res({passthrough: true}) res: Response,
    ): Promise<ExerciseExampleWithStatsResponse> {
        res.vary('Accept-Language');
        const language = req.locale ?? this.exerciseExampleI18nService.resolveLanguage();
        const result = await this.exerciseExamplesService.getExerciseExampleById(id, req.user, language);
        if (!result) throw new NotFoundException(`Exercise example with id ${id} not found`);
        return result;
    }
}
