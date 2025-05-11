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

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: ``})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    getExcludedEquipments(@Req() req, @Res() res) {
        const user = req.user;
        return this.excludedEquipmentsService
            .getExcludedEquipments(user)
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }

    @Post(":id")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: ``})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    setExcludedEquipment(@Req() req, @Res() res, @Param('id') id: string) {
        const user = req.user;
        return this.excludedEquipmentsService
            .setExcludedEquipment(user, id)
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: ``})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    deleteExcludedEquipment(@Req() req, @Res() res, @Param('id') id: string) {
        const user = req.user;
        return this.excludedEquipmentsService
            .deleteExcludedEquipment(user, id)
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }
}
