'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useWizard();

  if (toasts.length === 0) return null;

  return (
    <div id="tt" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id}>{toast.message}</div>
      ))}
    </div>
  );
};
