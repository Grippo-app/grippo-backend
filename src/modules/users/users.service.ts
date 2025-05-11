import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersEntity } from '../../entities/users.entity';
import { WeightHistoryEntity } from '../../entities/weight-history.entity';
import { ExcludedMusclesEntity } from '../../entities/excluded-muscles.entity';
import { MusclesEntity } from '../../entities/muscles.entity';
import {EquipmentsEntity} from "../../entities/equipments.entity";
import {ExcludedEquipmentsEntity} from "../../entities/excluded-equipments.entity";

@Injectable()
export class UsersService {
    constructor(
        @Inject('USERS_REPOSITORY')
        private readonly usersRepository: Repository<UsersEntity>,
        @Inject('WEIGHT_HISTORY_REPOSITORY')
        private readonly weightHistoryRepository: Repository<WeightHistoryEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY')
        private readonly excludedMusclesRepository: Repository<ExcludedMusclesEntity>,
        @Inject('MUSCLES_REPOSITORY')
        private readonly musclesRepository: Repository<MusclesEntity>,
        @Inject('EQUIPMENTS_REPOSITORY')
        private readonly equipmentsRepository: Repository<EquipmentsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY')
        private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
    ) {}

    async getUser(id: string) {
        const user = await this.usersRepository
            .createQueryBuilder('users')
            .select([
                'users.id',
                'users.email',
                'users.name',
                'users.experience',
                'users.height',
                'users.createdAt',
                'users.updatedAt',
            ])
            .where('users.id = :id', {id})
            .getOne();

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        const weight = await this.weightHistoryRepository
            .createQueryBuilder('weights')
            .select(['weights.weight'])
            .where('weights.user_id = :userId', { userId: id })
            .orderBy('weights.createdAt', 'DESC')
            .limit(1)
            .getOne();

        return {
            ...user,
            weight: weight?.weight ?? null,
        };
    }

    async getExcludedMuscles(user: UsersEntity) {
        return this.excludedMusclesRepository.find({
            where: { user: { id: user.id } },
        });
    }

    async setExcludedMuscle(user: UsersEntity, muscleId: string) {
        const existing = await this.excludedMusclesRepository.findOne({
            where: {
                user: { id: user.id },
                muscleId,
            },
        });

        if (existing) {
            throw new BadRequestException('This muscle is already excluded');
        }

        const muscleExists = await this.musclesRepository.findOne({ where: { id: muscleId } });

        if (!muscleExists) {
            throw new NotFoundException('Unknown muscle');
        }

        const entity = this.excludedMusclesRepository.create({
            user: { id: user.id },
            muscleId,
        });

        return this.excludedMusclesRepository.save(entity);
    }

    async deleteExcludedMuscle(user: UsersEntity, muscleId: string) {
        const excluded = await this.excludedMusclesRepository.findOne({
            where: {
                user: { id: user.id },
                muscleId,
            },
        });

        if (!excluded) {
            throw new BadRequestException('This muscle is not excluded');
        }

        return this.excludedMusclesRepository.remove(excluded);
    }

    async getExcludedEquipments(user: UsersEntity) {
        return this.excludedEquipmentsRepository.find({
            where: { user: { id: user.id } },
        });
    }

    async setExcludedEquipment(user: UsersEntity, equipmentId: string) {
        const exists = await this.excludedEquipmentsRepository.findOne({
            where: {
                user: { id: user.id },
                equipmentId,
            },
        });

        if (exists) {
            throw new BadRequestException('This equipment is already excluded');
        }

        const equipment = await this.equipmentsRepository.findOne({
            where: { id: equipmentId },
        });

        if (!equipment) {
            throw new NotFoundException('Unknown equipment');
        }

        const entity = this.excludedEquipmentsRepository.create({
            user: { id: user.id },
            equipmentId,
        });

        return this.excludedEquipmentsRepository.save(entity);
    }

    async deleteExcludedEquipment(user: UsersEntity, equipmentId: string) {
        const excluded = await this.excludedEquipmentsRepository.findOne({
            where: {
                user: { id: user.id },
                equipmentId,
            },
        });

        if (!excluded) {
            throw new BadRequestException('This equipment is not excluded');
        }

        return this.excludedEquipmentsRepository.remove(excluded);
    }
}