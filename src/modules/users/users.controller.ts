import {Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {UsersService} from './users.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {UpdateExcludedIdsDto} from "./dto/update-excluded-ids.dto";
import {CreateUserProfileRequest} from "./dto/create-user-profile.request";
import {UserResponse} from "./dto/user.response";

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get current user profile by token'})
    @ApiResponse({status: 200, description: 'User profile returned successfully', type: UserResponse})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    async getUser(@Req() req): Promise<UserResponse> {
        return this.usersService.getUser(req.user.id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Create user profile after registration'})
    @ApiBody({type: CreateUserProfileRequest})
    @ApiResponse({status: 201, description: 'User profile created', type: UserResponse})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, description: 'Profile already exists'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    async createProfile(
        @Req() req,
        @Body() dto: CreateUserProfileRequest,
    ): Promise<UserResponse> {
        return this.usersService.createProfile(req.user.id, dto);
    }

    @Get('excluded-muscles')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get all excluded muscles for current user'})
    @ApiResponse({status: 200, description: 'Excluded muscles fetched'})
    async getExcludedMuscles(@Req() req): Promise<any> {
        return this.usersService.getExcludedMuscles(req.user);
    }

    @Get('excluded-equipments')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get all excluded equipments for current user'})
    @ApiResponse({status: 200, description: 'Excluded equipments fetched'})
    async getExcludedEquipments(@Req() req): Promise<any> {
        return this.usersService.getExcludedEquipments(req.user);
    }

    @Post('excluded-muscles')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Replace excluded muscles with provided list'})
    @ApiResponse({status: 200, description: 'Excluded muscles updated'})
    async updateExcludedMuscles(
        @Req() req,
        @Body() body: UpdateExcludedIdsDto
    ): Promise<{ ids: string[] }> {
        return this.usersService.updateExcludedMuscles(req.user, body.ids);
    }

    @Post('excluded-equipments')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Replace excluded equipments with provided list'})
    @ApiResponse({status: 200, description: 'Excluded equipments updated'})
    async updateExcludedEquipments(
        @Req() req,
        @Body() body: UpdateExcludedIdsDto
    ): Promise<{ ids: string[] }> {
        return this.usersService.updateExcludedEquipments(req.user, body.ids);
    }
}
