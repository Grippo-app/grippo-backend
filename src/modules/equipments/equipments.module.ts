import {Module} from '@nestjs/common';
import {EquipmentsService} from './equipments.service';
import {EquipmentsController} from './equipments.controller';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [EquipmentsService],
    controllers: [EquipmentsController]
})
export class EquipmentsModule {

}
