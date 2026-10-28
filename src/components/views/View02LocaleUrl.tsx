'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';
import { TIMEZONE_WORKWEEK_MAP } from '@/mocks/mockSetupData';

export const View02LocaleUrl: React.FC = () => {
  const { state, updateLocaleUrl } = useWizard();
  const { localeUrl } = state;

  const handleSubdomainChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    updateLocaleUrl('subdomain', sanitized);
  };

  const previewUrl = `https://${localeUrl.subdomain || 'your-company'}.hrcloud.io/login`;

  return (
    <>
      <section className="card">
        <h2>Locale defaults</h2>
        <p className="sub">Auto-suggested from Egypt — editable at any time.</p>
        <div className="g3">
          <div>
            <label>
              Default currency <span className="rq">*</span>
            </label>
            <select
              value={localeUrl.currency}
              onChange={(e) => updateLocaleUrl('currency', e.target.value)}
            >
              <option value="EGP — Egyptian Pound">EGP — Egyptian Pound</option>
              <option value="SAR — Saudi Riyal">SAR — Saudi Riyal</option>
              <option value="AED — UAE Dirham">AED — UAE Dirham</option>
              <option value="USD — US Dollar">USD — US Dollar</option>
            </select>
          </div>

          <div>
            <label>
              Default timezone <span className="rq">*</span>
            </label>
            <select
              value={localeUrl.timezone}
              onChange={(e) => updateLocaleUrl('timezone', e.target.value)}
            >
              {Object.keys(TIMEZONE_WORKWEEK_MAP).map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>
              Default language <span className="rq">*</span>
            </label>
            <select
              value={localeUrl.language}
              onChange={(e) => updateLocaleUrl('language', e.target.value)}
            >
              <option value="Arabic / English">Arabic / English</option>
              <option value="English">English</option>
              <option value="Arabic">Arabic</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Company URL</h2>
        <p className="sub">Your team signs in at this address.</p>
        <label>
          Subdomain <span className="rq">*</span> <span className="bd b-g">Available</span>
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={localeUrl.subdomain}
            style={{ maxWidth: 280 }}
            onChange={(e) => handleSubdomainChange(e.target.value)}
          />
          <span className="h" style={{ margin: 0 }}>
            .hrcloud.io
          </span>
        </div>
        <div className="h">
          Auto-suggested from company name. Lowercase letters, numbers and hyphens only.
        </div>
        <div className="al" style={{ marginTop: 12 }}>
          <span>
            Preview:{' '}
            <b id="pv" style={{ display: 'inline', color: 'var(--ink)' }}>
              {previewUrl}
            </b>
          </span>
        </div>
      </section>
    </>
  );
};
