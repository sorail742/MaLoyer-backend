import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ActiveOtpCode,
  ClaimRefreshTokenResult,
  CreatedSession,
  IAuthRepository,
} from './auth-repository.interface';

/**
 * Adapter — seule classe du module `auth` qui importe `PrismaService`.
 * Voir darmeuble-kit/docs/backend/adr/0003-pattern-repository-port-adapter.md.
 */
@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    userId: string,
    deviceInfo: string | null,
  ): Promise<CreatedSession> {
    const session = await this.prisma.userSession.create({
      data: { userId, deviceInfo },
    });
    return { sessionId: session.id };
  }

  async createRefreshToken(
    sessionId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { sessionId, tokenHash, expiresAt },
    });
  }

  async claimRefreshToken(tokenHash: string): Promise<ClaimRefreshTokenResult> {
    const now = new Date();
    // Réclamation atomique gardée par `usedAt: null` — motif
    // finalizeTransaction (darmeuble-kit/docs/backend/paiements-djomy.md),
    // appliqué ici à la rotation de refresh token comme l'exige ADR-0004 :
    // deux appels concurrents avec le même token ne peuvent pas gagner
    // tous les deux la réclamation.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
        session: { revokedAt: null },
      },
      data: { usedAt: now },
    });

    if (claimed.count === 1) {
      const token = await this.prisma.refreshToken.findUniqueOrThrow({
        where: { tokenHash },
        include: { session: { include: { user: true } } },
      });
      return {
        outcome: 'claimed',
        sessionId: token.sessionId,
        userId: token.session.userId,
        role: token.session.user.role,
        organizationId: token.session.user.organizationId,
      };
    }

    return this.diagnoseUnclaimedToken(tokenHash, now);
  }

  /**
   * La réclamation a échoué : distingue "jamais vu", "expiré",
   * "session déjà révoquée" et "déjà réclamé" (réutilisation — signe
   * probable de vol, voir ADR-0004) pour qu'`AuthService` révoque la
   * session entière uniquement dans ce dernier cas.
   */
  private async diagnoseUnclaimedToken(
    tokenHash: string,
    now: Date,
  ): Promise<ClaimRefreshTokenResult> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    });
    if (!existing) {
      return { outcome: 'not_found' };
    }
    if (existing.session.revokedAt) {
      return { outcome: 'session_revoked' };
    }
    if (existing.usedAt) {
      return { outcome: 'reused', sessionId: existing.sessionId };
    }
    if (existing.expiresAt <= now) {
      return { outcome: 'expired' };
    }
    // Ne devrait pas arriver (la réclamation aurait dû réussir) — traité
    // comme "not_found" plutôt qu'une exception, pour ne pas transformer un
    // état incohérent en 500 sur le chemin d'authentification.
    return { outcome: 'not_found' };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async createOtpCode(
    phone: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.otpCode.create({ data: { phone, codeHash, expiresAt } });
  }

  async findActiveOtpCode(phone: string): Promise<ActiveOtpCode | null> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) return null;
    return { id: otp.id, codeHash: otp.codeHash, attempts: otp.attempts };
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await this.prisma.otpCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async consumeOtpCode(id: string): Promise<void> {
    // Suppression physique — catégorie C
    // (darmeuble-kit/docs/backend/soft-delete.md) : un code OTP n'a pas de
    // valeur d'historique une fois consommé ou expiré.
    await this.prisma.otpCode.delete({ where: { id } });
  }
}
