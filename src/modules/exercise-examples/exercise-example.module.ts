import {Module} from '@nestjs/common';
import {ExerciseExampleService} from './exercise-example.service';
import {ExerciseExampleController} from './exercise-example.controller';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [ExerciseExampleService],
    controllers: [ExerciseExampleController],
    exports: [ExerciseExampleService],
})
export class ExerciseExampleModule {
}
