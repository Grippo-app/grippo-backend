import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {TrainingsService} from './trainings.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {TrainingsRequest} from './dto/trainings.request';
import {TrainingCreateResponse} from './dto/trainings.response';

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
    @ApiOperation({summary: 'Create a new training for current user'})
    @ApiResponse({status: 201, description: 'Training created successfully', type: TrainingCreateResponse})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided'})
    async createTraining(
        @Req() req,
        @Body() body: TrainingsRequest,
    ): Promise<TrainingCreateResponse> {
        return this.trainingsService.createTraining(body, req.user);
    }

    @Put()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Update an existing training for current user'})
    @ApiQuery({name: 'id', required: true, example: '3b828d2f-797f-4a45-9d1d-1d3efe38fb54', description: 'Training ID to update'})
    @ApiResponse({status: 204, description: 'Training updated successfully'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Training not found or access denied'})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided'})
    async updateTraining(
        @Req() req,
        @Query('id') id: string,
        @Body() body: TrainingsRequest,
    ): Promise<void> {
        return this.trainingsService.updateTraining(id, body, req.user);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Delete a training by ID for current user'})
    @ApiResponse({status: 204, description: 'Training deleted successfully'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'Training not found or access denied'})
    async deleteTraining(
        @Req() req,
        @Param('id') id: string,
    ): Promise<void> {
        return this.trainingsService.deleteTraining(id, req.user);
    }
}
