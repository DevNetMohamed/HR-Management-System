'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  WizardDraftState,
  Shift,
  FieldAccessLevel,
  DataScope,
  SetupPublishPayload,
} from '@/types/setup';
import {
  initialSetupData,
  STEPS_LABELS,
  TIMEZONE_WORKWEEK_MAP,
} from '@/mocks/mockSetupData';
import { setupService } from '@/services/setupService';

export interface ModalConfig {
  title: string;
  subtitle: string;
  content?: ReactNode;
  confirmText: string;
  confirmStyle?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
}

// 16 Views mapping 1:1 with HTML pgs array
export const PAGE_DEFINITIONS = [
  /* 0 */ { st: 0, id: 'company-profile', title: 'Company Profile', sub: 'Core identity and company defaults. These cascade to every branch.', pageLabel: 'Page 1 of 2' },
  /* 1 */ { st: 0, id: 'locale-url', title: 'Locale & Company URL', sub: 'Regional defaults and the address your team signs in at.', pageLabel: 'Page 2 of 2' },
  /* 2 */ { st: 1, id: 'Additional Branches', title: 'Additional Branches', sub: 'Extend beyond the head office, or skip and add branches later.', skip: true },
  /* 3 */ { st: 1, id: 'Add / Edit Branch', title: 'Add branch — Alexandria Office', sub: 'Draft branch. Inherits company defaults until you override.', skip: true, nextLabel: 'Save branch' },
  /* 4 */ { st: 1, id: 'Branches List', title: 'Additional Branches', sub: '3 branches · 1 head office · 2 drafts. Overrides are highlighted.', skip: true },
  /* 5 */ { st: 2, id: 'Calendars', title: 'Calendars & Attendance Policies', sub: 'Workweek and attendance rules. Priority: branch override wins over company default.' },
  /* 6 */ { st: 3, id: 'Shifts', title: 'Shifts', sub: 'Shifts live independently of branches. Add or edit below.' },
  /* 7 */ { st: 4, id: 'Organization', title: 'Departments & Organization', sub: 'Build the hierarchy and add departments in one place.' },
  /* 8 */ { st: 5, id: 'Add / Edit Role', title: 'Add role — Payroll Specialist', sub: "Describe the role's purpose before assigning permissions.", nextLabel: 'Save role' },
  /* 9 */ { st: 5, id: 'Roles List', title: 'Roles & Access Control', sub: 'Start from 4 default roles. User assignment happens after employees are added.' },
  /* 10 */ { st: 5, id: 'Permission Matrix', title: 'Permission matrix — HR Admin', sub: '34 permissions · data scope Branch · self-approval blocked.' },
  /* 11 */ { st: 6, id: 'Add / Edit Rule', title: 'Add rule — Approval Overdue', sub: 'Recipients resolve dynamically from the employee, manager, roles and org.', skip: true, nextLabel: 'Save rule' },
  /* 12 */ { st: 6, id: 'Rules List', title: 'Notification Defaults', sub: '6 system defaults ready — use as-is or tailor. Mandatory rules cannot be disabled.', skip: true },
  /* 13 */ { st: 7, id: 'Review & Publish', title: 'Review & Publish', sub: 'Publishing freezes v1.0 — immutable. Later edits create v1.1.' },
  /* 14 */ { st: 7, id: 'Blocked', title: 'Resolve blocking errors to publish', sub: 'Warnings can be acknowledged. Blocking errors must be fixed.' },
  /* 15 */ { st: 7, id: 'Success', title: 'Company setup published', sub: '', noStep: true },
];

