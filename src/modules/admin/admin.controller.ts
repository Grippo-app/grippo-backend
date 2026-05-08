import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import {Response} from 'express';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {AdminOnlyGuard} from '../../common/admin.guard';
import {ExerciseExampleService} from '../exercise-examples/exercise-example.service';
import {ExerciseExampleRequest} from '../exercise-examples/dto/exercise-example.request';
import {ExerciseExampleCreateResponse} from '../exercise-examples/dto/exercise-example.response';
import {UsersService} from '../users/users.service';
import {AssignAdminRequest} from '../users/dto/assign-admin.request';
import {AdminUserResponse} from '../users/dto/admin-user.response';
import {AdminSetRoleRequest} from '../users/dto/admin-set-role.request';
import {GoalResponse} from '../users/dto/goal.response';
import {TrainingsService} from '../trainings/trainings.service';
import {TrainingsEntity} from '../../entities/trainings.entity';
import {WeightHistoryService} from '../weight-history/weight-history.service';
import {WeightHistoryEntity} from '../../entities/weight-history.entity';
import {PushTokensService} from '../push-tokens/push-tokens.service';
import {DeviceTokenResponse} from '../push-tokens/dto/device-token.response';
import {ExerciseExampleI18nService} from '../../i18n/exercise-example-i18n.service';

@Controller('admin')
@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminController {
    constructor(
        private readonly exerciseExamplesService: ExerciseExampleService,
        private readonly usersService: UsersService,
        private readonly trainingsService: TrainingsService,
        private readonly weightHistoryService: WeightHistoryService,
        private readonly pushTokensService: PushTokensService,
        private readonly exerciseExampleI18nService: ExerciseExampleI18nService,
    ) {
    }

    // Exercise examples
    @Post('exercise-examples')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Create a new exercise example (admin only)'})
    @ApiResponse({
        status: 201,
        description: 'Exercise example created successfully',
        type: ExerciseExampleCreateResponse,
    })
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiBadRequestResponse({description: 'Invalid data provided'})
    async createExerciseExample(
        @Body() body: ExerciseExampleRequest,
    ): Promise<ExerciseExampleCreateResponse> {
        return this.exerciseExamplesService.createExerciseExample(body);
    }

    @Put('exercise-examples')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Update an existing exercise example (admin only)'})
    @ApiQuery({
        name: 'id',
        required: true,
        example: '3b828d2f-797f-4a45-9d1d-1d3efe38fb54',
        description: 'Exercise example ID to update',
    })
    @ApiResponse({status: 204, description: 'Exercise example updated successfully'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @ApiNotFoundResponse({description: 'Exercise example not found'})
    @ApiBadRequestResponse({description: 'Invalid data provided'})
    async updateExerciseExample(
        @Query('id', new ParseUUIDPipe()) id: string,
        @Body() body: ExerciseExampleRequest,
    ): Promise<void> {
        return this.exerciseExamplesService.updateExerciseExample(id, body);
    }

    @Delete('exercise-examples/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Delete an exercise example (admin only)'})
    @ApiParam({name: 'id', description: 'Exercise example ID (UUID)', type: String, required: true})
    @ApiNoContentResponse({description: 'Exercise example deleted successfully'})
    @ApiNotFoundResponse({description: 'Exercise example not found'})
    @ApiConflictResponse({description: 'Example is referenced by exercises'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async deleteExerciseExample(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<void> {
        return this.exerciseExamplesService.deleteExerciseExample(id);
    }

    // Users
    @Post('users/make-admin')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Promote user to admin role'})
    @ApiOkResponse({description: 'User promoted successfully', type: AdminUserResponse})
    @ApiBadRequestResponse({description: 'Invalid payload or email already used'})
    @ApiNotFoundResponse({description: 'User not found'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async makeAdmin(
        @Body() body: AssignAdminRequest,
    ): Promise<AdminUserResponse> {
        return this.usersService.makeUserAdminByEmail(body.email);
    }

    @Get('users')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'List all users'})
    @ApiOkResponse({description: 'Users retrieved', type: [AdminUserResponse]})
    async getUsers(): Promise<AdminUserResponse[]> {
        return this.usersService.getAllUsers();
    }

    @Put('users/:id/role')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Set user role'})
    @ApiParam({name: 'id', description: 'User ID (UUID)', type: String})
    @ApiOkResponse({description: 'User role updated', type: AdminUserResponse})
    @ApiBadRequestResponse({description: 'Invalid data'})
    @ApiNotFoundResponse({description: 'User not found'})
    async setUserRole(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() body: AdminSetRoleRequest,
    ): Promise<AdminUserResponse> {
        return this.usersService.setUserRole(id, body);
    }

    @Get('users/:id/goal')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get goal of any user (admin only)'})
    @ApiParam({name: 'id', description: 'User ID (UUID)', type: String})
    @ApiOkResponse({description: 'Goal returned, or null if user has no profile/goal', type: GoalResponse})
    @ApiNotFoundResponse({description: 'User not found'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async getUserGoal(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Res({passthrough: true}) res: Response,
    ): Promise<void> {
        // Mirrors `users.getGoal`: NestJS sends an empty body for `null` returns,
        // so we explicitly serialize via `res.json` to keep the JSON contract stable.
        const goal = await this.usersService.getGoalByUserId(id);
        res.json(goal);
    }

    @Get('users/:id/trainings')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get trainings of any user in date range (admin only)'})
    @ApiParam({name: 'id', description: 'User ID (UUID)', type: String})
    @ApiQuery({name: 'start', required: true, example: new Date().toISOString(), description: 'Start date (ISO)'})
    @ApiQuery({name: 'end', required: true, example: new Date().toISOString(), description: 'End date (ISO)'})
    @ApiOkResponse({description: 'List of trainings', type: [TrainingsEntity]})
    @ApiBadRequestResponse({description: 'Invalid date range'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async getUserTrainings(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query('start') start: string,
        @Query('end') end: string,
        @Req() req,
    ): Promise<TrainingsEntity[]> {
        const language = req.locale ?? this.exerciseExampleI18nService.resolveLanguage();
        return this.trainingsService.getTrainingsByUserId(id, start, end, language);
    }

    @Get('users/:id/weight-history')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get full weight history of any user (admin only)'})
    @ApiParam({name: 'id', description: 'User ID (UUID)', type: String})
    @ApiOkResponse({description: 'Weight history (ordered DESC)', type: [WeightHistoryEntity]})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async getUserWeightHistory(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<WeightHistoryEntity[]> {
        return this.weightHistoryService.getWeightHistoryByUserId(id);
    }

    @Get('users/:id/device-tokens')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get device push tokens of any user (admin only)'})
    @ApiParam({name: 'id', description: 'User ID (UUID)', type: String})
    @ApiOkResponse({description: 'Device tokens (ordered DESC)', type: [DeviceTokenResponse]})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async getUserDeviceTokens(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<DeviceTokenResponse[]> {
        return this.pushTokensService.getTokensByUserId(id);
    }

    @Delete('users/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Remove user by admin'})
    @ApiParam({name: 'id', description: 'User ID (UUID)', type: String})
    @ApiNoContentResponse({description: 'User deleted'})
    @ApiNotFoundResponse({description: 'User not found'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    async deleteUser(
        @Param('id', new ParseUUIDPipe()) id: string,
    ): Promise<void> {
        await this.usersService.deleteUser(id);
    }
}
