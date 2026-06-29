import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';

export interface TokenPayload {
  sub: string;   // user id
  role: string;
  email: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: Pick<TokenPayload, 'sub'>): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): Pick<TokenPayload, 'sub'> {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as Pick<TokenPayload, 'sub'>;
}
