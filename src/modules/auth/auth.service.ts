import {BadRequestException, Inject, Injectable, Logger, UnauthorizedException,} from '@nestjs/common';
import {Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';

import {UsersEntity} from '../../entities/users.entity';

import {LoginResponse} from './dto/login.response';
import {LoginRequest} from './dto/login.request';
import {RegisterRequest} from './dto/register.request';
import {GoogleLoginRequest} from './dto/google-login.request';
import {AppleLoginRequest} from './dto/apple-login.request';
import {Hash} from '../../lib/hash';
import {ConfigService} from "@nestjs/config";
import {UserRoleEnum} from '../../lib/user-role.enum';
import {GoogleAuthService} from './services/google-auth.service';
import {AppleAuthService} from './services/apple-auth.service';
import {TokenService} from './services/token.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly tokenService: TokenService,
        private readonly googleAuthService: GoogleAuthService,
        private readonly appleAuthService: AppleAuthService,
        @Inject('USERS_REPOSITORY')
        private readonly usersRepository: Repository<UsersEntity>,
    ) {
    }

    async login(dto: LoginRequest): Promise<LoginResponse> {
        const user = await this.usersRepository.findOne({
            where: {email: dto.email},
            select: ['id', 'email', 'password'],
        });

        if (!user || !user.password || !Hash.compare(dto.password, user.password)) {
            this.logger.warn(`Login failed for ${dto.email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        this.logger.log(`User logged in: ${user.id}`);
        return this.buildLoginResponse(user.id);
    }

    async register(dto: RegisterRequest): Promise<LoginResponse> {
        const exists = await this.usersRepository.findOne({
            where: {email: dto.email},
            select: ['id', 'password'],
        });

        if (exists) {
            if (exists.password) {
                throw new BadRequestException('This email is already taken');
            }

            await this.usersRepository.update(exists.id, {password: Hash.make(dto.password)});
            this.logger.log(`Password added to Google account: ${exists.id}`);
            return this.buildLoginResponse(exists.id);
        }

        const user = this.usersRepository.create({
            email: dto.email,
            password: Hash.make(dto.password),
            role: UserRoleEnum.DEFAULT,
        });

        await this.usersRepository.save(user);
        this.logger.log(`New user registered: ${user.id}`);
        return this.buildLoginResponse(user.id);
    }

    // ----- GOOGLE -----
    async loginWithGoogle(dto: GoogleLoginRequest): Promise<LoginResponse> {
        let payload;
        try {
            payload = await this.googleAuthService.verifyIdToken(dto.idToken);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Google token verification failed: ${message}`);
            throw error;
        }

        if (!payload?.email || !payload.sub) {
            throw new UnauthorizedException('Google token payload is incomplete');
        }

        const emailVerified = payload.email_verified ?? false;
        if (!emailVerified) {
            throw new UnauthorizedException('Google email is not verified');
        }

        const googleId = payload.sub;

        let user = await this.usersRepository.findOne({where: {googleId}});

        if (!user) {
            user = await this.usersRepository.findOne({where: {email: payload.email}});
        }

        if (!user) {
            user = this.usersRepository.create({
                email: payload.email,
                googleId,
                password: null,
                role: UserRoleEnum.DEFAULT,
            });
            await this.usersRepository.save(user);
            this.logger.log(`New user registered via Google: ${user.id}`);
        } else if (!user.googleId) {
            await this.usersRepository.update(user.id, {googleId});
        }

        this.logger.log(`User logged in via Google: ${user.id}`);
        return this.buildLoginResponse(user.id);
    }

    // ----- APPLE -----
    async loginWithApple(dto: AppleLoginRequest): Promise<LoginResponse> {
        if (!dto.code) {
            throw new BadRequestException('Apple authorization code is required');
        }

        const idToken = await this.appleAuthService.exchangeCodeForIdToken(dto.code);
        let payload;
        try {
            payload = await this.appleAuthService.verifyIdToken(idToken);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Apple token verification failed: ${message}`);
            throw error;
        }

        const appleId = payload.sub;
        const resolvedEmail = payload.email ?? null;

        let user = await this.usersRepository.findOne({where: {appleId}});

        if (!user && resolvedEmail) {
            user = await this.usersRepository.findOne({where: {email: resolvedEmail}});
        }

        if (!user) {
            if (!resolvedEmail) {
                throw new BadRequestException('Apple token does not include email');
            }
            user = this.usersRepository.create({
                email: resolvedEmail,
                appleId,
                password: null,
                role: UserRoleEnum.DEFAULT,
            });
            await this.usersRepository.save(user);
            this.logger.log(`New user registered via Apple: ${user.id}`);
        } else {
            const updates: Partial<UsersEntity> = {};
            if (!user.appleId) {
                updates.appleId = appleId;
            }
            if (Object.keys(updates).length) {
                await this.usersRepository.update(user.id, updates);
            }
        }

        this.logger.log(`User logged in via Apple: ${user.id}`);
        return this.buildLoginResponse(user.id);
    }

    // ----- TOKENS -----
    async refresh(refreshToken: string): Promise<LoginResponse> {
        let payload: { id: string };
        try {
            payload = await this.jwtService.verifyAsync<{ id: string }>(refreshToken, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const userExists = await this.usersRepository.existsBy({id: payload.id});
        if (!userExists) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const tokens = await this.tokenService.createTokens(payload.id);

        return {
            id: payload.id,
            ...tokens,
        };
    }

    // ----- JWT HELPERS -----
    private async buildLoginResponse(userId: string): Promise<LoginResponse> {
        const tokens = await this.tokenService.createTokens(userId);
        return {
            id: userId,
            ...tokens,
        };
    }
}
