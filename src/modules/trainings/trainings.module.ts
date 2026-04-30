import {Module} from '@nestjs/common';
import {TrainingsService} from './trainings.service';
import {TrainingsController} from './trainings.controller';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [TrainingsService, ...repositoryProviders],
    controllers: [TrainingsController],
    exports: [TrainingsService],
})
export class TrainingsModule {
}
