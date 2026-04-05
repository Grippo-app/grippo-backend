import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import {UsersEntity} from './users.entity';

@Entity({name: 'push_tokens'})
export class PushTokensEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UsersEntity, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user: UsersEntity;

    @Column({unique: true})
    token: string;

    @CreateDateColumn({type: 'timestamp without time zone', name: 'created_at'})
    createdAt: Date;
}
