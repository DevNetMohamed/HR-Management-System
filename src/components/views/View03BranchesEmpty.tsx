'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';

export const View03BranchesEmpty: React.FC = () => {
  const { go } = useWizard();

  return (
    <>
      <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="bd b-g">Main branch created</span>
        <b>Cairo Headquarters · CAI-HQ · Cairo</b>
        <span className="sp" style={{ flex: 1 }} />
        <span className="h">Effective 01 Jan 2026</span>
      </div>

      <section className="card">
        <div className="empty">
          <i />
          <h2>No additional branches yet</h2>
          <p className="sub" style={{ maxWidth: 420, margin: '6px auto 14px' }}>
            New branches inherit company currency, timezone, calendar and attendance policies. You can override any of them per branch.
          </p>
          <button className="btn p" onClick={() => go('Add / Edit Branch')}>
            Add another branch
          </button>
          <div className="h" style={{ marginTop: 10 }}>
            You can skip — this step is optional.
          </div>
        </div>
      </section>
    </>
  );
};
