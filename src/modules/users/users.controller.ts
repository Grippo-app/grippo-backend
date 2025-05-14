import {Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {UsersService} from './users.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';

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

    @Get('muscles')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get all included muscles for current user'})
    @ApiResponse({status: 200, description: 'Included muscles fetched'})
    async getMuscles(@Req() req): Promise<any> {
        return this.usersService.getMuscles(req.user);
    }

    @Post('muscles/:id')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Include muscle for current user'})
    @ApiResponse({status: 201, description: 'Muscle included'})
    async setMuscle(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.setMuscle(req.user, id);
    }

    @Delete('muscles/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Exclude muscle for current user'})
    @ApiResponse({status: 200, description: 'Muscle excluded'})
    async deleteMuscle(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.deleteMuscle(req.user, id);
    }

    @Get('equipments')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get all included equipments for current user'})
    @ApiResponse({status: 200, description: 'Included equipments fetched'})
    async getEquipments(@Req() req): Promise<any> {
        return this.usersService.getEquipments(req.user);
    }

    @Post('equipments/:id')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Include equipment for current user'})
    @ApiResponse({status: 201, description: 'Equipment included'})
    async setEquipment(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.setEquipment(req.user, id);
    }

    @Delete('equipments/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Exclude equipment from current user'})
    @ApiResponse({status: 200, description: 'Equipment excluded'})
    async deleteEquipment(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.deleteEquipment(req.user, id);
    }
}