import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {ExerciseExamplesEntity} from './exercise-examples.entity';
import {MusclesEntity} from './muscles.entity';

@Entity({name: 'exercise_example_bundles'})
export class ExerciseExampleBundlesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null})
    percentage: number;

    @Column({default: null})
    exerciseExampleId: string;

    @Column({default: null})
    muscleId: string;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at',})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at',})
    updatedAt: Date;

    @ManyToOne(() => ExerciseExamplesEntity, (exerciseExample) => exerciseExample.exerciseExampleBundles, {
            onDelete: 'CASCADE',
            orphanedRowAction: 'delete',
        },
    )
    @JoinColumn({name: 'exercise_example_id'})
    exerciseExample: ExerciseExamplesEntity;

    @ManyToOne(() => MusclesEntity, (muscle) => muscle.exerciseExampleBundles, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'muscle_id'})
    muscle: MusclesEntity;
}
