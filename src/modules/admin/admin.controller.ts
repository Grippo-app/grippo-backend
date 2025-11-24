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
    UseGuards,
} from '@nestjs/common';
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

@Controller('admin')
@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminController {
    constructor(
        private readonly exerciseExamplesService: ExerciseExampleService,
        private readonly usersService: UsersService,
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
