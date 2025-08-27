import {Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {ExerciseExampleService} from './exercise-example.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {ExerciseExampleRequest} from "./dto/exercise-example.request";
import {ExerciseExampleCreateResponse} from "./dto/exercise-example.response";
import {ExerciseExamplesEntity} from "../../entities/exercise-examples.entity";
import {AdminOnlyGuard} from "../../common/admin.guard";

@Controller('exercise-examples')
@ApiTags('exercise-examples')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class ExerciseExampleController {
    constructor(private readonly exerciseExamplesService: ExerciseExampleService) {
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get all exercise examples'})
    @ApiResponse({status: 200, description: 'Returned all exercise examples'})
    async getExerciseExamples(): Promise<ExerciseExamplesEntity[]> {
        return this.exerciseExamplesService.getExerciseExamples();
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get exercise example by ID'})
    @ApiResponse({status: 200, description: 'Returned exercise example by ID'})
    @ApiParam({name: 'id', required: true, type: 'string'})
    async getExerciseExampleById(
        @Param('id', new ParseUUIDPipe()) id: string
    ): Promise<ExerciseExamplesEntity | null> {
        return this.exerciseExamplesService.getExerciseExampleById(id);
    }

    @Post()
    @UseGuards(AdminOnlyGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Create a new exercise example (admin only)'})
    @ApiResponse({status: 201, description: 'Exercise example created successfully', type: ExerciseExampleCreateResponse})
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
    @ApiQuery({name: 'id', required: true, example: '3b828d2f-797f-4a45-9d1d-1d3efe38fb54', description: 'Exercise example ID to update'})
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
}