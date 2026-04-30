import {Module} from '@nestjs/common';
import {ExerciseExampleModule} from '../exercise-examples/exercise-example.module';
import {UsersModule} from '../users/users.module';
import {TrainingsModule} from '../trainings/trainings.module';
import {WeightHistoryModule} from '../weight-history/weight-history.module';
import {AdminController} from './admin.controller';

@Module({
    imports: [
        ExerciseExampleModule,
        UsersModule,
        TrainingsModule,
        WeightHistoryModule,
    ],
    controllers: [AdminController],
})
export class AdminModule {
}
