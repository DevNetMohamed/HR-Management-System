'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';

export const View01CompanyProfile: React.FC = () => {
  const { state, updateIdentity, addToast, setDirty } = useWizard();
  const { identity, taxError } = state;

  return (
    <>
      <div className="al i" role="note">
        <b>How inheritance works</b>
        <span>
          Currency, timezone and language set here become company defaults. Branches inherit them unless you enable an override.
        </span>
      </div>

      <section className="card">
        <h2>Identity</h2>
        <p className="sub">Shown across payslips, offers and the employee portal.</p>
        <div className="g2">
          <div>
            <label>
              Company display name <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={identity.displayName}
              onChange={(e) => updateIdentity('displayName', e.target.value)}
            />
            <div className="h">Short name employees see every day.</div>
          </div>

          <div>
            <label>
              Legal name <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={identity.legalName}
              onChange={(e) => updateIdentity('legalName', e.target.value)}
            />
          </div>

          <div>
            <label>
              Country <span className="rq">*</span>
            </label>
            <select
              value={identity.country}
              onChange={(e) => updateIdentity('country', e.target.value)}
            >
              <option value="Egypt">Egypt</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
            <div className="h">Searchable list</div>
          </div>

          <div className={taxError ? 'er' : ''}>
            <label>
              Tax / registration number
            </label>
            <input
              type="text"
              id="tax"
              value={identity.taxNumber}
              onChange={(e) => updateIdentity('taxNumber', e.target.value)}
            />
            {taxError ? (
              <div className="msg" role="alert">
                {taxError}
              </div>
            ) : (
              <div className="h">Validated against Egypt rules (9 digits).</div>
            )}
          </div>

          <div className="fl">
            <label>Company logo</label>
            <div className="logo">
              <i>NH</i>
              <div>
                <b>{identity.logoFileName}</b>
                <div className="h">240 × 240 recommended · PNG or SVG</div>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  addToast('File picker opens here');
                  setDirty();
                }}
              >
                Add Logo
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
