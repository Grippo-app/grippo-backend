import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {ExercisesEntity} from './exercises.entity';

@Entity({name: 'iterations'})
export class IterationsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'assist_weight',
        type: 'decimal',
        precision: 5,
        scale: 1,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    assistWeight: number | null;

    @Column({
        name: 'external_weight',
        type: 'decimal',
        precision: 5,
        scale: 1,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    externalWeight: number | null;

    @Column({
        name: 'extra_weight',
        type: 'decimal',
        precision: 5,
        scale: 1,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    extraWeight: number | null;

    @Column({
        name: 'body_weight',
        type: 'decimal',
        precision: 5,
        scale: 1,
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    bodyWeight: number | null;

    @Column({type: 'int', nullable: true})
    repetitions: number | null;

    @Column({name: 'exercise_id', nullable: true})
    exerciseId: string | null;

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

    @ManyToOne(() => ExercisesEntity, (exercise) => exercise.iterations, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'exercise_id'})
    exercise: ExercisesEntity;
}
