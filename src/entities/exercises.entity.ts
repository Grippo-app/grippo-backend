import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {TrainingsEntity} from './trainings.entity';
import {IterationsEntity} from './iterations.entity';
import {ExerciseExamplesEntity} from "./exercise-examples.entity";

@Entity({name: 'exercises'})
export class ExercisesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', nullable: true})
    name: string | null;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 1,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    volume: number | null;

    @Column({type: 'int', nullable: true})
    repetitions: number | null;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    intensity: number | null;

    @Column({name: 'training_id', type: 'uuid', nullable: true})
    trainingId: string | null;

    @Column({name: 'exercise_example_id', type: 'uuid', nullable: true})
    exerciseExampleId: string | null;

    @Column({name: 'order_index', type: 'int', default: 0})
    orderIndex: number;

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

    @ManyToOne(() => TrainingsEntity, (training) => training.exercises, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'training_id'})
    training: TrainingsEntity;

    @ManyToOne(() => ExerciseExamplesEntity, (exerciseExample) => exerciseExample.exercises, {
        onDelete: 'SET NULL',
        orphanedRowAction: 'nullify',
    })
    @JoinColumn({name: 'exercise_example_id'})
    exerciseExample: ExerciseExamplesEntity;

    @OneToMany(() => IterationsEntity, (iterations) => iterations.exercise, {
        cascade: ['remove'],
    })
    iterations: IterationsEntity[];
}
