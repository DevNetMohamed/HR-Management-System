'use client';

import React from 'react';
import { useWizard } from '@/context/WizardContext';
import { TIMEZONE_WORKWEEK_MAP } from '@/mocks/mockSetupData';

export const View06CalendarsPolicies: React.FC = () => {
  const {
    state,
    setCalendarTab,
    setTimezone,
    updateAttendancePolicy,
    updateWorkweek,
    toggleWorkingDay,
    applyWorkweekDefaults,
  } = useWizard();

  const { calendarTab, selectedTimezone, workweek, attendancePolicy } = state;
  const currentWk = TIMEZONE_WORKWEEK_MAP[selectedTimezone] || TIMEZONE_WORKWEEK_MAP['Africa/Cairo'];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <div className="tab">
        <button
          className={`chip ${calendarTab === 'w' ? 'on' : ''}`}
          onClick={() => setCalendarTab('w')}
        >
          Workweek
        </button>
        <button
          className={`chip ${calendarTab === 'a' ? 'on' : ''}`}
          onClick={() => setCalendarTab('a')}
        >
          Attendance policy
        </button>
        <span style={{ flex: 1 }} />
        <button
          className="btn sm"
          onClick={applyWorkweekDefaults}
        >
          Use system defaults
        </button>
      </div>

      {calendarTab === 'w' ? (
        <section className="card">
          <h2>Workweek</h2>
          <p className="sub">
            Days follow the selected timezone. Adjust any day if your company differs.
          </p>
          <div className="g3">
            <div>
              <label>
                Timezone <span className="rq">*</span>{' '}
                <span className="bd b-i">Linked</span>
              </label>
              <select
                value={selectedTimezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {Object.keys(TIMEZONE_WORKWEEK_MAP).map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>
                Weekend days <span className="bd b-i">From timezone</span>
              </label>
              <input type="text" readOnly value={workweek.weekendDays} />
            </div>

            <div>
              <label>
                First day of week <span className="bd b-i">From timezone</span>
              </label>
              <input type="text" readOnly value={workweek.firstDayOfWeek || currentWk[2]} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label>Working days</label>
            <div className="chips">
              {daysOfWeek.map((day) => {
                const isActive = (workweek.workingDays || []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`chip ${isActive ? 'on' : ''}`}
                    aria-pressed={isActive}
                    onClick={() => toggleWorkingDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="g3" style={{ marginTop: 14 }}>
            <div>
              <label>Standard daily hours</label>
              <input
                type="number"
                value={workweek.standardDailyHours}
                onChange={(e) => updateWorkweek('standardDailyHours', Number(e.target.value) || 0)}
              />
              <div className="h">hrs / day</div>
            </div>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Attendance policy — Standard Office</h2>
          <p className="sub">
            Changes apply from the effective date forward. History is never rewritten.
          </p>
          <div className="g3">
            <div>
              <label>
                Policy name <span className="rq">*</span>
              </label>
              <input
                type="text"
                value={attendancePolicy.name}
                onChange={(e) => updateAttendancePolicy('name', e.target.value)}
              />
            </div>

            <div>
              <label>
                Late grace period <span className="rq">*</span>
              </label>
              <input
                type="text"
                value={attendancePolicy.lateGracePeriod}
                onChange={(e) => updateAttendancePolicy('lateGracePeriod', Number(e.target.value) || 0)}
              />
              <div className="h">minutes</div>
            </div>

            <div>
              <label>
                Early-leave grace <span className="rq">*</span>
              </label>
              <input
                type="text"
                value={attendancePolicy.earlyLeaveGrace}
                onChange={(e) => updateAttendancePolicy('earlyLeaveGrace', Number(e.target.value) || 0)}
              />
              <div className="h">minutes</div>
            </div>

            <div>
              <label>
                Half-day rule <span className="rq">*</span>
              </label>
              <select
                value={attendancePolicy.halfDayRule}
                onChange={(e) => updateAttendancePolicy('halfDayRule', e.target.value)}
              >
                <option value="After 4 hrs absence">After 4 hrs absence</option>
                <option value="After 3 hrs absence">After 3 hrs absence</option>
              </select>
            </div>

            <div>
              <label>
                Absence rule <span className="rq">*</span>
              </label>
              <select
                value={attendancePolicy.absenceRule}
                onChange={(e) => updateAttendancePolicy('absenceRule', e.target.value)}
              >
                <option value="No show = absent">No show = absent</option>
                <option value="Manual review">Manual review</option>
              </select>
            </div>

            <div>
              <label>
                Overtime multiplier <span className="rq">*</span>
              </label>
              <select
                value={attendancePolicy.overtimeMultiplier}
                onChange={(e) => updateAttendancePolicy('overtimeMultiplier', e.target.value)}
              >
                <option value="1.5×">1.5×</option>
                <option value="1.25×">1.25×</option>
                <option value="2×">2×</option>
              </select>
            </div>
          </div>

          <div className="g2" style={{ marginTop: 14 }}>
            <div className="tr">
              <div>
                <b>Geofence required</b>
                <small>Check in within branch radius</small>
              </div>
              <button
                type="button"
                className="tg"
                role="switch"
                aria-checked={attendancePolicy.geofenceRequired}
                onClick={() =>
                  updateAttendancePolicy('geofenceRequired', !attendancePolicy.geofenceRequired)
                }
              />
            </div>

            <div className="tr">
              <div>
                <b>Remote attendance allowed</b>
                <small>Employees can check in remotely</small>
              </div>
              <button
                type="button"
                className="tg"
                role="switch"
                aria-checked={attendancePolicy.remoteAttendanceAllowed}
                onClick={() =>
                  updateAttendancePolicy('remoteAttendanceAllowed', !attendancePolicy.remoteAttendanceAllowed)
                }
              />
            </div>

            <div className="tr">
              <div>
                <b>Overtime enabled</b>
                <small>Track hours beyond shift</small>
              </div>
              <button
                type="button"
                className="tg"
                role="switch"
                aria-checked={attendancePolicy.overtimeEnabled}
                onClick={() =>
                  updateAttendancePolicy('overtimeEnabled', !attendancePolicy.overtimeEnabled)
                }
              />
            </div>

            <div>
              <label>
                Effective date <span className="rq">*</span>
              </label>
              <input
                type="date"
                value={attendancePolicy.effectiveDate}
                onChange={(e) => updateAttendancePolicy('effectiveDate', e.target.value)}
              />
            </div>
          </div>

          <div className="al e" role="alert" style={{ marginTop: 14 }}>
            <b>Conflict warning</b>
            <span>
              Standard Office and Ramadan Schedule overlap for Cairo HQ (01–30 Mar 2026). Resolve before publishing.
            </span>
          </div>

          <div className="al w" role="note">
            <b>Missing policy</b>
            <span>
              New Cairo Hub has no effective policy for Feb 2026. Use the company default or create a branch override.
            </span>
          </div>
        </section>
      )}
    </>
  );
};
