import { Injectable } from "@nestjs/common";
import { FieldCipher } from "src/infrastructure/security/field-cipher";
import { EmployeeBankAccountOrmEntity } from "./employee-bank-account.orm-entity";
import { EmployeeBankAccount } from "../../../domain/employee-bank-accounts/entities/employee-bank-account.class";
import { EmployeeBankAccountProps } from "src/modules/Employee/domain/employee-bank-accounts/entities/employee-bank-account.entity";
import { Iban } from "src/modules/Employee/domain/employee-bank-accounts/value-objects/iban.vo";


@Injectable()
export class EmployeeBankAccountMapper {
    constructor(private readonly cipher: FieldCipher){}

    toDomain(orm: EmployeeBankAccountOrmEntity): EmployeeBankAccount
    {
        return EmployeeBankAccount.restore({
            id: orm.id,
            companyId: orm.companyId,
            employeeId: orm.employeeId,
            bankName: orm.bankName,
            iban: this.cipher.decrypt(orm.ibanEncrypted),
            accountNumber: orm.accountNumberEncrypted ? this.cipher.decrypt(orm.accountNumberEncrypted) : null,
            isPrimary: orm.isPrimary
        });
    }

    toOrm(Prop: Readonly<EmployeeBankAccountProps>) : EmployeeBankAccountOrmEntity
    {
        const orm = new EmployeeBankAccountOrmEntity();
        orm.id = Prop.id;
        orm.companyId = Prop.companyId;
        orm.employeeId = Prop.employeeId;
        orm.bankName = Prop.bankName;
        orm.ibanEncrypted = this.cipher.encrypt(Prop.iban);
        orm.ibanHash = this.cipher.hash(Prop.iban);
        orm.ibanMasked = Iban.mask(Prop.iban);
        orm.accountNumberEncrypted = Prop.accountNumber ? this.cipher.encrypt(Prop.accountNumber) : null;
        orm.isPrimary = Prop.isPrimary;

        return orm;
    }
}