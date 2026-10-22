import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class UserEmailService {
  async sendCompanyMailboxActivation(to: string, providerActivationUrl: string) {
    return this.send(to, 'Activate your company email', this.render('Activate your company email', 'Use your company email provider’s secure setup link to activate your mailbox. This mailbox password is separate from your HRMS password.', 'Activate company email', providerActivationUrl));
  }

  async sendHrmsActivation(to: string, activationUrl: string) {
    return this.send(to, 'Activate your HRMS account', this.render('Set up your HRMS account', 'Your company email is ready. Create a separate HRMS password to finish setting up your account.', 'Create HRMS password', activationUrl));
  }

  async sendPasswordRecovery(to: string, recoveryUrl: string) {
    return this.send(to, 'Reset your HRMS password', this.render('Reset your HRMS password', 'We received a request to reset your HRMS password. This link expires in 30 minutes and does not change your company mailbox password.', 'Reset password', recoveryUrl));
  }

  async sendPasswordChanged(to: string) {
    return this.send(to, 'Your HRMS password was changed', this.render('Password changed', 'Your HRMS password was changed. If you did not make this change, contact your HR administrator.', undefined, undefined));
  }

  async sendHrmsActivated(personalEmail: string, companyEmail: string) {
    const html = this.render('HRMS account activated', 'Your HRMS account is active. Sign in using your company email and the HRMS password you created.', undefined, undefined);
    await Promise.all([
      this.send(personalEmail, 'Your HRMS account is active', html),
      this.send(companyEmail, 'Your HRMS account is active', html),
    ]);
  }

  private async send(to: string, subject: string, html: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.HRMS_EMAIL_FROM;
    if (!apiKey || !from) throw new ServiceUnavailableException('HRMS email delivery is not configured');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!response.ok) throw new ServiceUnavailableException('HRMS email delivery failed; the request can be retried');
  }

  private render(title: string, message: string, label?: string, url?: string) {
    const button = label && url
      ? `<p style="margin:28px 0"><a href="${this.escape(url)}" style="background:#164e63;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">${this.escape(label)}</a></p><p style="color:#64748b;font-size:13px">If the button does not work, copy this link:<br>${this.escape(url)}</p>`
      : '';
    return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:560px;margin:40px auto;background:#fff;padding:32px;border-radius:12px"><p style="font-size:13px;color:#0e7490;font-weight:bold">HRMS</p><h1 style="font-size:24px">${this.escape(title)}</h1><p style="line-height:1.6">${this.escape(message)}</p>${button}<hr style="border:0;border-top:1px solid #e2e8f0"><p style="font-size:12px;color:#64748b">This message concerns your HRMS account. Your company mailbox password is managed separately.</p></div></body></html>`;
  }

  private escape(value: string) {
    return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  }
}
