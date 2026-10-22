import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserProviderDelivery1792050000000 implements MigrationInterface {
  name = 'UserProviderDelivery1792050000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employee_accounts" ADD COLUMN "provider_activation_sent_at" TIMESTAMP WITH TIME ZONE`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employee_accounts" DROP COLUMN "provider_activation_sent_at"`);
  }
}
