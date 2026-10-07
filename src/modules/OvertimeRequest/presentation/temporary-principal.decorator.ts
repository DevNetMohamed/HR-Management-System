import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../application/ports/authorization.gateway';

function firstHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * DEVELOPMENT-ONLY principal adapter.
 * These headers are controlled by the caller and are NOT production-safe.
 * Replace this decorator with a principal populated by verified authentication.
 */
export const TemporaryPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    const userId = firstHeader(request.headers, 'x-user-id');
    const companyId = firstHeader(request.headers, 'x-company-id');
    const employeeId = firstHeader(request.headers, 'x-employee-id');
    const permissionsHeader = firstHeader(request.headers, 'x-permissions');

    if (!userId || !companyId) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Temporary principal requires x-user-id and x-company-id',
      });
    }

    return {
      userId,
      companyId,
      employeeId: employeeId || null,
      permissions: permissionsHeader
        ? permissionsHeader
            .split(',')
            .map((permission) => permission.trim())
            .filter(Boolean)
        : [],
    };
  },
);
