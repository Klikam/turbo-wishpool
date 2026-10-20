import { ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard } from './jwt.guard';

/**
 * Lets anonymous visitors through, but validates the token when one is sent,
 * so an invalid token is rejected instead of silently treated as a visitor.
 */
@Injectable()
export class OptionalJwtGuard extends JwtGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    if (!request.headers.authorization) return true;

    return super.canActivate(context);
  }
}
