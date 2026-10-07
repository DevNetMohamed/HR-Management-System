export enum OvertimeNotificationType {
  MANAGER_REJECTED = 'MANAGER_REJECTED',
  HR_APPROVED = 'HR_APPROVED',
  HR_REJECTED = 'HR_REJECTED',
}

export interface SendOvertimeNotificationInput {
  companyId: string;
  employeeId: string;
  requestId: string;
  type: OvertimeNotificationType;
}

export interface NotificationPort {
  send(input: SendOvertimeNotificationInput): Promise<void>;
}

export const NOTIFICATION_PORT = Symbol('NOTIFICATION_PORT');
