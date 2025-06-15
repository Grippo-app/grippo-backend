import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {UsersEntity} from "./users.entity";
import {EquipmentsEntity} from "./equipments.entity";

@Entity({name: 'excluded_equipments'})
export class ExcludedEquipmentsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null})
    equipmentId: string;

    @Column({default: null})
    userId: string;

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

    @ManyToOne(() => UsersEntity, (user) => user.excludedEquipments, {
        onDelete: 'CASCADE',
        orphanedRowAction: 'delete',
    })
    @JoinColumn({name: 'user_id'})
    user: UsersEntity;
}