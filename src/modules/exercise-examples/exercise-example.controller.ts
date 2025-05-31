import {Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {ExerciseExampleService} from './exercise-example.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {ExerciseExampleRequest} from "./dto/exercise-example.request";
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
    @ApiOperation({summary: 'Create or update an exercise example (admin only)'})
    @ApiResponse({status: 201, description: 'Exercise example created or updated'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    async setExerciseExample(
        @Body() body: ExerciseExampleRequest,
    ): Promise<ExerciseExamplesEntity | null> {
        return this.exerciseExamplesService.setOrUpdateExerciseExample(body);
    }
}