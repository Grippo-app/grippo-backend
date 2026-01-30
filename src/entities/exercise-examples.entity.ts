import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {ExerciseExampleBundlesEntity} from './exercise-example-bundles.entity';
import {ExercisesEntity} from "./exercises.entity";
import {ExerciseCategoryEnum} from "../lib/exercise-category.enum";
import {WeightTypeEnum} from "../lib/weight-type.enum";
import {ExerciseExamplesEquipmentsEntity} from "./exercise-examples-equipments.entity";
import {ForceTypeEnum} from "../lib/force-type.enum";
import {ExperienceEnum} from "../lib/experience.enum";
import {ExerciseExampleTranslationEntity} from "./exercise-example-translation.entity";
import {ExerciseExampleRulesEntity} from "./exercise-example-rules.entity";
import {ApiProperty} from "@nestjs/swagger";
import {ExerciseRulesResponseDto} from "../modules/exercise-examples/dto/exercise-rules.dto";

@Entity({name: 'exercise_examples'})
export class ExerciseExamplesEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null})
    name: string | null;

    @Column({default: null})
    description: string | null;

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

    @OneToMany(() => ExercisesEntity, (exercises) => exercises.exerciseExample, {
        cascade: ['remove']
    })
    exercises: ExercisesEntity[];

    @OneToMany(() => ExerciseExamplesEquipmentsEntity, (exerciseExampleRefs) => exerciseExampleRefs.exerciseExample, {
        cascade: ['remove']
    })
    equipmentRefs: ExerciseExamplesEquipmentsEntity[];

    @OneToMany(() => ExerciseExampleTranslationEntity, (translation) => translation.exerciseExample, {
        cascade: ['remove']
    })
    translations: ExerciseExampleTranslationEntity[];

    @OneToOne(() => ExerciseExampleRulesEntity, (rules) => rules.exerciseExample, {
        cascade: true,
    })
    rule: ExerciseExampleRulesEntity;

    @ApiProperty({type: () => ExerciseRulesResponseDto})
    rules: ExerciseRulesResponseDto;
}
