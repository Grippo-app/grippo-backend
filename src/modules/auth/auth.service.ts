import {BadRequestException, Inject, Injectable, Logger, UnauthorizedException,} from '@nestjs/common';
import {Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';

import {UsersEntity} from '../../entities/users.entity';
import {WeightHistoryEntity} from '../../entities/weight-history.entity';
import {ExcludedMusclesEntity} from '../../entities/excluded-muscles.entity';
import {ExcludedEquipmentsEntity} from '../../entities/excluded-equipments.entity';

import {LoginResponse} from './dto/login.response';
import {LoginRequest} from './dto/login.request';
import {RegisterRequest} from './dto/register.request';
import {Hash} from '../../lib/hash';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        @Inject('USERS_REPOSITORY')
        private readonly usersRepository: Repository<UsersEntity>,
        @Inject('WEIGHT_HISTORY_REPOSITORY')
        private readonly weightHistoryRepository: Repository<WeightHistoryEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY')
        private readonly excludedMusclesRepository: Repository<ExcludedMusclesEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY')
        private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
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
        const manager = this.usersRepository.manager;

        return manager.transaction(async transactionalEntityManager => {
            const usersRepo = transactionalEntityManager.getRepository(UsersEntity);
            const weightRepo = transactionalEntityManager.getRepository(WeightHistoryEntity);
            const excludedMusclesRepo = transactionalEntityManager.getRepository(ExcludedMusclesEntity);
            const excludedEquipmentsRepo = transactionalEntityManager.getRepository(ExcludedEquipmentsEntity);

            const exists = await usersRepo.findOne({where: {email: dto.email}});
            if (exists) {
                throw new BadRequestException('This email is already taken');
            }

            const user = usersRepo.create({
                email: dto.email,
                name: dto.name,
                height: dto.height,
                experience: dto.experience,
                password: Hash.make(dto.password),
            });

            await usersRepo.save(user);

            await weightRepo.save({
                user: {id: user.id},
                weight: dto.weight,
            });

            if (dto.excludeMuscleIds?.length) {
                const muscles = dto.excludeMuscleIds.map(muscleId =>
                    excludedMusclesRepo.create({
                        user: {id: user.id},
                        muscleId,
                    }),
                );
                await excludedMusclesRepo.save(muscles);
            }

            if (dto.excludeEquipmentIds?.length) {
                const equipments = dto.excludeEquipmentIds.map(equipmentId =>
                    excludedEquipmentsRepo.create({
                        user: {id: user.id},
                        equipmentId,
                    }),
                );
                await excludedEquipmentsRepo.save(equipments);
            }

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
        });
    }

    async refresh(refreshToken: string): Promise<LoginResponse> {
        try {
            const payload = await this.jwtService.verifyAsync<{ id: string }>(refreshToken, {
                secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            });

            const newPayload = { id: payload.id };

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
