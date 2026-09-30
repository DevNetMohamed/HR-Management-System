export interface OrganizationGateway {
  departmentExists(companyId: string, id: string): Promise<boolean>;
  positionExists(companyId: string, id: string): Promise<boolean>;
  branchExists(companyId: string, id: string): Promise<boolean>;
}
export const ORGANIZATION_GATEWAY = Symbol('ORGANIZATION_GATEWAY');
