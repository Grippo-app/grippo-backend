import {Controller, Delete, Get, HttpStatus, Param, Post, Req, Res, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {ExcludedEquipmentsService} from './excluded-equipments.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';

@Controller('excluded-equipments')
@ApiTags('excluded-equipments')
@ApiBearerAuth('access-token')
export class ExcludedEquipmentsController {
    constructor(private readonly excludedEquipmentsService: ExcludedEquipmentsService) {
    }


}
