import {
    BadRequestException,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Query,
    Req,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {StatisticsService} from './statistics.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {
    AchievementsQueryDto,
    ExerciseExampleAchievementsDto,
    ExerciseIdsResponseDto,
    MuscleFilterQueryDto,
    PersonalRecordDto,
    WorkoutSummaryDto,
} from './dto/exercise.response';

@Controller('statistics')
@ApiTags('statistics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {
    }

    @Get('achievements/exercise-example/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get exercise example achievements by ID'})
    @ApiParam({name: 'id', required: true, type: 'string', description: 'Exercise example ID (UUID)'})
    @ApiOkResponse({type: ExerciseExampleAchievementsDto})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiBadRequestResponse({description: 'Invalid exercise example ID or query'})
    @ApiNotFoundResponse({description: 'Exercise example not found'})
    async getExerciseExampleAchievements(
        @Req() req: any,
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query(new ValidationPipe({transform: true, whitelist: true})) query: AchievementsQueryDto,
    ): Promise<ExerciseExampleAchievementsDto> {
        const size = query.size ?? 10;
        return this.statisticsService.getExerciseExampleAchievements(id, req.user, size);
    }

    @Get('personal-records')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get personal records for all exercise examples'})
    @ApiOkResponse({type: [PersonalRecordDto]})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async getPersonalRecords(@Req() req: any): Promise<PersonalRecordDto[]> {
        return this.statisticsService.getPersonalRecords(req.user);
    }

    @Get('workout-summary')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get workout summary statistics'})
    @ApiOkResponse({type: WorkoutSummaryDto})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async getWorkoutSummary(@Req() req: any): Promise<WorkoutSummaryDto> {
        return this.statisticsService.getWorkoutSummary(req.user);
    }

    @Get('recent-exercises')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'DEPRECATED: use /statistics/recent-exercises with muscle filters',
        deprecated: true,
    })
    @ApiOkResponse({type: ExerciseIdsResponseDto})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiBadRequestResponse({description: 'Invalid muscle or muscle group ID'})
    async getRecentExercisesByMuscle(
        @Req() req: any,
        @Query(new ValidationPipe({transform: true, whitelist: true})) query: MuscleFilterQueryDto,
    ): Promise<ExerciseIdsResponseDto> {
        if (!query.muscleId && !query.muscleGroupId) {
            throw new BadRequestException('Either muscleId or muscleGroupId must be provided');
        }
        const limit = query.limit ?? 10;

        // proxy to unified endpoint logic
        const items = await this.statisticsService.getRecentExercises(
            req.user,
            limit,
            {muscleId: query.muscleId, muscleGroupId: query.muscleGroupId},
        );
        return {exerciseExampleIds: items.map((i) => i.exerciseExampleId)};
    }

    @Get('frequent-exercises-by-muscle')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'DEPRECATED: use /statistics/frequent-exercises with muscle filters',
        deprecated: true,
    })
    @ApiOkResponse({type: ExerciseIdsResponseDto})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiBadRequestResponse({description: 'Invalid muscle or muscle group ID'})
    async getFrequentExercisesByMuscle(
        @Req() req: any,
        @Query(new ValidationPipe({transform: true, whitelist: true})) query: MuscleFilterQueryDto,
    ): Promise<ExerciseIdsResponseDto> {
        if (!query.muscleId && !query.muscleGroupId) {
            throw new BadRequestException('Either muscleId or muscleGroupId must be provided');
        }
        const limit = query.limit ?? 10;

        // proxy to unified endpoint logic
        const items = await this.statisticsService.getFrequentExercises(
            req.user,
            limit,
            {muscleId: query.muscleId, muscleGroupId: query.muscleGroupId},
        );
        return {exerciseExampleIds: items.map((i) => i.exerciseExampleId)};
    }
}
