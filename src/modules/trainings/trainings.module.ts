import {Module} from '@nestjs/common';
import {TrainingsService} from './trainings.service';
import {TrainingsController} from './trainings.controller';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [TrainingsService],
    controllers: [TrainingsController],
    exports: [TrainingsService],
})
export class TrainingsModule {
}
