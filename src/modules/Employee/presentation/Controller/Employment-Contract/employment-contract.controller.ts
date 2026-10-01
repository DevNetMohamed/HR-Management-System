import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  CONTRACT_QUERIES,
  type ContractQueries,
} from 'src/modules/Employee/application/queries/contract.queries';
import { EmploymentContractUseCases } from 'src/modules/Employee/application/use-cases/Contract-UseCase/employment-contract.use-cases';
import { CurrentCompany } from '../../current-company.decorator';
import {
  AttachDocumentRequest,
  CreateContractRequest,
  TerminateContractRequest,
  UpdateContractRequest,
} from '../../dto/Contract-employee/contract.requests';

@Controller('employees/:employeeId/contracts')
export class EmploymentContractController {
  constructor(
    private readonly useCases: EmploymentContractUseCases,
    @Inject(CONTRACT_QUERIES) private readonly queries: ContractQueries,
  ) {}

  @Post()
  create(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: CreateContractRequest,
  ) {
    return this.useCases.create({ companyId, employeeId, ...dto });
  }

  @Get()
  list(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.queries.listByEmployee(companyId, employeeId);
  }

  @Patch(':id')
  @HttpCode(204)
  update(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractRequest,
  ) {
    return this.useCases.updateTerms({ companyId, employeeId, id, ...dto });
  }

  @Put(':id/document')
  @HttpCode(204)
  attachDocument(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachDocumentRequest,
  ) {
    return this.useCases.attachDocument({
      companyId,
      employeeId,
      id,
      documentUrl: dto.documentUrl,
    });
  }

  @Post(':id/activate')
  @HttpCode(204)
  activate(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.useCases.activate({ companyId, employeeId, id });
  }

  @Post(':id/terminate')
  @HttpCode(204)
  terminate(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TerminateContractRequest,
  ) {
    return this.useCases.terminate({
      companyId,
      employeeId,
      id,
      terminationDate: dto.terminationDate,
      reason: dto.reason,
    });
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
