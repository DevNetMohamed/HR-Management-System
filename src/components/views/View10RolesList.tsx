'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';

export const View10RolesList: React.FC = () => {
  const { state, go, addToast } = useWizard();
  const { roles } = state;

  return (
    <div className="g3">
      {roles.map((r) => (
        <section key={r.name} className="card">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <b style={{ flex: 1 }}>{r.name}</b>
            <span className="bd b-g">Active</span>
          </div>
          <p className="h">{r.description}</p>
          <div className="chips" style={{ margin: '8px 0' }}>
            <span className="bd">
              {r.isProtected ? 'System · Protected' : r.type}
            </span>
            <span className="bd">{r.permissionsCount} permissions</span>
            <span className="bd">{r.dataScope}</span>
          </div>
          <p className="h">
            {r.assignedUsersCount} assigned {r.assignedUsersCount === 1 ? 'user' : 'users'} · Effective {r.effectiveDate}
          </p>
          <div style={{ marginTop: 8 }}>
            <button className="lk" onClick={() => go('Permission Matrix')}>
              View
            </button>
            <button className="lk" onClick={() => go('Permission Matrix')}>
              Edit
            </button>
            <button className="lk" onClick={() => addToast('Role duplicated')}>
              Duplicate
            </button>
            {r.isProtected ? (
              <button
                className="lk"
                onClick={() =>
                  addToast('Company Admin is protected and cannot be retired')
                }
              >
                Protected
              </button>
            ) : (
              <button
                className="lk r"
                onClick={() => addToast('Role retired')}
              >
                Retire
              </button>
            )}
          </div>
        </section>
      ))}

      <section
        className="card"
        style={{ display: 'grid', placeItems: 'center', cursor: 'pointer', minHeight: 180 }}
        onClick={() => go('Add / Edit Role')}
      >
        <b style={{ color: 'var(--pb)' }}>+ Add custom role</b>
      </section>
    </div>
  );
};
