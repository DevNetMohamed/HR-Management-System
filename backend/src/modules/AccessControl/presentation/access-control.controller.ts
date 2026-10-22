import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { EmployeeAuthGuard } from '../../Employee/application/services/employee-auth.guard';
import { AccessControlGuard } from '../application/access-control.guard';
import { AccessControlService, ACCESS_PERMISSIONS, ACCESS_SCOPES } from '../application/access-control.service';
import { RequireAccess } from './require-access.decorator';

class BootstrapRequest { @IsString() @MinLength(32) key: string; }
class CreateRoleRequest {
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(3) purpose: string;
  @IsArray() @IsString({ each: true }) permissionKeys: string[];
  @IsOptional() @IsBoolean() defaultForNewHires?: boolean;
  @IsOptional() @IsIn([...ACCESS_SCOPES]) defaultScopeType?: string;
  @IsOptional() @IsBoolean() highRisk?: boolean;
}
class AssignRoleRequest {
  @IsUUID() employeeId: string;
  @IsUUID() roleId: string;
  @IsIn([...ACCESS_SCOPES]) scopeType: string;
  @IsOptional() @IsUUID() scopeId?: string;
  @IsOptional() @IsDateString() effectiveFrom?: string;
  @IsOptional() @IsDateString() effectiveUntil?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsDateString() exceptionExpiresAt?: string;
}
class RevokeAssignmentRequest { @IsDateString() effectiveAt: string; }
class PolicyRequest {
  @IsOptional() @IsInt() @Min(12) @Max(128) minPasswordLength?: number;
  @IsOptional() @IsBoolean() mfaRequired?: boolean;
  @IsOptional() @IsBoolean() mfaForHighRisk?: boolean;
  @IsOptional() @IsInt() @Min(5) @Max(480) sessionMinutes?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) allowedNetworks?: string[];
  @IsOptional() @IsInt() @Min(3) @Max(10) maxFailedAttempts?: number;
  @IsOptional() @IsInt() @Min(5) @Max(1440) lockoutMinutes?: number;
  @IsOptional() @IsIn(['immediate', 'scheduled']) terminationRevocation?: string;
}
class SodRuleRequest {
  @IsIn([...ACCESS_PERMISSIONS]) permissionA: string;
  @IsIn([...ACCESS_PERMISSIONS]) permissionB: string;
  @IsBoolean() critical: boolean;
}
class DelegationRequest {
  @IsUUID() delegateId: string;
  @IsArray() @IsIn([...ACCESS_PERMISSIONS], { each: true }) permissionKeys: string[];
  @IsIn([...ACCESS_SCOPES]) scopeType: string;
  @IsOptional() @IsUUID() scopeId?: string;
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
  @IsString() @MinLength(5) reason: string;
}
class ElevationRequest {
  @IsArray() @IsIn([...ACCESS_PERMISSIONS], { each: true }) permissionKeys: string[];
  @IsIn([...ACCESS_SCOPES]) scopeType: string;
  @IsOptional() @IsUUID() scopeId?: string;
  @IsString() @MinLength(10) purpose: string;
  @IsDateString() expiresAt: string;
}
class ReviewRequest { @IsUUID() employeeId: string; @IsDateString() dueAt: string; }
class ReviewDecisionRequest {
  @IsIn(['keep', 'remove', 'investigate']) decision: string;
  @IsString() @MinLength(3) reason: string;
}
class FieldRuleRequest {
  @IsUUID() roleId: string;
  @IsString() @MinLength(2) fieldKey: string;
  @IsIn(['hidden', 'masked', 'readonly', 'editable']) behavior: string;
  @IsString() @MinLength(5) purpose: string;
}

@Controller('access-control')
@UseGuards(EmployeeAuthGuard, AccessControlGuard)
export class AccessControlController {
  constructor(private readonly access: AccessControlService) {}

  @Post('bootstrap') bootstrap(@Req() req: any, @Body() dto: BootstrapRequest) {
    return this.access.bootstrap(req.user.companyId, req.user.employeeId, dto.key);
  }
  @Get('permissions') permissions() { return { permissions: ACCESS_PERMISSIONS, scopes: ACCESS_SCOPES }; }

