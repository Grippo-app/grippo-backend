import {Module} from '@nestjs/common';
import {FiltersService} from './filters.service';
import {FiltersController} from './filters.controller';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [FiltersService, ...repositoryProviders],
    controllers: [FiltersController]
})
export class FiltersModule {
}
