import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ACCESS = 'requiredAccessPermission';
export const RequireAccess = (permission: string) => SetMetadata(REQUIRED_ACCESS, permission);
