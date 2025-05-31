import {Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {UsersService} from './users.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';

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
    @ApiResponse({status: 200, description: 'User profile returned successfully'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    async getUser(@Req() req): Promise<any> {
        return this.usersService.getUser(req.user.id);
    }

    @Get('excluded-muscles')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all excluded muscles for current user' })
    @ApiResponse({ status: 200, description: 'Excluded muscles fetched' })
    async getExcludedMuscles(@Req() req): Promise<any> {
        return this.usersService.getExcludedMuscles(req.user);
    }

    @Post('excluded-muscles/:id')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Exclude muscle for current user' })
    @ApiResponse({ status: 201, description: 'Muscle excluded' })
    async excludeMuscle(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.excludeMuscle(req.user, id);
    }

    @Delete('excluded-muscles/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove muscle from excluded list (i.e., include it)' })
    @ApiResponse({ status: 200, description: 'Muscle included (unexcluded)' })
    async unexcludeMuscle(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.unexcludeMuscle(req.user, id);
    }

    @Get('excluded-equipments')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all excluded equipments for current user' })
    @ApiResponse({ status: 200, description: 'Excluded equipments fetched' })
    async getExcludedEquipments(@Req() req): Promise<any> {
        return this.usersService.getExcludedEquipments(req.user);
    }

    @Post('excluded-equipments/:id')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Exclude equipment for current user' })
    @ApiResponse({ status: 201, description: 'Equipment excluded' })
    async excludeEquipment(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.excludeEquipment(req.user, id);
    }

    @Delete('excluded-equipments/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove equipment from excluded list (i.e., include it)' })
    @ApiResponse({ status: 200, description: 'Equipment included (unexcluded)' })
    async unexcludeEquipment(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.unexcludeEquipment(req.user, id);
    }
}