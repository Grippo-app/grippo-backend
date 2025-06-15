import {Module} from '@nestjs/common';
import {StatisticsService} from './statistics.service';
import {StatisticsController} from './statistics.controller';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [StatisticsService, ...repositoryProviders],
    controllers: [StatisticsController],
})
export class StatisticsModule {
}
