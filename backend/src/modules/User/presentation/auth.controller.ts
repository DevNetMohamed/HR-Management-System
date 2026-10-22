import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, IsUUID, MinLength, MaxLength, IsOptional, Matches, IsUrl } from 'class-validator';
import { AuthenticateEmployeeUseCase } from '../../Employee/application/use-cases/employee/authenticate-employee.use-case';
import { AcceptEmployeeInvitationUseCase } from '../../Employee/application/use-cases/employee/accept-employee-invitation.use-case';
import { EmployeeMfaService } from '../../Employee/application/services/employee-mfa.service';
import { EmployeeAuthGuard } from '../../Employee/application/services/employee-auth.guard';
import { AccessControlService } from '../../AccessControl/application/access-control.service';
import { EmployeeAccountOrmEntity } from '../infrastructure/persistence/user-account.orm-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { timingSafeEqual } from 'crypto';
import { EmployeePasswordRecoveryService } from '../../Employee/application/services/employee-password-recovery.service';
import { EmployeeInvitationService } from '../../Employee/application/services/employee-invitation.service';
import { GoogleLoginUseCase } from '../application/use-cases/google-login.use-case';
import { UserEmailService } from '../application/services/user-email.service';
import { EmployeeOrmEntity } from '../../Employee/infrastructure/persistence/employee/employee.orm-entity';
import { ChangeHrmsPasswordUseCase } from '../application/use-cases/change-hrms-password.use-case';

class LoginRequest {
  @IsUUID() companyId: string;
  @IsEmail() email: string;
  @IsString() @MinLength(12) @MaxLength(128) password: string;
  @IsOptional() @Matches(/^\d{6}$/) mfaCode?: string;
}

class AcceptInvitationRequest {
  @IsString() @MinLength(64) @MaxLength(64) token: string;
  @IsString() @MinLength(12) @MaxLength(128) password: string;
}
class MfaCodeRequest { @Matches(/^\d{6}$/) code: string; }
class ProviderEmailActivationRequest { @IsUUID() companyId: string; @IsUUID() employeeId: string; @IsEmail() companyEmail: string; }
class RecoveryRequest { @IsUUID() companyId: string; @IsEmail() email: string; }
class ActivationResendRequest { @IsUUID() companyId: string; @IsEmail() email: string; }
class CompleteRecoveryRequest { @IsString() @MinLength(64) @MaxLength(64) token: string; @IsString() @MinLength(12) @MaxLength(128) password: string; }
class GoogleChallengeRequest { @IsUUID() companyId: string; }
class GoogleLoginRequest { @IsUUID() companyId: string; @IsString() idToken: string; @IsString() @MinLength(32) nonce: string; @IsOptional() @Matches(/^\d{6}$/) mfaCode?: string; }
class ProviderActivationEmailRequest { @IsUUID() companyId: string; @IsUUID() employeeId: string; @IsUrl({ protocols: ['https'], require_protocol: true }) providerActivationUrl: string; }
class ChangePasswordRequest { @IsString() @MinLength(1) @MaxLength(128) currentPassword: string; @IsString() @MinLength(12) @MaxLength(128) newPassword: string; }

