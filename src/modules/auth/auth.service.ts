import {BadRequestException, Inject, Injectable, Logger, UnauthorizedException,} from '@nestjs/common';
import {Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';

import {UsersEntity} from '../../entities/users.entity';

import {LoginResponse} from './dto/login.response';
import {LoginRequest} from './dto/login.request';
import {RegisterRequest} from './dto/register.request';
import {Hash} from '../../lib/hash';
import {ConfigService} from "@nestjs/config";
import {UserRoleEnum} from '../../lib/user-role.enum';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

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

        if (!user || !Hash.compare(dto.password, user.password)) {
            this.logger.warn(`Login failed for ${dto.email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: { id: string } = {id: user.id};

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_SECRET_KEY'),
            expiresIn: this.config.get<string>('JWT_EXPIRATION_TIME'),
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
        });

        this.logger.log(`User logged in: ${user.id}`);
        return {id: user.id, accessToken, refreshToken};
    }

    async register(dto: RegisterRequest): Promise<LoginResponse> {
        const exists = await this.usersRepository.findOne({where: {email: dto.email}});
        if (exists) {
            throw new BadRequestException('This email is already taken');
        }

        const user = this.usersRepository.create({
            email: dto.email,
            password: Hash.make(dto.password),
            role: UserRoleEnum.DEFAULT,
        });

        await this.usersRepository.save(user);

        const payload = {id: user.id};

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_SECRET_KEY'),
            expiresIn: this.config.get<string>('JWT_EXPIRATION_TIME'),
        });

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
        });

        this.logger.log(`New user registered: ${user.id}`);
        return {id: user.id, accessToken, refreshToken};
    }

    async refresh(refreshToken: string): Promise<LoginResponse> {
        try {
            const payload = await this.jwtService.verifyAsync<{ id: string }>(refreshToken, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            });

            const newPayload = {id: payload.id};

            const accessToken = await this.jwtService.signAsync(newPayload, {
                secret: this.config.get<string>('JWT_SECRET_KEY'),
                expiresIn: this.config.get<string>('JWT_EXPIRATION_TIME'),
            });

            const newRefreshToken = await this.jwtService.signAsync(newPayload, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
            });

            return {
                id: payload.id,
                accessToken,
                refreshToken: newRefreshToken,
            };
        } catch (e) {
            // this.logger.warn(`Refresh token failed: ${e.message}`);
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }
}
