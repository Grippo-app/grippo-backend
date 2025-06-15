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
import {ExerciseExampleBundlesEntity} from './exercise-example-bundles.entity';
import {UsersEntity} from "./users.entity";
import {ExercisesEntity} from "./exercises.entity";
import {ExerciseCategoryEnum} from "../lib/exercise-category.enum";
import {WeightTypeEnum} from "../lib/weight-type.enum";
import {ExerciseExamplesEquipmentsEntity} from "./exercise-examples-equipments.entity";
import {ForceTypeEnum} from "../lib/force-type.enum";
import {ExperienceEnum} from "../lib/experience.enum";
import {ExerciseExamplesTutorialsEntity} from "./exercise-examples-tutorials.entity";

@Entity({name: 'exercise_examples'})
export class ExerciseExamplesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null})
    name: string;

    @Column({default: null})
    description: string;

    @Column({default: null})
    imageUrl: string;

    @Column({type: 'enum', enum: ExerciseCategoryEnum, nullable: true})
    category: ExerciseCategoryEnum;

    @Column({type: 'enum', enum: WeightTypeEnum, nullable: true})
    weightType: WeightTypeEnum;

    @Column({type: 'enum', enum: ForceTypeEnum, nullable: true})
    forceType: ForceTypeEnum;

    @Column({type: 'enum', enum: ExperienceEnum, nullable: true})
    experience: ExperienceEnum;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at',})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at',})
    updatedAt: Date;

    @OneToMany(() => ExerciseExampleBundlesEntity, (exerciseExampleBundle) => exerciseExampleBundle.exerciseExample, {
        cascade: ['remove']
    })
    exerciseExampleBundles: ExerciseExampleBundlesEntity[];

    @OneToMany(() => ExerciseExamplesTutorialsEntity, (tutorial) => tutorial.exerciseExample, {
        cascade: ['remove']
    })
    tutorials: ExerciseExamplesTutorialsEntity[];

    @OneToMany(() => ExercisesEntity, (exercises) => exercises.exerciseExample, {
        cascade: ['remove']
    })
    exercises: ExercisesEntity[];

    @OneToMany(() => ExerciseExamplesEquipmentsEntity, (exerciseExampleRefs) => exerciseExampleRefs.exerciseExample, {
        cascade: ['remove']
    })
    equipmentRefs: ExerciseExamplesEquipmentsEntity[];
}
