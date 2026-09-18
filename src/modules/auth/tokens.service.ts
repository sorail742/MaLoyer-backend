import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { AppConfig } from '../../config/configuration';
import { Role } from '../../prisma/prisma-client';
import { parseDurationMs, sha256Hex } from './auth.util';
import { AUTH_REPOSITORY } from './repositories/auth-repository.interface';
import type { IAuthRepository } from './repositories/auth-repository.interface';
import type { JwtPayload } from './strategies/jwt.strategy';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

interface UserIdentity {
  id: string;
  role: Role;
  organizationId: string | null;
}

/**
 * Émission et rotation des jetons access/refresh (ADR-0004). Isolé
 * d'`AuthService` pour que l'orchestration des parcours (login, OTP,
 * inscription) reste lisible sans le détail cryptographique — voir
 * darmeuble-kit/docs/backend/coding-rules-backend.md §"Taille et
 * complexité des fichiers".
 */
@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {}

  /**
   * Chemin unique de signature pour les deux parcours de connexion
   * (email/mot de passe et OTP locataire) — voir ADR-0004
   * "Les deux émettent le même couple de jetons par un chemin unique".
   */
  async issueAuthResult(
    user: UserIdentity,
    deviceInfo: string | null,
  ): Promise<IssuedTokens> {
    const { sessionId } = await this.authRepository.createSession(
      user.id,
      deviceInfo,
    );
    const refreshToken = await this.attachNewRefreshToken(sessionId);
    const accessToken = this.signAccessToken({
      sub: user.id,
      sid: sessionId,
      role: user.role,
      organizationId: user.organizationId,
    });
    return { accessToken, refreshToken, sessionId };
  }

  /**
   * Rotation après une réclamation réussie (`POST /auth/refresh`) — même
   * session, nouveau refresh token, nouvel access token.
   */
  async rotate(claimed: {
    sessionId: string;
    userId: string;
    role: Role;
    organizationId: string | null;
  }): Promise<IssuedTokens> {
    const refreshToken = await this.attachNewRefreshToken(claimed.sessionId);
    const accessToken = this.signAccessToken({
      sub: claimed.userId,
      sid: claimed.sessionId,
      role: claimed.role,
      organizationId: claimed.organizationId,
    });
    return { accessToken, refreshToken, sessionId: claimed.sessionId };
  }

  private async attachNewRefreshToken(sessionId: string): Promise<string> {
    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpiresIn = this.configService.get('jwt', {
      infer: true,
    }).refreshExpiresIn;
    const expiresAt = new Date(Date.now() + parseDurationMs(refreshExpiresIn));
    await this.authRepository.createRefreshToken(
      sessionId,
      sha256Hex(refreshToken),
      expiresAt,
    );
    return refreshToken;
  }

  private signAccessToken(payload: JwtPayload): string {
    const jwtConfig = this.configService.get('jwt', { infer: true });
    return this.jwtService.sign(payload, {
      secret: jwtConfig.accessSecret,
      // `expiresIn` est typé par un gabarit de chaîne (`StringValue` de la
      // bibliothèque `ms`) côté `@nestjs/jwt` — notre config valide déjà ce
      // format elle-même (`parseDurationMs`, voir auth.util.ts), d'où ce
      // seul cast ciblé plutôt qu'un `any`.
      expiresIn: jwtConfig.accessExpiresIn as NonNullable<
        JwtSignOptions['expiresIn']
      >,
    });
  }
}
