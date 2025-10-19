import {Injectable, NestMiddleware} from '@nestjs/common';
import {NextFunction, Request, Response} from 'express';
import {ExerciseExampleI18nService} from './exercise-example-i18n.service';

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
    constructor(private readonly exerciseExampleI18nService: ExerciseExampleI18nService) {}

    use(req: Request, _: Response, next: NextFunction): void {
        const header = req.headers['accept-language'];
        req.locale = this.exerciseExampleI18nService.resolveLanguage(header as string | string[] | undefined);
        next();
    }
}
