import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ActivateCompanyUseCase } from '../application/use-cases/activate-company.use-case';
import { CreateCompanyUseCase } from '../application/use-cases/create-company.use-case';
import { SuspendCompanyUseCase } from '../application/use-cases/suspend-company.use-case';
import { CreateCompanyRequest } from './dto/company.requests';

@Controller('companies')
export class CompanyController {
  constructor(
    private readonly createCompany: CreateCompanyUseCase,
    private readonly activate: ActivateCompanyUseCase,
    private readonly suspend: SuspendCompanyUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateCompanyRequest) {
    return this.createCompany.execute(dto);
  }

  @Post(':id/activate')
  @HttpCode(204)
  async activateCompany(@Param('id', ParseUUIDPipe) id: string) {
    await this.activate.execute({ companyId: id });
  }

  @Post(':id/suspend')
  @HttpCode(204)
  async suspendCompany(@Param('id', ParseUUIDPipe) id: string) {
    await this.suspend.execute({ companyId: id });
  }
}
