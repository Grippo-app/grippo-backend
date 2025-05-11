import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TrainingsModule } from './modules/trainings/trainings.module';
import { ExerciseExampleModule } from './modules/exercise-examples/exercise-example.module';
import { MusclesModule } from './modules/muscles/muscles.module';
import { WeightHistoryModule } from './modules/weight-history/weight-history.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { FiltersModule } from './modules/filters/filters.module';
import { EquipmentsModule } from './modules/equipments/equipments.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env`,
            isGlobal: true,
        }),

        // Shared
        DatabaseModule,

        // Features
        AuthModule,
        UsersModule,
        TrainingsModule,
        ExerciseExampleModule,
        MusclesModule,
        WeightHistoryModule,
        StatisticsModule,
        FiltersModule,
        EquipmentsModule,
    ],
})
export class AppModule {}
