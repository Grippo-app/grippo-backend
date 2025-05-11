import {Controller, Get, HttpStatus, Query, Req, Res, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {StatisticsService} from './statistics.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';

@Controller()
@ApiTags('statistics')
@ApiBearerAuth('access-token')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {
    }

    @Get("statistics/achievements/exercise-example")
    @UseGuards(JwtAuthGuard)
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    getExerciseExampleAchievements(@Req() req, @Res() res, @Query("id") id: string, @Query("size") size: number) {
        const user = req.user;
        return this.statisticsService
            .getExerciseExampleAchievements(id, user, size)
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }
}
