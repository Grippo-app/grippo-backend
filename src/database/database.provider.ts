import {DataSource} from 'typeorm';
import {DatabaseService} from './database.service';

/**
 * 🔌 Provides a singleton DataSource instance for TypeORM
 */
export const dataSourceProviders = [
    {
        provide: 'DATA_SOURCE',
        useFactory: async (databaseService: DatabaseService) => {
            const dataSource = new DataSource(databaseService.typeOrmConfig());

            // Prevent re-initializing if already connected
            if (!dataSource.isInitialized) {
                await dataSource.initialize();
            }

            return dataSource;
        },
        inject: [DatabaseService],
    },
];