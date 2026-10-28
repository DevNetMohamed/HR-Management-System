'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';

export const View16PublishSuccess: React.FC = () => {
  const { addToast } = useWizard();

  const nextSteps = [
    { title: 'Add employees', desc: 'Bulk import or invite one by one', btnText: 'Add employees' },
    { title: 'Assign department managers', desc: '1 pending · Engineering', btnText: 'Assign' },
    { title: 'Assign roles to users', desc: 'After employees exist', btnText: 'Open roles' },
    { title: 'Review notification rules', desc: '2 mandatory locked', btnText: 'Review' },
    { title: 'Connect attendance devices', desc: 'Requires backend support', btnText: 'Connect' },
    { title: 'Configure payroll policies', desc: 'Optional follow-up', btnText: 'Later' },
  ];

  return (
    <>
      <section className="card top" style={{ textAlign: 'center', padding: 34 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--ok)',
            color: '#fff',
            fontSize: 28,
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 10px',
            fontWeight: 700,
          }}
        >
          ✓
        </div>
        <h1>Company setup published</h1>
        <p className="sub">
          Version <b>v1.0</b> · Effective 01 Mar 2026 · 3 branches · 2 shifts · 6 departments · 5 roles · 4 notification rules
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button
            className="btn p"
            onClick={() => addToast('Opening dashboard…')}
          >
            Go to Dashboard
          </button>
          <button
            className="btn"
            onClick={() => addToast('Invite dialog')}
          >
            Invite team members
          </button>
          <button
            className="btn"
            onClick={() => addToast('Add employees')}
          >
            Add employees
          </button>
        </div>
      </section>

      <h2 style={{ fontSize: 18, marginTop: 20, marginBottom: 8, fontWeight: 700 }}>
        Next steps checklist
      </h2>
      <div className="g2" style={{ marginTop: 8 }}>
        {nextSteps.map((step) => (
          <div key={step.title} className="tr">
            <input type="checkbox" aria-label={step.title} />
            <div>
              <b>{step.title}</b>
              <small>{step.desc}</small>
            </div>
            <button
              className="btn sm"
              onClick={() => addToast(step.btnText)}
            >
              {step.btnText}
            </button>
          </div>
        ))}
      </div>

      <div
        className="card"
        style={{
          background: 'var(--side)',
          color: '#fff',
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1 }}>
          <b style={{ display: 'block', fontSize: 14 }}>
            Your workspace is live at nile-horizon.hrcloud.io
          </b>
          <div style={{ color: '#B9D0C8', fontSize: 12, marginTop: 2 }}>
            Share the link with managers to start approvals and attendance from day one.
          </div>
        </div>
        <button
          className="btn"
          style={{
            background: 'var(--gold)',
            borderColor: 'var(--gold)',
            color: '#14201C',
          }}
          onClick={() => addToast('Link copied')}
        >
          Copy link
        </button>
      </div>
    </>
  );
};
