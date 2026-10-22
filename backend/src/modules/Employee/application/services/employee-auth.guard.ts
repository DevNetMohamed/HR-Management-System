import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeStatus } from '../../domain/Employees/enums/Employee-enums';
import { EmployeeOrmEntity } from '../../infrastructure/persistence/employee/employee.orm-entity';
import { AccessControlService } from '../../../AccessControl/application/access-control.service';
import { SessionTokenService } from './session-token.service';
import { EmployeeAccountOrmEntity } from '../../../User/infrastructure/persistence/user-account.orm-entity';

@Injectable()
export class EmployeeAuthGuard implements CanActivate {
  constructor(private readonly tokens: SessionTokenService, @InjectRepository(EmployeeOrmEntity) private readonly employees: Repository<EmployeeOrmEntity>, @InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>, private readonly access: AccessControlService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) throw new UnauthorizedException('Bearer access token is required');
    const claims = this.tokens.verify(authorization.slice(7));
    if (claims.mfaSetupRequired && !request.url?.startsWith('/auth/mfa/')) throw new UnauthorizedException('Complete MFA enrollment before using HRMS');
    if (!claims.mfaSetupRequired && !(await this.access.isSessionActive(claims.companyId, claims.employeeId, claims.jti))) {
      throw new UnauthorizedException('Session is no longer active');
    }
    const employee = await this.employees.findOne({ where: { id: claims.employeeId, companyId: claims.companyId } });
    if (!employee) throw new UnauthorizedException('Employee access is no longer active');
    const account = await this.accounts.findOne({ where: { companyId: claims.companyId, employeeId: claims.employeeId } });
    if (!account || account.accountStatus !== 'ACTIVE' || !account.activatedAt || (account.lockedUntil && account.lockedUntil > new Date())) throw new UnauthorizedException('User account is no longer active');
    if (employee.status === EmployeeStatus.TERMINATED) {
      const policy: any = await this.access.getPolicy(claims.companyId);
      const endOfLastDay = employee.terminationDate ? new Date(`${employee.terminationDate}T23:59:59.999Z`) : new Date(0);
      if (policy.terminationRevocation !== 'scheduled' || endOfLastDay <= new Date()) throw new UnauthorizedException('Employee access is no longer active');
    }
    request.user = claims;
    return true;
  }
}
