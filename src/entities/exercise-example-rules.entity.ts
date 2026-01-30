import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {ExerciseExamplesEntity} from './exercise-examples.entity';

@Entity({name: 'exercise_example_rules'})
export class ExerciseExampleRulesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid', unique: true})
    exerciseExampleId: string;

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
            from: (value: string | null) => (value === null ? null : parseFloat(value)),
        },
    })
    bodyWeightMultiplier: number | null;

    @Column({type: 'boolean', name: 'extra_weight_required', nullable: true})
    extraWeightRequired: boolean | null;

    @Column({type: 'boolean', name: 'assistance_required', nullable: true})
    assistanceRequired: boolean | null;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at'})
    updatedAt: Date;

    @OneToOne(() => ExerciseExamplesEntity, (exerciseExample) => exerciseExample.rule, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'exercise_example_id'})
    exerciseExample: ExerciseExamplesEntity;
}
