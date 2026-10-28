'use client';

import React, { useState } from 'react';
import { useWizard } from '@/context/WizardContext';
import { DataScope } from '@/types/setup';

export const View11PermissionMatrix: React.FC = () => {
  const {
    state,
    setDataScope,
    cycleFieldAccess,
    togglePermission,
    applyRolePreset,
    saveCurrentAsPreset,
    updatePresetAssignedGroups,
    addToast,
    setDirty,
  } = useWizard();

  const { permissions, dataScope, fieldAccess, rolePresets, selectedPresetId } = state;
  const [searchQuery, setSearchQuery] = useState('');

  // Save as new preset modal/form state
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetTier, setNewPresetTier] = useState('Level 1');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [newPresetGroupInput, setNewPresetGroupInput] = useState('');
  const [newPresetGroups, setNewPresetGroups] = useState<string[]>([]);

  // Group assignment management state for the currently active preset
  const [groupInput, setGroupInput] = useState('');

  const currentPreset = (rolePresets || []).find((p) => p.id === selectedPresetId);

  const dataScopeOptions: DataScope[] = [
    'Self',
    'Direct Reports',
    'Team',
    'Department',
    'Branch',
    'Company',
  ];

  const filteredPermissions = permissions.filter(
    (p) =>
      p.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.resource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddGroupToCurrentPreset = () => {
    if (!currentPreset) return;
    const trimmed = groupInput.trim();
    if (!trimmed) return;
    const existing = currentPreset.assignedGroups || [];
    if (existing.includes(trimmed)) {
      addToast('Group already assigned');
      return;
    }
    const updated = [...existing, trimmed];
    updatePresetAssignedGroups(currentPreset.id, updated);
    setGroupInput('');
    setDirty();
  };

  const handleRemoveGroupFromCurrentPreset = (groupToRemove: string) => {
    if (!currentPreset) return;
    const existing = currentPreset.assignedGroups || [];
    const updated = existing.filter((g) => g !== groupToRemove);
    updatePresetAssignedGroups(currentPreset.id, updated);
    setDirty();
  };

  const handleAddGroupToNewPreset = () => {
    const trimmed = newPresetGroupInput.trim();
    if (!trimmed) return;
    if (newPresetGroups.includes(trimmed)) return;
    setNewPresetGroups((prev) => [...prev, trimmed]);
    setNewPresetGroupInput('');
  };

  const handleRemoveGroupFromNewPreset = (groupToRemove: string) => {
    setNewPresetGroups((prev) => prev.filter((g) => g !== groupToRemove));
  };

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      addToast('Please enter a preset name');
      return;
    }
    saveCurrentAsPreset({
      name: newPresetName.trim(),
      tier: newPresetTier,
      description: newPresetDesc.trim(),
      assignedGroups: newPresetGroups,
    });
    setShowSavePresetModal(false);
    setNewPresetName('');
    setNewPresetDesc('');
    setNewPresetGroups([]);
  };

  return (
    <>
      {/* Role Presets & Level Templates Header Selector */}
      <section className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              Role Presets / Level Templates
              {currentPreset && (
                <span className="bd b-i" style={{ fontSize: '11px' }}>
                  {currentPreset.tier}
                </span>
              )}
            </h2>
            <p className="sub" style={{ margin: '4px 0 0' }}>
              Select a standardized HR level preset to auto-configure matrix grants, data scope, and field visibility.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedPresetId || ''}
              onChange={(e) => applyRolePreset(e.target.value)}
              style={{
                minWidth: '240px',
                padding: '7px 12px',
                fontWeight: 600,
                color: 'var(--ink)',
                borderColor: 'var(--p1)',
              }}
            >
              {(rolePresets || []).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn p"
              onClick={() => {
                setNewPresetName(`HR Level ${(rolePresets?.length || 3) + 1} Preset`);
                setNewPresetTier(`Level ${(rolePresets?.length || 3) + 1}`);
                setShowSavePresetModal(true);
              }}
              style={{ whiteSpace: 'nowrap' }}
            >
              + Save as New Preset / Level
            </button>
          </div>
        </div>

        {/* Group / User Assignment for Current Preset */}
        {currentPreset && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>
                  Assigned Groups / Users:
                </span>
                <span className="h" style={{ fontSize: '12px' }}>
                  {currentPreset.description}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Assign user or team/group…"
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGroupToCurrentPreset();
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    height: '28px',
                    width: '200px',
                  }}
                />
                <button
                  type="button"
                  className="btn sm"
                  onClick={handleAddGroupToCurrentPreset}
                  style={{ height: '28px', padding: '2px 10px', fontSize: '12px' }}
                >
                  Assign
                </button>
              </div>
            </div>

            <div className="chips" style={{ marginTop: 2 }}>
              {(currentPreset.assignedGroups && currentPreset.assignedGroups.length > 0) ? (
                currentPreset.assignedGroups.map((group) => (
                  <span
                    key={group}
                    className="chip on"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      borderRadius: '14px',
                      fontSize: '12px',
                    }}
                  >
                    <span>{group}</span>
                    <button
                      type="button"
                      aria-label={`Unassign ${group}`}
                      onClick={() => handleRemoveGroupFromCurrentPreset(group)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--p1)',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--err)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--p1)';
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="h" style={{ fontSize: '12px' }}>
                  No groups or users assigned to this level yet.
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Save as New Preset Modal */}
      {showSavePresetModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowSavePresetModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              margin: 0,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>Save Current Setup as Role Preset</h2>
            <p className="sub">
              Captures all active Matrix checkboxes, Data Scope ({dataScope}), and Field-level access rules into a reusable level template.
            </p>

            <form onSubmit={handleSavePresetSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label>
                    Preset / Level Name <span className="rq">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HR Level 2 (Senior Specialist)"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                  />
                </div>

                <div className="g2">
                  <div>
                    <label>Tier / Level Code</label>
                    <select
                      value={newPresetTier}
                      onChange={(e) => setNewPresetTier(e.target.value)}
                    >
                      <option value="Level 1">Level 1 (Junior / Associate)</option>
                      <option value="Level 2">Level 2 (Specialist / Officer)</option>
                      <option value="Level 3">Level 3 (Manager / BP)</option>
                      <option value="Level 4">Level 4 (Director / Head)</option>
                      <option value="Custom Level">Custom Level</option>
                    </select>
                  </div>

                  <div>
                    <label>Current Scope (Captured)</label>
                    <input type="text" readOnly value={dataScope} />
                  </div>
                </div>

                <div>
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of this tier's operational purpose"
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label>Initial Assigned Groups / Teams</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      type="text"
                      placeholder="e.g. Branch Specialists, Recruitment Lead"
                      value={newPresetGroupInput}
                      onChange={(e) => setNewPresetGroupInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGroupToNewPreset();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={handleAddGroupToNewPreset}
                    >
                      Add
                    </button>
                  </div>
                  {newPresetGroups.length > 0 && (
                    <div className="chips" style={{ marginTop: 8 }}>
                      {newPresetGroups.map((g) => (
                        <span key={g} className="chip on" style={{ padding: '2px 8px', fontSize: '12px' }}>
                          {g}{' '}
                          <button
                            type="button"
                            onClick={() => handleRemoveGroupFromNewPreset(g)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p1)' }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowSavePresetModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn p">
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter & Toolbar */}
      <div className="card" style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          placeholder="Search modules and resources…"
          style={{ flex: 1 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            addToast('Permissions copied');
            setDirty();
          }}
        >
          Copy from role
        </button>
        <button
          className="btn"
          onClick={() => {
            const total = permissions.reduce(
              (acc, p) =>
                acc +
                (p.create ? 1 : 0) +
                (p.read ? 1 : 0) +
                (p.update ? 1 : 0) +
                (p.delete ? 1 : 0) +
                (p.approve ? 1 : 0) +
                (p.export ? 1 : 0),
              0
            );
            addToast(`${total} permissions granted · ${permissions.length} modules`);
          }}
        >
          Permission summary
        </button>
      </div>

      <section className="card">
        <h2>Matrix</h2>
        <p className="sub">Select all / clear per module. Sensitive grants need confirmation.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="mx">
            <thead>
              <tr>
                <th>Module</th>
                <th>Resource</th>
                <th>Create</th>
                <th>Read</th>
                <th>Update</th>
                <th>Delete</th>
                <th>Approve</th>
                <th>Export</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((row, idx) => (
                <tr key={row.module}>
                  <td>
                    <b>{row.module}</b>
                  </td>
                  <td className="h">{row.resource}</td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.module} create`}
                      checked={row.create}
                      onChange={() => togglePermission(idx, 'create')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.module} read`}
                      checked={row.read}
                      onChange={() => togglePermission(idx, 'read')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.module} update`}
                      checked={row.update}
                      onChange={() => togglePermission(idx, 'update')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.module} delete`}
                      checked={row.delete}
                      onChange={() => togglePermission(idx, 'delete')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.module} approve`}
                      checked={row.approve}
                      onChange={() => togglePermission(idx, 'approve')}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.module} export`}
                      checked={row.export}
                      onChange={() => togglePermission(idx, 'export')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="al e" role="alert" style={{ marginTop: 14 }}>
          <b>Sensitive grant needs confirmation</b>
          <span>
            Payroll Export for HR Admin will require confirmation. Approve + own-request on the same user is blocked (no self-approval).
          </span>
        </div>

        <div className="al w" role="note">
          <b>Permission conflict</b>
          <span>
            Update on Employee profiles overlaps Manager approvals for the same department. Review before saving.
          </span>
        </div>
      </section>

      <div className="g2">
        <section className="card">
          <h2>Data scope</h2>
          <p className="sub">Applies per permission group.</p>
          <div className="chips">
            {dataScopeOptions.map((scope) => (
              <button
                key={scope}
                type="button"
                className={`chip k ${dataScope === scope ? 'on' : ''}`}
                onClick={() => setDataScope(scope)}
              >
                {scope}
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Field-level access</h2>
          <p className="sub">Payroll fields for this role. Click to change.</p>
          {Object.entries(fieldAccess).map(([field, level]) => (
            <div
              key={field}
              className="tr"
              style={{ marginBottom: 8, justifyContent: 'space-between' }}
            >
              <div>
                <b>{field}</b>
              </div>
              <button
                type="button"
                className="btn sm"
                onClick={() => cycleFieldAccess(field)}
              >
                {level}
              </button>
            </div>
          ))}
        </section>
      </div>
    </>
  );
};
