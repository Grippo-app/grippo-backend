import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {MusclesEntity} from "./muscles.entity";
import {UserProfilesEntity} from "./user-profiles.entity";

@Entity({name: 'excluded_muscles'})
export class ExcludedMusclesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null})
    muscleId: string;

    @Column({default: null, name: 'profile_id'})
    profileId: string;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at',})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at',})
    updatedAt: Date;

    @ManyToOne(() => MusclesEntity, (muscle) => muscle.excludedMuscles, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'muscle_id'})
    muscle: MusclesEntity;

    @ManyToOne(() => UserProfilesEntity, (profile) => profile.excludedMuscles, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'profile_id'})
    profile: UserProfilesEntity;
}
