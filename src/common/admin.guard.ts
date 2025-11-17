import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {UserRoleEnum} from '../lib/user-role.enum';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || user.role !== UserRoleEnum.ADMIN) {
            throw new ForbiddenException('Only admin can access this route');
        }

        return true;
    }
}
