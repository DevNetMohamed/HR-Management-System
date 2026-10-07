import { Inject, Injectable } from "@nestjs/common";
import { EMPLOYEE_BANK_ACCOUNT_REPOSITORY, type EmployeeBankAccountRepository } from "../../../domain/employee-bank-accounts/repositories/employee-bank-account.repository";
import { EmployeeGuard } from "../../services/employee-guard";
import { CreateBankAccountInput, EmployeeBankAccountProps } from "src/modules/Employee/domain/employee-bank-accounts/entities/employee-bank-account.entity";
import { ConflictError, NotFoundError, ValidationError } from "../../errors";
import { EmployeeBankAccount } from "src/modules/Employee/domain/employee-bank-accounts/entities/employee-bank-account.class";


const MAX_ACCOUNTS = 3
type Scope = { companyId: string; employeeId: string; id: string };

@Injectable()
export class EmployeeBankAccountUseCases {
    constructor(
        @Inject(EMPLOYEE_BANK_ACCOUNT_REPOSITORY)
        private readonly account: EmployeeBankAccountRepository,
        private readonly employees: EmployeeGuard,
    ){}

    private async assertIbanFree(a: EmployeeBankAccount) {
        const { companyId, employeeId, iban } = a.snapshot;
        if (await this.account.existsIban(companyId, employeeId, iban, a.id))
        {
            throw new ConflictError('This IBAN is already registered for the employee');
        }
    }

    private async load({ companyId, employeeId, id }: Scope) {
        const account = await this.account.findById(companyId, id);
        if (!account || account.employeeId !== employeeId) 
        {        
            throw new NotFoundError('Bank account not found');
        }
        return account;
    }

    async add(cmd: Omit<CreateBankAccountInput, 'isPrimary'> & {isPrimary?: boolean})
    {
        await this.employees.assertEditable(cmd.companyId, cmd.employeeId)
        const count = await this.account.countByEmployee(cmd.companyId, cmd.employeeId);
        if(count >= MAX_ACCOUNTS)
        {
            throw new ValidationError(`An employee can have at most ${MAX_ACCOUNTS} bank accounts`)
        }

        const account = EmployeeBankAccount.create({...cmd, isPrimary: count === 0? true: (cmd.isPrimary ?? false)});
        await this.assertIbanFree(account);

        await this.account.save(account);
        return {
            id: account.id
        }
    }

    async update(cmd: Scope & Partial<Pick<EmployeeBankAccountProps, 'bankName' | 'iban' | 'accountNumber'>>)
    {
        const {companyId, employeeId, id, ...patch} = cmd;
        await this.employees.assertEditable(companyId, employeeId);

        const account = await this.load({companyId, employeeId, id});
        account.update(patch);
        await this.assertIbanFree(account);

        await this.account.save(account)
    }


    async setPrimary(cmd: Scope)
    {
        await this.employees.assertEditable(cmd.companyId, cmd.employeeId);
        const account = await this.load(cmd);
        if(account.snapshot.isPrimary)
            return;
        account.makePrimary();
        await this.account.save(account);
    }


    async remove(cmd: Scope){
        await this.employees.assertEditable(cmd.companyId, cmd.employeeId);
        const account = await this.load(cmd);

        if(account.snapshot.isPrimary && (await this.account.countByEmployee(cmd.companyId, cmd.employeeId)) > 1)
        {
            throw new ValidationError('Set another account as primary before deleting the primary one')
        }

        await this.account.remove(cmd.companyId, cmd.id)
    }

    async reveal(cmd: Scope)
    {
        await this.employees.assertEditable(cmd.companyId, cmd.employeeId);
        const {bankName, iban, accountNumber} = (await this.load(cmd)).snapshot;
        // TODO(audit_logs)
        return {
            bankName,
            iban,
            accountNumber
        }
    }
}