import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MusclesEntity } from '../../entities/muscles.entity';
import { MuscleGroupsEntity } from '../../entities/muscle-groups.entity';
import { MuscleGroupsResponse, MuscleResponse } from './dto/muscle-response';
import { MuscleStatusEnum } from '../../lib/muscle-status.enum';
import { ExcludedMusclesEntity } from '../../entities/excluded-muscles.entity';
import { MuscleLoadEnum } from '../../lib/muscle-load.enum';

@Injectable()
export class MusclesService {
    constructor(
        @Inject('MUSCLES_REPOSITORY')
        private readonly musclesRepository: Repository<MusclesEntity>,
        @Inject('MUSCLE_GROUPS_REPOSITORY')
        private readonly muscleGroupsRepository: Repository<MuscleGroupsEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY')
        private readonly excludedMusclesRepository: Repository<ExcludedMusclesEntity>,
    ) {}

    async getUserMuscles(user) {
        const muscleGroups = await this.muscleGroupsRepository
            .createQueryBuilder('muscle_groups')
            .leftJoinAndSelect('muscle_groups.muscles', 'muscles')
            .getMany();

        const excluded = await this.getExcludedMuscles(user.id);

        return muscleGroups.map((group) =>
            this.buildMuscleGroupResponse(group, user, excluded),
        );
    }

    async getMuscleById(user, id: string) {
        const muscle = await this.musclesRepository
            .createQueryBuilder('muscles')
            .where('muscles.id = :id', { id })
            .getOne();

        if (!muscle) return null;

        const excluded = await this.getExcludedMuscles(user.id);

        return this.buildMuscleResponse(muscle);
    }

    async getPublicMuscles() {
        const muscleGroups = await this.muscleGroupsRepository
            .createQueryBuilder('muscle_groups')
            .leftJoinAndSelect('muscle_groups.muscles', 'muscles')
            .leftJoinAndSelect('muscles.muscleGroup', 'muscleGroup') // ✅ добавили join
            .getMany();

        return muscleGroups.map((group) =>
            this.buildMuscleGroupResponse(group),
        );
    }

    private async getExcludedMuscles(userId: string) {
        const excluded = await this.excludedMusclesRepository
            .createQueryBuilder('excluded_muscles')
            .where('excluded_muscles.userId = :userId', { userId })
            .select(['excluded_muscles.muscleId'])
            .getMany();

        return new Set(excluded.map((item) => item.muscleId));
    }

    private buildMuscleGroupResponse(
        group: MuscleGroupsEntity,
        user: any = null,
        excluded: Set<string> = new Set(),
    ): MuscleGroupsResponse {
        const response = new MuscleGroupsResponse();
        response.id = group.id;
        response.name = group.name;
        response.type = group.type;
        response.createdAt = group.createdAt;
        response.updatedAt = group.updatedAt;

        response.muscles = (group.muscles || []).map((muscle) =>
            this.buildMuscleResponse(muscle),
        );

        return response;
    }

    private buildMuscleResponse(
        muscle: MusclesEntity,
    ): MuscleResponse {
        const response = new MuscleResponse();
        response.id = muscle.id;
        response.name = muscle.name;
        response.type = muscle.type;

        if (!muscle || !muscle.muscleGroup) {
            throw new Error(`❗ Muscle or muscleGroup is missing. Muscle = ${JSON.stringify(muscle)}`);
        }

        response.muscleGroupId = muscle.muscleGroup.id;
        response.createdAt = muscle.createdAt;
        response.updatedAt = muscle.updatedAt;

        return response;
    }
}