export interface WizardContextType {
  state: WizardDraftState;
  toasts: ToastItem[];
  modal: ModalConfig | null;
  addToast: (msg: string) => void;
  closeModal: () => void;
  setModal: (config: ModalConfig | null) => void;
  setDirty: () => void;
  toggleTheme: () => void;
  goI: (i: number) => void;
  go: (id: string) => void;
  goStep: (stepNum: number) => void;
  next: () => void;
  skip: () => void;
  back: () => void;
  saveDraft: (exit?: boolean) => void;
  applyFix: (key: 'p' | 's' | 'r') => void;
  confirmPublish: () => void;
  promptPublish: () => void;
  deleteDraftBranchModal: (name: string) => void;
  addShift: (shift: Shift) => void;
  addDepartment: (
    name: string,
    code: string,
    extra?: {
      costCenter?: string;
      branch?: string;
      effectiveDate?: string;
      assignedBranches?: string[];
      subTeams?: { name: string; code: string; subTeamsCount: number }[];
    }
  ) => void;
  updateDepartmentSubTeams: (
    deptName: string,
    subTeams: { name: string; code: string; subTeamsCount: number }[]
  ) => void;
  updateIdentity: (field: string, val: string) => void;
  updateLocaleUrl: (field: string, val: string) => void;
  setCalendarTab: (tab: 'w' | 'a') => void;
  setTimezone: (tz: string) => void;
  setSelectedDepartment: (deptName: string) => void;
  setWarningsAcknowledged: (checked: boolean) => void;
  setDataScope: (scope: DataScope) => void;
  togglePermission: (moduleIndex: number, perm: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export') => void;
  cycleFieldAccess: (fieldName: string) => void;
  applyRolePreset: (presetId: string) => void;
  saveCurrentAsPreset: (preset: {
    name: string;
    tier: string;
    description?: string;
    assignedGroups?: string[];
  }) => void;
  updatePresetAssignedGroups: (presetId: string, groups: string[]) => void;
  toggleNotificationStatus: (index: number) => void;
  updateAttendancePolicy: (field: string, val: unknown) => void;
  updateWorkweek: (field: string, val: unknown) => void;
  toggleWorkingDay: (day: string) => void;
  applyWorkweekDefaults: () => void;
  calculateShiftHours: (startTime: string, endTime: string, breakMinutes: number) => {
    isNight: boolean;
    netHoursText: string;
    grossHoursText: string;
  };
}

const WizardContext = createContext<WizardContextType | null>(null);

export const WizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Wizard state initialized in-memory (resets on page refresh, per specification)
  const [state, setState] = useState<WizardDraftState>(() => {
    let initialTheme: 'light' | 'dark' = 'light';
    if (typeof window !== 'undefined') {
      try {
        const storedTheme = localStorage.getItem('th') as 'light' | 'dark' | null;
        if (storedTheme) {
          initialTheme = storedTheme;
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          initialTheme = 'dark';
        }
      } catch {
        // storage fallback
      }
    }
    return { ...initialSetupData, theme: initialTheme };
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalConfig | null>(null);

  // Synchronize document theme attribute with current theme
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  const addToast = useCallback((msg: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message: msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const setDirty = useCallback(() => {
    setState((prev) => {
      if (prev.saveStatus === 'Unsaved changes') return prev;
      return { ...prev, saveStatus: 'Unsaved changes' };
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => {
      const nextTheme = prev.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem('th', nextTheme);
      } catch {
        // storage fallback
      }
      return { ...prev, theme: nextTheme };
    });
  }, []);

  const goI = useCallback((i: number) => {
    setState((prev) => ({
      ...prev,
      pageIndex: i,
      maxPageIndex: Math.max(prev.maxPageIndex, i),
    }));
  }, []);

  const go = useCallback((id: string) => {
    const targetIndex = PAGE_DEFINITIONS.findIndex((p) => p.id === id);
    if (targetIndex !== -1) {
      goI(targetIndex);
    }
  }, [goI]);

  const goStep = useCallback((stepNum: number) => {
    setState((prev) => {
      const targetFirstPageIndex = PAGE_DEFINITIONS.findIndex((p) => p.st === stepNum);
      const maxAllowedStep = PAGE_DEFINITIONS[prev.maxPageIndex].st;
      if (stepNum > maxAllowedStep) {
        addToast(`Finish ${STEPS_LABELS[maxAllowedStep]} first — later steps depend on it.`);
        return prev;
      }
      return {
        ...prev,
        pageIndex: targetFirstPageIndex,
        maxPageIndex: Math.max(prev.maxPageIndex, targetFirstPageIndex),
      };
    });
  }, [addToast]);

  const back = useCallback(() => {
    setState((prev) => {
      if (prev.pageIndex <= 0) return prev;
      return { ...prev, pageIndex: prev.pageIndex - 1 };
    });
  }, []);

  const saveDraft = useCallback((exit = false) => {
    setState((prev) => ({ ...prev, saveStatus: 'Saving…' }));
    setupService.saveDraft(state);
    setTimeout(() => {
      setState((prev) => ({ ...prev, saveStatus: 'Saved' }));
      addToast(exit ? 'Draft saved. You can resume anytime.' : 'Saved as draft');
    }, 450);
  }, [addToast, state]);

  const next = useCallback(() => {
    setState((prev) => {
      // Step 0 validation: Tax number validation (must be 9 digits for Egypt if provided)
      if (prev.pageIndex === 0) {
        const cleanTax = prev.identity.taxNumber.replace(/\D/g, '');
        if (cleanTax && cleanTax.length !== 9) {
          return { ...prev, taxError: 'Tax number must be 9 digits for Egypt.' };
        }
      }

      // Mark saving status
      setTimeout(() => {
        setState((current) => ({
          ...current,
          saveStatus: 'Saved',
        }));
        addToast('Saved');
      }, 450);

      const currentPage = PAGE_DEFINITIONS[prev.pageIndex];
      let nextIndex = prev.pageIndex + 1;

      // Custom page navigation sequences from HTML:
      if (currentPage.id === 'Additional Branches') {
        nextIndex = PAGE_DEFINITIONS.findIndex((p) => p.id === 'Calendars');
      } else if (currentPage.id === 'Add / Edit Branch') {
        nextIndex = PAGE_DEFINITIONS.findIndex((p) => p.id === 'Branches List');
      } else if (currentPage.id === 'Branches List') {
        nextIndex = PAGE_DEFINITIONS.findIndex((p) => p.id === 'Calendars');
      } else if (currentPage.id === 'Roles List') {
        nextIndex = PAGE_DEFINITIONS.findIndex((p) => p.id === 'Permission Matrix');
      } else if (currentPage.id === 'Add / Edit Rule') {
        nextIndex = PAGE_DEFINITIONS.findIndex((p) => p.id === 'Rules List');
      } else if (currentPage.id === 'Rules List') {
        nextIndex = PAGE_DEFINITIONS.findIndex((p) => p.id === 'Review & Publish');
      }

      return {
        ...prev,
        taxError: '',
        saveStatus: 'Saving…',
        pageIndex: nextIndex,
        maxPageIndex: Math.max(prev.maxPageIndex, nextIndex),
      };
    });
  }, [addToast]);

  const skip = useCallback(() => {
    setState((prev) => {
      const currentStep = PAGE_DEFINITIONS[prev.pageIndex].st;
      const nextStepFirstPageIndex = PAGE_DEFINITIONS.findIndex((p) => p.st > currentStep);

      addToast(`${STEPS_LABELS[currentStep]} skipped — you can add it later`);

      return {
        ...prev,
        skippedSteps: { ...prev.skippedSteps, [currentStep]: true },
        pageIndex: nextStepFirstPageIndex !== -1 ? nextStepFirstPageIndex : prev.pageIndex + 1,
        maxPageIndex: Math.max(
          prev.maxPageIndex,
          nextStepFirstPageIndex !== -1 ? nextStepFirstPageIndex : prev.pageIndex + 1
        ),
      };
    });
  }, [addToast]);

  const applyFix = useCallback((key: 'p' | 's' | 'r') => {
    setState((prev) => {
      const nextFixes = { ...prev.blockingFixes, [key]: 1 };
      return {
        ...prev,
        blockingFixes: nextFixes,
        saveStatus: 'Unsaved changes',
      };
    });
    addToast('Fix applied');
  }, [addToast]);

  const confirmPublish = useCallback(() => {
    setModal({
      title: 'Publish configuration v1.0?',
      subtitle:
        'Effective 01 Mar 2026 · by Mona Adel. This version becomes immutable — future changes create v1.1. 2 warnings acknowledged.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card" style={{ padding: '10px 14px', margin: 0 }}>
            <div className="tr" style={{ border: 0, padding: '3px 0' }}>
              <div>Branches</div>
              <b>3 (1 head office)</b>
            </div>
            <div className="tr" style={{ border: 0, padding: '3px 0' }}>
              <div>Shifts · Departments · Roles</div>
              <b>2 · 6 · 5</b>
            </div>
          </div>
          <div className="al w" role="note">
            <b>Skipped step carried over</b>
            <span>Notifications used system defaults. You can refine rules after publishing.</span>
          </div>
        </div>
      ),
      confirmText: 'Confirm & publish v1.0',
      confirmStyle: 'primary',
      onConfirm: async () => {
        closeModal();
        const payload: SetupPublishPayload = {
          version: 'v1.0',
          effectiveDate: '2026-03-01',
          changeSummary:
            'Initial setup: 3 branches, 2 shifts, 6 departments, 5 roles, 4 notification rules.',
          acknowledgedWarnings: true,
        };
        await setupService.publishConfiguration(payload);
        setState((prev) => ({
          ...prev,
          isPublishedDone: true,
          pageIndex: PAGE_DEFINITIONS.findIndex((p) => p.id === 'Success'),
        }));
        addToast('Published v1.0');
      },
    });
  }, [closeModal, addToast]);

  const promptPublish = useCallback(() => {
    if (!state.warningsAcknowledged) {
      addToast('Acknowledge the 2 warnings first');
      return;
    }
    const resolvedCount = state.blockingFixes.p + state.blockingFixes.s + state.blockingFixes.r;
    if (resolvedCount < 3) {
      setState((prev) => ({
        ...prev,
        isBlockedMode: true,
        pageIndex: PAGE_DEFINITIONS.findIndex((p) => p.id === 'Blocked'),
      }));
    } else {
      confirmPublish();
    }
  }, [state.warningsAcknowledged, state.blockingFixes, addToast, confirmPublish]);

  const deleteDraftBranchModal = useCallback((branchName: string) => {
    setModal({
      title: 'Remove draft branch?',
      subtitle: `“${branchName}” will be removed from this draft. Published branches can't be deleted here.`,
      confirmText: 'Remove branch',
      confirmStyle: 'danger',
      onConfirm: () => {
        closeModal();
        setState((prev) => ({
          ...prev,
          branches: prev.branches.filter((b) => b.name !== branchName),
          saveStatus: 'Unsaved changes',
        }));
        addToast('Draft branch removed');
      },
    });
  }, [closeModal, addToast]);

  const addShift = useCallback((newShift: Shift) => {
    setState((prev) => ({
      ...prev,
      shifts: [...prev.shifts, newShift],
      saveStatus: 'Unsaved changes',
    }));
    addToast('Shift added');
  }, [addToast]);

  const addDepartment = useCallback(
    (
      name: string,
      code: string,
      extra?: {
        costCenter?: string;
        branch?: string;
        effectiveDate?: string;
        assignedBranches?: string[];
        subTeams?: { name: string; code: string; subTeamsCount: number }[];
      }
    ) => {
      if (!name.trim() || !code.trim()) {
        addToast('Enter a department name and code');
        return;
      }
      const subTeams = extra?.subTeams || [];
      setState((prev) => ({
        ...prev,
        departments: [
          ...prev.departments,
          {
            name: name.trim(),
            code: code.trim(),
            subTeamsCount: subTeams.length,
            costCenter: extra?.costCenter?.trim() || 'CC-4150',
            branch: extra?.branch || (extra?.assignedBranches && extra.assignedBranches[0]) || 'Cairo HQ',
            manager: 'Unassigned',
            effectiveDate: extra?.effectiveDate,
            assignedBranches: extra?.assignedBranches,
            subTeams: subTeams,
          },
        ],
        selectedDepartment: name.trim(),
        saveStatus: 'Unsaved changes',
      }));
      addToast('Department added');
    },
    [addToast]
  );

  const updateDepartmentSubTeams = useCallback(
    (
      deptName: string,
      subTeams: { name: string; code: string; subTeamsCount: number }[]
    ) => {
      setState((prev) => {
        const nextDepts = prev.departments.map((d) => {
          if (d.name === deptName) {
            return {
              ...d,
              subTeams,
              subTeamsCount: subTeams.length,
            };
          }
          return d;
        });
        return {
          ...prev,
          departments: nextDepts,
          saveStatus: 'Unsaved changes',
        };
      });
    },
    []
  );

  const updateIdentity = useCallback((field: string, val: string) => {
    setState((prev) => ({
      ...prev,
      identity: { ...prev.identity, [field]: val },
      taxError: field === 'taxNumber' ? '' : prev.taxError,
      saveStatus: 'Unsaved changes',
    }));
  }, []);

  const updateLocaleUrl = useCallback((field: string, val: string) => {
    setState((prev) => ({
      ...prev,
      localeUrl: { ...prev.localeUrl, [field]: val },
      saveStatus: 'Unsaved changes',
    }));
  }, []);

  const setCalendarTab = useCallback((tab: 'w' | 'a') => {
    setState((prev) => ({ ...prev, calendarTab: tab }));
  }, []);

  const setTimezone = useCallback((tz: string) => {
    const wk = TIMEZONE_WORKWEEK_MAP[tz];
    setState((prev) => ({
      ...prev,
      selectedTimezone: tz,
      workweek: {
        ...prev.workweek,
        timezone: tz,
        workingDays: wk ? wk[0].split(',') : prev.workweek.workingDays,
        weekendDays: wk ? wk[1] : prev.workweek.weekendDays,
        firstDayOfWeek: wk ? wk[2] : prev.workweek.firstDayOfWeek,
      },
      saveStatus: 'Unsaved changes',
    }));
    addToast(`Weekend and week start updated for ${tz}`);
  }, [addToast]);

  const setSelectedDepartment = useCallback((deptName: string) => {
    setState((prev) => ({ ...prev, selectedDepartment: deptName }));
  }, []);

  const setWarningsAcknowledged = useCallback((checked: boolean) => {
    setState((prev) => ({ ...prev, warningsAcknowledged: checked }));
  }, []);

  const setDataScope = useCallback((scope: DataScope) => {
    setState((prev) => ({ ...prev, dataScope: scope, saveStatus: 'Unsaved changes' }));
  }, []);

  const togglePermission = useCallback((moduleIndex: number, perm: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export') => {
    setState((prev) => {
      const nextPerms = [...prev.permissions];
      nextPerms[moduleIndex] = {
        ...nextPerms[moduleIndex],
        [perm]: !nextPerms[moduleIndex][perm],
      };
      return {
        ...prev,
        permissions: nextPerms,
        saveStatus: 'Unsaved changes',
      };
    });
  }, []);

  const cycleFieldAccess = useCallback((fieldName: string) => {
    const options: FieldAccessLevel[] = ['Hidden', 'Masked', 'Read only', 'Editable'];
    setState((prev) => {
      const current = prev.fieldAccess[fieldName] || 'Hidden';
      const currentIndex = options.indexOf(current);
      const nextLevel = options[(currentIndex + 1) % options.length];
      return {
        ...prev,
        fieldAccess: {
          ...prev.fieldAccess,
          [fieldName]: nextLevel,
        },
        saveStatus: 'Unsaved changes',
      };
    });
  }, []);

  const applyRolePreset = useCallback(
    (presetId: string) => {
      setState((prev) => {
        const targetPreset = (prev.rolePresets || []).find((p) => p.id === presetId);
        if (!targetPreset) return prev;

        return {
          ...prev,
          selectedPresetId: presetId,
          dataScope: targetPreset.dataScope,
          permissions: JSON.parse(JSON.stringify(targetPreset.permissions)),
          fieldAccess: { ...targetPreset.fieldAccess },
          saveStatus: 'Unsaved changes',
        };
      });
      addToast('Role preset applied');
    },
    [addToast]
  );

  const saveCurrentAsPreset = useCallback(
    (presetData: {
      name: string;
      tier: string;
      description?: string;
      assignedGroups?: string[];
    }) => {
      setState((prev) => {
        const id = 'preset-' + Math.random().toString(36).substring(2, 8);
        const newPreset = {
          id,
          name: presetData.name.trim(),
          tier: presetData.tier.trim() || 'Custom Level',
          description: presetData.description?.trim(),
          dataScope: prev.dataScope,
          permissions: JSON.parse(JSON.stringify(prev.permissions)),
          fieldAccess: { ...prev.fieldAccess },
          assignedGroups: presetData.assignedGroups || [],
        };

        return {
          ...prev,
          rolePresets: [...(prev.rolePresets || []), newPreset],
          selectedPresetId: id,
          saveStatus: 'Unsaved changes',
        };
      });
      addToast('Saved as new permission preset');
    },
    [addToast]
  );

  const updatePresetAssignedGroups = useCallback(
    (presetId: string, groups: string[]) => {
      setState((prev) => {
        const nextPresets = (prev.rolePresets || []).map((p) => {
          if (p.id === presetId) {
            return {
              ...p,
              assignedGroups: groups,
            };
          }
          return p;
        });

        return {
          ...prev,
          rolePresets: nextPresets,
          saveStatus: 'Unsaved changes',
        };
      });
      addToast('Group assignments updated');
    },
    [addToast]
  );

  const toggleNotificationStatus = useCallback((index: number) => {
    setState((prev) => {
      const nextRules = [...prev.notificationRules];
      const target = nextRules[index];
      if (target.isMandatory) {
        addToast('Mandatory notifications cannot be disabled');
        return prev;
      }
      const newStatus = target.status === 'Active' ? 'Deactivated' : 'Active';
      nextRules[index] = { ...target, status: newStatus };
      addToast(`Rule ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
      return {
        ...prev,
        notificationRules: nextRules,
        saveStatus: 'Unsaved changes',
      };
    });
  }, [addToast]);

  const updateAttendancePolicy = useCallback((field: string, val: unknown) => {
    setState((prev) => ({
      ...prev,
      attendancePolicy: {
        ...prev.attendancePolicy,
        [field]: val,
      },
      saveStatus: 'Unsaved changes',
    }));
  }, []);

  const updateWorkweek = useCallback((field: string, val: unknown) => {
    setState((prev) => ({
      ...prev,
      workweek: {
        ...prev.workweek,
        [field]: val,
      },
      saveStatus: 'Unsaved changes',
    }));
  }, []);

  const toggleWorkingDay = useCallback((day: string) => {
    const daysOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setState((prev) => {
      const currentWorkingDays = prev.workweek.workingDays || [];
      const isCurrentlyWorking = currentWorkingDays.includes(day);

      const nextWorkingDays = isCurrentlyWorking
        ? currentWorkingDays.filter((d) => d !== day)
        : [...currentWorkingDays, day];

      const nextWeekendDaysList = daysOrder.filter((d) => !nextWorkingDays.includes(d));
      const nextWeekendDaysStr = nextWeekendDaysList.join(', ');

      return {
        ...prev,
        workweek: {
          ...prev.workweek,
          workingDays: nextWorkingDays,
          weekendDays: nextWeekendDaysStr,
        },
        saveStatus: 'Unsaved changes',
      };
    });
  }, []);

  const applyWorkweekDefaults = useCallback(() => {
    setState((prev) => {
      const tz = prev.selectedTimezone || prev.workweek.timezone || 'Africa/Cairo';
      const wk = TIMEZONE_WORKWEEK_MAP[tz] || TIMEZONE_WORKWEEK_MAP['Africa/Cairo'];
      const defaultWorkingDays = wk[0].split(',');
      const defaultWeekendDays = wk[1];
      const defaultFirstDayOfWeek = wk[2];

      return {
        ...prev,
        workweek: {
          ...prev.workweek,
          timezone: tz,
          workingDays: defaultWorkingDays,
          weekendDays: defaultWeekendDays,
          firstDayOfWeek: defaultFirstDayOfWeek,
        },
        saveStatus: 'Unsaved changes',
      };
    });
    addToast('System defaults applied');
  }, [addToast]);

  const calculateShiftHours = useCallback((startTime: string, endTime: string, breakMinutes: number) => {
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':');
      return Number(h) * 60 + Number(m);
    };
    const s = toMinutes(startTime);
    const e = toMinutes(endTime);
    const isNight = e < s;
    const grossMinutes = (e - s + 1440) % 1440;
    const netMinutes = grossMinutes - (breakMinutes || 0);

    const formatHours = (mins: number) => {
      const hrs = Math.floor(mins / 60);
      const m = String(mins % 60).padStart(2, '0');
      return `${hrs}h ${m}m`;
    };

    return {
      isNight,
      netHoursText: `${formatHours(netMinutes)} net`,
      grossHoursText: `${formatHours(grossMinutes)} gross`,
    };
  }, []);

  return (
    <WizardContext.Provider
      value={{
        state,
        toasts,
        modal,
        addToast,
        closeModal,
        setModal,
        setDirty,
        toggleTheme,
        goI,
        go,
        goStep,
        next,
        skip,
        back,
        saveDraft,
        applyFix,
        confirmPublish,
        promptPublish,
        deleteDraftBranchModal,
        addShift,
        addDepartment,
        updateDepartmentSubTeams,
        updateIdentity,
        updateLocaleUrl,
        setCalendarTab,
        setTimezone,
        setSelectedDepartment,
        setWarningsAcknowledged,
        setDataScope,
        togglePermission,
        cycleFieldAccess,
        applyRolePreset,
        saveCurrentAsPreset,
        updatePresetAssignedGroups,
        toggleNotificationStatus,
        updateAttendancePolicy,
        updateWorkweek,
        toggleWorkingDay,
        applyWorkweekDefaults,
        calculateShiftHours,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};
