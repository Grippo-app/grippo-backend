import {Inject, Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {EquipmentGroupResponse, EquipmentResponse} from "./dto/equipment-response";
import {ExcludedEquipmentsEntity} from "../../entities/excluded-equipments.entity";
import {EquipmentGroupsEntity} from "../../entities/equipment-groups.entity";
import {EquipmentsEntity} from "../../entities/equipments.entity";
import {EquipmentStatusEnum} from "../../lib/equipment-status.enum";

@Injectable()
export class EquipmentsService {
    constructor(
        @Inject('EQUIPMENTS_REPOSITORY')
        private readonly equipmentsRepository: Repository<EquipmentsEntity>,
        @Inject('EQUIPMENT_GROUPS_REPOSITORY')
        private readonly equipmenGroupsRepository: Repository<EquipmentGroupsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY')
        private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
    ) {
    }

    async getUserEquipments(user) {
        const equipmentGroups = await this.equipmenGroupsRepository
            .createQueryBuilder('equipment_groups')
            .leftJoinAndSelect('equipment_groups.equipments', 'equipments')
            .getMany();

        const excluded = await this.excludedEquipmentsRepository
            .createQueryBuilder('excluded_equipments')
            .where('excluded_equipments.userId = :userId', {userId: user.id})
            .select(['excluded_equipments.equipmentId'])
            .getMany();

        return equipmentGroups.map((item) => {
                const equipmentGroup = new EquipmentGroupResponse()
                equipmentGroup.id = item.id
                equipmentGroup.name = item.name
                equipmentGroup.type = item.type
                equipmentGroup.createdAt = item.createdAt
                equipmentGroup.updatedAt = item.updatedAt
                equipmentGroup.equipments = item.equipments.map((equipment) => {
                        return this.processingEquipment(user, equipment, excluded)
                    }
                )
                return equipmentGroup
            }
        )
    }

    async getPublicEquipments() {
        const equipmentGroups = await this.equipmenGroupsRepository
            .createQueryBuilder('equipment_groups')
            .leftJoinAndSelect('equipment_groups.equipments', 'equipments')
            .getMany();

        return equipmentGroups.map((item) => {
                const equipmentGroup = new EquipmentGroupResponse()
                equipmentGroup.id = item.id
                equipmentGroup.name = item.name
                equipmentGroup.type = item.type
                equipmentGroup.createdAt = item.createdAt
                equipmentGroup.updatedAt = item.updatedAt
                equipmentGroup.equipments = item.equipments.map((equipment) => {
                        const response = new EquipmentResponse()
                        response.id = equipment.id
                        response.name = equipment.name
                        response.type = equipment.type
                        response.equipmentGroupId = equipment.equipmentGroup.id
                        response.createdAt = equipment.createdAt
                        response.updatedAt = equipment.updatedAt
                        return response
                    }
                )
                return equipmentGroup
            }
        )
    }

    private processingEquipment(user, equipment, excluded) {
        let status: EquipmentStatusEnum = null

        if (user) {
            if (excluded.some((excludedItem) => excludedItem.equipmentId === equipment.id)) {
                status = EquipmentStatusEnum.EXCLUDED
            } else {
                status = EquipmentStatusEnum.INCLUDED
            }
        }

        const response = new EquipmentResponse()
        response.id = equipment.id
        response.name = equipment.name
        response.type = equipment.type
        response.equipmentGroupId = equipment.equipmentGroupId
        response.status = status
        response.createdAt = equipment.createdAt
        response.updatedAt = equipment.updatedAt
        response.imageUrl = equipment.imageUrl
        return response
    }
}
