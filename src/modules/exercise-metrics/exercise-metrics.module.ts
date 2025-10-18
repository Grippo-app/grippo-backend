import {Module} from '@nestjs/common';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';
import {ExerciseMetricsService} from './exercise-metrics.service';
import {ExerciseMetricsController} from './exercise-metrics.controller';

@Module({
    imports: [DatabaseModule],
    providers: [ExerciseMetricsService, ...repositoryProviders],
    controllers: [ExerciseMetricsController],
})
export class ExerciseMetricsModule {
}
