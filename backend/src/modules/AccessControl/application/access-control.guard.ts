import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from './access-control.service';
import { REQUIRED_ACCESS } from '../presentation/require-access.decorator';

@Injectable()
export class AccessControlGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly access: AccessControlService) {}
  async canActivate(context: ExecutionContext) {
    const permission = this.reflector.getAllAndOverride<string>(REQUIRED_ACCESS, [context.getHandler(), context.getClass()]);
    if (!permission) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.companyId || !user?.employeeId) throw new ForbiddenException('Authenticated employee context is missing');
    const targetId = request.params?.employeeId ?? request.params?.id ?? request.body?.employeeId;
    await this.access.authorize(user.companyId, user.employeeId, permission, targetId);
    return true;
  }
}
