import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeAuthGuard } from '../Employee/application/services/employee-auth.guard';
import { SessionTokenService } from '../Employee/application/services/session-token.service';
import { EmployeeOrmEntity } from '../Employee/infrastructure/persistence/employee/employee.orm-entity';
import { AccessControlGuard } from './application/access-control.guard';
import { AccessControlService } from './application/access-control.service';
import {
  AccessAssignmentOrmEntity, AccessDecisionEvidenceOrmEntity, AccessDelegationOrmEntity,
  AccessElevationOrmEntity, AccessFieldRuleOrmEntity, AccessLoginAttemptOrmEntity, AccessReviewOrmEntity,
  AccessPermissionOrmEntity, AccessRoleOrmEntity, AccessRolePermissionOrmEntity,
  AccessSecurityPolicyOrmEntity, AccessSessionOrmEntity, AccessSodExceptionOrmEntity, AccessSodRuleOrmEntity,
} from './infrastructure/persistence/access-control.orm-entities';
import { AccessControlController } from './presentation/access-control.controller';
import { EmployeeAccountOrmEntity } from '../User/infrastructure/persistence/user-account.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    EmployeeOrmEntity, AccessRoleOrmEntity, AccessAssignmentOrmEntity, AccessSecurityPolicyOrmEntity,
    AccessSodRuleOrmEntity, AccessDelegationOrmEntity, AccessElevationOrmEntity, AccessReviewOrmEntity,
    AccessDecisionEvidenceOrmEntity, AccessFieldRuleOrmEntity, AccessPermissionOrmEntity,
    AccessRolePermissionOrmEntity, AccessSodExceptionOrmEntity, AccessLoginAttemptOrmEntity,
    AccessSessionOrmEntity, EmployeeAccountOrmEntity,
  ])],
  controllers: [AccessControlController],
  providers: [AccessControlService, AccessControlGuard, EmployeeAuthGuard, SessionTokenService],
  exports: [AccessControlService, AccessControlGuard, EmployeeAuthGuard, SessionTokenService],
})
export class AccessControlModule {}
