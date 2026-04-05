import {Module} from '@nestjs/common';
import {PushTokensService} from './push-tokens.service';
import {PushTokensController} from './push-tokens.controller';
import {repositoryProviders} from '../../database/repository.providers';
import {DatabaseModule} from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [PushTokensService, ...repositoryProviders],
    controllers: [PushTokensController],
    exports: [PushTokensService],
})
export class PushTokensModule {
}
