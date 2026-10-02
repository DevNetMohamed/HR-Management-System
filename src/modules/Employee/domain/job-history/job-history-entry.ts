import { JobChangeType } from "../Employees/enums/Employee-enums";


export interface JobHistoryEntry {
    id: string;
    companyId: string;
    employeeId: string;
    departmentId: string | null;
    positionId: string | null;
    managerId: string | null;
    changeType: JobChangeType;
    effectiveDate: string;
    reason: string | null;
}

