import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ExerciseExampleI18nService } from './exercise-example-i18n.service';
import { LanguageMiddleware } from './language.middleware';

@Global()
@Module({
    providers: [ExerciseExampleI18nService, LanguageMiddleware],
    exports: [ExerciseExampleI18nService],
})
export class I18nModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(LanguageMiddleware).forRoutes('*');
    }
}
