import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompanySettingsNotificationsAndPublishing1792060000000 implements MigrationInterface {
  name = 'CompanySettingsNotificationsAndPublishing1792060000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE company_notification_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      rule_key varchar(100) NOT NULL,
      name varchar(160) NOT NULL,
      event_key varchar(100) NOT NULL,
      recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
      recipient_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
      channels jsonb NOT NULL,
      priority varchar(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal')),
      language varchar(20) NOT NULL DEFAULT 'bilingual' CHECK (language IN ('bilingual','en','ar')),
      delivery_delay_minutes integer NOT NULL DEFAULT 0 CHECK (delivery_delay_minutes BETWEEN 0 AND 10080),
      reminder_interval_minutes integer NOT NULL DEFAULT 0 CHECK (reminder_interval_minutes BETWEEN 0 AND 10080),
      max_reminders integer NOT NULL DEFAULT 0 CHECK (max_reminders BETWEEN 0 AND 20),
      quiet_hours jsonb,
      digest_option varchar(20) NOT NULL DEFAULT 'none' CHECK (digest_option IN ('none','daily')),
      escalation_path jsonb NOT NULL DEFAULT '[]'::jsonb,
      retry_attempts integer NOT NULL DEFAULT 3 CHECK (retry_attempts BETWEEN 1 AND 10),
      retry_interval_minutes integer NOT NULL DEFAULT 15 CHECK (retry_interval_minutes BETWEEN 1 AND 1440),
      fallback_channel varchar(20) CHECK (fallback_channel IS NULL OR fallback_channel IN ('in_app','email','sms','push')),
      template_subject varchar(200),
      template_body text,
      status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','disabled')),
      is_mandatory boolean NOT NULL DEFAULT false,
      created_by uuid,
      updated_by uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT company_notification_rules_key_uq UNIQUE (company_id, rule_key),
      CONSTRAINT company_notification_rules_channels_chk CHECK (jsonb_typeof(channels) = 'array' AND jsonb_array_length(channels) > 0),
      CONSTRAINT company_notification_rules_mandatory_chk CHECK (NOT is_mandatory OR status <> 'disabled')
    )`);
    await queryRunner.query(`CREATE INDEX company_notification_rules_company_status_idx ON company_notification_rules(company_id, status)`);
    await queryRunner.query(`CREATE TABLE company_setup_drafts (
      company_id uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
      configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_by uuid,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE company_configuration_versions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      version_number integer NOT NULL CHECK (version_number > 0),
      effective_date date NOT NULL,
      change_summary varchar(500) NOT NULL,
      snapshot jsonb NOT NULL,
      acknowledged_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
      published_by uuid NOT NULL,
      published_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT company_configuration_versions_version_uq UNIQUE (company_id, version_number)
    )`);
    await queryRunner.query(`CREATE INDEX company_configuration_versions_company_published_idx ON company_configuration_versions(company_id, published_at DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE company_configuration_versions');
    await queryRunner.query('DROP TABLE company_setup_drafts');
    await queryRunner.query('DROP TABLE company_notification_rules');
  }
}
