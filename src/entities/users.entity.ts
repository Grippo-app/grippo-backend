import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import {TrainingsEntity} from './trainings.entity';
import {WeightHistoryEntity} from './weight-history.entity';
import {ExcludedMusclesEntity} from './excluded-muscles.entity';
import {ExcludedEquipmentsEntity} from './excluded-equipments.entity';
import {ExperienceEnum} from '../lib/experience.enum';
import {UserRoleEnum} from '../lib/user-role.enum';

@Entity({name: 'users'})
export class UsersEntity {
    // 🆔 ID / Auth
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    email: string;

    @Column({select: false})
    password: string;

    // 👤 Profile
    @Column()
    name: string;

    @Column({type: 'integer'})
    height: number; // stored in centimeters, e.g., 175 = 175 cm

    @Column({type: 'enum', enum: ExperienceEnum, nullable: true})
    experience: ExperienceEnum;

    @Column({type: 'enum', enum: UserRoleEnum, default: UserRoleEnum.DEFAULT})
    role: UserRoleEnum;

    // 📅 Metadata
    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at'})
    updatedAt: Date;

    // 🔗 Relations
    @OneToMany(() => TrainingsEntity, (training) => training.user, {
        cascade: ['remove'],
    })
    trainings: TrainingsEntity[];

    @OneToMany(() => WeightHistoryEntity, (weights) => weights.user, {
        cascade: ['remove'],
    })
    weights: WeightHistoryEntity[];

    @OneToMany(() => ExcludedMusclesEntity, (exclude) => exclude.user, {
        cascade: ['remove'],
    })
    excludedMuscles: ExcludedMusclesEntity[];

    @OneToMany(() => ExcludedEquipmentsEntity, (exclude) => exclude.user, {
        cascade: ['remove'],
    })
    excludedEquipments: ExcludedEquipmentsEntity[];
}
