import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {ExercisesEntity} from './exercises.entity';
import {UserProfilesEntity} from './user-profiles.entity';

@Entity({name: 'trainings'})
export class TrainingsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'int', nullable: true})
    duration: number | null;

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

    @Column({name: 'profile_id', type: 'uuid', nullable: true})
    profileId: string | null;

    @Index()
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

    @OneToMany(() => ExercisesEntity, (exercise) => exercise.training, {
        cascade: ['remove'],
    })
    exercises: ExercisesEntity[];

    @ManyToOne(() => UserProfilesEntity, (profile) => profile.trainings, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'profile_id'})
    profile: UserProfilesEntity;
}
