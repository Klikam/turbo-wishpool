export interface JwtPayload {
  sub: number;
  email: string;
}

export interface RefreshJwtPayload extends JwtPayload {
  sid: string;
}
