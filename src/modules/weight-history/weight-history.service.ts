import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WeightHistoryEntity } from '../../entities/weight-history.entity';

@Injectable()
export class WeightHistoryService {
    constructor(
        @Inject('WEIGHT_HISTORY_REPOSITORY')
        private readonly weightHistoryRepository: Repository<WeightHistoryEntity>,
    ) {}

    async getWeightHistory(user) {
        return this.weightHistoryRepository
            .createQueryBuilder('weight')
            .where('weight.user_id = :userId', { userId: user.id }) // ✅ правильное поле
            .orderBy('weight.createdAt', 'DESC')
            .getMany();
    }

    async setWeightHistory(user, weight: number) {
        const entity = this.weightHistoryRepository.create({
            user: { id: user.id }, // ✅ корректная инициализация связи
            weight,
        });

        return await this.weightHistoryRepository.save(entity);
    }

    async removeWeight(user, id: string) {
        const count = await this.weightHistoryRepository
            .createQueryBuilder('weight')
            .where('weight.user_id = :userId', { userId: user.id })
            .getCount();

        if (count <= 1) {
            throw new Error('Cannot delete the last weight history entry');
        }

        return await this.weightHistoryRepository
            .createQueryBuilder()
            .delete()
            .from(WeightHistoryEntity)
            .where('id = :id', { id })
            .andWhere('user_id = :userId', { userId: user.id })
            .execute();
    }
}
