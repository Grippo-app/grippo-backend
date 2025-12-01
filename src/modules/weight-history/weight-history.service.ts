import {BadRequestException, Inject, Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {WeightHistoryEntity} from '../../entities/weight-history.entity';
import {UserProfilesEntity} from '../../entities/user-profiles.entity';

@Injectable()
export class WeightHistoryService {
    constructor(
        @Inject('WEIGHT_HISTORY_REPOSITORY')
        private readonly weightHistoryRepository: Repository<WeightHistoryEntity>,
        @Inject('USER_PROFILES_REPOSITORY')
        private readonly userProfilesRepository: Repository<UserProfilesEntity>,
    ) {
    }

    async getWeightHistory(user) {
        const profile = await this.requireProfile(user?.id);
        return this.weightHistoryRepository
            .createQueryBuilder('weight')
            .where('weight.profile_id = :profileId', {profileId: profile.id})
            .orderBy('weight.createdAt', 'DESC')
            .getMany();
    }

    async setWeightHistory(user, weight: number) {
        const profile = await this.requireProfile(user?.id);
        const entity = this.weightHistoryRepository.create({
            profile: {id: profile.id},
            weight,
        });

        return await this.weightHistoryRepository.save(entity);
    }

    async removeWeight(user, id: string) {
        const profile = await this.requireProfile(user?.id);
        const count = await this.weightHistoryRepository
            .createQueryBuilder('weight')
            .where('weight.profile_id = :profileId', {profileId: profile.id})
            .getCount();

        if (count <= 1) {
            throw new Error('Cannot delete the last weight history entry');
        }

        return await this.weightHistoryRepository
            .createQueryBuilder()
            .delete()
            .from(WeightHistoryEntity)
            .where('id = :id', {id})
            .andWhere('profile_id = :profileId', {profileId: profile.id})
            .execute();
    }

    private async requireProfile(userId?: string): Promise<UserProfilesEntity> {
        if (!userId) {
            throw new BadRequestException('User not authenticated');
        }

        const profile = await this.userProfilesRepository.findOne({where: {user: {id: userId}}});
        if (!profile) {
            throw new BadRequestException('User profile not created yet');
        }
        return profile;
    }
}
