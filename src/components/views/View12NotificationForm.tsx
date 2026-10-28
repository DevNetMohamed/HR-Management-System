'use client';

import React, { useState } from 'react';
import { useWizard } from '@/context/WizardContext';

export const View12NotificationForm: React.FC = () => {
  const { addToast, setDirty } = useWizard();

  const [businessEvent, setBusinessEvent] = useState('Approval Overdue (24h)');
  const [ruleName, setRuleName] = useState('Approval overdue nudge');
  const [recipients, setRecipients] = useState('Manager · HR Admin');
  const [recipientRoles, setRecipientRoles] = useState('Manager, HR Admin');
  const [priority, setPriority] = useState('Urgent');
  const [language, setLanguage] = useState('Arabic / English');
  const [channels, setChannels] = useState(['In-app', 'Email', 'SMS']);
  const [delivery, setDelivery] = useState('Delay 24h');
  const [reminderFreq, setReminderFreq] = useState('Every 12h × 3');
  const [quietHours, setQuietHours] = useState('22:00 – 07:00');
  const [digestOption, setDigestOption] = useState('No digest');
  const [escalationPath, setEscalationPath] = useState(['Manager', 'HR Admin', 'Company Admin']);
  const [isMandatory, setIsMandatory] = useState(false);

  const channelOptions = ['In-app', 'Email', 'SMS', 'Push'];
  const escalationOptions = ['Manager', 'HR Admin', 'Company Admin'];

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
    setDirty();
  };

  const toggleEscalation = (esc: string) => {
    setEscalationPath((prev) =>
      prev.includes(esc) ? prev.filter((e) => e !== esc) : [...prev, esc]
    );
    setDirty();
  };

  return (
    <>
      <section className="card">
        <h2>Trigger &amp; audience</h2>
        <div className="g2">
          <div>
            <label>
              Business event <span className="rq">*</span>
            </label>
            <select
              value={businessEvent}
              onChange={(e) => {
                setBusinessEvent(e.target.value);
                setDirty();
              }}
            >
              <option value="Approval Overdue (24h)">Approval Overdue (24h)</option>
              <option value="Leave Approved">Leave Approved</option>
              <option value="Payroll Published">Payroll Published</option>
            </select>
          </div>

          <div>
            <label>
              Rule name <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => {
                setRuleName(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Recipients <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => {
                setRecipients(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Recipient roles <span className="rq">*</span>
            </label>
            <input
              type="text"
              value={recipientRoles}
              onChange={(e) => {
                setRecipientRoles(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Priority <span className="rq">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setDirty();
              }}
            >
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <div>
            <label>
              Language <span className="rq">*</span>
            </label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setDirty();
              }}
            >
              <option value="Arabic / English">Arabic / English</option>
              <option value="English">English</option>
              <option value="Arabic">Arabic</option>
            </select>
          </div>
        </div>

        <label style={{ marginTop: 14 }}>
          Channels <span className="rq">*</span>
        </label>
        <div className="chips">
          {channelOptions.map((ch) => (
            <button
              key={ch}
              type="button"
              className={`chip ${channels.includes(ch) ? 'on' : ''}`}
              aria-pressed={channels.includes(ch)}
              onClick={() => toggleChannel(ch)}
            >
              {ch}
            </button>
          ))}
        </div>
        <div className="h">At least one active channel is required. SMS is the fallback.</div>
      </section>

      <div className="g2" style={{ alignItems: 'start' }}>
        <section className="card">
          <h2>Timing</h2>
          <div className="g2">
            <div>
              <label>
                Delivery <span className="rq">*</span>
              </label>
              <select
                value={delivery}
                onChange={(e) => {
                  setDelivery(e.target.value);
                  setDirty();
                }}
              >
                <option value="Immediately">Immediately</option>
                <option value="Delay 24h">Delay 24h</option>
              </select>
            </div>

            <div>
              <label>
                Reminder frequency <span className="rq">*</span>
              </label>
              <select
                value={reminderFreq}
                onChange={(e) => {
                  setReminderFreq(e.target.value);
                  setDirty();
                }}
              >
                <option value="Every 12h × 3">Every 12h × 3</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div>
              <label>
                Quiet hours <span className="rq">*</span>
              </label>
              <input
                type="text"
                value={quietHours}
                onChange={(e) => {
                  setQuietHours(e.target.value);
                  setDirty();
                }}
              />
            </div>

            <div>
              <label>
                Digest option <span className="rq">*</span>
              </label>
              <select
                value={digestOption}
                onChange={(e) => {
                  setDigestOption(e.target.value);
                  setDirty();
                }}
              >
                <option value="No digest">No digest</option>
                <option value="Daily digest">Daily digest</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Escalation path</label>
            <div className="chips">
              {escalationOptions.map((esc) => (
                <button
                  key={esc}
                  type="button"
                  className={`chip ${escalationPath.includes(esc) ? 'on' : ''}`}
                  aria-pressed={escalationPath.includes(esc)}
                  onClick={() => toggleEscalation(esc)}
                >
                  {esc}
                </button>
              ))}
            </div>
          </div>
          <div className="h">Retry policy: 3 attempts · 15 min apart · then SMS fallback.</div>
        </section>

        <section className="card">
          <h2>Template preview</h2>
          <div className="tr" style={{ display: 'block' }}>
            <b>Approval overdue: leave type — employee name</b>
            <div className="h">
              Hi manager, the leave request (dates) has waited 24h. Tap to review.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="tr">
              <div>
                <b>Mandatory notification</b>
                <small>Locked rules can&apos;t be disabled</small>
              </div>
              <button
                type="button"
                className="tg"
                role="switch"
                aria-checked={isMandatory}
                onClick={() => {
                  setIsMandatory(!isMandatory);
                  setDirty();
                }}
              />
            </div>
          </div>

          <div className="al i" role="note" style={{ marginTop: 12 }}>
            <b>Test action</b>
            <span>Sends a real message to you only. Use it after saving the draft.</span>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() => addToast('Test message sent to you')}
          >
            Send test
          </button>
        </section>
      </div>
    </>
  );
};
