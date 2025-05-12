import {Controller, Get, HttpCode, HttpStatus, Param, Req, Res, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {EquipmentsService} from './equipments.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";

@Controller()
@ApiTags('equipments')
export class EquipmentsController {
    constructor(private readonly equipmentsService: EquipmentsService) {
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get public equipment list (unauthorized access allowed)' })
    @ApiResponse({ status: 200, description: 'Returned public equipment list' })
    async getEquipments(): Promise<any> {
        return this.equipmentsService.getPublicEquipments();
    }
}
