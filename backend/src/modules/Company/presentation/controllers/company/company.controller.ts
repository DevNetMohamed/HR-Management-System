import { Body, Controller, Post } from '@nestjs/common';
import { CreateCompanyUseCase } from '../../../application/use-cases/create-company.use-case';
import { CreateCompanyRequest } from '../../../application/dto/company/company.requests';

@Controller('companies')
export class CompanyController {
  constructor(private readonly createCompany: CreateCompanyUseCase) {}

  @Post()
  create(@Body() request: CreateCompanyRequest) {
    return this.createCompany.execute(request);
  }
}