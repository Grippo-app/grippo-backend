import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {UserProfilesEntity} from './user-profiles.entity';

@Entity({name: 'weight_history'})
@Check(`"weight" >= 30 AND "weight" <= 300`)
export class WeightHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 1,
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseFloat(value),
        },
    })
    weight: number; // in kilograms, 1 decimal precision (e.g., 82.5)

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

    @ManyToOne(() => UserProfilesEntity, (profile) => profile.weights, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'profile_id'})
    profile: UserProfilesEntity;
}
