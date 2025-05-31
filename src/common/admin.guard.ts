import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || user.email !== 'grippo@admin.panel') {
            throw new ForbiddenException('Only admin can access this route');
        }

        return true;
    }
}
