import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {ExperienceEnum} from '../lib/experience.enum';
import {UsersEntity} from './users.entity';
import {TrainingsEntity} from './trainings.entity';
import {WeightHistoryEntity} from './weight-history.entity';
import {ExcludedMusclesEntity} from './excluded-muscles.entity';
import {ExcludedEquipmentsEntity} from './excluded-equipments.entity';

@Entity({name: 'user_profiles'})
export class UserProfilesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => UsersEntity, (user) => user.profile, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'user_id'})
    user: UsersEntity;

    @Column()
    name: string;

    @Column({type: 'integer'})
    height: number; // stored in centimeters

    @Column({type: 'enum', enum: ExperienceEnum})
    experience: ExperienceEnum;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at'})
    updatedAt: Date;

    @OneToMany(() => TrainingsEntity, (training) => training.profile, {
        cascade: ['remove'],
    })
    trainings: TrainingsEntity[];

    @OneToMany(() => WeightHistoryEntity, (weights) => weights.profile, {
        cascade: ['remove'],
    })
    weights: WeightHistoryEntity[];

    @OneToMany(() => ExcludedMusclesEntity, (exclude) => exclude.profile, {
        cascade: ['remove'],
    })
    excludedMuscles: ExcludedMusclesEntity[];

    @OneToMany(() => ExcludedEquipmentsEntity, (exclude) => exclude.profile, {
        cascade: ['remove'],
    })
    excludedEquipments: ExcludedEquipmentsEntity[];
}
