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
import {ExerciseExamplesEntity} from './exercise-examples.entity';

@Entity({name: 'exercise_example_components'})
@Check(`
    ("body_weight_multiplier" IS NULL)
    OR ("body_weight_multiplier" >= 0.05 AND "body_weight_multiplier" <= 2.0)
`)
@Check(`
    ("external_weight_required" IS NULL)
    OR ("body_weight_multiplier" IS NULL)
`)
@Check(`
    ("body_weight_multiplier" IS NOT NULL)
    OR ("extra_weight_required" IS NULL AND "assist_weight_required" IS NULL)
`)
@Check(`
    ("external_weight_required" IS NULL)
    OR ("extra_weight_required" IS NULL AND "assist_weight_required" IS NULL)
`)
export class ExerciseExampleComponentsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid', name: 'exercise_example_id', unique: true})
    exerciseExampleId: string;

    @OneToOne(() => ExerciseExamplesEntity, (exerciseExample) => exerciseExample.componentsEntity, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'exercise_example_id'})
    exerciseExample: ExerciseExamplesEntity;

    @Column({type: 'boolean', name: 'external_weight_required', nullable: true})
    externalWeightRequired: boolean | null;

    @Column({
        type: 'numeric',
        name: 'body_weight_multiplier',
        precision: 4,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value: number | null) => value,
            from: (value: string | null) => (value === null ? null : Number(value)),
        },
    })
    bodyWeightMultiplier: number | null;

    @Column({type: 'boolean', name: 'extra_weight_required', nullable: true})
    extraWeightRequired: boolean | null;

    @Column({type: 'boolean', name: 'assist_weight_required', nullable: true})
    assistWeightRequired: boolean | null;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at'})
    updatedAt: Date;
}
