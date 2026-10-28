'use client';

import React, { useState } from 'react';
import { useWizard } from '@/context/WizardContext';

export const View14ReviewPublish: React.FC = () => {
  const { state, goStep, setWarningsAcknowledged, setDirty } = useWizard();
  const { warningsAcknowledged, blockingFixes } = state;

  const [version, setVersion] = useState('v1.0 — initial release');
  const [effectiveDate, setEffectiveDate] = useState('2026-03-01');
  const [changeSummary, setChangeSummary] = useState(
    'Initial setup: 3 branches, 2 shifts, 6 departments, 5 roles, 4 notification rules.'
  );

  const stepSummaries: [string, string, 'Completed' | 'Warning' | 'Skipped', number][] = [
    ['Company profile', 'Nile Horizon · nile-horizon.hrcloud.io · EGP', 'Completed', 0],
    ['Additional branches', 'Alexandria · New Cairo (2 drafts)', 'Completed', 1],
    ['Calendars & policies', 'Egypt weekend Fri–Sat · Standard Office', 'Warning', 2],
    ['Shifts', 'General · Night · Security (2 active)', 'Completed', 3],
    ['Departments', '6 departments · 1 manager unassigned', 'Warning', 4],
    ['Roles & access', '5 roles · 107 permissions · SoD clean', 'Completed', 5],
    ['Notifications', '4 rules · 2 mandatory locked', 'Skipped', 6],
  ];

  const remainingBlockingErrors = 3 - blockingFixes.p - blockingFixes.s - blockingFixes.r;

  const getBadgeClass = (status: 'Completed' | 'Warning' | 'Skipped') => {
    if (status === 'Warning') return 'b-o';
    if (status === 'Skipped') return '';
    return 'b-g';
  };

  return (
    <>
      <div className="g2">
        {stepSummaries.map(([title, desc, status, stepIdx]) => (
          <div
            key={title}
            className="card"
            style={{ margin: 0, display: 'flex', gap: 10, alignItems: 'center' }}
          >
            <div style={{ flex: 1 }}>
              <b>{title}</b>
              <div className="h">{desc}</div>
            </div>
            <span className={`bd ${getBadgeClass(status)}`}>{status}</span>
            <button className="lk" onClick={() => goStep(stepIdx)}>
              Edit
            </button>
          </div>
        ))}
      </div>

      <div className="al w" role="note" style={{ marginTop: 14 }}>
        <b>2 warnings need acknowledgement</b>
        <span>
          Policy overlap for Cairo HQ in March · Engineering manager unassigned. Warnings never block publishing.
        </span>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Publish configuration</h2>
        <p className="sub">
          Version v1.0 · effective 01 Mar 2026 · by Mona Adel (Company Admin).
        </p>
        <div className="g2">
          <div>
            <label>
              Configuration version <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                setDirty();
              }}
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

          <div className="fl">
            <label>
              Change summary <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={changeSummary}
              onChange={(e) => {
                setChangeSummary(e.target.value);
                setDirty();
              }}
            />
          </div>
        </div>

        <label className="ck" style={{ marginTop: 12, fontWeight: 500 }}>
          <input
            type="checkbox"
            id="ack"
            checked={warningsAcknowledged}
            onChange={(e) => setWarningsAcknowledged(e.target.checked)}
          />{' '}
          I acknowledge the 2 warnings above.
        </label>
        <div className="h" style={{ marginTop: 8 }}>
          Warnings: 2 · Blocking errors: {remainingBlockingErrors}
        </div>
      </section>
    </>
  );
};
