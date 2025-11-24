import {Module} from '@nestjs/common';
import {UsersService} from './users.service';
import {UsersController} from './users.controller';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [UsersService, ...repositoryProviders],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {
}
