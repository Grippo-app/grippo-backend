import {BadRequestException, Inject, Injectable, NotFoundException,} from '@nestjs/common';
import {In, Repository} from 'typeorm';
import {UsersEntity} from '../../entities/users.entity';
import {WeightHistoryEntity} from '../../entities/weight-history.entity';
import {ExcludedMusclesEntity} from '../../entities/excluded-muscles.entity';
import {MusclesEntity} from '../../entities/muscles.entity';
import {EquipmentsEntity} from "../../entities/equipments.entity";
import {ExcludedEquipmentsEntity} from "../../entities/excluded-equipments.entity";
import {EquipmentResponse} from "../equipments/dto/equipment-response";
import {MuscleResponse} from "../muscles/dto/muscle-response";
import {AdminAuthTypeEnum, AdminUserResponse} from "./dto/admin-user.response";
import {UserRoleEnum} from "../../lib/user-role.enum";
import {AdminSetRoleRequest} from "./dto/admin-set-role.request";
import {CreateUserProfileRequest} from "./dto/create-user-profile.request";
import {UserProfilesEntity} from "../../entities/user-profiles.entity";
import {UserProfileResponse, UserResponse} from "./dto/user.response";
import {ExperienceEnum} from "../../lib/experience.enum";

@Injectable()
export class UsersService {
    constructor(
        @Inject('USERS_REPOSITORY')
        private readonly usersRepository: Repository<UsersEntity>,
        @Inject('USER_PROFILES_REPOSITORY')
        private readonly userProfilesRepository: Repository<UserProfilesEntity>,
        @Inject('WEIGHT_HISTORY_REPOSITORY')
        private readonly weightHistoryRepository: Repository<WeightHistoryEntity>,
        @Inject('EXCLUDED_MUSCLES_REPOSITORY')
        private readonly excludedMusclesRepository: Repository<ExcludedMusclesEntity>,
        @Inject('MUSCLES_REPOSITORY')
        private readonly musclesRepository: Repository<MusclesEntity>,
        @Inject('EQUIPMENTS_REPOSITORY')
        private readonly equipmentsRepository: Repository<EquipmentsEntity>,
        @Inject('EXCLUDED_EQUIPMENTS_REPOSITORY')
        private readonly excludedEquipmentsRepository: Repository<ExcludedEquipmentsEntity>,
    ) {
    }

    async createProfile(userId: string, dto: CreateUserProfileRequest): Promise<UserResponse> {
        const manager = this.usersRepository.manager;

        await manager.transaction(async transactionalEntityManager => {
            const usersRepo = transactionalEntityManager.getRepository(UsersEntity);
            const profilesRepo = transactionalEntityManager.getRepository(UserProfilesEntity);
            const weightRepo = transactionalEntityManager.getRepository(WeightHistoryEntity);
            const excludedMusclesRepo = transactionalEntityManager.getRepository(ExcludedMusclesEntity);
            const excludedEquipmentsRepo = transactionalEntityManager.getRepository(ExcludedEquipmentsEntity);

            const user = await usersRepo.findOne({where: {id: userId}});
            if (!user) {
                throw new NotFoundException(`User with id ${userId} not found`);
            }

            const existingProfile = await profilesRepo.findOne({where: {user: {id: user.id}}});
            if (existingProfile) {
                throw new BadRequestException('User profile already created');
            }

            const profile = profilesRepo.create({
                user,
                name: dto.name,
                height: dto.height,
                experience: dto.experience,
            });
            await profilesRepo.save(profile);

            await weightRepo.save({
                profile: {id: profile.id},
                weight: dto.weight,
            });

            await excludedMusclesRepo.delete({profile: {id: profile.id}});
            if (dto.excludeMuscleIds?.length) {
                const muscles = dto.excludeMuscleIds.map(muscleId =>
                    excludedMusclesRepo.create({
                        profile: {id: profile.id},
                        muscleId,
                    }),
                );
                await excludedMusclesRepo.save(muscles);
            }

            await excludedEquipmentsRepo.delete({profile: {id: profile.id}});
            if (dto.excludeEquipmentIds?.length) {
                const equipments = dto.excludeEquipmentIds.map(equipmentId =>
                    excludedEquipmentsRepo.create({
                        profile: {id: profile.id},
                        equipmentId,
                    }),
                );
                await excludedEquipmentsRepo.save(equipments);
            }
        });

        return this.getUser(userId);
    }

    async updateExperience(userId: string, experience: ExperienceEnum): Promise<UserResponse> {
        const profile = await this.requireProfile(userId);

        if (profile.experience !== experience) {
            profile.experience = experience;
            await this.userProfilesRepository.save(profile);
        }

        return this.getUser(userId);
    }

    async getUser(id: string): Promise<UserResponse> {
        const user = await this.usersRepository
            .createQueryBuilder('users')
            .leftJoinAndSelect('users.profile', 'profile')
            .select([
                'users.id',
                'users.email',
                'users.googleId',
                'users.role',
                'users.createdAt',
                'users.updatedAt',
                'profile.id',
                'profile.name',
                'profile.height',
                'profile.experience',
            ])
            .where('users.id = :id', {id})
            .getOne();

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        let profile: UserProfileResponse | null = null;
        if (user.profile?.id) {
            const latestWeight = await this.weightHistoryRepository
                .createQueryBuilder('weights')
                .select(['weights.weight'])
                .where('weights.profile_id = :profileId', {profileId: user.profile.id})
                .orderBy('weights.createdAt', 'DESC')
                .limit(1)
                .getOne();

            profile = {
                id: user.profile.id,
                name: user.profile.name,
                height: user.profile.height,
                experience: user.profile.experience,
                weight: latestWeight?.weight ?? null,
            };
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            profile,
        };
    }

