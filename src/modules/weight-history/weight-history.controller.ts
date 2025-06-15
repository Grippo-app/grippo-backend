import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { WeightHistoryService } from './weight-history.service';
import { WeightHistoryRequest } from './dto/weight-history.request';

@ApiTags('weight-history')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('weight-history')
export class WeightHistoryController {
    constructor(private readonly weightHistoryService: WeightHistoryService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get full weight history for current user' })
    @ApiResponse({ status: 200, description: 'Weight history fetched successfully' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    async getWeightHistory(@Req() req) {
        return this.weightHistoryService.getWeightHistory(req.user);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add new weight entry for current user' })
    @ApiResponse({ status: 201, description: 'Weight entry added' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    async setWeightHistory(
        @Req() req,
        @Body() body: WeightHistoryRequest,
    ) {
        return this.weightHistoryService.setWeightHistory(req.user, body.weight);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove weight entry by ID' })
    @ApiResponse({ status: 200, description: 'Weight entry deleted' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
    async removeWeightHistory(@Req() req, @Param('id') id: string) {
        return this.weightHistoryService.removeWeight(req.user, id);
    }
}