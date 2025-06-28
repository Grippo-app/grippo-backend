import {Inject, Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {EquipmentGroupResponse, EquipmentResponse} from './dto/equipment-response';
import {ExcludedEquipmentsEntity} from '../../entities/excluded-equipments.entity';
import {EquipmentGroupsEntity} from '../../entities/equipment-groups.entity';
import {EquipmentsEntity} from '../../entities/equipments.entity';

@Injectable()
export class EquipmentsService {
    constructor(
        @Inject('EQUIPMENTS_REPOSITORY')
        private readonly equipmentsRepository: Repository<EquipmentsEntity>,
        @Inject('EQUIPMENT_GROUPS_REPOSITORY')
        private readonly equipmentGroupsRepository: Repository<EquipmentGroupsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY')
        private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
    ) {
    }

    async getPublicEquipments(): Promise<EquipmentGroupResponse[]> {
        const groups = await this.equipmentGroupsRepository
            .createQueryBuilder('equipment_groups')
            .leftJoinAndSelect('equipment_groups.equipments', 'equipments')
            .leftJoinAndSelect('equipments.equipmentGroup', 'equipmentGroup')
            .getMany();

        return groups.map(group => {
            const groupResponse = new EquipmentGroupResponse();
            groupResponse.id = group.id;
            groupResponse.name = group.name;
            groupResponse.type = group.type;
            groupResponse.createdAt = group.createdAt;
            groupResponse.updatedAt = group.updatedAt;

            groupResponse.equipments = (group.equipments ?? []).map(equipment => {
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
}