    async getExcludedMuscles(user: UsersEntity): Promise<MuscleResponse[]> {
        const profile = await this.requireProfile(user.id);
        const excluded = await this.excludedMusclesRepository.find({
            where: {profile: {id: profile.id}},
            relations: ['muscle', 'muscle.muscleGroup'],
        });

        return excluded.map(e => {
            const m = e.muscle;
            const dto = new MuscleResponse();

            dto.id = m.id;
            dto.name = m.name;
            dto.muscleGroupId = m.muscleGroup.id;
            dto.type = m.type;
            dto.recoveryTimeHours = m.recoveryTimeHours;
            dto.createdAt = m.createdAt;
            dto.updatedAt = m.updatedAt;

            return dto;
        });
    }

    async updateExcludedMuscles(user: UsersEntity, muscleIds: string[]): Promise<{ ids: string[] }> {
        const profile = await this.requireProfile(user.id);
        const existingMuscles = await this.musclesRepository.findBy({id: In(muscleIds)});
        if (existingMuscles.length !== muscleIds.length) {
            throw new NotFoundException('One or more muscle IDs are invalid');
        }

        await this.excludedMusclesRepository.delete({profile: {id: profile.id}});

        const entities = muscleIds.map((id) =>
            this.excludedMusclesRepository.create({
                profile: {id: profile.id},
                muscleId: id,
            }),
        );

        await this.excludedMusclesRepository.save(entities);
        return {ids: muscleIds};
    }

    async updateExcludedEquipments(user: UsersEntity, equipmentIds: string[]): Promise<{ ids: string[] }> {
        const profile = await this.requireProfile(user.id);
        const existingEquipments = await this.equipmentsRepository.findBy({id: In(equipmentIds)});
        if (existingEquipments.length !== equipmentIds.length) {
            throw new NotFoundException('One or more equipment IDs are invalid');
        }

        await this.excludedEquipmentsRepository.delete({profile: {id: profile.id}});

        const entities = equipmentIds.map((id) =>
            this.excludedEquipmentsRepository.create({
                profile: {id: profile.id},
                equipmentId: id,
            }),
        );

        await this.excludedEquipmentsRepository.save(entities);
        return {ids: equipmentIds};
    }

    async getExcludedEquipments(user: UsersEntity): Promise<EquipmentResponse[]> {
        const profile = await this.requireProfile(user.id);
        const excluded = await this.excludedEquipmentsRepository.find({
            where: {profile: {id: profile.id}},
            relations: ['equipment', 'equipment.equipmentGroup'],
        });

        return excluded.map(e => {
            const eq = e.equipment;
            const dto = new EquipmentResponse();

            dto.id = eq.id;
            dto.name = eq.name;
            dto.equipmentGroupId = eq.equipmentGroup.id;
            dto.type = eq.type;
            dto.createdAt = eq.createdAt;
            dto.updatedAt = eq.updatedAt;

            return dto;
        });
    }

    async makeUserAdminByEmail(email: string): Promise<AdminUserResponse> {
        const user = await this.usersRepository.findOne({where: {email}, relations: ['profile']});
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }

        if (user.role !== UserRoleEnum.ADMIN) {
            user.role = UserRoleEnum.ADMIN;
            await this.usersRepository.save(user);
        }

        return this.toAdminUserResponse(user);
    }

    async getAllUsers(): Promise<AdminUserResponse[]> {
        const users = await this.usersRepository
            .createQueryBuilder('users')
            .leftJoinAndSelect('users.profile', 'profile')
            .select([
                'users.id',
                'users.email',
                'users.googleId',
                'users.role',
                'users.createdAt',
                'users.updatedAt',
                'profile.id',
                'profile.name',
                'profile.height',
                'profile.experience',
            ])
            .orderBy('users.createdAt', 'DESC')
            .getMany();

        return users.map(user => this.toAdminUserResponse(user));
    }

    async setUserRole(id: string, dto: AdminSetRoleRequest): Promise<AdminUserResponse> {
        const user = await this.usersRepository.findOne({where: {id}, relations: ['profile']});
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        if (dto.role === user.role) {
            return this.toAdminUserResponse(user);
        }

        user.role = dto.role;
        await this.usersRepository.save(user);
        return this.toAdminUserResponse(user);
    }

    async deleteUser(id: string): Promise<void> {
        const result = await this.usersRepository.delete({id});
        if (result.affected === 0) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
    }

    private toAdminUserResponse(user: UsersEntity): AdminUserResponse {
        const dto = new AdminUserResponse();
        dto.id = user.id;
        dto.email = user.email;
        dto.profileId = user.profile?.id ?? null;
        dto.profile = user.profile?.id
            ? {
                id: user.profile.id,
                name: user.profile.name,
                height: user.profile.height,
                experience: user.profile.experience,
                weight: null,
            }
            : null;
        dto.role = user.role;
        dto.authType = user.googleId ? AdminAuthTypeEnum.GOOGLE : AdminAuthTypeEnum.EMAIL;
        dto.createdAt = user.createdAt;
        dto.updatedAt = user.updatedAt;
        return dto;
    }

    private async requireProfile(userId: string): Promise<UserProfilesEntity> {
        const profile = await this.userProfilesRepository.findOne({where: {user: {id: userId}}});
        if (!profile) {
            throw new BadRequestException('User profile not created yet');
        }
        return profile;
    }
}
