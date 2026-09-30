import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// export const CurrentCompany = createParamDecorator(
//   (_: unknown, ctx: ExecutionContext): string =>
//     ctx.switchToHttp().getRequest().user.companyId,

// );


export const CurrentCompany = createParamDecorator(
  (_data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return request.headers['x-company-id'];
  },
);
