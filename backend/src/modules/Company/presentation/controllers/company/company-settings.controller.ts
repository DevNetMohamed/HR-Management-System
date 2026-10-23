import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AccessControlGuard } from '../../../../AccessControl/application/access-control.guard';
import { EmployeeAuthGuard } from '../../../../Employee/application/services/employee-auth.guard';
import { RequireAccess } from '../../../../AccessControl/presentation/require-access.decorator';
import { CompanySettingsService } from '../../../application/company-settings.service';
import { NotificationRuleRequest, PublishCompanyConfigurationRequest, SaveCompanySetupDraftRequest, UpdateNotificationRuleRequest } from '../../../application/dto/company/company-settings.requests';

@Controller('company-settings')
@UseGuards(EmployeeAuthGuard, AccessControlGuard)
@RequireAccess('access.roles.manage')
export class CompanySettingsController {
  constructor(private readonly settings: CompanySettingsService) {}

  @Get('notifications') listNotifications(@Req() req: any) { return this.settings.listRules(req.user.companyId); }
  @Post('notifications') createNotification(@Req() req: any, @Body() body: NotificationRuleRequest) { return this.settings.createRule(req.user.companyId, req.user.employeeId, body); }
  @Patch('notifications/:ruleId') updateNotification(@Req() req: any, @Param('ruleId', ParseUUIDPipe) id: string, @Body() body: UpdateNotificationRuleRequest) { return this.settings.updateRule(req.user.companyId, req.user.employeeId, id, body); }
  @Post('notifications/:ruleId/duplicate') duplicateNotification(@Req() req: any, @Param('ruleId', ParseUUIDPipe) id: string) { return this.settings.duplicateRule(req.user.companyId, req.user.employeeId, id); }
  @Delete('notifications/:ruleId') disableNotification(@Req() req: any, @Param('ruleId', ParseUUIDPipe) id: string) { return this.settings.disableRule(req.user.companyId, id); }
  @Post('notifications/:ruleId/test') testNotification(@Req() req: any, @Param('ruleId', ParseUUIDPipe) id: string) { return this.settings.testRule(req.user.companyId, req.user.employeeId, id); }
  @Get('draft') getDraft(@Req() req: any) { return this.settings.getDraft(req.user.companyId); }
  @Put('draft') saveDraft(@Req() req: any, @Body() body: SaveCompanySetupDraftRequest) { return this.settings.saveDraft(req.user.companyId, req.user.employeeId, body); }
  @Get('review') review(@Req() req: any) { return this.settings.review(req.user.companyId); }
  @Post('publish') publish(@Req() req: any, @Body() body: PublishCompanyConfigurationRequest) { return this.settings.publish(req.user.companyId, req.user.employeeId, body); }
  @Get('versions') listVersions(@Req() req: any) { return this.settings.listVersions(req.user.companyId); }
  @Get('versions/:version') getVersion(@Req() req: any, @Param('version', ParseIntPipe) version: number) { return this.settings.getVersion(req.user.companyId, version); }
}
