import {Injectable} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {
    }

    async createTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = {id: userId};

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_SECRET_KEY'),
            expiresIn: this.config.get<string>('JWT_EXPIRATION_TIME'),
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
        });

        return {accessToken, refreshToken};
    }
}
