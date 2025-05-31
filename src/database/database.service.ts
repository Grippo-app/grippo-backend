import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DataSourceOptions} from 'typeorm';
import {SnakeNamingStrategy} from '../common/snake-naming.strategy';
import {join} from 'path';

@Injectable()
export class DatabaseService {
    constructor(private configService: ConfigService) {
    }

    typeOrmConfig(): DataSourceOptions {
        const get = <T = string>(key: string): T => this.configService.get<T>(key);

        return {
            type: 'postgres',
            name: 'default',
            host: get('POSTGRES_HOST'),
            port: get<number>('POSTGRES_PORT'),
            username: get('POSTGRES_USERNAME'),
            password: get('POSTGRES_PASSWORD'),
            database: get('POSTGRES_DATABASE'),

            entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
            migrations: [],

            synchronize: get<boolean>('POSTGRES_SYNC'),
            logging: get<boolean>('POSTGRES_LOGS'),
            migrationsRun: get<boolean>('POSTGRES_MIGRATIONS'),

            namingStrategy: new SnakeNamingStrategy(),

            extra: {
                charset: 'utf8mb4_unicode_ci',
            },
        };
    }
}