import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { dataSourceProviders } from './database.provider';
import { repositoryProviders } from './repository.providers';
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [...dataSourceProviders, ...repositoryProviders, DatabaseService],
  exports: [...dataSourceProviders, ...repositoryProviders],
})
export class DatabaseModule {}
