import { Role } from '../../../prisma/prisma-client';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export interface CreatedSession {
  sessionId: string;
}

/**
 * Résultat de la réclamation atomique d'un refresh token (ADR-0004). Union
 * discriminée plutôt qu'un booléen + message : chaque cas a une
 * conséquence différente pour `AuthService` (`reused` révoque la session
 * entière, les autres se contentent de rejeter la requête courante).
 */
export type ClaimRefreshTokenResult =
  | {
      outcome: 'claimed';
      sessionId: string;
      userId: string;
      role: Role;
      organizationId: string | null;
    }
  | { outcome: 'reused'; sessionId: string }
  | { outcome: 'session_revoked' }
  | { outcome: 'expired' }
  | { outcome: 'not_found' };

export interface ActiveOtpCode {
  id: string;
  codeHash: string;
  attempts: number;
}

/**
 * Port — regroupe les données propres à l'authentification (sessions,
 * refresh tokens, codes OTP). Distinct de `IUsersRepository` : ce ne sont
 * pas des données métier tenant-scopées mais des données techniques de
 * cycle de vie de connexion (catégories C, voir
 * darmeuble-kit/docs/backend/soft-delete.md). Voir
 * darmeuble-kit/docs/backend/adr/0003-pattern-repository-port-adapter.md.
 */
export interface IAuthRepository {
  createSession(
    userId: string,
    deviceInfo: string | null,
  ): Promise<CreatedSession>;

  createRefreshToken(
    sessionId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;

  claimRefreshToken(tokenHash: string): Promise<ClaimRefreshTokenResult>;

  revokeSession(sessionId: string): Promise<void>;

  createOtpCode(
    phone: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void>;

  findActiveOtpCode(phone: string): Promise<ActiveOtpCode | null>;

  incrementOtpAttempts(id: string): Promise<void>;

  consumeOtpCode(id: string): Promise<void>;
}
