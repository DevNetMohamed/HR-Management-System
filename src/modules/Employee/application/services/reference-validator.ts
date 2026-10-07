import { Inject, Injectable } from '@nestjs/common';
import {
    EMPLOYEE_REPOSITORY,
    type EmployeeRepository,
} from '../../domain/Employees/repositories/employee.repository';
import { EmployeeStatus } from '../../domain/Employees/Enums/Employee-enums';
import {
    ORGANIZATION_GATEWAY,
    type OrganizationGateway,
} from '../ports/organization.gateway';
import { ValidationError } from '../errors';

@Injectable()
export class ReferenceValidator {
    constructor(
        @Inject(ORGANIZATION_GATEWAY) private readonly org: OrganizationGateway,
        @Inject(EMPLOYEE_REPOSITORY) private readonly employees: EmployeeRepository,
    ) { }

    async validate(
        companyId: string,
        r: {
            departmentId?: string | null;
            positionId?: string | null;
            branchId?: string | null;
            managerId?: string | null;
        },
    ) {
        if (
            r.departmentId &&
            !(await this.org.departmentExists(companyId, r.departmentId))
        )
            throw new ValidationError('Department not found');
        if (
            r.positionId &&
            !(await this.org.positionExists(companyId, r.positionId))
        )
            throw new ValidationError('Position not found');
        if (r.branchId && !(await this.org.branchExists(companyId, r.branchId)))
            throw new ValidationError('Branch not found');
        if (r.managerId) {
            const m = await this.employees.findById(companyId, r.managerId);
            if (!m || m.status === EmployeeStatus.TERMINATED)
                throw new ValidationError('Manager not found or terminated');
        }
    }
}
