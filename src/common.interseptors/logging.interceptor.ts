import {CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor,} from '@nestjs/common';
import {Observable, tap} from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const {method, url, body, user} = request;

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;
                const duration = Date.now() - now;

                const logBody =
                    method === 'POST' || method === 'PUT' ? ` body=${JSON.stringify(body)}` : '';

                const userId = user?.id ? ` uid=${user.id}` : '';

                this.logger.log(
                    `${method} ${url} ${statusCode} ${userId}${logBody} - ${duration}ms`,
                );
            }),
        );
    }
}
