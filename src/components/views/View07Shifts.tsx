'use client';

import React, { useState } from 'react';
import { useWizard } from '@/context/WizardContext';
import { Shift } from '@/types/setup';

export const View07Shifts: React.FC = () => {
  const { state, addShift, addToast, calculateShiftHours, setDirty } = useWizard();
  const { shifts } = state;

  // Add Shift Form State
  const [shiftName, setShiftName] = useState('Evening Support');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('00:30');
  const [breakMin, setBreakMin] = useState(45);
  const [attendancePolicy, setAttendancePolicy] = useState('Standard Office Policy');
  const [effectiveDate, setEffectiveDate] = useState('2026-02-01');
  const [workingDays, setWorkingDays] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
  const [branches, setBranches] = useState(['Cairo HQ', 'Alexandria']);

  const daysList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const branchList = ['Cairo HQ', 'Alexandria', 'New Cairo Hub'];

  const calcResult = calculateShiftHours(startTime, endTime, breakMin);

  const handleAddShift = () => {
    const isNight = calcResult.isNight;
    const newShiftItem: Shift = {
      name: shiftName || 'New shift',
      startTime,
      endTime,
      breakDuration: breakMin,
      attendancePolicy,
      effectiveDate,
      workingDays,
      assignedBranches: branches,
      isNightShift: isNight,
      detailsSummary: `${startTime} – ${endTime} · ${breakMin} min break · ${attendancePolicy}`,
      daysSummary: 'Sun–Thu',
      branchSummary: branches.join(' · '),
    };
    addShift(newShiftItem);
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setDirty();
  };

  const toggleBranch = (b: string) => {
    setBranches((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]
    );
    setDirty();
  };

  return (
    <>
      <section className="card">
        <h2>Shifts</h2>
        <p className="sub">{shifts.length} shifts · 42.5 hrs scheduled weekly</p>
        <div className="g2">
          {shifts.map((s, idx) => (
            <div key={idx} className="tr" style={{ display: 'block' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <b>{s.name}</b>
                {s.isNightShift && (
                  <span className="bd b-k">Night · auto</span>
                )}
                <span className="bd b-g">Active</span>
              </div>
              <div className="h">{s.detailsSummary || `${s.startTime} – ${s.endTime}`}</div>
              <div className="h">
                {s.daysSummary || 'Sun–Thu'} · Branches: {s.branchSummary || s.assignedBranches.join(' · ')} · Effective {s.effectiveDate}
              </div>
              <div style={{ marginTop: 6 }}>
                <button className="lk" onClick={() => addToast('Editing')}>
                  Edit
                </button>
                <button className="lk" onClick={() => addToast('Duplicated')}>
                  Duplicate
                </button>
                <button className="lk" onClick={() => addToast('Assign branches below')}>
                  Assign branches
                </button>
                <button className="lk r" onClick={() => addToast('Shift retired')}>
                  Retire
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Add shift — Evening Support</h2>
        <p className="sub">Net hours update live as you edit times and breaks.</p>
        <div className="g3">
          <div>
            <label>
              Shift name <span className="rq">*</span>
            </label>
            <input
              type="text"
              id="sn"
              value={shiftName}
              onChange={(e) => {
                setShiftName(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Start time <span className="rq">*</span>
            </label>
            <input
              type="time"
              id="st"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              End time <span className="rq">*</span>
            </label>
            <input
              type="time"
              id="en"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Break duration (min) <span className="rq">*</span>
            </label>
            <input
              type="number"
              id="br"
              value={breakMin}
              onChange={(e) => {
                setBreakMin(Number(e.target.value) || 0);
                setDirty();
              }}
            />
          </div>

          <div>
            <label>
              Attendance policy <span className="rq">*</span>
            </label>
            <select
              value={attendancePolicy}
              onChange={(e) => {
                setAttendancePolicy(e.target.value);
                setDirty();
              }}
            >
              <option value="Standard Office Policy">Standard Office Policy</option>
              <option value="Ramadan Schedule">Ramadan Schedule</option>
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
        </div>

        {/* Live Calculation Pill */}
        <div id="calc" style={{ margin: '12px 0' }}>
          {calcResult.isNight && (
            <span className="bd b-k" style={{ marginRight: 6 }}>
              Night shift — auto-detected (ends after midnight)
            </span>
          )}
          <span className="bd b-i">
            {calcResult.netHoursText} · {calcResult.grossHoursText}
          </span>
        </div>

        <label>Working days</label>
        <div className="chips">
          {daysList.map((day) => (
            <button
              key={day}
              type="button"
              className={`chip ${workingDays.includes(day) ? 'on' : ''}`}
              aria-pressed={workingDays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <label style={{ marginTop: 14 }}>Branch assignment</label>
        <div className="chips">
          {branchList.map((branch) => (
            <button
              key={branch}
              type="button"
              className={`chip ${branches.includes(branch) ? 'on' : ''}`}
              aria-pressed={branches.includes(branch)}
              onClick={() => toggleBranch(branch)}
            >
              {branch}
            </button>
          ))}
        </div>

        <div className="al w" role="note" style={{ marginTop: 14 }}>
          <b>Overlap warning</b>
          <span>
            16:00 – 00:30 overlaps General Shift by 1 hour for Cairo HQ. Confirm the overlap before saving.
          </span>
        </div>

        <button type="button" className="btn p" onClick={handleAddShift}>
          Add shift
        </button>
      </section>
    </>
  );
};
