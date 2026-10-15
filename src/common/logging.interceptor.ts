import {CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor,} from '@nestjs/common';
import {catchError, Observable, tap, throwError} from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const start = Date.now();
        const request = context.switchToHttp().getRequest();
        const {method, url, user} = request;
        const path = url.split(/[?#]/, 1)[0];
        const userIdPart = user?.id ? ` uid=${user.id}` : '';

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;
                const duration = Date.now() - start;

                this.logger.log(`${method} ${path} ${statusCode}${userIdPart} - ${duration}ms`);
            }),
            catchError((err) => {
                const duration = Date.now() - start;
                const statusCode = err instanceof HttpException ? err.getStatus() : 500;
                this.logger.error(`${method} ${path} ${statusCode}${userIdPart} - ${duration}ms`);
                return throwError(() => err);
            }),
        );
    }
}