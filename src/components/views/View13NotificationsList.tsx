'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';

export const View13NotificationsList: React.FC = () => {
  const { state, go, addToast, toggleNotificationStatus } = useWizard();
  const { notificationRules } = state;

  return (
    <section className="card">
      <h2>Rules ({notificationRules.length})</h2>
      <div style={{ textAlign: 'right', margin: '-34px 0 10px' }}>
        <button
          className="btn"
          style={{ marginRight: 8 }}
          onClick={() => addToast('Template preview')}
        >
          Preview template
        </button>
        <button className="btn p" onClick={() => go('Add / Edit Rule')}>
          Add rule
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Event</th>
              <th>Recipients</th>
              <th>Channels</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notificationRules.map((rule, idx) => (
              <tr key={rule.name}>
                <td>
                  <b>{rule.name}</b>{' '}
                  {rule.isMandatory && (
                    <span className="bd b-r">Mandatory</span>
                  )}
                </td>
                <td>{rule.event}</td>
                <td>{rule.recipients}</td>
                <td>{rule.channels.join(' · ')}</td>
                <td>{rule.priority}</td>
                <td>
                  <span className={`bd ${rule.status === 'Active' ? 'b-g' : ''}`}>
                    {rule.status}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="lk" onClick={() => go('Add / Edit Rule')}>
                    Edit
                  </button>
                  <button className="lk" onClick={() => addToast('Duplicated')}>
                    Duplicate
                  </button>
                  <button className="lk" onClick={() => addToast('Template preview')}>
                    Preview
                  </button>
                  {rule.isMandatory ? (
                    <button
                      className="lk"
                      onClick={() =>
                        addToast('Mandatory notifications cannot be disabled')
                      }
                    >
                      Locked
                    </button>
                  ) : (
                    <button
                      className="lk"
                      onClick={() => toggleNotificationStatus(idx)}
                    >
                      {rule.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
