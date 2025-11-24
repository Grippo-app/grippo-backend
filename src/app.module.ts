import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';

import {DatabaseModule} from './database/database.module';

import {AuthModule} from './modules/auth/auth.module';
import {UsersModule} from './modules/users/users.module';
import {TrainingsModule} from './modules/trainings/trainings.module';
import {ExerciseExampleModule} from './modules/exercise-examples/exercise-example.module';
import {MusclesModule} from './modules/muscles/muscles.module';
import {WeightHistoryModule} from './modules/weight-history/weight-history.module';
import {ExerciseMetricsModule} from './modules/exercise-metrics/exercise-metrics.module';
import {EquipmentsModule} from './modules/equipments/equipments.module';
import {AdminModule} from './modules/admin/admin.module';
import {I18nModule} from './i18n/i18n.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env`,
            isGlobal: true,
        }),

        // Shared
        DatabaseModule,
        I18nModule,

        // Features
        AuthModule,
        UsersModule,
        TrainingsModule,
        ExerciseExampleModule,
        MusclesModule,
        WeightHistoryModule,
        ExerciseMetricsModule,
        EquipmentsModule,
        AdminModule,
    ],
})
export class AppModule {
}
