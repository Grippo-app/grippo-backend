import {Controller, Get, HttpStatus, Param, Req, Res, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {EquipmentsService} from './equipments.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";

@Controller()
@ApiTags('equipments')
export class EquipmentsController {
    constructor(private readonly equipmentsService: EquipmentsService) {
    }

    @Get("user-equipments")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    getUserEquipments(@Req() req, @Res() res) {
        const user = req.user
        return this.equipmentsService
            .getUserEquipments(user)
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }

    @Get("public-equipments")
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    getEquipments(@Req() req, @Res() res) {
        return this.equipmentsService
            .getPublicEquipments()
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }
}
