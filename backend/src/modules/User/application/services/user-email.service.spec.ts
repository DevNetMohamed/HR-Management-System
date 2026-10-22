import { ServiceUnavailableException } from '@nestjs/common';
import { UserEmailService } from './user-email.service';

describe('UserEmailService', () => {
  const service = new UserEmailService();
  const oldApiKey = process.env.RESEND_API_KEY;
  const oldFrom = process.env.HRMS_EMAIL_FROM;

  afterEach(() => {
    if (oldApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldApiKey;
    if (oldFrom === undefined) delete process.env.HRMS_EMAIL_FROM;
    else process.env.HRMS_EMAIL_FROM = oldFrom;
    jest.restoreAllMocks();
  });

  it('renders and sends the provider-owned mailbox activation link to the personal email', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.HRMS_EMAIL_FROM = 'HRMS <noreply@example.com>';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);

    await service.sendCompanyMailboxActivation('person@example.com', 'https://mail.example.com/activate?code=<script>');

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer test-api-key' }),
      body: expect.stringContaining('&lt;script&gt;'),
    }));
    expect(fetchMock.mock.calls[0][1]?.body).toContain('person@example.com');
  });

  it('fails clearly when delivery is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.HRMS_EMAIL_FROM;
    await expect(service.sendHrmsActivation('person@example.com', 'https://hrms.example.com/activate#token=x'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('reports provider delivery failures for retry handling', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.HRMS_EMAIL_FROM = 'HRMS <noreply@example.com>';
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response);

    await expect(service.sendPasswordRecovery('person@example.com', 'https://hrms.example.com/recover#token=x'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
