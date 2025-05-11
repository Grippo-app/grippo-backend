import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import {ExerciseExampleBundlesEntity} from './exercise-example-bundles.entity';
import {MuscleGroupsEntity} from './muscle-groups.entity';
import {MuscleEnum} from '../lib/muscle.enum';
import {ExcludedMusclesEntity} from './excluded-muscles.entity';

@Entity({name: 'muscles'})
@Check(`"recovery_time_hours" IS NULL OR "recovery_time_hours" >= 0`)
export class MusclesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({type: 'enum', enum: MuscleEnum, nullable: true})
    type: MuscleEnum;

    @Column({
        type: 'integer',
        nullable: true,
        name: 'recovery_time_hours'
    })
    recoveryTimeHours: number;

    @CreateDateColumn({
        type: 'timestamp without time zone',
        name: 'created_at',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamp without time zone',
        name: 'updated_at',
    })
    updatedAt: Date;

    @ManyToOne(() => MuscleGroupsEntity, (group) => group.muscles, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'muscle_group_id'})
    muscleGroup: MuscleGroupsEntity;

    @OneToMany(
        () => ExerciseExampleBundlesEntity,
        (bundle) => bundle.muscle,
        {cascade: ['remove']},
    )
    exerciseExampleBundles: ExerciseExampleBundlesEntity[];

    @OneToMany(
        () => ExcludedMusclesEntity,
        (excluded) => excluded.muscle,
        {cascade: ['remove']},
    )
    excludedMuscles: ExcludedMusclesEntity[];
}