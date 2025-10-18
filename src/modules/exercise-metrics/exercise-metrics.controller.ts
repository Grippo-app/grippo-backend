import {Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Req, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath} from '@nestjs/swagger';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {ExerciseMetricsService} from './exercise-metrics.service';
import {BestTonnageResponseDto, BestWeightResponseDto} from './dto/exercise-metrics.response';
import type {ExercisesEntity} from '../../entities/exercises.entity';

@Controller('exercise-metrics')
@ApiTags('exercise-metrics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiExtraModels(BestWeightResponseDto, BestTonnageResponseDto)
export class ExerciseMetricsController {
    constructor(private readonly exerciseMetricsService: ExerciseMetricsService) {
    }

    @Get('exercise-example/:id/best-weight')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get best weight lifted for the exercise example'})
    @ApiOkResponse({
        schema: {
            $ref: getSchemaPath(BestWeightResponseDto),
            nullable: true,
        },
    })
    async getBestWeight(
        @Req() req: any,
        @Param('id', new ParseUUIDPipe()) exerciseExampleId: string,
    ): Promise<BestWeightResponseDto | null> {
        return this.exerciseMetricsService.getBestWeight(exerciseExampleId, req.user);
    }

    @Get('exercise-example/:id/best-tonnage')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get best tonnage (volume) for the exercise example'})
    @ApiOkResponse({
        schema: {
            $ref: getSchemaPath(BestTonnageResponseDto),
            nullable: true,
        },
    })
    async getBestTonnage(
        @Req() req: any,
        @Param('id', new ParseUUIDPipe()) exerciseExampleId: string,
    ): Promise<BestTonnageResponseDto | null> {
        return this.exerciseMetricsService.getBestTonnage(exerciseExampleId, req.user);
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
