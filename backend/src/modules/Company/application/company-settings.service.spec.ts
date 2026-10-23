import { BadRequestException } from '@nestjs/common';
jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));
import { CompanySettingsService } from './company-settings.service';

describe('CompanySettingsService', () => {
  const rules: any = { findOne: jest.fn(), save: jest.fn(async (v) => v), create: jest.fn((v) => v), createQueryBuilder: jest.fn() };
  const service = new CompanySettingsService({} as any, rules, {} as any, {} as any, {} as any, {} as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('rejects disabling a mandatory notification', async () => {
    rules.findOne.mockResolvedValue({ id: 'r', companyId: 'c', isMandatory: true, status: 'active' });
    await expect(service.disableRule('c', 'r')).rejects.toBeInstanceOf(BadRequestException);
    expect(rules.save).not.toHaveBeenCalled();
  });

  it('does not let mandatory notification rules move to draft', async () => {
    rules.findOne.mockResolvedValue({ id: 'r', companyId: 'c', isMandatory: true, status: 'active' });
    await expect(service.updateRule('c', 'actor', 'r', { status: 'draft' })).rejects.toBeInstanceOf(BadRequestException);
    expect(rules.save).not.toHaveBeenCalled();
  });

  it('scopes a rule lookup to the authenticated company', async () => {
    rules.findOne.mockResolvedValue(null);
    await expect(service.disableRule('other-company', 'r')).rejects.toThrow('Notification rule not found');
    expect(rules.findOne).toHaveBeenCalledWith({ where: { companyId: 'other-company', id: 'r' } });
  });

  it('duplicates a rule as an editable draft with a new key', async () => {
    rules.findOne.mockResolvedValue({ id: 'r', companyId: 'c', ruleKey: 'system', name: 'Example', status: 'active', isMandatory: true, createdAt: new Date(), updatedAt: new Date(), channels: ['email'] });
    rules.save.mockImplementation(async (v) => v);
    const result = await service.duplicateRule('c', 'actor', 'r');
    expect(result).toMatchObject({ companyId: 'c', name: 'Example (Copy)', status: 'draft', isMandatory: false, createdBy: 'actor', channels: ['email'] });
    expect(result.ruleKey).not.toBe('system');
    expect(result.id).toBeUndefined();
  });
});
