import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {ExerciseExampleService} from './exercise-example.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {ExerciseExampleRequest} from "./dto/exercise-example.request";
import {RecommendedRequest} from "./dto/recommended.request";
import {FiltersRequest} from "./dto/filters.request";
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";
import {WeightTypeEnum} from "../../lib/weight-type.enum";
import {ExperienceEnum} from "../../lib/experience.enum";
import {ForceTypeEnum} from "../../lib/force-type.enum";
import {ExerciseCategoryEnum} from "../../lib/exercise-category.enum";

@Controller('exercise-examples')
@ApiTags('exercise-examples')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class ExerciseExampleController {
    constructor(private readonly exerciseExamplesService: ExerciseExampleService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get exercise examples with filters' })
    @ApiQuery({ name: 'query', required: false, type: String })
    @ApiQuery({ name: 'weightType', required: false, enum: WeightTypeEnum })
    @ApiQuery({ name: 'experience', required: false, enum: ExperienceEnum })
    @ApiQuery({ name: 'forceType', required: false, enum: ForceTypeEnum })
    @ApiQuery({ name: 'category', required: false, enum: ExerciseCategoryEnum })
    @ApiQuery({ name: 'muscleIds', required: false, type: [String], isArray: true })
    @ApiQuery({ name: 'equipmentIds', required: false, type: [String], isArray: true })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'size', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Returned exercise examples' })
    async getExerciseExamples(
        @Query('query') query?: string,
        @Query('weightType') weightType?: WeightTypeEnum,
        @Query('experience') experience?: ExperienceEnum,
        @Query('forceType') forceType?: ForceTypeEnum,
        @Query('category') category?: ExerciseCategoryEnum,
        @Query('muscleIds') muscleIds?: string[],
        @Query('equipmentIds') equipmentIds?: string[],
        @Query('page') page = 1,
        @Query('size') size = 20,
    ): Promise<{ items: ExerciseExamplesEntity[]; total: number; page: number; size: number }> {
        const filters: FiltersRequest = { query, weightType, experience, forceType, category, muscleIds, equipmentIds };
        return this.exerciseExamplesService.getExerciseExamples(Number(page), Number(size), filters);
    }

    @Get('recommended')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get recommended exercise examples' })
    @ApiResponse({ status: 200, description: 'Returned recommended exercise examples' })
    async getRecommendedExerciseExamples(
        @Req() req,
        @Query('size') size: number,
        @Query('page') page: number,
        @Query() body: RecommendedRequest,
    ): Promise<{ recommendations: string[]; exercises: ExerciseExamplesEntity[] }> {
        return this.exerciseExamplesService.getRecommendedExerciseExamples(req.user, page, size, body);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get exercise example by ID' })
    @ApiResponse({ status: 200, description: 'Returned exercise example by ID' })
    async getExerciseExampleById(
        @Param('id') id: string,
    ): Promise<ExerciseExamplesEntity | null> {
        return this.exerciseExamplesService.getExerciseExampleById(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create or update an exercise example (admin only)' })
    @ApiResponse({ status: 201, description: 'Exercise example created or updated' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
    async setExerciseExample(
        @Req() req,
        @Body() body: ExerciseExampleRequest,
    ): Promise<ExerciseExamplesEntity | null> {
        if (req.user.email !== 'grippo@admin.panel') {
            throw new ForbiddenException('Only admin can create or update exercise examples');
        }
        return this.exerciseExamplesService.setOrUpdateExerciseExample(body);
    }
}