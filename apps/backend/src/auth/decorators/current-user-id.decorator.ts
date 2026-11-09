import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * The authenticated user's numeric id. better-auth exposes ids as strings,
 * while the rest of the schema references users by integer id.
 * `undefined` on routes where authentication is optional and nobody is signed in.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    // `user` is attached to the request by the better-auth guard.
    const { user } = ctx
      .switchToHttp()
      .getRequest<Request & { user?: { id: string } | null }>();
    return user ? Number(user.id) : undefined;
  },
);
