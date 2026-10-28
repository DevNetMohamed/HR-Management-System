import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  EMPLOYEE_DOCUMENT_QUERIES,
  type EmployeeDocumentQueries,
} from 'src/modules/Employee/application/queries/employee-document.queries';
import { EmployeeDocumentUseCases } from 'src/modules/Employee/application/use-cases/employee-document/employee-document.use-cases';
import { CurrentCompany } from '../../decorators/current-company.decorator';
import {
  AddDocumentRequest,
  ReplaceDocumentFileRequest,
  RequestUploadRequest,
  UpdateDocumentDatesRequest,
} from 'src/modules/Employee/application/dto/employee-document/employee-document.requests';
import { todayIn } from 'src/modules/Employee/domain/value-objects/iso-date';
import { CurrentUserId } from '../../decorators/current-user.decorator';

@Controller('employees/:employeeId/documents')
export class EmployeeDocumentController {
  constructor(
    private readonly useCases: EmployeeDocumentUseCases,
    @Inject(EMPLOYEE_DOCUMENT_QUERIES)
    private readonly queries: EmployeeDocumentQueries,
  ) {}

  @Post('uploads')
  requestUpload(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: RequestUploadRequest,
  ) {
    return this.useCases.requestUpload({ companyId, employeeId, ...dto });
  }

  @Post()
  add(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: AddDocumentRequest,
  ) {
    return this.useCases.add({ companyId, employeeId, ...dto });
  }

  @Get()
  list(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.queries.listByEmployee(
      companyId,
      employeeId,
      todayIn('Africa/Cairo'),
    );
  }

  @Patch(':id')
  @HttpCode(204)
  updateDates(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDatesRequest,
  ) {
    return this.useCases.updateDates({ companyId, employeeId, id, ...dto });
  }

  @Put(':id/file')
  @HttpCode(204)
  replaceFile(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceDocumentFileRequest,
  ) {
    return this.useCases.replaceFile({ companyId, employeeId, id, ...dto });
  }

  @Get(':id/download-url')
  @Header('Cache-Control', 'no-store')
  downloadUrl(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.useCases.downloadUrl({ companyId, employeeId, id });
  }

  @Post(':id/verify')
  @HttpCode(204)
  verify(
    @CurrentCompany() companyId: string,
    @CurrentUserId() actorUserId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.useCases.verify({ companyId, employeeId, id, actorUserId });
  }

  @Post(':id/unverify')
  @HttpCode(204)
  unverify(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.useCases.revokeVerification({ companyId, employeeId, id });
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.useCases.remove({ companyId, employeeId, id });
  }
}
