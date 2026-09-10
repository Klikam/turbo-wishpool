import { JwtPayload } from './src/auth/interfaces/jwt-payload.interface';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      PORT: string;
      jwtSecretKey: string;
      jwtRefreshTokenKey: string;
    }
  }

  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
