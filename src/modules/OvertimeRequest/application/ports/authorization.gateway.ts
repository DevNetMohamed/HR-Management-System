export interface AuthenticatedPrincipal {
  userId: string;
  employeeId: string | null;
  companyId: string;
  permissions: readonly string[];
}

export interface ManagerReviewAuthorizationInput {
  principal: AuthenticatedPrincipal;
  targetEmployeeId: string;
}

export interface HrReviewAuthorizationInput {
  principal: AuthenticatedPrincipal;
}

export interface AuthorizationGateway {
  canReviewAsManager(input: ManagerReviewAuthorizationInput): Promise<boolean>;

  canReviewAsHr(input: HrReviewAuthorizationInput): Promise<boolean>;
}

export const AUTHORIZATION_GATEWAY = Symbol('AUTHORIZATION_GATEWAY');
