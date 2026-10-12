// import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// export const CurrentCompany = createParamDecorator(
//   (_: unknown, ctx: ExecutionContext): string =>
//     ctx.switchToHttp().getRequest().user.companyId,

// );

// TODO

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const STATIC_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000';

export const CurrentCompany = createParamDecorator(
  (_: unknown, _ctx: ExecutionContext): string => {
    return STATIC_COMPANY_ID;
  },
);