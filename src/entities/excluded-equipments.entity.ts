import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {UserProfilesEntity} from "./user-profiles.entity";
import {EquipmentsEntity} from "./equipments.entity";

@Entity({name: 'excluded_equipments'})
export class ExcludedEquipmentsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null})
    equipmentId: string;

    @Column({default: null, name: 'profile_id'})
    profileId: string;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at',})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at',})
    updatedAt: Date;

    @ManyToOne(() => EquipmentsEntity, (equipment) => equipment.excludedEquipments, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'equipment_id'})
    equipment: EquipmentsEntity;

    @ManyToOne(() => UserProfilesEntity, (profile) => profile.excludedEquipments, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'profile_id'})
    profile: UserProfilesEntity;
}
