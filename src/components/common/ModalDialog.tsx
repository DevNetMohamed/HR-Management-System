'use client';

import React, { useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';

export const ModalDialog: React.FC = () => {
  const { modal, closeModal } = useWizard();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal, closeModal]);

  if (!modal) return null;

  return (
    <div className="ov" role="dialog" aria-modal="true" onClick={closeModal}>
      <div className="md" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, margin: '0 0 6px', fontWeight: 700 }}>{modal.title}</h2>
        <p className="sub" style={{ margin: '0 0 16px', color: 'var(--mut)', fontSize: 13 }}>
          {modal.subtitle}
        </p>

        {modal.content && <div style={{ marginBottom: 16 }}>{modal.content}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn" onClick={closeModal}>
            Cancel
          </button>
          <button
            className={`btn p ${modal.confirmStyle === 'danger' ? 'dn' : ''}`}
            style={
              modal.confirmStyle === 'danger'
                ? { background: 'var(--err)', borderColor: 'var(--err)', color: '#fff' }
                : {}
            }
            onClick={modal.onConfirm}
          >
            {modal.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
