import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EquipmentGroupResponse, EquipmentResponse } from './dto/equipment-response';
import { ExcludedEquipmentsEntity } from '../../entities/excluded-equipments.entity';
import { EquipmentGroupsEntity } from '../../entities/equipment-groups.entity';
import { EquipmentsEntity } from '../../entities/equipments.entity';
import { EquipmentStatusEnum } from '../../lib/equipment-status.enum';

@Injectable()
export class EquipmentsService {
    constructor(
        @Inject('EQUIPMENTS_REPOSITORY')
        private readonly equipmentsRepository: Repository<EquipmentsEntity>,
        @Inject('EQUIPMENT_GROUPS_REPOSITORY')
        private readonly equipmenGroupsRepository: Repository<EquipmentGroupsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY')
        private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
    ) {}

    async getUserEquipments(user) {
        const equipmentGroups = await this.equipmenGroupsRepository
            .createQueryBuilder('equipment_groups')
            .leftJoinAndSelect('equipment_groups.equipments', 'equipments')
            .leftJoinAndSelect('equipments.equipmentGroup', 'equipmentGroup')
            .getMany();

        const excluded = await this.excludedEquipmentsRepository
            .createQueryBuilder('excluded_equipments')
            .where('excluded_equipments.userId = :userId', { userId: user.id })
            .select(['excluded_equipments.equipmentId'])
            .getMany();

        return equipmentGroups.map((group) => {
            const groupResponse = new EquipmentGroupResponse();
            groupResponse.id = group.id;
            groupResponse.name = group.name;
            groupResponse.type = group.type;
            groupResponse.createdAt = group.createdAt;
            groupResponse.updatedAt = group.updatedAt;

            groupResponse.equipments = (group.equipments || []).map((equipment) =>
                this.processingEquipment(user, equipment, excluded),
            );

            return groupResponse;
        });
    }

    async getPublicEquipments() {
        const equipmentGroups = await this.equipmenGroupsRepository
            .createQueryBuilder('equipment_groups')
            .leftJoinAndSelect('equipment_groups.equipments', 'equipments')
            .leftJoinAndSelect('equipments.equipmentGroup', 'equipmentGroup') // 🔧 обязательно
            .getMany();

        return equipmentGroups.map((group) => {
            const groupResponse = new EquipmentGroupResponse();
            groupResponse.id = group.id;
            groupResponse.name = group.name;
            groupResponse.type = group.type;
            groupResponse.createdAt = group.createdAt;
            groupResponse.updatedAt = group.updatedAt;

            groupResponse.equipments = (group.equipments || []).map((equipment) => {
                if (!equipment.equipmentGroup) {
                    throw new Error(`Equipment ${equipment.id} is missing equipmentGroup`);
                }

                const response = new EquipmentResponse();
                response.id = equipment.id;
                response.name = equipment.name;
                response.type = equipment.type;
                response.equipmentGroupId = equipment.equipmentGroup.id;
                response.createdAt = equipment.createdAt;
                response.updatedAt = equipment.updatedAt;
                return response;
            });

            return groupResponse;
        });
    }

    private processingEquipment(user, equipment: EquipmentsEntity, excluded: ExcludedEquipmentsEntity[]) {
        let status: EquipmentStatusEnum;

        if (excluded.some((e) => e.equipmentId === equipment.id)) {
            status = EquipmentStatusEnum.EXCLUDED;
        } else {
            status = EquipmentStatusEnum.INCLUDED;
        }

        if (!equipment.equipmentGroup) {
            throw new Error(`Equipment ${equipment.id} is missing equipmentGroup`);
        }

        const response = new EquipmentResponse();
        response.id = equipment.id;
        response.name = equipment.name;
        response.type = equipment.type;
        response.equipmentGroupId = equipment.equipmentGroup.id;
        response.status = status;
        response.createdAt = equipment.createdAt;
        response.updatedAt = equipment.updatedAt;
        response.imageUrl = equipment.imageUrl;
        return response;
    }
}