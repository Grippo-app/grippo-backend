import {Body, Controller, Get, HttpStatus, Param, Post, Query, Req, Res, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiQuery, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {TrainingsService} from './trainings.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {TrainingsRequest} from './dto/trainings.request';

// todo 'trainings'
@Controller('trainings')
@ApiTags('trainings')
@ApiBearerAuth('access-token')
export class TrainingsController {
    constructor(private readonly usersService: TrainingsService) {
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    @ApiQuery({name: 'start', required: true, example: new Date()})
    @ApiQuery({name: 'end', required: true, example: new Date()})
    getUserTrainings(
        @Req() req,
        @Res() res,
        @Query('start') start: string,
        @Query('end') end: string,
    ) {
        const user = req.user;
        return this.usersService
            .getAllTrainings(user, start, end)
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    getTrainingById(@Req() req, @Res() res, @Param('id') id: string) {
        const user = req.user;
        return this.usersService
            .getTrainingById(id, user)
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    setTraining(@Req() req, @Res() res, @Body() body: TrainingsRequest) {
        const user = req.user;
        return this.usersService
            .setOrUpdateTraining(body, user)
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }
}
