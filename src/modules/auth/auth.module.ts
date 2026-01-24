import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {ConfigModule, ConfigService} from '@nestjs/config';

import {AuthService} from './auth.service';
import {AppleAuthService} from './services/apple-auth.service';
import {GoogleAuthService} from './services/google-auth.service';
import {TokenService} from './services/token.service';
import {AuthController} from './auth.controller';
import {JwtStrategy} from '../../common/jwt.strategy';

import {DatabaseModule} from '../../database/database.module';
import {repositoryProviders} from '../../database/repository.providers';

@Module({
    imports: [
        PassportModule.register({defaultStrategy: 'jwt'}),

        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET_KEY'),
                signOptions: {
                    expiresIn: config.get<string>('JWT_EXPIRATION_TIME') || '1d',
                },
            }),
        }),

        DatabaseModule,
    ],
    providers: [
        JwtStrategy,
        AuthService,
        AppleAuthService,
        GoogleAuthService,
        TokenService,
        ...repositoryProviders,
    ],
    controllers: [AuthController],
    exports: [
        JwtStrategy,
        AuthService,
        AppleAuthService,
        GoogleAuthService,
        TokenService,
        ...repositoryProviders,
    ],
})
export class AuthModule {
}
