import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {ExerciseExamplesEntity} from "./exercise-examples.entity";
import {ResourceTypeEnum} from "../lib/resource-type.enum";

@Entity({name: 'exercise_examples_tutorials'})
export class ExerciseExamplesTutorialsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at',})
    createdAt: Date;

    @Column({default: null})
    exerciseExampleId: string;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at',})
    updatedAt: Date;

    @Column({default: null})
    title: string;

    @Column({default: null})
    value: string;

    @Column({default: null})
    language: string;

    @Column({default: null, nullable: true})
    author: string;

    @Column({type: 'enum', enum: ResourceTypeEnum, nullable: true})
    resourceType: ResourceTypeEnum

    @ManyToOne(() => ExerciseExamplesEntity, (exercise) => exercise.tutorials, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })

    @JoinColumn({name: 'exercise_example_id'})
    exerciseExample: ExerciseExamplesEntity;
}
