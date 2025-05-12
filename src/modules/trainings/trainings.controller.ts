import {Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {TrainingsService} from './trainings.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {TrainingsRequest} from './dto/trainings.request';

@ApiTags('trainings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('trainings')
export class TrainingsController {
    constructor(private readonly trainingsService: TrainingsService) {
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get all trainings in date range for current user'})
    @ApiQuery({name: 'start', required: true, example: new Date().toISOString(), description: 'Start date (ISO)'})
    @ApiQuery({name: 'end', required: true, example: new Date().toISOString(), description: 'End date (ISO)'})
    @ApiResponse({status: 200, description: 'List of trainings returned successfully'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    async getUserTrainings(
        @Req() req,
        @Query('start') start: string,
        @Query('end') end: string,
    ): Promise<any> {
        return this.trainingsService.getAllTrainings(req.user, start, end);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get training details by ID for current user'})
    @ApiResponse({status: 200, description: 'Training details returned successfully'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    async getTrainingById(
        @Req() req,
        @Param('id') id: string,
    ): Promise<any> {
        return this.trainingsService.getTrainingById(id, req.user);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Create or update a training for current user'})
    @ApiResponse({status: 201, description: 'Training saved successfully'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    async setTraining(
        @Req() req,
        @Body() body: TrainingsRequest,
    ): Promise<any> {
        return this.trainingsService.setOrUpdateTraining(body, req.user);
    }
}
