import {Body, Controller, Delete, HttpCode, HttpStatus, Post, Req, UseGuards,} from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiOperation, ApiResponse, ApiTags,} from '@nestjs/swagger';
import {JwtAuthGuard} from '../../common/jwt-auth.guard';
import {PushTokensService} from './push-tokens.service';
import {PushTokenRequest} from './dto/push-token.request';

@ApiTags('push-tokens')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('push-tokens')
export class PushTokensController {
    constructor(private readonly pushTokensService: PushTokensService) {
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Register or update a push token for the current device'})
    @ApiBody({type: PushTokenRequest})
    @ApiResponse({status: HttpStatus.CREATED, description: 'Push token saved'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    async savePushToken(
        @Req() req,
        @Body() body: PushTokenRequest,
    ): Promise<void> {
        await this.pushTokensService.upsertToken(req.user.id, body.token);
    }

    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Delete all push tokens for the current user'})
    @ApiNoContentResponse({description: 'Push tokens deleted'})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized'})
    async deletePushTokens(@Req() req): Promise<void> {
        await this.pushTokensService.deleteAllForUser(req.user.id);
    }
}
