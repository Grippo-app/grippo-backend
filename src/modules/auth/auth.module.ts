import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {ConfigModule, ConfigService} from '@nestjs/config';

import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';
import {JwtStrategy} from './strategies/jwt.strategy';

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
        ...repositoryProviders,
    ],
    controllers: [AuthController],
    exports: [
        JwtStrategy,
        AuthService,
        ...repositoryProviders,
    ],
})
export class AuthModule {
}
