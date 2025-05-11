import {
    Controller, Delete,
    Get,
    HttpCode,
    HttpStatus, Param, Post,
    Req, Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get current user profile by token' })
    @ApiResponse({ status: 200, description: 'User profile returned successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
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
    @ApiOperation({ summary: 'Add muscle to excluded list' })
    @ApiResponse({ status: 201, description: 'Muscle excluded' })
    async setExcludedMuscle(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.setExcludedMuscle(req.user, id);
    }

    @Delete('excluded-muscles/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove muscle from excluded list' })
    @ApiResponse({ status: 200, description: 'Muscle unexcluded' })
    async deleteExcludedMuscle(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.deleteExcludedMuscle(req.user, id);
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
    @ApiOperation({ summary: 'Add equipment to excluded list' })
    @ApiResponse({ status: 201, description: 'Equipment excluded' })
    async setExcludedEquipment(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.setExcludedEquipment(req.user, id);
    }

    @Delete('excluded-equipments/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove equipment from excluded list' })
    @ApiResponse({ status: 200, description: 'Equipment unexcluded' })
    async deleteExcludedEquipment(@Req() req, @Param('id') id: string): Promise<any> {
        return this.usersService.deleteExcludedEquipment(req.user, id);
    }
}