// Provisional TypeScript models for Company Setup Wizard (Phase 1: Configuration System)
// These interfaces reflect the entities and states verified from the HTML reference.

export type WizardStepId =
  | 'company-profile'
  | 'locale-url'
  | 'branches-empty'
  | 'branch-form'
  | 'branches-list'
  | 'calendars-policies'
  | 'shifts'
  | 'organization'
  | 'role-form'
  | 'roles-list'
  | 'permission-matrix'
  | 'notification-form'
  | 'notifications-list'
  | 'review-publish'
  | 'blocked-errors'
  | 'publish-success';

export interface CompanyIdentity {
  displayName: string;
  legalName: string;
  country: string;
  taxNumber: string;
  logoFileName: string;
}

export interface CompanyLocaleUrl {
  currency: string;
  timezone: string;
  language: string;
  subdomain: string;
}

export interface Branch {
  name: string;
  code: string;
  city: string;
  address?: string;
  timezone: string;
  timezoneOverride: boolean;
  currency: string;
  currencyOverride: boolean;
  calendar: string;
  calendarOverride: boolean;
  status: 'Active' | 'Draft' | 'Retired';
  effectiveDate: string;
  isHeadOffice?: boolean;
}

export interface WorkweekConfig {
  timezone: string;
  weekendDays: string;
  firstDayOfWeek: string;
  workingDays: string[];
  standardDailyHours: number;
}

export interface AttendancePolicy {
  name: string;
  lateGracePeriod: number;
  earlyLeaveGrace: number;
  halfDayRule: string;
  absenceRule: string;
  overtimeMultiplier: string;
  geofenceRequired: boolean;
  remoteAttendanceAllowed: boolean;
  overtimeEnabled: boolean;
  effectiveDate: string;
}

export interface Shift {
  id?: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  attendancePolicy: string;
  effectiveDate: string;
  workingDays: string[];
  assignedBranches: string[];
  isNightShift: boolean;
  detailsSummary?: string;
  daysSummary?: string;
  branchSummary?: string;
}

export interface Department {
  name: string;
  code: string;
  subTeamsCount: number;
  costCenter: string;
  branch: string;
  manager: string;
  effectiveDate?: string;
  assignedBranches?: string[];
  subTeams?: { name: string; code: string; subTeamsCount: number }[];
}

export type DataScope = 'Self' | 'Direct Reports' | 'Team' | 'Department' | 'Branch' | 'Company';

export type FieldAccessLevel = 'Hidden' | 'Masked' | 'Read only' | 'Editable';

export interface Role {
  name: string;
  type: 'System' | 'Custom';
  description: string;
  purpose?: string;
  permissionsCount: number;
  dataScope: DataScope;
  assignedUsersCount: number;
  effectiveDate: string;
  isProtected?: boolean;
  status: 'Active' | 'Draft';
}

export interface PermissionMatrixModule {
  module: string;
  resource: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export interface RolePreset {
  id: string;
  name: string;
  description?: string;
  tier: string; // e.g. "Level 1", "Level 2", "Level 3"
  dataScope: DataScope;
  permissions: PermissionMatrixModule[];
  fieldAccess: Record<string, FieldAccessLevel>;
  assignedGroups?: string[];
}

export interface NotificationRule {
  id?: string;
  name: string;
  event: string;
  recipients: string;
  recipientRoles: string;
  priority: 'Urgent' | 'High' | 'Normal';
  language: string;
  channels: string[];
  delivery: string;
  reminderFrequency: string;
  quietHours: string;
  digestOption: string;
  escalationPath: string[];
  isMandatory: boolean;
  status: 'Active' | 'Draft' | 'Deactivated';
}

export interface BlockingFixes {
  p: number; // E1: Branch without policy (New Cairo Hub)
  s: number; // E2: Shift without branches (Evening Support)
  r: number; // E3: Self-approval risk on Manager role
}

export interface WizardDraftState {
  pageIndex: number;
  maxPageIndex: number;
  skippedSteps: Record<number, boolean>;
  saveStatus: 'Saved' | 'Saving…' | 'Unsaved changes';
  calendarTab: 'w' | 'a';
  selectedTimezone: string;
  blockingFixes: BlockingFixes;
  warningsAcknowledged: boolean;
  isBlockedMode: boolean;
  isPublishedDone: boolean;
  selectedDepartment: string;
  theme: 'light' | 'dark';

  // Wizard Data Collections
  identity: CompanyIdentity;
  localeUrl: CompanyLocaleUrl;
  branches: Branch[];
  workweek: WorkweekConfig;
  attendancePolicy: AttendancePolicy;
  shifts: Shift[];
  departments: Department[];
  roles: Role[];
  permissions: PermissionMatrixModule[];
  dataScope: DataScope;
  fieldAccess: Record<string, FieldAccessLevel>;
  rolePresets: RolePreset[];
  selectedPresetId?: string;
  notificationRules: NotificationRule[];
  taxError: string;
}

export interface SetupPublishPayload {
  version: string;
  effectiveDate: string;
  changeSummary: string;
  acknowledgedWarnings: boolean;
}

export interface SetupPublishResponse {
  success: boolean;
  version: string;
  publishedAt: string;
  message: string;
}
