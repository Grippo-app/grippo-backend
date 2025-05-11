import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import {EquipmentGroupEnum} from '../lib/equipment-group.enum';
import {EquipmentsEntity} from './equipments.entity';

@Entity({name: 'equipment_groups'})
export class EquipmentGroupsEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({type: 'enum', enum: EquipmentGroupEnum, nullable: true})
    type: EquipmentGroupEnum;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at'})
    updatedAt: Date;

    @OneToMany(() => EquipmentsEntity, (equipment) => equipment.equipmentGroup, {
        cascade: ['remove'],
    })
    equipments: EquipmentsEntity[];
}
