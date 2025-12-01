import {Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';
import {UserRoleEnum} from '../lib/user-role.enum';
import {UserProfilesEntity} from './user-profiles.entity';

@Entity({name: 'users'})
export class UsersEntity {
    // 🆔 ID / Auth
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    email: string;

    @Column({select: false})
    password: string;

    @Column({type: 'enum', enum: UserRoleEnum, default: UserRoleEnum.DEFAULT})
    role: UserRoleEnum;

    @OneToOne(() => UserProfilesEntity, (profile) => profile.user)
    profile?: UserProfilesEntity;

    // 📅 Metadata
    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp without time zone', name: 'updated_at'})
    updatedAt: Date;
}
