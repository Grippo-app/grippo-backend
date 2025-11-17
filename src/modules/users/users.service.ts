import {Inject, Injectable, NotFoundException,} from '@nestjs/common';
import {In, Repository} from 'typeorm';
import {UsersEntity} from '../../entities/users.entity';
import {WeightHistoryEntity} from '../../entities/weight-history.entity';
import {ExcludedMusclesEntity} from '../../entities/excluded-muscles.entity';
import {MusclesEntity} from '../../entities/muscles.entity';
import {EquipmentsEntity} from "../../entities/equipments.entity";
import {ExcludedEquipmentsEntity} from "../../entities/excluded-equipments.entity";
import {EquipmentResponse} from "../equipments/dto/equipment-response";
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
                'users.role',
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

    async getExcludedMuscles(user: UsersEntity): Promise<MuscleResponse[]> {
        const excluded = await this.excludedMusclesRepository.find({
            where: {user: {id: user.id}},
            relations: ['muscle', 'muscle.muscleGroup'],
        });

        return excluded.map(e => {
            const m = e.muscle;
            const dto = new MuscleResponse();

            dto.id = m.id;
            dto.name = m.name;
            dto.muscleGroupId = m.muscleGroup.id;
            dto.type = m.type;
            dto.recoveryTimeHours = m.recoveryTimeHours;
            dto.createdAt = m.createdAt;
            dto.updatedAt = m.updatedAt;

            return dto;
        });
    }

    async updateExcludedMuscles(user: UsersEntity, muscleIds: string[]): Promise<{ ids: string[] }> {
        const existingMuscles = await this.musclesRepository.findBy({id: In(muscleIds)});
        if (existingMuscles.length !== muscleIds.length) {
            throw new NotFoundException('One or more muscle IDs are invalid');
        }

        await this.excludedMusclesRepository.delete({user: {id: user.id}});

        const entities = muscleIds.map((id) =>
            this.excludedMusclesRepository.create({
                user: {id: user.id},
                muscleId: id,
            }),
        );

        await this.excludedMusclesRepository.save(entities);
        return {ids: muscleIds};
    }

    async updateExcludedEquipments(user: UsersEntity, equipmentIds: string[]): Promise<{ ids: string[] }> {
        const existingEquipments = await this.equipmentsRepository.findBy({id: In(equipmentIds)});
        if (existingEquipments.length !== equipmentIds.length) {
            throw new NotFoundException('One or more equipment IDs are invalid');
        }

        await this.excludedEquipmentsRepository.delete({user: {id: user.id}});

        const entities = equipmentIds.map((id) =>
            this.excludedEquipmentsRepository.create({
                user: {id: user.id},
                equipmentId: id,
            }),
        );

        await this.excludedEquipmentsRepository.save(entities);
        return {ids: equipmentIds};
    }

    async getExcludedEquipments(user: UsersEntity): Promise<EquipmentResponse[]> {
        const excluded = await this.excludedEquipmentsRepository.find({
            where: {user: {id: user.id}},
            relations: ['equipment', 'equipment.equipmentGroup'],
        });

        return excluded.map(e => {
            const eq = e.equipment;
            const dto = new EquipmentResponse();

            dto.id = eq.id;
            dto.name = eq.name;
            dto.equipmentGroupId = eq.equipmentGroup.id;
            dto.type = eq.type;
            dto.createdAt = eq.createdAt;
            dto.updatedAt = eq.updatedAt;

            return dto;
        });
    }
}
