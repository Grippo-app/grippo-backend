import {Module} from '@nestjs/common';
import {WeightHistoryService} from './weight-history.service';
import {WeightHistoryController} from './weight-history.controller';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [WeightHistoryService, ...repositoryProviders],
    controllers: [WeightHistoryController]
})
export class WeightHistoryModule {
}
