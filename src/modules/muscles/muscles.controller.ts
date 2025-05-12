import {Controller, Get, HttpCode, HttpStatus, Param, Req, Res, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {MusclesService} from './muscles.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {MuscleGroupsResponse} from "./dto/muscle-response";

@Controller('muscles')
@ApiTags('muscles')
export class MusclesController {
    constructor(private readonly musclesService: MusclesService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get public muscle list (unauthorized access allowed)' })
    @ApiResponse({ status: 200, description: 'Returned public muscle list' })
    async getMuscles(): Promise<MuscleGroupsResponse[]> {
        return this.musclesService.getPublicMuscles();
    }
}