@Controller('auth')
export class AuthController {
  constructor(private readonly login: AuthenticateEmployeeUseCase, private readonly acceptInvitation: AcceptEmployeeInvitationUseCase, private readonly mfa: EmployeeMfaService, private readonly access: AccessControlService, private readonly recovery: EmployeePasswordRecoveryService, private readonly invitations: EmployeeInvitationService, private readonly google: GoogleLoginUseCase, private readonly email: UserEmailService, private readonly changePassword: ChangeHrmsPasswordUseCase, @InjectRepository(EmployeeAccountOrmEntity) private readonly accounts: Repository<EmployeeAccountOrmEntity>, @InjectRepository(EmployeeOrmEntity) private readonly employees: Repository<EmployeeOrmEntity>) {}
  @Get('me') @UseGuards(EmployeeAuthGuard)
  async currentUser(@Req() req: any) {
    const [account, employee] = await Promise.all([
      this.accounts.findOne({ where: { companyId: req.user.companyId, employeeId: req.user.employeeId } }),
      this.employees.findOne({ where: { companyId: req.user.companyId, id: req.user.employeeId } }),
    ]);
    if (!account || !employee) throw new UnauthorizedException();
    return {
      id: account.id,
      employeeId: account.employeeId,
      companyId: account.companyId,
      email: account.email,
      personalEmail: account.personalEmail,
      companyEmail: account.companyEmail,
      accountStatus: account.accountStatus,
      companyEmailStatus: account.companyEmailStatus,
      activatedAt: account.activatedAt,
      mfaEnabled: account.mfaEnabled,
      employee: {
        firstName: employee.firstName, lastName: employee.lastName,
        employeeNumber: employee.employeeNumber, status: employee.status,
        departmentId: employee.departmentId, positionId: employee.positionId,
        profilePhotoUrl: employee.profilePhotoUrl,
      },
    };
  }
  @Post('login')
  signIn(@Body() request: LoginRequest, @Req() req: any) { return this.login.execute(request.companyId, request.email, request.password, req.ip, request.mfaCode); }
  @Post('accept-invitation')
  setPassword(@Body() request: AcceptInvitationRequest) { return this.acceptInvitation.execute(request.token, request.password); }
  @Post('activation/resend')
  resendActivation(@Body() request: ActivationResendRequest) { return this.invitations.resendHrmsActivation(request.companyId, request.email); }
  @Post('company-email/provider-confirmation')
  async confirmCompanyEmail(@Body() request: ProviderEmailActivationRequest, @Headers('x-mail-provider-secret') secret?: string) {
    this.assertProviderSecret(secret);
    const account = await this.accounts.findOne({ where: { companyId: request.companyId, employeeId: request.employeeId } });
    if (!account || !account.companyEmail || account.companyEmail !== request.companyEmail.trim().toLowerCase()) throw new UnauthorizedException('Provider confirmation does not match assigned company email');
    const duplicate = await this.accounts.findOne({ where: { companyId: request.companyId, email: account.companyEmail } });
    if (duplicate && duplicate.employeeId !== account.employeeId) throw new UnauthorizedException('Company email is assigned to another account');
    const activated = await this.accounts.update(
      { id: account.id, accountStatus: 'PENDING_ACTIVATION', companyEmailStatus: 'PENDING' },
      { email: account.companyEmail, companyEmailStatus: 'ACTIVE' },
    );
    if (activated.affected) {
      const confirmedAccount = await this.accounts.findOneByOrFail({ id: account.id });
      await this.invitations.issueHrmsActivation(confirmedAccount);
    }
    const finalAccount = activated.affected ? null : await this.accounts.findOneByOrFail({ id: account.id });
    return { companyEmailStatus: activated.affected ? 'ACTIVE' : finalAccount!.companyEmailStatus };
  }
  @Post('company-email/send-provider-activation')
  async sendProviderActivation(@Body() request: ProviderActivationEmailRequest, @Headers('x-mail-provider-secret') secret?: string) {
    this.assertProviderSecret(secret);
    const account = await this.accounts.findOne({ where: { companyId: request.companyId, employeeId: request.employeeId } });
    if (!account?.personalEmail || !account.companyEmail || account.accountStatus !== 'PENDING_ACTIVATION' || account.companyEmailStatus !== 'PENDING') throw new UnauthorizedException('Company email activation is not pending');
    const url = new URL(request.providerActivationUrl);
    const allowedHosts = (process.env.MAIL_PROVIDER_ACTIVATION_HOSTS ?? '').split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowedHosts.includes(url.hostname.toLowerCase())) {
      throw new UnauthorizedException('Provider activation link host is not approved');
    }
    const sent = await this.accounts.createQueryBuilder().update().set({ providerActivationSentAt: new Date() })
      .where('id = :id AND account_status = :status AND company_email_status = :emailStatus', {
        id: account.id, status: 'PENDING_ACTIVATION', emailStatus: 'PENDING',
      })
      .andWhere('(provider_activation_sent_at IS NULL OR provider_activation_sent_at <= NOW() - INTERVAL \'60 seconds\')')
      .execute();
    if (!sent.affected) throw new HttpException('Company email activation instructions were recently sent', HttpStatus.TOO_MANY_REQUESTS);
    await this.email.sendCompanyMailboxActivation(account.personalEmail, url.toString());
    return { message: 'Company mailbox activation instructions sent' };
  }
  @Post('password-recovery')
  requestPasswordRecovery(@Body() request: RecoveryRequest) { return this.recovery.request(request.companyId, request.email); }
  @Post('password-recovery/complete')
  completePasswordRecovery(@Body() request: CompleteRecoveryRequest) { return this.recovery.complete(request.token, request.password); }
  @Post('google/challenge')
  googleChallenge(@Body() request: GoogleChallengeRequest) { return this.google.createChallenge(request.companyId); }
  @Post('google')
  googleLogin(@Body() request: GoogleLoginRequest, @Req() req: any) { return this.google.execute(request.companyId, request.idToken, request.nonce, req.ip, request.mfaCode); }
  @Post('mfa/enrollment') @UseGuards(EmployeeAuthGuard)
  beginMfa(@Req() req: any) { return this.mfa.begin(req.user.companyId, req.user.employeeId); }
  @Post('mfa/confirm') @UseGuards(EmployeeAuthGuard)
  confirmMfa(@Req() req: any, @Body() request: MfaCodeRequest) { return this.mfa.confirm(req.user.companyId, req.user.employeeId, request.code, req.ip); }
  @Post('logout') @UseGuards(EmployeeAuthGuard)
  logout(@Req() req: any) { return this.access.revokeSession(req.user.companyId, req.user.employeeId, req.user.jti); }
  @Post('password/change') @UseGuards(EmployeeAuthGuard)
  changeHrmsPassword(@Req() req: any, @Body() request: ChangePasswordRequest) {
    return this.changePassword.execute(req.user.companyId, req.user.employeeId, request.currentPassword, request.newPassword);
  }

  private assertProviderSecret(secret?: string) {
    const expected = process.env.MAIL_PROVIDER_CALLBACK_SECRET;
    if (!expected || expected.length < 32 || !secret || Buffer.byteLength(secret) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))) throw new UnauthorizedException();
  }
}
