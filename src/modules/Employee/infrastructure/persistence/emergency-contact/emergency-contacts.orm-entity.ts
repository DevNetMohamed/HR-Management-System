import { Column, Entity, PrimaryColumn } from "typeorm";
import { AuditedOrmEntity } from "../../audited.orm-entity";



@Entity('emergency_contacts')
export class emergency_contacts extends AuditedOrmEntity{
    @PrimaryColumn('uuid') id: string;
    @Column('uuid') companyId: string;
    @Column('uuid') employeeId: string;
    @Column({type: 'varchar', nullable: true}) name: string;
    @Column({type: 'varchar', nullable: true}) relationship: string;
    @Column({type: 'varchar', nullable: true}) phone: string;
}