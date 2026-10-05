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
} from '@nestjs/common';
import {
  EMERGENCY_CONTACT_QUERIES,
  type EmergencyContactQueries,
} from 'src/modules/Employee/application/queries/emergency-contact.queries';
import { EmergencyContactUseCases } from 'src/modules/Employee/application/use-cases/emergency-contact/emergency-contact.use-cases';
import { CurrentCompany } from '../../decorators/current-company.decorator';
import {
  AddEmergencyContactRequest,
  UpdateEmergencyContactRequest,
} from 'src/modules/Employee/application/dto/emergency-contact/emergency-contact.requests';

@Controller('employees/:employeeId/emergency-contacts')
export class EmergencyContactController {
  constructor(
    private readonly useCases: EmergencyContactUseCases,
    @Inject(EMERGENCY_CONTACT_QUERIES)
    private readonly queries: EmergencyContactQueries,
  ) {}

  @Post()
  add(
    @CurrentCompany() companyId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: AddEmergencyContactRequest,
  ) {
    return this.useCases.add({ companyId, employeeId, ...dto });
  }

  @Get()
  async list(
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
    @Body() dto: UpdateEmergencyContactRequest,
  ) {
    return this.useCases.update({ companyId, employeeId, id, ...dto });
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
