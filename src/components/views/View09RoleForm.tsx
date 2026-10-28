'use client';

import React, { useState } from 'react';
import { useWizard } from '@/context/WizardContext';

export const View09RoleForm: React.FC = () => {
  const { go, addToast, setDirty } = useWizard();

  const [roleName, setRoleName] = useState('Payroll Specialist');
  const [roleType, setRoleType] = useState('Custom role');
  const [effectiveDate, setEffectiveDate] = useState('2026-02-01');
  const [status, setStatus] = useState('Active');
  const [roleDescription, setRoleDescription] = useState(
    'Runs monthly payroll, validates inputs and exports bank files.'
  );
  const [rolePurpose, setRolePurpose] = useState(
    'Separate payroll execution from HR approvals (SoD).'
  );

  return (
    <>
      <section className="card">
        <h2>Role basics</h2>
        <div className="g2">
          <div>
            <label>
              Role name <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Role type <span className="rq">*</span>
            </label>
            <select
              value={roleType}
              onChange={(e) => {
                setRoleType(e.target.value);
                setDirty();
              }}
            >
              <option value="Custom role">Custom role</option>
              <option value="System role">System role</option>
            </select>
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

          <div>
            <label>
              Status <span className="rq">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setDirty();
              }}
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="fl">
            <label>
              Role description <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={roleDescription}
              onChange={(e) => {
                setRoleDescription(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div className="fl">
            <label>
              Role purpose <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={rolePurpose}
              onChange={(e) => {
                setRolePurpose(e.target.value);
                setDirty();
              }}
            />
            <div className="h">Shown to admins when assigning this role.</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Continue to permissions</h2>
        <p className="sub">Next: module permissions, data scope and field-level access.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn p" onClick={() => go('Permission Matrix')}>
            Open permission matrix
          </button>
          <button
            className="btn"
            onClick={() => {
              addToast('Permissions copied from HR Admin');
              setDirty();
            }}
          >
            Copy from HR Admin
          </button>
        </div>

        <div className="al w" role="note" style={{ marginTop: 14 }}>
          <b>Segregation of duties</b>
          <span>
            Payroll Specialist + Payroll Approver on one user will trigger an SoD warning. Keep execution and approval apart.
          </span>
        </div>
      </section>
    </>
  );
};
