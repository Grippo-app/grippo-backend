import {Module} from '@nestjs/common';
import {EquipmentsService} from './equipments.service';
import {EquipmentsController} from './equipments.controller';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [EquipmentsService, ...repositoryProviders],
    controllers: [EquipmentsController]
})
export class EquipmentsModule {

}
