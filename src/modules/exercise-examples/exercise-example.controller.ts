import {
    Body,
    Controller, Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth, ApiConflictResponse,
    ApiExtraModels, ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ExerciseExampleService} from './exercise-example.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {ExerciseExampleRequest} from "./dto/exercise-example.request";
import {ExerciseExampleCreateResponse, ExerciseExampleWithStatsResponse} from "./dto/exercise-example.response";
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";
import {AdminOnlyGuard} from "../../common/admin.guard";
import {ExerciseExampleI18nService} from "../../i18n/exercise-example-i18n.service";

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
    @ApiOkResponse({status: 200, description: 'List returned successfully', type: [ExerciseExampleWithStatsResponse]})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiBearerAuth('access-token')
    @ApiExtraModels(ExerciseExamplesEntity, ExerciseExampleWithStatsResponse)
    async getExerciseExamples(
        @Req() req: any,
    ): Promise<ExerciseExampleWithStatsResponse[]> {
        const language = req.locale ?? this.exerciseExampleI18nService.resolveLanguage();
        return this.exerciseExamplesService.getExerciseExamples(req.user, language);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get exercise example by ID with per-user stats (usageCount, lastUsed)'})
    @ApiParam({name: 'id', description: 'Exercise example ID (UUID)', type: String, required: true})
    @ApiOkResponse({status: 200, description: 'Exercise example returned', type: ExerciseExampleWithStatsResponse})
    @ApiBadRequestResponse({description: 'Invalid ID format'})
    @ApiNotFoundResponse({description: 'Exercise example not found'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiBearerAuth('access-token')
    @ApiExtraModels(ExerciseExamplesEntity, ExerciseExampleWithStatsResponse)
    async getExerciseExampleById(
        @Req() req: any,
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<ExerciseExampleWithStatsResponse> {
        const language = req.locale ?? this.exerciseExampleI18nService.resolveLanguage();
        const result = await this.exerciseExamplesService.getExerciseExampleById(id, req.user, language);
        if (!result) throw new NotFoundException(`Exercise example with id ${id} not found`);
        return result;
    }

    @Post()
    @UseGuards(AdminOnlyGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Create a new exercise example (admin only)'})
    @ApiResponse({
        status: 201,
        description: 'Exercise example created successfully',
        type: ExerciseExampleCreateResponse
    })
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided'})
    async createExerciseExample(
        @Body() body: ExerciseExampleRequest,
    ): Promise<ExerciseExampleCreateResponse> {
        return this.exerciseExamplesService.createExerciseExample(body);
    }

    @Put()
    @UseGuards(AdminOnlyGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Update an existing exercise example (admin only)'})
    @ApiQuery({
        name: 'id',
        required: true,
        example: '3b828d2f-797f-4a45-9d1d-1d3efe38fb54',
        description: 'Exercise example ID to update'
    })
    @ApiResponse({status: 204, description: 'Exercise example updated successfully'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Exercise example not found'})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided'})
    async updateExerciseExample(
        @Query('id', new ParseUUIDPipe()) id: string,
        @Body() body: ExerciseExampleRequest,
    ): Promise<void> {
        return this.exerciseExamplesService.updateExerciseExample(id, body);
    }

    @Delete(':id')
    @UseGuards(AdminOnlyGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an exercise example (admin only)' })
    @ApiParam({ name: 'id', description: 'Exercise example ID (UUID)', type: String, required: true })
    @ApiNoContentResponse({ description: 'Exercise example deleted successfully' })
    @ApiNotFoundResponse({ description: 'Exercise example not found' })
    @ApiConflictResponse({ description: 'Example is referenced by exercises' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
    @ApiBearerAuth('access-token')
    async deleteExerciseExample(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<void> {
        return this.exerciseExamplesService.deleteExerciseExample(id);
    }
}
