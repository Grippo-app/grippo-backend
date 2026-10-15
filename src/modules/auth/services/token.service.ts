import {Injectable, InternalServerErrorException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {
    }

    getRefreshSecret(): string {
        const accessSecret = this.config.get<string>('JWT_SECRET_KEY');
        const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

        if (typeof accessSecret !== 'string' || !accessSecret.trim()
            || typeof refreshSecret !== 'string' || !refreshSecret.trim()
            || accessSecret === refreshSecret) {
            throw new InternalServerErrorException('JWT configuration is invalid');
        }

        return refreshSecret;
    }

    async createTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
        const refreshSecret = this.getRefreshSecret();
        const payload = {id: userId};

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_SECRET_KEY'),
            expiresIn: this.config.get<string>('JWT_EXPIRATION_TIME') || '1d',
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: refreshSecret,
            expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
        });

        return {accessToken, refreshToken};
    }
}
