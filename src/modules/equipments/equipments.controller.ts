import {Controller, Get, HttpCode, HttpStatus,} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {EquipmentsService} from './equipments.service';

@Controller('equipments')
@ApiTags('equipments')
export class EquipmentsController {
    constructor(private readonly equipmentsService: EquipmentsService) {
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get public equipment list (unauthorized access allowed)'})
    @ApiResponse({status: 200, description: 'Returned public equipment list'})
    async getEquipments(): Promise<any> {
        return this.equipmentsService.getPublicEquipments();
    }
}
