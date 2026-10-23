import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlModule } from '../AccessControl/access-control.module';
import { EmployeeAccountOrmEntity } from './infrastructure/persistence/user-account.orm-entity';
import { EmployeePasswordRecoveryOrmEntity } from './infrastructure/persistence/user-password-recovery.orm-entity';
import { EmployeeOrmEntity } from '../Employee/infrastructure/persistence/employee/employee.orm-entity';
import { EmployeeInvitationService } from '../Employee/application/services/employee-invitation.service';
import { EmployeePasswordRecoveryService } from '../Employee/application/services/employee-password-recovery.service';
import { EmployeeMfaService } from '../Employee/application/services/employee-mfa.service';
import { TotpService } from '../Employee/application/services/totp.service';
import { PasswordHasher } from '../Employee/application/services/password-hasher';
import { AuthenticateEmployeeUseCase } from '../Employee/application/use-cases/employee/authenticate-employee.use-case';
import { AcceptEmployeeInvitationUseCase } from '../Employee/application/use-cases/employee/accept-employee-invitation.use-case';
import { AuthController } from './presentation/auth.controller';
import { GoogleLoginChallengeOrmEntity } from './infrastructure/persistence/google-login-challenge.orm-entity';
import { GoogleLoginUseCase } from './application/use-cases/google-login.use-case';
import { UserEmailService } from './application/services/user-email.service';
import { ChangeHrmsPasswordUseCase } from './application/use-cases/change-hrms-password.use-case';

@Module({
  imports: [
    AccessControlModule,
    TypeOrmModule.forFeature([
      EmployeeAccountOrmEntity,
      EmployeePasswordRecoveryOrmEntity,
      EmployeeOrmEntity,
      GoogleLoginChallengeOrmEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    EmployeeInvitationService,
    EmployeePasswordRecoveryService,
    EmployeeMfaService,
    TotpService,
    PasswordHasher,
    AuthenticateEmployeeUseCase,
    AcceptEmployeeInvitationUseCase,
    GoogleLoginUseCase,
    UserEmailService,
    ChangeHrmsPasswordUseCase,
  ],
  exports: [EmployeeInvitationService, UserEmailService],
})
export class UserModule {}
