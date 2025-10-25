import {Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Req, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {ExerciseMetricsService} from './exercise-metrics.service';
import {ExerciseAchievementsResponseDto} from './dto/exercise-metrics.response';
import type {ExercisesEntity} from '../../entities/exercises.entity';

@Controller('exercise-metrics')
@ApiTags('exercise-metrics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiExtraModels(ExerciseAchievementsResponseDto)
export class ExerciseMetricsController {
    constructor(private readonly exerciseMetricsService: ExerciseMetricsService) {
    }

    @Get('exercise-example/:id/achievements')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get aggregated achievements for the exercise example'})
    @ApiOkResponse({type: ExerciseAchievementsResponseDto})
    async getAchievements(
        @Req() req: any,
        @Param('id', new ParseUUIDPipe()) exerciseExampleId: string,
    ): Promise<ExerciseAchievementsResponseDto> {
        return this.exerciseMetricsService.getAchievements(exerciseExampleId, req.user);
    }

    @Get('exercise-example/:id/recent')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get five most recent exercises for the exercise example'})
    @ApiOkResponse({description: 'Array of exercises with iterations limited to recent 5'})
    async getRecentExercises(
        @Req() req: any,
        @Param('id', new ParseUUIDPipe()) exerciseExampleId: string,
    ): Promise<ExercisesEntity[]> {
        return this.exerciseMetricsService.getRecentExercises(exerciseExampleId, req.user);
    }
}
