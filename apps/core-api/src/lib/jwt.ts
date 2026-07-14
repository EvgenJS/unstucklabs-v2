import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

// Pinned explicitly rather than relying on jsonwebtoken's default accepted
// algorithm list -- both signing and verifying always use this one HMAC
// scheme, so there's no reason to leave the door open to any other.
const ALGORITHM = "HS256";

export interface AccessTokenPayload {
  sub: string; // userId
}

export interface RefreshTokenPayload {
  sub: string; // userId
  tokenVersion: number; // must match User.tokenVersion -- see schema.prisma
}

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not set");
  return secret;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
    algorithm: ALGORITHM,
  });
}

export function signRefreshToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ sub: userId, tokenVersion } satisfies RefreshTokenPayload, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_TTL,
    algorithm: ALGORITHM,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getAccessSecret(), { algorithms: [ALGORITHM] }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, getRefreshSecret(), { algorithms: [ALGORITHM] }) as RefreshTokenPayload;
}
