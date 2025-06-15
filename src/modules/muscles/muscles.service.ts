import {Inject, Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {MusclesEntity} from '../../entities/muscles.entity';
import {MuscleGroupsEntity} from '../../entities/muscle-groups.entity';
import {MuscleGroupsResponse, MuscleResponse} from './dto/muscle-response';

@Injectable()
export class MusclesService {
    constructor(
        @Inject('MUSCLES_REPOSITORY')
        private readonly musclesRepository: Repository<MusclesEntity>,
        @Inject('MUSCLE_GROUPS_REPOSITORY')
        private readonly muscleGroupsRepository: Repository<MuscleGroupsEntity>
    ) {
    }

    async getPublicMuscles(): Promise<MuscleGroupsResponse[]> {
        const muscleGroups = await this.muscleGroupsRepository
            .createQueryBuilder('muscle_groups')
            .leftJoinAndSelect('muscle_groups.muscles', 'muscles')
            .leftJoinAndSelect('muscles.muscleGroup', 'muscleGroup')
            .getMany();

        return muscleGroups.map(group => this.buildMuscleGroupResponse(group));
    }

    private buildMuscleGroupResponse(group: MuscleGroupsEntity): MuscleGroupsResponse {
        const response = new MuscleGroupsResponse();
        response.id = group.id;
        response.name = group.name;
        response.type = group.type;
        response.createdAt = group.createdAt;
        response.updatedAt = group.updatedAt;

        response.muscles = (group.muscles || []).map(muscle => this.buildMuscleResponse(muscle));
        return response;
    }

    private buildMuscleResponse(muscle: MusclesEntity): MuscleResponse {
        if (!muscle || !muscle.muscleGroup) {
            throw new Error(`❗ Muscle or muscleGroup is missing. Muscle = ${JSON.stringify(muscle)}`);
        }

        const response = new MuscleResponse();
        response.id = muscle.id;
        response.name = muscle.name;
        response.type = muscle.type;
        response.muscleGroupId = muscle.muscleGroup.id;
        response.createdAt = muscle.createdAt;
        response.updatedAt = muscle.updatedAt;
        response.recoveryTimeHours = muscle.recoveryTimeHours;

        return response;
    }
}