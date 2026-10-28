'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { authService } from '@/services/authService';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const { isRTL, t, toggleLanguage } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // Submission feedback state
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    user?: { name: string; email: string; role: string };
  } | null>(null);

  const validateEmail = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) {
      return t.emailRequired;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return t.emailInvalid;
    }
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) {
      return t.passwordRequired;
    }
    if (val.length < 6) {
      return t.passwordMin;
    }
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passwordErr });
    setStatusMessage(null);

    if (emailErr || passwordErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.login({ email, password });
      setStatusMessage({
        type: 'success',
        text: response.message,
        user: response.user,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : isRTL
            ? 'تعذر تسجيل الدخول. يرجى التحقق من بياناتك.'
            : 'Unable to sign in. Please verify your credentials.';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="w-full min-h-screen flex flex-col md:flex-row bg-[var(--bg)] text-[var(--ink)] overflow-x-hidden"
    >
      {/* 1. BRAND VISUAL HERO PANEL — Corporate Workplace Team (Matching Image 2 Reference) */}
      <div className="relative w-full md:w-1/2 min-h-[420px] md:min-h-screen overflow-hidden bg-[var(--p2)] flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white text-left">
        {/* Workplace Team Photograph */}
        <Image
          src="/images/corporate_team_office.jpg"
          alt="Corporate workplace team collaborating around a modern office table"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center"
        />

        {/* Dark Navy / Blue Overlay maintaining strong text contrast matching Image 2 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(8, 20, 68, 0.3) 0%, rgba(8, 20, 68, 0.44) 42%, rgba(8, 20, 68, 0.3) 100%)',
          }}
        />

        {/* Visual Panel Content */}
        <div className="relative z-10 flex flex-col justify-between w-full h-full">
          {/* Top-left: Enterprise Badge & Main Heading */}
          <div className="space-y-3 sm:space-y-4 max-w-lg">
            <div
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[11px] sm:text-[11.5px] font-semibold tracking-wider uppercase border border-white/20 bg-white/10 backdrop-blur-sm text-white"
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#2440F0',
                  boxShadow: '0 0 8px rgba(36, 64, 240, 0.95)',
                }}
              />
              {isRTL ? t.visualBadge : 'ENTERPRISE WORKFORCE CLOUD'}
            </div>

            <div className="pt-1">
              <h2
                className="text-3xl sm:text-4xl lg:text-[38px] font-extrabold tracking-tight leading-tight text-white"
                style={{ letterSpacing: '-0.025em' }}
              >
                {isRTL ? t.visualHeadline : 'Welcome to Dynamic HRMS'}
              </h2>
              <p className="mt-2.5 text-sm sm:text-[15.5px] text-white/90 leading-relaxed font-normal max-w-lg">
                {isRTL ? t.visualDesc : 'Manage your HR tasks smarter, faster, and easier — all in one unified place.'}
              </p>
            </div>
          </div>

          {/* Bottom-left: Tagline & Feature Labels */}
          <div className="max-w-lg space-y-3 pt-8">
            <div
              className="text-[12px] font-bold tracking-widest uppercase"
              style={{ color: '#93B4FC' }}
            >
              {isRTL ? t.visualNarrative : 'PEOPLE · PERFORMANCE · POSSIBILITIES'}
            </div>

            {/* Feature Labels */}
            <div className="flex flex-wrap gap-2.5">
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-[12px] font-medium bg-white/10 border border-white/20 text-white/95 backdrop-blur-sm">
                {isRTL ? t.visualPill1 : 'Enterprise SSO Ready'}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-[12px] font-medium bg-white/10 border border-white/20 text-white/95 backdrop-blur-sm">
                {isRTL ? t.visualPill2 : 'Dual Dashboard Architecture'}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-[12px] font-medium bg-white/10 border border-white/20 text-white/95 backdrop-blur-sm">
                {isRTL ? t.visualPill3 : 'Multi-Branch Governance'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL — Login Form Panel (Centered Content, Navbar Removed) */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col items-center justify-between px-6 sm:px-10 lg:px-14 py-8 sm:py-12 z-10 bg-[var(--bg)]">
        {/* Center: Main Form Container */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-8 sm:py-10">
          {/* Welcoming Header */}
          <div className="mb-6 sm:mb-8">
            <div
              className="inline-block text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded mb-2.5"
              style={{ background: 'var(--s3)', color: 'var(--p1)' }}
            >
              {t.loginTag}
            </div>
            <h1
              className="text-2xl sm:text-[30px] font-bold tracking-tight text-[var(--ink)] leading-tight"
              style={{ letterSpacing: '-0.02em' }}
            >
              {t.loginTitle}
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--mut)] leading-normal">
              {t.loginSubtitle}
            </p>
          </div>

          {/* Feedback Alert Banner */}
          {statusMessage && (
            <div
              className="mb-6 p-3.5 rounded-lg border text-[13px]"
              style={{
                backgroundColor: statusMessage.type === 'success' ? 'var(--okl)' : 'var(--errl)',
                borderColor: statusMessage.type === 'success' ? 'var(--ok)' : 'var(--err)',
                color: statusMessage.type === 'success' ? 'var(--ok)' : 'var(--err)',
              }}
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base font-bold leading-none mt-0.5">
                  {statusMessage.type === 'success' ? '✓' : '⚠'}
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{statusMessage.text}</div>
                  {statusMessage.user && (
                    <div className="mt-1 text-xs text-[var(--mut)]">
                      {t.signedInAs}: <strong className="text-[var(--ink)]">{statusMessage.user.name}</strong> ({statusMessage.user.role})
                    </div>
                  )}
                  {statusMessage.type === 'success' && (
                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 flex items-center gap-3">
                      <Link
                        href="/"
                        className="btn sm p"
                        style={{ padding: '4px 12px', fontSize: 12 }}
                      >
                        {t.launchWizard}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
            {/* Field 1: Email Address */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-[12px] font-semibold uppercase tracking-wider text-[var(--ink)] mb-1.5"
              >
                {t.emailLabel} <span className="text-[var(--err)]">*</span>
              </label>

              {/* Exact Soft Blue Custom Input Container Matching Reference */}
              <div className="soft-input-wrap">
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder={t.emailPlaceholder}
                  className={`soft-input ${touched.email && errors.email ? 'has-error' : ''}`}
                  aria-invalid={Boolean(touched.email && errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />

                {/* Mail Envelope Icon matching user reference image */}
                <div
                  className={`absolute top-0 bottom-0 flex items-center justify-center pointer-events-none text-[#7E8DA6] dark:text-[#6C7D9E] transition-colors ${isRTL ? 'right-3.5' : 'left-3.5'
                    }`}
                  aria-hidden="true"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
              </div>

              {touched.email && errors.email && (
                <div id="email-error" className="msg text-[12px] mt-1.5 font-medium" style={{ color: 'var(--err)' }}>
                  {errors.email}
                </div>
              )}
            </div>

            {/* Field 2: Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-[12px] font-semibold uppercase tracking-wider text-[var(--ink)] mb-1.5"
              >
                {t.passwordLabel} <span className="text-[var(--err)]">*</span>
              </label>

              {/* Exact Soft Blue Custom Input Container Matching Reference */}
              <div className="soft-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('password')}
                  placeholder={t.passwordPlaceholder}
                  className={`soft-input has-two-icons ${touched.password && errors.password ? 'has-error' : ''}`}
                  aria-invalid={Boolean(touched.password && errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />

                {/* Security Lock Icon */}
                <div
                  className={`absolute top-0 bottom-0 flex items-center justify-center pointer-events-none text-[#7E8DA6] dark:text-[#6C7D9E] transition-colors ${isRTL ? 'right-3.5' : 'left-3.5'
                    }`}
                  aria-hidden="true"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                </div>

                {/* Show/Hide Password Toggle Eye Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  className={`absolute top-0 bottom-0 px-3.5 flex items-center justify-center text-[#7E8DA6] hover:text-[var(--p1)] transition-colors focus:outline-none ${isRTL ? 'left-0' : 'right-0'
                    }`}
                  style={{ background: 'transparent', border: 0 }}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {touched.password && errors.password && (
                <div id="password-error" className="msg text-[12px] mt-1.5 font-medium" style={{ color: 'var(--err)' }}>
                  {errors.password}
                </div>
              )}
            </div>

            {/* Primary Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn p w-full text-[14.5px] font-semibold tracking-wide"
                style={{
                  height: 48,
                  borderRadius: 12,
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    {t.signingInBtn}
                  </span>
                ) : (
                  t.signInBtn
                )}
              </button>
            </div>
          </form>

          {/* Minimal Enterprise Notice */}
          <div className="mt-8 pt-5 border-t border-[var(--line)]">
            <p className="text-[12px] text-[var(--mut)] leading-relaxed">
              {t.ssoNotice}
            </p>
          </div>
        </div>

        {/* Footer info with Language Switcher and Secure SSO */}
        <footer className="w-full max-w-[440px] mx-auto pt-4 text-[12px] text-[var(--mut)] flex items-center justify-between">
          <span>{t.copyright}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="hover:text-[var(--p1)] transition-colors inline-flex items-center gap-1.5"
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 12 }}
              title={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{t.langSwitchLabel}</span>
            </button>
            <span className="pill" style={{ fontSize: 11 }}>{t.secureSso}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
