import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ExerciseExamplesEntity } from './exercise-examples.entity';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../i18n/i18n.types';

@Entity({ name: 'exercise_example_translations' })
export class ExerciseExampleTranslationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'exercise_example_id' })
    exerciseExampleId: string;

    @ManyToOne(() => ExerciseExamplesEntity, (exerciseExample) => exerciseExample.translations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'exercise_example_id' })
    exerciseExample: ExerciseExamplesEntity;

    @Column({ type: 'enum', enum: SUPPORTED_LANGUAGES })
    language: SupportedLanguage;

    @Column({ type: 'text', nullable: true })
    name: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
    updatedAt: Date;
}
