import {Module} from '@nestjs/common';
import {MusclesService} from './muscles.service';
import {MusclesController} from './muscles.controller';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [MusclesService, ...repositoryProviders],
    controllers: [MusclesController]
})
export class MusclesModule {
}
