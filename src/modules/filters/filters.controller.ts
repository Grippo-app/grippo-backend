import {Controller, Get, HttpStatus, Req, Res, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {FiltersService} from './filters.service';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';

@Controller('filters')
@ApiTags('filters')
@ApiBearerAuth('access-token')
export class FiltersController {
    constructor(private readonly service: FiltersService) {
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: ``})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: 'Forbidden'})
    getAllUsers(@Req() req, @Res() res) {
        return this.service
            .getFilters()
            .then((data) => res.json(data))
            .catch((err) => res.status(400).send(err.message));
    }
}
