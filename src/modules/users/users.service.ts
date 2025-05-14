import {BadRequestException, Inject, Injectable, NotFoundException,} from '@nestjs/common';
import {Repository} from 'typeorm';
import {UsersEntity} from '../../entities/users.entity';
import {WeightHistoryEntity} from '../../entities/weight-history.entity';
import {ExcludedMusclesEntity} from '../../entities/excluded-muscles.entity';
import {MusclesEntity} from '../../entities/muscles.entity';
import {EquipmentsEntity} from "../../entities/equipments.entity";
import {ExcludedEquipmentsEntity} from "../../entities/excluded-equipments.entity";
import {EquipmentResponse} from "../equipments/dto/equipment-response";
import {EquipmentEnum} from "../../lib/equipment.enum";
import {MuscleResponse} from "../muscles/dto/muscle-response";

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
    ) {
    }

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
            .where('weights.user_id = :userId', {userId: id})
            .orderBy('weights.createdAt', 'DESC')
            .limit(1)
            .getOne();

        return {
            ...user,
            weight: weight?.weight ?? null,
        };
    }

    async getMuscles(user: UsersEntity): Promise<MuscleResponse[]> {
        const allMuscles = await this.musclesRepository.find({
            relations: ['muscleGroup'],
        });

        const excluded = await this.excludedMusclesRepository.find({
            where: {user: {id: user.id}},
        });

        const excludedIds = new Set(excluded.map(e => e.muscleId));

        return allMuscles
            .filter(muscle => !excludedIds.has(muscle.id))
            .map(muscle => {
                const response = new MuscleResponse();

                response.id = muscle.id;
                response.name = muscle.name;
                response.muscleGroupId = muscle.muscleGroup.id;
                response.type = muscle.type;
                response.createdAt = muscle.createdAt;
                response.updatedAt = muscle.updatedAt;
                response.recoveryTimeHours = muscle.recoveryTimeHours;

                return response;
            });
    }

    async setMuscle(user: UsersEntity, muscleId: string): Promise<string> {
        const excluded = await this.excludedMusclesRepository.findOne({
            where: {
                user: {id: user.id},
                muscleId,
            },
        });

        if (!excluded) {
            return 'Already included';
        }

        await this.excludedMusclesRepository.remove(excluded);
        return 'Included successfully';
    }

    async deleteMuscle(user: UsersEntity, muscleId: string): Promise<ExcludedMusclesEntity> {
        const existing = await this.excludedMusclesRepository.findOne({
            where: {
                user: {id: user.id},
                muscleId,
            },
        });

        if (existing) {
            throw new BadRequestException('This muscle is already excluded');
        }

        const muscle = await this.musclesRepository.findOne({
            where: {id: muscleId},
        });

        if (!muscle) {
            throw new NotFoundException('Unknown muscle');
        }

        const entity = this.excludedMusclesRepository.create({
            user: {id: user.id},
            muscleId,
        });

        return this.excludedMusclesRepository.save(entity);
    }

    async getEquipments(user: UsersEntity): Promise<EquipmentResponse[]> {
        const allEquipments = await this.equipmentsRepository.find({
            relations: ['equipmentGroup'],
        });

        const excluded = await this.excludedEquipmentsRepository.find({
            where: {user: {id: user.id}},
        });

        const excludedIds = new Set(excluded.map(e => e.equipmentId));

        return allEquipments
            .filter(eq => !excludedIds.has(eq.id))
            .map(eq => {
                const response = new EquipmentResponse();

                response.id = eq.id;
                response.name = eq.name;
                response.equipmentGroupId = eq.equipmentGroup.id;
                response.type = eq.type as EquipmentEnum;
                response.createdAt = eq.createdAt;
                response.updatedAt = eq.updatedAt;
                response.imageUrl = eq.imageUrl ?? null;

                return response;
            });
    }

    async setEquipment(user: UsersEntity, equipmentId: string): Promise<string> {
        const excluded = await this.excludedEquipmentsRepository.findOne({
            where: {
                user: {id: user.id},
                equipmentId,
            },
        });

        if (!excluded) {
            // Уже включено, ничего не делаем
            return 'Already included';
        }

        await this.excludedEquipmentsRepository.remove(excluded);
        return 'Included successfully';
    }

    async deleteEquipment(user: UsersEntity, equipmentId: string): Promise<ExcludedEquipmentsEntity> {
        const exists = await this.excludedEquipmentsRepository.findOne({
            where: {
                user: {id: user.id},
                equipmentId,
            },
        });

        if (exists) {
            throw new BadRequestException('This equipment is already excluded');
        }

        const equipment = await this.equipmentsRepository.findOne({
            where: {id: equipmentId},
        });

        if (!equipment) {
            throw new NotFoundException('Unknown equipment');
        }

        const entity = this.excludedEquipmentsRepository.create({
            user: {id: user.id},
            equipmentId,
        });

        return this.excludedEquipmentsRepository.save(entity);
    }
}