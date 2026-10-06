import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RefreshJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException('Lack of JWT token');

    let payload: RefreshJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(token, {
        secret: process.env.jwtRefreshTokenKey,
      });
    } catch {
      throw new UnauthorizedException();
    }

    if (typeof payload.sub !== 'number' || typeof payload.sid !== 'string')
      throw new UnauthorizedException();

    request.refreshSession = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request) {
    if (!request.headers.authorization) return undefined;
    const [type, token] = request.headers.authorization.split(' ');
    return type === 'Refresh' ? token : undefined;
  }
}
