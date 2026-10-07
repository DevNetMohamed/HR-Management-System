import { DomainError } from "src/common/domain-error/DomainError.base";
import { Iban } from "../value-objects/iban.vo";

export interface EmployeeBankAccountProps {
    id: string;
    companyId: string;
    employeeId: string;
    bankName: string;
    iban: string;
    accountNumber: string | null;
    isPrimary: boolean;
}
export type Editable = Pick<EmployeeBankAccountProps, 'bankName'| 'iban' | 'accountNumber'>;
const fail = (message: string, code: string) => new DomainError(message, code);

export function normalize(i: Editable) : Editable
{
    const bankName = i.bankName.trim();
    if(!bankName)
    {
        throw fail('Bank name is required', 'BANK_NAME_REQUIRED')
    };

    if(bankName.length > 150)
    {
        throw fail('Bank name is too long', 'BANK_NAME_TOO_LONG')
    }
    const iban = Iban.create(i.iban).masked;

    let accountNumber: string | null = null;

    if(i.accountNumber != null && i.accountNumber.trim())
    {
        accountNumber = i.accountNumber.replace(/\s+/g, '');
        
        if(!/^[A-Za-z0-9-]{4,34}$/.test(accountNumber))
        {
            throw fail('Invalid account number', 'BANK_INVALID_ACCOUNT_NUMBER')
        }
    }

    return { bankName, iban, accountNumber };
}


export type CreateBankAccountInput =
  Pick<EmployeeBankAccountProps, 'companyId' | 'employeeId' | 'bankName' | 'iban'> &
  { accountNumber?: string | null; isPrimary?: boolean };
