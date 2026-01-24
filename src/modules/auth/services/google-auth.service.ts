import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {OAuth2Client, TokenPayload} from 'google-auth-library';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class GoogleAuthService {
    private readonly googleClient = new OAuth2Client();

    constructor(private readonly config: ConfigService) {
    }

    async verifyIdToken(idToken: string): Promise<TokenPayload> {
        const clientIds = [
            this.config.get<string>('GOOGLE_CLIENT_ID_WEB'),
            this.config.get<string>('GOOGLE_CLIENT_ID_ANDROID'),
            this.config.get<string>('GOOGLE_CLIENT_ID_IOS'),
        ].filter((id): id is string => Boolean(id));

        if (!clientIds.length) {
            throw new BadRequestException('Google auth is not configured');
        }

        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: clientIds.length === 1 ? clientIds[0] : clientIds,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new UnauthorizedException('Google token payload is incomplete');
            }
            return payload;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new UnauthorizedException(`Invalid Google token: ${message}`);
        }
    }
}
