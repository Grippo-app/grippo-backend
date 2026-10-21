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
        const boolean = (key: string): boolean => {
            const value = this.configService.get<unknown>(key);
            if (value === undefined || value === null || value === '') return false;
            if (value === true || value === false) return value;
            if (typeof value === 'string' && value.trim().toLowerCase() === 'true') return true;
            if (typeof value === 'string' && value.trim().toLowerCase() === 'false') return false;
            throw new Error(`${key} must be true or false`);
        };
        const synchronize = boolean('POSTGRES_SYNC');
        const migrationsRun = boolean('POSTGRES_MIGRATIONS');
        if (get('NODE_ENV') === 'production' && (synchronize || migrationsRun)) {
            throw new Error('Automatic schema changes are disabled in production');
        }
        const rawPort = get('POSTGRES_PORT');
        const port = Number(rawPort);
        if (!/^\d+$/.test(String(rawPort)) || !Number.isInteger(port) || port < 1 || port > 65535) {
            throw new Error('POSTGRES_PORT must be an integer between 1 and 65535');
        }

        return {
            type: 'postgres',
            name: 'default',
            host: get('POSTGRES_HOST'),
            port,
            username: get('POSTGRES_USERNAME'),
            password: get('POSTGRES_PASSWORD'),
            database: get('POSTGRES_DATABASE'),

            entities: [join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
            migrations: [],
            installExtensions: get('NODE_ENV') !== 'production',

            synchronize,
            logging: boolean('POSTGRES_LOGS'),
            migrationsRun,

            namingStrategy: new SnakeNamingStrategy(),
        };
    }
}
