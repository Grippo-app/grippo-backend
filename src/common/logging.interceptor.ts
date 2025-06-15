import {CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor,} from '@nestjs/common';
import {catchError, Observable, tap, throwError} from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const start = Date.now();
        const request = context.switchToHttp().getRequest();
        const {method, url, body, user} = request;

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;
                const duration = Date.now() - start;

                const shouldLogBody = ['POST', 'PUT'].includes(method);
                const bodyPart = shouldLogBody ? ` body=${this.safeStringify(body)}` : '';
                const userIdPart = user?.id ? ` uid=${user.id}` : '';

                this.logger.log(`${method} ${url} ${statusCode}${userIdPart}${bodyPart} - ${duration}ms`);
            }),
            catchError((err) => {
                const duration = Date.now() - start;
                this.logger.error(`${method} ${url} ❌ ${err.message} - ${duration}ms`);
                return throwError(() => err);
            }),
        );
    }

    private safeStringify(data: unknown): string {
        try {
            return JSON.stringify(data);
        } catch {
            return '[Unserializable body]';
        }
    }
}