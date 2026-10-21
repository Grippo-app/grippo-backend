import {Module} from '@nestjs/common';
import {WeightHistoryService} from './weight-history.service';
import {WeightHistoryController} from './weight-history.controller';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [WeightHistoryService],
    controllers: [WeightHistoryController],
    exports: [WeightHistoryService],
})
export class WeightHistoryModule {
}
