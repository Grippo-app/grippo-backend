import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {GoalPersonalizationKeyEnum, GoalPrimaryGoalEnum, GoalSecondaryGoalEnum,} from '../lib/goal.enum';
import {UserProfilesEntity} from './user-profiles.entity';

@Entity({name: 'goals'})
@Check(`"confidence" >= 0 AND "confidence" <= 1`)
export class GoalsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({name: 'profile_id', type: 'uuid', unique: true})
    profileId: string;

    @Column({
        type: 'enum',
        enum: GoalPrimaryGoalEnum,
        enumName: 'goal_primary_goal_enum',
    })
    primaryGoal: GoalPrimaryGoalEnum;

    @Column({
        name: 'secondary_goal',
        type: 'enum',
        enum: GoalSecondaryGoalEnum,
        enumName: 'goal_secondary_goal_enum',
        nullable: true,
    })
    secondaryGoal: GoalSecondaryGoalEnum | null;

    @Column({type: 'timestamp without time zone', name: 'target', nullable: true})
    target: Date | null;

    @Column({
        type: 'enum',
        enum: GoalPersonalizationKeyEnum,
        enumName: 'goal_personalization_key_enum',
        array: true,
        default: () => "'{}'::goal_personalization_key_enum[]",
    })
    personalizations: GoalPersonalizationKeyEnum[];

    @Column({
        type: 'decimal',
        precision: 3,
        scale: 2,
        default: 1,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    confidence: number;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at'})
    updatedAt: Date;

    @Column({
        type: 'timestamp without time zone',
        name: 'last_confirmed_at',
        nullable: true,
    })
    lastConfirmedAt: Date | null;

    @OneToOne(() => UserProfilesEntity, (profile) => profile.goal, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'profile_id'})
    profile: UserProfilesEntity;
}
