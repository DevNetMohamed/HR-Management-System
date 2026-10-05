import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EmergencyContactRepository } from "src/modules/Employee/domain/emergency-contact/repositories/emergency-contact.repository";
import { EmergencyContactOrmEntity } from "./emergency-contacts.orm-entity";
import { Not, QueryFailedError, Repository } from "typeorm";
import { EmergencyContact } from "src/modules/Employee/domain/emergency-contact/entities/emergency-contact.entity";
import { EmergencyContactMapper } from "./emergency-contact.mapper";
import { ConflictError } from "src/modules/Employee/application/errors";

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class TypeOrmEmergencyContactRepository implements EmergencyContactRepository{
    constructor(
        @InjectRepository(EmergencyContactOrmEntity)
        private readonly orm: Repository<EmergencyContactOrmEntity>
    ){}

    async findById(companyId: string, id: string): Promise<EmergencyContact | null> {
        const row = await this.orm.findOne({
            where: {companyId, id}
        });

        return row ? EmergencyContactMapper.toDomain(row) : null;
    }

    async save(contact: EmergencyContact): Promise<void> {
        try {
          await this.orm.save(EmergencyContactMapper.toOrm(contact.snapshot))  
        } catch (error) {
            if(error instanceof QueryFailedError && (error as any).driverError?.code === UNIQUE_VIOLATION){
                throw new ConflictError('This phone number is already registered for the employee')
            }
            throw error;
        }
    }

    async remove(companyId: string, id: string): Promise<void> {
        await this.orm.softDelete({companyId, id})
    }

    existsPhone(companyId: string, employeeId: string, phone: string, excludeId?: string): Promise<boolean> {
        return this.orm.exists({
            where: {companyId, employeeId, phone, ...(excludeId? {id: Not(excludeId)} : {}) },
        });
    }

    countByEmployee(companyId: string, employeeId: string): Promise<number> {
        return this.orm.count({ where: { companyId, employeeId } });
    }

}