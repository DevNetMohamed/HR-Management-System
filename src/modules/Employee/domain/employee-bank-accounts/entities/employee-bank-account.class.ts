import { randomUUID } from "crypto";
import { CreateBankAccountInput, Editable, EmployeeBankAccountProps, normalize } from "./employee-bank-account.entity";
import { Iban } from "../value-objects/iban.vo";

export class EmployeeBankAccount{
    private constructor(private props: EmployeeBankAccountProps){}

    static create(i:CreateBankAccountInput): EmployeeBankAccount
    {
        return new EmployeeBankAccount({
            id: randomUUID(),
            companyId: i.companyId,
            employeeId: i.employeeId,
            ...normalize({iban: i.iban, bankName: i.bankName, accountNumber: i.accountNumber ?? null }),
            isPrimary: i.isPrimary ?? false,
        });
    }

    static restore(props: EmployeeBankAccountProps): EmployeeBankAccount
    {
        return new EmployeeBankAccount(props)
    }

    update(patch: Partial<Editable>)
    {
        const defined = Object.fromEntries(Object.entries(patch).filter(([, v])=> v !== undefined));
        Object.assign(this.props, normalize({...this.props, ...defined} as Editable))
    }

    makePrimary()
    {
        this.props.isPrimary = true;
    }
    
    get id() { return this.props.id; }
    get companyId() { return this.props.companyId; }
    get employeeId() { return this.props.employeeId; }
    get maskedIban() { return Iban.mask(this.props.iban); }
    
    get snapshot(): Readonly<EmployeeBankAccountProps> { return { ...this.props }; }

    toJSON() { return { id: this.props.id, bankName: this.props.bankName, iban: this.maskedIban }; }
}