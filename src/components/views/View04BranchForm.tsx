'use client';

import React, { useState } from 'react';
import { useWizard } from '@/context/WizardContext';
import { TIMEZONE_WORKWEEK_MAP } from '@/mocks/mockSetupData';

export const View04BranchForm: React.FC = () => {
  const { setDirty } = useWizard();
  const [currencyOverrideEnabled, setCurrencyOverrideEnabled] = useState(true);
  const [branchName, setBranchName] = useState('Alexandria Office');
  const [branchCode, setBranchCode] = useState('ALX-01');
  const [address, setAddress] = useState('14 El Gaish Rd, Alexandria');
  const [city, setCity] = useState('Alexandria');
  const [effectiveDate, setEffectiveDate] = useState('2026-02-01');
  const [branchTimezone, setBranchTimezone] = useState('Africa/Cairo');
  const [currencyOverride, setCurrencyOverride] = useState('USD — US Dollar');

  const toggleCurrency = () => {
    setCurrencyOverrideEnabled((prev) => !prev);
    setDirty();
  };

  return (
    <>
      <section className="card">
        <h2>Branch details</h2>
        <div className="g2">
          <div>
            <label>
              Branch name <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => {
                setBranchName(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Branch code <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={branchCode}
              onChange={(e) => {
                setBranchCode(e.target.value);
                setDirty();
              }}
            />
            <div className="h">Unique · checked live.</div>
          </div>

          <div>
            <label>
              Address <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              City <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Calendar <span className="rq">*</span> <span className="bd b-i">Inherited</span>
            </label>
            <input
              type="text"
              readOnly
              value="Egypt 2026 — company default"
            />
          </div>

          <div>
            <label>
              Effective date <span className="rq">*</span>
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => {
                setEffectiveDate(e.target.value);
                setDirty();
              }}
            />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Overrides</h2>
        <p className="sub">Toggle on to diverge from company defaults.</p>
        <div className="g2">
          <div>
            <label>
              Branch timezone <span className="rq">*</span> <span className="bd b-o">Override</span>
            </label>
            <select
              value={branchTimezone}
              onChange={(e) => {
                setBranchTimezone(e.target.value);
                setDirty();
              }}
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
              Currency <span className="rq">*</span> <span className="bd b-i">Inherited</span>
            </label>
            <input
              type="text"
              readOnly
              value="EGP — inherited"
            />
          </div>
        </div>

        <div className="tr" style={{ marginTop: 14 }}>
          <div>
            <b>This branch uses a different currency</b>
            <small>When on, a currency override is required</small>
          </div>
          <button
            type="button"
            className="tg"
            role="switch"
            aria-checked={currencyOverrideEnabled}
            onClick={toggleCurrency}
          />
        </div>

        {currencyOverrideEnabled && (
          <div id="co" style={{ marginTop: 12 }}>
            <label>
              Currency override <span className="rq">*</span>
            </label>
            <select
              value={currencyOverride}
              onChange={(e) => {
                setCurrencyOverride(e.target.value);
                setDirty();
              }}
            >
              <option value="USD — US Dollar">USD — US Dollar</option>
              <option value="EUR — Euro">EUR — Euro</option>
              <option value="AED — UAE Dirham">AED — UAE Dirham</option>
            </select>
          </div>
        )}

        <div className="al w" role="note" style={{ marginTop: 14 }}>
          <b>Delete protection</b>
          <span>
            Draft branches can be removed with confirmation. Published branches can only be retired — never deleted here.
          </span>
        </div>
      </section>
    </>
  );
};
