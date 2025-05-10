// src/auth/auth.service.ts
import {BadRequestException, Inject, Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {DataSource, Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';
import {UsersEntity} from '../../entities/users.entity';
import {WeightHistoryEntity} from '../../entities/weight-history.entity';
import {ExcludedMusclesEntity} from '../../entities/excluded-muscles.entity';
import {ExcludedEquipmentsEntity} from '../../entities/excluded-equipments.entity';
import {LoginResponse} from './dto/login.response';
import {LoginRequest} from './dto/login.request';
import {RegisterRequest} from './dto/register.request';
import {Hash} from '../../lib/hash';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        @Inject('USERS_REPOSITORY')
        private readonly usersRepository: Repository<UsersEntity>,
        @Inject('WEIGHT_HISTORY_REPOSITORY')
        private readonly weightHistoryRepository: Repository<WeightHistoryEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY')
        private readonly excludedMusclesRepository: Repository<ExcludedMusclesEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY')
        private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
        private readonly dataSource: DataSource,
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

        const accessToken = await this.jwtService.signAsync({id: user.id});
        this.logger.log(`User logged in: ${user.id}`);
        return {id: user.id, accessToken};
    }

    async register(dto: RegisterRequest): Promise<LoginResponse> {
        return this.dataSource.transaction(async manager => {
            const exists = await manager.getRepository(UsersEntity).findOne({where: {email: dto.email}});
            if (exists) {
                throw new BadRequestException('This email is already taken');
            }

            // создаём пользователя
            const user = manager.getRepository(UsersEntity).create({
                email: dto.email,
                name: dto.name,
                height: dto.height,
                experience: dto.experience,
                password: Hash.make(dto.password),
            });
            await manager.getRepository(UsersEntity).save(user);

            // добавляем вес
            await manager.getRepository(WeightHistoryEntity).save({
                userId: user.id,
                weight: dto.weight,
            });

            // исключённые мышцы
            if (dto.excludeMuscleIds?.length) {
                const muscles = dto.excludeMuscleIds.map(muscleId =>
                    manager.getRepository(ExcludedMusclesEntity).create({
                        userId: user.id,
                        muscleId,
                    }),
                );
                await manager.getRepository(ExcludedMusclesEntity).save(muscles);
            }

            // исключённое оборудование
            if (dto.excludeEquipmentIds?.length) {
                const equipments = dto.excludeEquipmentIds.map(equipmentId =>
                    manager.getRepository(ExcludedEquipmentsEntity).create({
                        userId: user.id,
                        equipmentId,
                    }),
                );
                await manager.getRepository(ExcludedEquipmentsEntity).save(equipments);
            }

            const accessToken = await this.jwtService.signAsync({id: user.id});
            this.logger.log(`New user registered: ${user.id}`);
            return {id: user.id, accessToken};
        });
    }
}