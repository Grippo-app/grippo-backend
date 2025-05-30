import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    public handleRequest<TUser = any>(
        err: any,
        user: any,
        info: any,
        context: ExecutionContext,
        status?: any
    ): TUser {
        const response = context.switchToHttp().getResponse<Response>();

        if (err || !user) {
            if (info?.name === 'TokenExpiredError') {
                response.setHeader(
                    'WWW-Authenticate',
                    'Bearer error="invalid_token", error_description="The access token expired"'
                );
                throw new UnauthorizedException('ACCESS_TOKEN_EXPIRED');
            }

            if (info?.name === 'JsonWebTokenError') {
                response.setHeader(
                    'WWW-Authenticate',
                    'Bearer error="invalid_token", error_description="The access token is invalid"'
                );
                throw new UnauthorizedException('ACCESS_TOKEN_INVALID');
            }

            response.setHeader(
                'WWW-Authenticate',
                'Bearer error="unauthorized", error_description="Authorization required"'
            );
            throw new UnauthorizedException('UNAUTHORIZED');
        }

        return user;
    }
}
