import {Inject, Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {MusclesEntity} from "../../entities/muscles.entity";
import {MuscleGroupsEntity} from "../../entities/muscle-groups.entity";
import {MuscleGroupsResponse, MuscleResponse} from "./dto/muscle-response";
import {MuscleStatusEnum} from "../../lib/muscle-status.enum";
import {ExcludedMusclesEntity} from "../../entities/excluded-muscles.entity";
import {MuscleLoadEnum} from "../../lib/muscle-load.enum";

@Injectable()
export class MusclesService {
    constructor(
        @Inject('MUSCLES_REPOSITORY')
        private readonly musclesRepository: Repository<MusclesEntity>,
        @Inject('MUSCLE_GROUPS_REPOSITORY')
        private readonly muscleGroupsRepository: Repository<MuscleGroupsEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY')
        private readonly excludedMusclesEntity: Repository<ExcludedMusclesEntity>
    ) {
    }

    async getUserMuscles(user) {
        const muscleGroups = await this.muscleGroupsRepository
            .createQueryBuilder('muscle_groups')
            .leftJoinAndSelect('muscle_groups.muscles', 'muscles')
            .getMany();

        const excluded = await this.excludedMusclesEntity
            .createQueryBuilder('excluded_muscles')
            .where('excluded_muscles.userId = :userId', {userId: user.id})
            .select(['excluded_muscles.muscleId'])
            .getMany();

        return muscleGroups.map((item) => {
                const muscleGroup = new MuscleGroupsResponse()
                muscleGroup.id = item.id
                muscleGroup.name = item.name
                muscleGroup.type = item.type
                muscleGroup.createdAt = item.createdAt
                muscleGroup.updatedAt = item.updatedAt
                muscleGroup.muscles = item.muscles.map((muscle) => {
                        return this.processingMuscle(user, muscle, excluded)
                    }
                )
                return muscleGroup
            }
        )
    }

    async getMuscleById(user, id: string) {
        const muscle: MusclesEntity = await this.musclesRepository
            .createQueryBuilder('muscles')
            .where('muscles.id = :id', {id})
            .getOne();

        const excluded = await this.excludedMusclesEntity
            .createQueryBuilder('excluded_muscles')
            .where('excluded_muscles.userId = :userId', {userId: user.id})
            .select(['excluded_muscles.muscleId'])
            .getMany();

        return this.processingMuscle(user, muscle, excluded)
    }

    async getPublicMuscles() {
        const muscleGroups = await this.muscleGroupsRepository
            .createQueryBuilder('muscle_groups')
            .leftJoinAndSelect('muscle_groups.muscles', 'muscles')
            .getMany();

        return muscleGroups.map((item) => {
                const group = new MuscleGroupsResponse()
                group.id = item.id
                group.name = item.name
                group.type = item.type
                group.createdAt = item.createdAt
                group.updatedAt = item.updatedAt
                group.muscles = item.muscles.map((muscle) => {
                        const muscleResponse = new MuscleResponse()
                        muscleResponse.id = muscle.id
                        muscleResponse.name = muscle.name
                        muscleResponse.type = muscle.type
                        muscleResponse.muscleGroupId = muscle.muscleGroup.id
                        muscleResponse.createdAt = muscle.createdAt
                        muscleResponse.updatedAt = muscle.updatedAt
                        return muscleResponse
                    }
                )
                return group
            }
        )
    }

    private processingMuscle(user, muscle, excluded) {
        let status: MuscleStatusEnum = null
        let load: MuscleLoadEnum = null

        if (user) {
            if (excluded.some((excludedItem) => excludedItem.muscleId === muscle.id)) {
                status = MuscleStatusEnum.EXCLUDED
            } else {
                status = MuscleStatusEnum.INCLUDED
            }

            const list = [MuscleLoadEnum.LOW, MuscleLoadEnum.MEDIUM, MuscleLoadEnum.HIGH]
            load = list[Math.floor(Math.random() * list.length)];
        }

        const muscleResponse = new MuscleResponse()
        muscleResponse.id = muscle.id
        muscleResponse.name = muscle.name
        muscleResponse.type = muscle.type
        muscleResponse.muscleGroupId = muscle.muscleGroupId
        muscleResponse.load = load
        muscleResponse.status = status
        muscleResponse.createdAt = muscle.createdAt
        muscleResponse.updatedAt = muscle.updatedAt
        return muscleResponse
    }
}
