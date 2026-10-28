'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';

export const View05BranchesList: React.FC = () => {
  const { state, go, addToast, deleteDraftBranchModal } = useWizard();
  const { branches } = state;
  const [openDropdownCode, setOpenDropdownCode] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownCode(null);
      }
    };

    if (openDropdownCode) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownCode]);

  return (
    <section className="card">
      <h2>Branches</h2>
      <div style={{ textAlign: 'right', margin: '-34px 0 10px' }}>
        <button className="btn p" onClick={() => go('Add / Edit Branch')}>
          Add another branch
        </button>
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Code</th>
              <th>City</th>
              <th>Timezone</th>
              <th>Currency</th>
              <th>Calendar</th>
              <th>Status</th>
              <th>Effective</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b, i) => {
              const isHeadOffice = i === 0 || b.isHeadOffice;
              const isOpen = openDropdownCode === b.code;

              return (
                <tr key={b.code}>
                  <td>
                    <b>{b.name}</b> {i === 0 && <span className="bd b-k">Head office</span>}
                  </td>
                  <td>{b.code}</td>
                  <td>{b.city}</td>
                  <td>
                    Africa/Cairo{' '}
                    <span className={`bd ${b.timezoneOverride ? 'b-o' : 'b-i'}`}>
                      {b.timezoneOverride ? 'Override' : 'Inherited'}
                    </span>
                  </td>
                  <td>
                    {b.currency}{' '}
                    <span className={`bd ${b.currencyOverride ? 'b-o' : 'b-i'}`}>
                      {b.currencyOverride ? 'Override' : 'Inherited'}
                    </span>
                  </td>
                  <td>
                    Egypt 2026{' '}
                    <span className={`bd ${b.calendarOverride ? 'b-o' : 'b-i'}`}>
                      {b.calendarOverride ? 'Override' : 'Inherited'}
                    </span>
                  </td>
                  <td>
                    <span className={`bd ${b.status === 'Active' ? 'b-g' : ''}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>{b.effectiveDate}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap', position: 'relative' }}>
                    <div style={{ display: 'inline-block', position: 'relative' }}>
                      <button
                        type="button"
                        aria-label={`Actions for ${b.name}`}
                        aria-expanded={isOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownCode(isOpen ? null : b.code);
                        }}
                        style={{
                          background: isOpen ? 'var(--s3)' : 'transparent',
                          border: '1px solid',
                          borderColor: isOpen ? 'var(--line)' : 'transparent',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--mut)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--s3)';
                          e.currentTarget.style.color = 'var(--ink)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isOpen) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--mut)';
                          }
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          style={{ pointerEvents: 'none' }}
                        >
                          <circle cx="8" cy="3" r="1.5" />
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="8" cy="13" r="1.5" />
                        </svg>
                      </button>

                      {isOpen && (
                        <div
                          ref={dropdownRef}
                          role="menu"
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '4px',
                            minWidth: '140px',
                            background: 'var(--card)',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06)',
                            padding: '4px 0',
                            zIndex: 50,
                            textAlign: 'left',
                          }}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenDropdownCode(null);
                              addToast('Opens branch');
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 14px',
                              background: 'none',
                              border: 0,
                              fontSize: '13px',
                              color: 'var(--ink)',
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'background 0.12s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--s3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenDropdownCode(null);
                              if (isHeadOffice) {
                                addToast('Opens branch');
                              } else {
                                go('Add / Edit Branch');
                              }
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 14px',
                              background: 'none',
                              border: 0,
                              fontSize: '13px',
                              color: 'var(--ink)',
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'background 0.12s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--s3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenDropdownCode(null);
                              addToast(isHeadOffice ? 'Duplicated' : 'Branch duplicated');
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 14px',
                              background: 'none',
                              border: 0,
                              fontSize: '13px',
                              color: 'var(--ink)',
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'background 0.12s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--s3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            Duplicate
                          </button>

                          {!isHeadOffice && (
                            <>
                              <div
                                style={{
                                  height: '1px',
                                  background: 'var(--line)',
                                  margin: '4px 0',
                                }}
                              />
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenDropdownCode(null);
                                  deleteDraftBranchModal(b.name);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '8px 14px',
                                  background: 'none',
                                  border: 0,
                                  fontSize: '13px',
                                  color: 'var(--err)',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                  transition: 'background 0.12s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'var(--errl)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'none';
                                }}
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
