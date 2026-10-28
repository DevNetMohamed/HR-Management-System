'use client';

import React, { useState } from 'react';
import { useWizard } from '@/context/WizardContext';

export const View08Organization: React.FC = () => {
  const {
    state,
    setSelectedDepartment,
    addDepartment,
    updateDepartmentSubTeams,
    addToast,
    setDirty,
  } = useWizard();

  const { departments, selectedDepartment } = state;

  const [newDeptName, setNewDeptName] = useState('Product Design');
  const [newDeptCode, setNewDeptCode] = useState('DES');
  const [newCostCenter, setNewCostCenter] = useState('CC-4150');
  const [effectiveDate, setEffectiveDate] = useState('2026-02-01');
  const [assignedBranches, setAssignedBranches] = useState(['Cairo Headquarters']);

  // Expanded department names set for accordion
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    Engineering: true,
  });

  // Dynamic sub-departments in Add Department form
  const [subDepts, setSubDepts] = useState<string[]>([]);
  const [subDeptInput, setSubDeptInput] = useState('');

  // Editing state for form sub-departments (index or null)
  const [editingFormIndex, setEditingFormIndex] = useState<number | null>(null);
  const [editingFormValue, setEditingFormValue] = useState('');

  // Editing state for tree sub-departments
  const [editingTreeSub, setEditingTreeSub] = useState<{
    deptName: string;
    subIndex: number;
    value: string;
  } | null>(null);

  const branchOptions = ['Cairo Headquarters', 'Alexandria Office', 'New Cairo Hub'];

  const toggleBranch = (branch: string) => {
    setAssignedBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
    setDirty();
  };

  const toggleAccordion = (deptName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDepts((prev) => ({
      ...prev,
      [deptName]: !prev[deptName],
    }));
  };

  const handleAddSubDept = () => {
    const trimmed = subDeptInput.trim();
    if (!trimmed) return;
    if (subDepts.includes(trimmed)) {
      addToast('Sub-department already added');
      return;
    }
    setSubDepts((prev) => [...prev, trimmed]);
    setSubDeptInput('');
    setDirty();
  };

  const handleRemoveSubDept = (indexToRemove: number) => {
    setSubDepts((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (editingFormIndex === indexToRemove) {
      setEditingFormIndex(null);
    }
    setDirty();
  };

  const handleStartEditFormSubDept = (index: number, name: string) => {
    setEditingFormIndex(index);
    setEditingFormValue(name);
  };

  const handleSaveEditFormSubDept = (index: number) => {
    const trimmed = editingFormValue.trim();
    if (!trimmed) {
      handleRemoveSubDept(index);
      return;
    }
    setSubDepts((prev) => {
      const copy = [...prev];
      copy[index] = trimmed;
      return copy;
    });
    setEditingFormIndex(null);
    setEditingFormValue('');
    setDirty();
  };

  const handleSubDeptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubDept();
    }
  };

  // Tree sub-department editing and removing
  const handleRemoveTreeSub = (
    deptName: string,
    subIndex: number,
    currentSubTeams: { name: string; code: string; subTeamsCount: number }[],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const updated = currentSubTeams.filter((_, idx) => idx !== subIndex);
    updateDepartmentSubTeams(deptName, updated);
    addToast('Sub-department removed');
  };

  const handleStartEditTreeSub = (
    deptName: string,
    subIndex: number,
    currentName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingTreeSub({
      deptName,
      subIndex,
      value: currentName,
    });
  };

  const handleSaveEditTreeSub = (
    currentSubTeams: { name: string; code: string; subTeamsCount: number }[]
  ) => {
    if (!editingTreeSub) return;
    const trimmed = editingTreeSub.value.trim();
    if (!trimmed) {
      handleRemoveTreeSub(
        editingTreeSub.deptName,
        editingTreeSub.subIndex,
        currentSubTeams,
        { stopPropagation: () => {} } as React.MouseEvent
      );
      setEditingTreeSub(null);
      return;
    }
    const words = trimmed.split(' ').filter(Boolean);
    const code =
      words.length > 1
        ? (words[0][0] + words[1][0]).toUpperCase()
        : trimmed.slice(0, 2).toUpperCase();

    const updated = [...currentSubTeams];
    updated[editingTreeSub.subIndex] = {
      ...updated[editingTreeSub.subIndex],
      name: trimmed,
      code,
    };

    updateDepartmentSubTeams(editingTreeSub.deptName, updated);
    setEditingTreeSub(null);
    addToast('Sub-department renamed');
  };

  const handleAddDept = () => {
    if (!newDeptName.trim() || !newDeptCode.trim()) {
      addToast('Enter a department name and code');
      return;
    }

    const formattedSubTeams = subDepts.map((sd) => {
      const words = sd.split(' ').filter(Boolean);
      const code =
        words.length > 1
          ? (words[0][0] + words[1][0]).toUpperCase()
          : sd.slice(0, 2).toUpperCase();
      return {
        name: sd,
        code,
        subTeamsCount: 0,
      };
    });

    addDepartment(newDeptName, newDeptCode, {
      costCenter: newCostCenter,
      effectiveDate,
      assignedBranches,
      subTeams: formattedSubTeams,
    });

    // Auto-expand the newly created department in the tree
    setExpandedDepts((prev) => ({
      ...prev,
      [newDeptName.trim()]: true,
    }));

    // Reset sub-departments list
    setSubDepts([]);
    setSubDeptInput('');
    setEditingFormIndex(null);
  };

  const currentSelectedDeptObj = departments.find((d) => d.name === selectedDepartment);

  return (
    <>
      <div className="g2" style={{ gridTemplateColumns: '1.6fr 1fr', alignItems: 'start' }}>
        {/* Left: Organization Tree */}
        <section className="card">
          <h2>Organization tree</h2>
          <div className="nd">
            <em>NH</em>
            <div>
              <b>Nile Horizon Technologies</b>
              <small>{departments.length} departments</small>
            </div>
          </div>

          {departments.map((dept) => {
            const isSelected = selectedDepartment === dept.name;
            const subTeams =
              dept.subTeams ||
              (dept.name === 'Engineering'
                ? [
                    { name: 'Backend Chapter', code: 'BE', subTeamsCount: 0 },
                    { name: 'Mobile Chapter', code: 'MO', subTeamsCount: 0 },
                  ]
                : []);
            const hasChildren = subTeams.length > 0;
            const isExpanded = !!expandedDepts[dept.name];

            return (
              <div key={dept.code}>
                <div
                  className={`nd ${isSelected ? 'on' : ''}`}
                  onClick={() => setSelectedDepartment(dept.name)}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${dept.name} sub-departments`}
                      aria-expanded={isExpanded}
                      onClick={(e) => toggleAccordion(dept.name, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--mut)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--pb)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--mut)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ) : (
                    <span style={{ width: 14, display: 'inline-block' }} />
                  )}

                  <em>{dept.code.slice(0, 2)}</em>
                  <div style={{ flex: 1 }}>
                    <b>{dept.name}</b>
                    <small>
                      {dept.code} · {dept.subTeamsCount || subTeams.length} sub-teams
                    </small>
                  </div>
                  {isSelected && <span className="h">Selected</span>}
                </div>

                {hasChildren && isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {subTeams.map((sub, sIdx) => {
                      const isEditingThisTreeSub =
                        editingTreeSub?.deptName === dept.name &&
                        editingTreeSub?.subIndex === sIdx;

                      return (
                        <div
                          key={sub.name + sIdx}
                          className="nd k"
                          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                          <em>{sub.code || sub.name.slice(0, 2).toUpperCase()}</em>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isEditingThisTreeSub ? (
                              <div
                                style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editingTreeSub.value}
                                  autoFocus
                                  onChange={(e) =>
                                    setEditingTreeSub({
                                      ...editingTreeSub,
                                      value: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditTreeSub(subTeams);
                                    } else if (e.key === 'Escape') {
                                      setEditingTreeSub(null);
                                    }
                                  }}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '13px',
                                    height: '28px',
                                  }}
                                />
                                <button
                                  type="button"
                                  className="btn sm"
                                  onClick={() => handleSaveEditTreeSub(subTeams)}
                                  style={{ padding: '2px 8px', fontSize: '11px', height: '28px' }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn sm"
                                  onClick={() => setEditingTreeSub(null)}
                                  style={{ padding: '2px 8px', fontSize: '11px', height: '28px' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <b>{sub.name}</b>
                                <small>{sub.code || sub.name.slice(0, 2).toUpperCase()} · 0 sub-teams</small>
                              </>
                            )}
                          </div>

                          {!isEditingThisTreeSub && (
                            <div
                              style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="lk"
                                style={{ fontSize: '12px' }}
                                onClick={(e) =>
                                  handleStartEditTreeSub(dept.name, sIdx, sub.name, e)
                                }
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="lk r"
                                style={{ fontSize: '12px' }}
                                onClick={(e) =>
                                  handleRemoveTreeSub(dept.name, sIdx, subTeams, e)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Right: Selected Department Details */}
        <section className="card">
          <h2>{selectedDepartment}</h2>
          <p>
            <span className="bd b-g">Active</span>
          </p>
          <table>
            <tbody>
              <tr>
                <td className="h">Branch</td>
                <td>{currentSelectedDeptObj?.branch || 'Cairo HQ'}</td>
              </tr>
              <tr>
                <td className="h">Cost center</td>
                <td>{currentSelectedDeptObj?.costCenter || 'CC-4100'}</td>
              </tr>
              <tr>
                <td className="h">Manager</td>
                <td style={{ color: 'var(--warn)' }}>
                  <b>{currentSelectedDeptObj?.manager || 'Unassigned'}</b>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="al i" role="note" style={{ marginTop: 12 }}>
            <span>You can assign a manager after adding employees.</span>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
            <button className="btn" onClick={() => addToast('Edit department')}>
              Edit
            </button>
            <button
              className="btn"
              onClick={() => addToast('Moving also moves its sub-teams')}
            >
              Move
            </button>
            <button
              className="btn dn"
              onClick={() => addToast('Department retired')}
            >
              Retire
            </button>
          </div>
        </section>
      </div>

      {/* Add Department Section */}
      <section className="card" style={{ marginTop: 16 }}>
        <h2>Add department — {newDeptName || 'New Department'}</h2>
        <p className="sub">Departments attach to one or more branches.</p>
        
        {/* Optimized 2-column balanced form grid */}
        <div className="g2">
          <div>
            <label>
              Department name <span className="rq">*</span>
            </label>
            <input
              type="text"
              id="dn"
              value={newDeptName}
              onChange={(e) => {
                setNewDeptName(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Department code <span className="rq">*</span>
            </label>
            <input
              type="text"
              id="dc"
              value={newDeptCode}
              onChange={(e) => {
                setNewDeptCode(e.target.value);
                setDirty();
              }}
            />
            <div className="h">Unique identifier (e.g. DES, ENG)</div>
          </div>

          <div>
            <label>
              Cost center <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={newCostCenter}
              onChange={(e) => {
                setNewCostCenter(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>Manager</label>
            <input
              type="text"
              readOnly
              value="Assign later — select employee"
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

          <div>
            <label>
              Primary branch <span className="rq">*</span>
            </label>
            <select
              value={assignedBranches[0] || 'Cairo Headquarters'}
              onChange={(e) => {
                const val = e.target.value;
                setAssignedBranches((prev) => [val, ...prev.filter((b) => b !== val)]);
                setDirty();
              }}
            >
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Sub-departments Field */}
        <div style={{ marginTop: 16 }}>
          <label>Sub-departments / Sub-teams</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, maxWidth: '520px' }}>
            <input
              type="text"
              placeholder="e.g. Design Systems, UX Research"
              value={subDeptInput}
              onChange={(e) => setSubDeptInput(e.target.value)}
              onKeyDown={handleSubDeptKeyDown}
            />
            <button
              type="button"
              className="btn"
              onClick={handleAddSubDept}
              style={{ whiteSpace: 'nowrap' }}
            >
              Add Sub-department
            </button>
          </div>

          {subDepts.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 10,
                marginTop: 12,
              }}
            >
              {subDepts.map((sd, idx) => {
                const isEditing = editingFormIndex === idx;

                return (
                  <div
                    key={sd + idx}
                    style={{
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, width: '100%', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingFormValue}
                          autoFocus
                          onChange={(e) => setEditingFormValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditFormSubDept(idx);
                            } else if (e.key === 'Escape') {
                              setEditingFormIndex(null);
                            }
                          }}
                          style={{
                            padding: '3px 8px',
                            fontSize: '13px',
                            height: '28px',
                            flex: 1,
                          }}
                        />
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => handleSaveEditFormSubDept(idx)}
                          style={{ padding: '2px 8px', fontSize: '11px', height: '28px' }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => setEditingFormIndex(null)}
                          style={{ padding: '2px 8px', fontSize: '11px', height: '28px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span
                            style={{
                              background: 'var(--s3)',
                              color: 'var(--p1)',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: '4px',
                              padding: '2px 6px',
                            }}
                          >
                            SUB
                          </span>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '13px',
                              color: 'var(--ink)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {sd}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="lk"
                            style={{ fontSize: '12px' }}
                            onClick={() => handleStartEditFormSubDept(idx, sd)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="lk r"
                            style={{ fontSize: '12px' }}
                            onClick={() => handleRemoveSubDept(idx)}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="h" style={{ marginTop: 6 }}>
            Press Enter or click &quot;Add Sub-department&quot; to attach child teams.
          </div>
        </div>

        {/* Branch Assignments */}
        <label style={{ marginTop: 16 }}>
          Attach to branches <span className="rq">*</span>
        </label>
        <div className="g3">
          {branchOptions.map((b) => (
            <label key={b} className="ck" style={{ fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={assignedBranches.includes(b)}
                onChange={() => toggleBranch(b)}
              />
              {b}
            </label>
          ))}
        </div>

        <p style={{ margin: '16px 0 0' }}>
          <button className="btn p" onClick={handleAddDept}>
            Add department
          </button>
        </p>
      </section>
    </>
  );
};
