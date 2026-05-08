import {Inject, Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {PushTokensEntity} from '../../entities/push-tokens.entity';
import {DeviceTokenResponse} from './dto/device-token.response';

@Injectable()
export class PushTokensService {
    constructor(
        @Inject('PUSH_TOKENS_REPOSITORY')
        private readonly pushTokensRepository: Repository<PushTokensEntity>,
    ) {
    }

    async upsertToken(userId: string, token: string): Promise<void> {
        await this.pushTokensRepository
            .createQueryBuilder()
            .insert()
            .into(PushTokensEntity)
            .values({user: {id: userId}, token})
            .orUpdate(['user_id'], ['token'])
            .execute();
    }

    async deleteAllForUser(userId: string): Promise<void> {
        await this.pushTokensRepository
            .createQueryBuilder()
            .delete()
            .from(PushTokensEntity)
            .where('user_id = :userId', {userId})
            .execute();
    }

    async getTokensByUserId(userId: string): Promise<DeviceTokenResponse[]> {
        const tokens = await this.pushTokensRepository
            .createQueryBuilder('token')
            .where('token.user_id = :userId', {userId})
            .orderBy('token.createdAt', 'DESC')
            .getMany();
        return tokens.map(({id, token, createdAt}) => ({id, token, createdAt}));
    }
}
