import {Module} from '@nestjs/common';
import {MusclesService} from './muscles.service';
import {MusclesController} from './muscles.controller';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [MusclesService],
    controllers: [MusclesController]
})
export class MusclesModule {
}
