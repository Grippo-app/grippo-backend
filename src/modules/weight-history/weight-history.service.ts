import {Inject, Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {WeightHistoryEntity} from "../../entities/weight-history.entity";

@Injectable()
export class WeightHistoryService {
    constructor(
        @Inject('WEIGHT_HISTORY_REPOSITORY')
        private readonly weightHistoryRepository: Repository<WeightHistoryEntity>
    ) {
    }

    async getWeightHistory(user) {
        return this.weightHistoryRepository
            .createQueryBuilder('weight_history')
            .where('weight_history.userId = :userId', {userId: user.id})
            .addOrderBy('weight_history.createdAt', 'DESC')
            .getMany();
    }

    async setWeightHistory(user, weight: number) {
        const weightHistoryEntity = new WeightHistoryEntity()
        weightHistoryEntity.user.id = user.id
        weightHistoryEntity.weight = weight

        return await this.weightHistoryRepository.save(weightHistoryEntity)
    }

    async removeWeight(user, id: string) {
        const count = await this.weightHistoryRepository
            .createQueryBuilder('weight_history')
            .where('weight_history.userId = :userId', {userId: user.id})
            .getCount();

        if (count <= 1) {
            throw new Error('Cannot delete the last weight history entry');
        }

        return await this.weightHistoryRepository
            .createQueryBuilder()
            .delete()
            .from(WeightHistoryEntity)
            .where('id = :id', {id})
            .andWhere('userId = :userId', {userId: user.id})
            .execute();
    }
}
