import {BadRequestException, Inject, Injectable, Logger, UnauthorizedException,} from '@nestjs/common';
import {Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';
import {OAuth2Client, TokenPayload} from 'google-auth-library';

import {UsersEntity} from '../../entities/users.entity';

import {LoginResponse} from './dto/login.response';
import {LoginRequest} from './dto/login.request';
import {RegisterRequest} from './dto/register.request';
import {GoogleLoginRequest} from './dto/google-login.request';
import {Hash} from '../../lib/hash';
import {ConfigService} from "@nestjs/config";
import {UserRoleEnum} from '../../lib/user-role.enum';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly googleClient = new OAuth2Client();

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
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

    async loginWithGoogle(dto: GoogleLoginRequest): Promise<LoginResponse> {
        const clientIds = [
            this.config.get<string>('GOOGLE_CLIENT_ID_WEB'),
            this.config.get<string>('GOOGLE_CLIENT_ID_ANDROID'),
            this.config.get<string>('GOOGLE_CLIENT_ID_IOS'),
        ].filter((id): id is string => Boolean(id));

        if (!clientIds.length) {
            throw new BadRequestException('Google auth is not configured');
        }

        let payload: TokenPayload | undefined;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: dto.idToken,
                audience: clientIds.length === 1 ? clientIds[0] : clientIds,
            });
            payload = ticket.getPayload();
        } catch (error) {
            this.logger.warn(`Google token verification failed: ${error.message}`);
            throw new UnauthorizedException('Invalid Google token');
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

    async refresh(refreshToken: string): Promise<LoginResponse> {
        try {
            const payload = await this.jwtService.verifyAsync<{ id: string }>(refreshToken, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            });

            const tokens = await this.createTokens(payload.id);

            return {
                id: payload.id,
                ...tokens,
            };
        } catch (e) {
            // this.logger.warn(`Refresh token failed: ${e.message}`);
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    private async buildLoginResponse(userId: string): Promise<LoginResponse> {
        const tokens = await this.createTokens(userId);
        return {id: userId, ...tokens};
    }

    private async createTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
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
