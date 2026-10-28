'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';

export const View15BlockedErrors: React.FC = () => {
  const { state, applyFix } = useWizard();
  const { blockingFixes } = state;

  const errorItems = [
    {
      key: 'p' as const,
      code: 'E1',
      title: 'E1 · Branch without policy — New Cairo Hub',
      desc: 'No effective attendance policy for Feb 2026. Assign Standard Office or create an override.',
      fieldLabel: 'Attendance policy',
      fixOption: 'Standard Office Policy',
    },
    {
      key: 's' as const,
      code: 'E2',
      title: 'E2 · Shift without branches — Evening Support',
      desc: 'Draft shift has 0 assigned branches. Assign at least one branch or retire the draft.',
      fieldLabel: 'Branches',
      fixOption: 'Cairo HQ',
    },
    {
      key: 'r' as const,
      code: 'E3',
      title: 'E3 · Self-approval risk — Manager role',
      desc: 'Approve permission includes own requests. Restrict scope to Direct Reports excluding self.',
      fieldLabel: 'Data scope',
      fixOption: 'Direct Reports (excl. self)',
    },
  ];

  return (
    <>
      {errorItems.map((item) => {
        const isFixed = !!blockingFixes[item.key];
        return isFixed ? (
          <div key={item.key} className="al ok" role="note">
            <b>Fixed — {item.code}</b>
            <span>Resolved in this draft.</span>
          </div>
        ) : (
          <div key={item.key} className="al e" role="alert">
            <b>{item.title}</b>
            <span>{item.desc}</span>
          </div>
        );
      })}

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Fix inline</h2>
        <p className="sub">Quick fixes without leaving review.</p>
        <div className="g3">
          {errorItems.map((item) => {
            const isFixed = !!blockingFixes[item.key];
            return (
              <div key={item.key} className="tr" style={{ display: 'block' }}>
                <b>{item.fieldLabel}</b>
                <select style={{ margin: '8px 0' }} disabled={isFixed}>
                  <option>{item.fixOption}</option>
                </select>
                <button
                  type="button"
                  className="btn p sm"
                  disabled={isFixed}
                  onClick={() => applyFix(item.key)}
                >
                  {isFixed ? 'Fixed' : 'Apply fix'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};
