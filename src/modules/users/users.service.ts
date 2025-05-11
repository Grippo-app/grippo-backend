import {Inject, Injectable} from '@nestjs/common';
import {UsersEntity} from '../../entities/users.entity';
import {Repository} from 'typeorm';
import {WeightHistoryEntity} from "../../entities/weight-history.entity";

@Injectable()
export class UsersService {
    constructor(
        @Inject('USERS_REPOSITORY')
        private readonly usersRepository: Repository<UsersEntity>,
        @Inject('WEIGHT_HISTORY_REPOSITORY')
        private readonly weightHistoryRepository: Repository<WeightHistoryEntity>
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
            throw new Error(`User with id ${id} not found`);
        }

        const weight = await this.weightHistoryRepository
            .createQueryBuilder('weights')
            .select(['weights.weight'])
            .where('weights.user_id = :userId', { userId: id })
            .orderBy('weights.createdAt', 'DESC')
            .limit(1)
            .getOne();

        return {
            ...user,
            weight: weight?.weight ?? null,
        };
    }
}
