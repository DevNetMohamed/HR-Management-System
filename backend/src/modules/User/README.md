# User account, activation, email, and login

`UserModule` owns the authentication controller and account provisioning, activation, recovery, email, and Google sign-in providers. `EmployeeModule` calls the exported `EmployeeInvitationService` while persisting the new Employee and User account in one database transaction.

## Endpoints

- `GET /auth/me` — returns the authenticated account and a minimal employee profile; excludes credentials and recovery data.
- `POST /auth/login` — company email and HRMS password.
- `POST /auth/company-email/send-provider-activation` — trusted mail workflow sends the provider-issued mailbox link to the employee's personal email. Requires `x-mail-provider-secret`.
- `POST /auth/company-email/provider-confirmation` — trusted provider callback confirms the assigned mailbox. Requires `x-mail-provider-secret`; this then sends the separate HRMS password setup email.
- `POST /auth/accept-invitation` — consumes the one-time HRMS activation token and sets the HRMS password.
- `POST /auth/activation/resend` — generic, per-account throttled HRMS activation resend request.
- `POST /auth/password-recovery` and `POST /auth/password-recovery/complete` — password reset flow.
- `POST /auth/password/change` — authenticated password change; validates the current password and revokes existing sessions.
- `POST /auth/google/challenge` then `POST /auth/google` — one-time nonce challenge and verified Google ID token login. The Google subject is linked to the existing account only when the verified Google email matches the active company email.

Google client configuration is required in `GOOGLE_CLIENT_ID`. The browser must obtain an ID token for that client using the nonce returned by `/auth/google/challenge`, then submit the token, nonce, and company ID to `/auth/google`.

Email delivery uses the Resend API. Configure `RESEND_API_KEY` and a verified sender in `HRMS_EMAIL_FROM`. The company mailbox setup remains provider-managed: the trusted mail workflow supplies its provider-issued HTTPS link; HRMS never sets or stores the mailbox password.

Configure `MAIL_PROVIDER_ACTIVATION_HOSTS` as a comma-separated allowlist of exact HTTPS hostnames for provider-issued activation URLs. The send endpoint enforces this allowlist and applies a per-account resend cooldown. A provider email send failure remains pending and can be retried after the cooldown.

All endpoints under `GET /auth/me`, `POST /auth/password/change`, `POST /auth/mfa/*`, and `POST /auth/logout` require the existing Bearer session. Login, Google login, activation, and recovery do not require an existing session.
