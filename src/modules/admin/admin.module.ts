import {Module} from '@nestjs/common';
import {ExerciseExampleModule} from '../exercise-examples/exercise-example.module';
import {UsersModule} from '../users/users.module';
import {AdminController} from './admin.controller';

@Module({
    imports: [ExerciseExampleModule, UsersModule],
    controllers: [AdminController],
})
export class AdminModule {
}
