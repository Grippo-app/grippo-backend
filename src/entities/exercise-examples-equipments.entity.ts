import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {EquipmentsEntity} from "./equipments.entity";
import {ExerciseExamplesEntity} from "./exercise-examples.entity";

@Entity({name: 'exercise_examples_equipments'})
export class ExerciseExamplesEquipmentsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at',})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at',})
    updatedAt: Date;

    @Column({default: null})
    equipmentId: string;

    @Column({default: null})
    exerciseExampleId: string;

    @ManyToOne(() => EquipmentsEntity, (equipment) => equipment.exerciseExampleRefs, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })

    @JoinColumn({name: 'equipment_id'})
    equipment: EquipmentsEntity;

    @ManyToOne(() => ExerciseExamplesEntity, (exercise) => exercise.equipmentRefs, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })

    @JoinColumn({name: 'exercise_example_id'})
    exerciseExample: ExerciseExamplesEntity;
}
