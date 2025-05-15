import {Injectable, UnauthorizedException,} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err, user, info) {
        if (err || !user) {
            if (info?.name === 'TokenExpiredError') {
                throw new UnauthorizedException('ACCESS_TOKEN_EXPIRED');
            }

            if (info?.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('ACCESS_TOKEN_INVALID');
            }

            throw new UnauthorizedException('UNAUTHORIZED');
        }

        return user;
    }
}