  @Post('roles') @RequireAccess('access.roles.manage')
  createRole(@Req() req: any, @Body() dto: CreateRoleRequest) { return this.access.createRole(req.user.companyId, dto); }
  @Get('roles') @RequireAccess('access.roles.manage')
  listRoles(@Req() req: any) { return this.access.listRoles(req.user.companyId); }
  @Patch('roles/:id/retire') @RequireAccess('access.roles.manage')
  retireRole(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.access.retireRole(req.user.companyId, id); }

  @Post('assignments') @RequireAccess('access.assignments.manage')
  assign(@Req() req: any, @Body() dto: AssignRoleRequest) { return this.access.assignRole(req.user.companyId, req.user.employeeId, dto); }
  @Patch('assignments/:id/revoke') @RequireAccess('access.assignments.manage')
  revoke(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RevokeAssignmentRequest) { return this.access.endAssignment(req.user.companyId, id, dto.effectiveAt); }
  @Get('assignments') @RequireAccess('access.assignments.manage')
  listAssignments(@Req() req: any, @Query('employeeId') employeeId?: string) { return this.access.listAssignments(req.user.companyId, employeeId); }

  @Get('policy') @RequireAccess('access.policies.manage')
  getPolicy(@Req() req: any) { return this.access.getPolicy(req.user.companyId); }
  @Patch('policy') @RequireAccess('access.policies.manage')
  setPolicy(@Req() req: any, @Body() dto: PolicyRequest) { return this.access.savePolicy(req.user.companyId, req.user.employeeId, dto); }

  @Post('field-rules') @RequireAccess('access.policies.manage')
  setFieldRule(@Req() req: any, @Body() dto: FieldRuleRequest) { return this.access.saveFieldRule(req.user.companyId, dto.roleId, dto.fieldKey, dto.behavior, dto.purpose); }

  @Post('sod-rules') @RequireAccess('access.sod.manage')
  addSodRule(@Req() req: any, @Body() dto: SodRuleRequest) { return this.access.addSodRule(req.user.companyId, dto.permissionA, dto.permissionB, dto.critical); }
  @Get('sod-rules') @RequireAccess('access.sod.manage')
  listSodRules(@Req() req: any) { return this.access.listSodRules(req.user.companyId); }
  @Post('delegations') @RequireAccess('access.delegations.manage')
  delegate(@Req() req: any, @Body() dto: DelegationRequest) { return this.access.requestDelegation(req.user.companyId, req.user.employeeId, { ...dto, scope: { type: dto.scopeType, id: dto.scopeId } }); }
  @Get('delegations') @RequireAccess('access.delegations.manage')
  listDelegations(@Req() req: any) { return this.access.listDelegations(req.user.companyId); }
  @Patch('delegations/:id/approve') @RequireAccess('access.delegations.manage')
  approveDelegation(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.access.approveDelegation(req.user.companyId, req.user.employeeId, id); }
  @Post('elevations') @RequireAccess('access.elevations.request')
  requestElevation(@Req() req: any, @Body() dto: ElevationRequest) { return this.access.requestElevation(req.user.companyId, req.user.employeeId, { ...dto, scope: { type: dto.scopeType, id: dto.scopeId } }); }
  @Get('elevations') @RequireAccess('access.elevations.approve')
  listElevations(@Req() req: any) { return this.access.listElevations(req.user.companyId); }
  @Patch('elevations/:id/approve') @RequireAccess('access.elevations.approve')
  approveElevation(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) { return this.access.approveElevation(req.user.companyId, req.user.employeeId, id); }

  @Post('reviews') @RequireAccess('access.reviews.manage')
  createReview(@Req() req: any, @Body() dto: ReviewRequest) { return this.access.createReview(req.user.companyId, req.user.employeeId, dto.employeeId, dto.dueAt); }
  @Patch('reviews/:id/decision') @RequireAccess('access.reviews.manage')
  decideReview(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewDecisionRequest) { return this.access.decideReview(req.user.companyId, req.user.employeeId, id, dto.decision, dto.reason); }
  @Get('reviews/overdue') @RequireAccess('access.reviews.manage')
  overdue(@Req() req: any) { return this.access.markOverdueReviews(req.user.companyId); }
  @Get('decisions') @RequireAccess('access.reviews.manage')
  decisions(@Req() req: any, @Query('limit') limit?: number) { return this.access.listDecisions(req.user.companyId, Number(limit) || 100); }
}
