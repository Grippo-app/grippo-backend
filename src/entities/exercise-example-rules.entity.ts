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
import {
    ExerciseRulesEntryTypeEnum,
    ExerciseRulesLoadTypeEnum,
    ExerciseRulesMissingBodyWeightBehaviorEnum,
} from '../lib/exercise-rules.enum';

@Entity({name: 'exercise_example_rules'})
export class ExerciseExampleRulesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid', unique: true})
    exerciseExampleId: string;

    @Column({
        type: 'enum',
        enum: ExerciseRulesEntryTypeEnum,
        enumName: 'exercise_example_rules_entry_type_enum',
    })
    entryType: ExerciseRulesEntryTypeEnum;

    @Column({
        type: 'enum',
        enum: ExerciseRulesLoadTypeEnum,
        enumName: 'exercise_example_rules_load_type_enum',
    })
    loadType: ExerciseRulesLoadTypeEnum;

    @Column({
        type: 'numeric',
        precision: 4,
        scale: 2,
        nullable: true,
        transformer: {
            to: (value: number | null) => value,
            from: (value: string | null) => (value === null ? null : parseFloat(value)),
        },
    })
    bodyWeightMultiplier: number | null;

    @Column({type: 'boolean', default: false})
    canAddExtraWeight: boolean;

    @Column({type: 'boolean', default: false})
    canUseAssistance: boolean;

    @Column({
        type: 'enum',
        enum: ExerciseRulesMissingBodyWeightBehaviorEnum,
        enumName: 'exercise_example_rules_missing_body_weight_behavior_enum',
        default: ExerciseRulesMissingBodyWeightBehaviorEnum.SaveAsRepetitionsOnly,
    })
    missingBodyWeightBehavior: ExerciseRulesMissingBodyWeightBehaviorEnum;

    @Column({type: 'boolean', default: false})
    requiresEquipment: boolean;

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
