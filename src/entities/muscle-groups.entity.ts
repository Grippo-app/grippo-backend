import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import {MusclesEntity} from "./muscles.entity";
import {MuscleGroupEnum} from "../lib/muscle-group.enum";

@Entity({name: 'muscle_groups'})
export class MuscleGroupsEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({default: null})
    name: string;

    @Column({default: null})
    nameUa: string;

    @Column({default: null})
    nameRu: string;

    @Column({type: 'enum', enum: MuscleGroupEnum, nullable: true})
    type: MuscleGroupEnum;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at',})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at',})
    updatedAt: Date;

    @OneToMany(() => MusclesEntity, (muscles) => muscles.muscleGroup, {
        cascade: ['remove']
    })
    muscles: MusclesEntity[];
}
