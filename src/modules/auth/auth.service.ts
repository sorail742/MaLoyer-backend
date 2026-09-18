import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { AppConfig } from '../../config/configuration';
import { Role, User } from '../../prisma/prisma-client';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { sha256Hex } from './auth.util';
import { LoginDto } from './dto/login.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RegisterDto } from './dto/register.dto';
import { AUTH_REPOSITORY } from './repositories/auth-repository.interface';
import type { IAuthRepository } from './repositories/auth-repository.interface';
import { SMS_SENDER } from './sms/sms-sender.interface';
import type { SmsSender } from './sms/sms-sender.interface';
import { TokensService } from './tokens.service';
import type { IssuedTokens } from './tokens.service';

const BCRYPT_SALT_ROUNDS = 12;

export interface AuthResult {
  tokens: IssuedTokens;
  user: User;
}

/**
 * Orchestration des parcours d'authentification (cahier des charges §6.4,
 * §9.2) : inscription du compte principal, connexion email/mot de passe,
 * OTP locataire, rotation de refresh token. Le détail cryptographique est
 * délégué à `TokensService` — voir
 * darmeuble-kit/docs/backend/coding-rules-backend.md §"Taille et
 * complexité des fichiers".
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly tokensService: TokensService,
    private readonly configService: ConfigService<AppConfig, true>,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(SMS_SENDER)
    private readonly smsSender: SmsSender,
  ) {}

  async register(
    dto: RegisterDto,
    deviceInfo: string | null,
  ): Promise<AuthResult> {
    const organization = await this.organizationsService.register(
      dto.organizationName,
    );
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create({
      organizationId: organization.id,
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: Role.owner,
    });
    const tokens = await this.tokensService.issueAuthResult(
      { id: user.id, role: user.role, organizationId: user.organizationId },
      deviceInfo,
    );
    return { tokens, user };
  }

  async login(dto: LoginDto, deviceInfo: string | null): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const invalidCredentials = () =>
      new UnauthorizedException('Identifiants invalides');

    if (!user || !user.passwordHash || !user.isActive) {
      throw invalidCredentials();
    }
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw invalidCredentials();
    }

    const tokens = await this.tokensService.issueAuthResult(
      { id: user.id, role: user.role, organizationId: user.organizationId },
      deviceInfo,
    );
    return { tokens, user };
  }

  /**
   * Ne révèle jamais si le numéro correspond à un compte réel — toujours
   * un message générique côté controller, un code n'est réellement généré
   * et envoyé que si un `User` `tenant` actif existe pour ce numéro.
   */
  async requestOtp(phone: string): Promise<void> {
    const user = await this.usersService.findByPhone(phone);
    if (!user || user.role !== 'tenant' || !user.isActive) {
      return;
    }
    const otp = this.configService.get('otp', { infer: true });
    const code = randomInt(0, 10 ** otp.codeLength)
      .toString()
      .padStart(otp.codeLength, '0');
    const expiresAt = new Date(Date.now() + otp.ttlSeconds * 1000);
    await this.authRepository.createOtpCode(phone, sha256Hex(code), expiresAt);
    await this.smsSender.send(
      phone,
      `Votre code DarMeuble : ${code} (valable ${Math.round(otp.ttlSeconds / 60)} min)`,
    );
  }

  async verifyOtp(
    dto: OtpVerifyDto,
    deviceInfo: string | null,
  ): Promise<AuthResult> {
    const otp = this.configService.get('otp', { infer: true });
    const active = await this.authRepository.findActiveOtpCode(dto.phone);
    if (!active) {
      throw new UnauthorizedException('Code invalide ou expiré');
    }
    if (active.attempts >= otp.maxAttempts) {
      await this.authRepository.consumeOtpCode(active.id);
      throw new UnauthorizedException(
        'Trop de tentatives — redemandez un code',
      );
    }
    if (sha256Hex(dto.code) !== active.codeHash) {
      await this.authRepository.incrementOtpAttempts(active.id);
      throw new UnauthorizedException('Code invalide ou expiré');
    }
    await this.authRepository.consumeOtpCode(active.id);

    const user = await this.usersService.findByPhone(dto.phone);
    if (!user || user.role !== 'tenant' || !user.isActive) {
      throw new UnauthorizedException('Compte introuvable');
    }
    const tokens = await this.tokensService.issueAuthResult(
      { id: user.id, role: user.role, organizationId: user.organizationId },
      deviceInfo,
    );
    return { tokens, user };
  }

  async refresh(refreshTokenValue: string): Promise<IssuedTokens> {
    const claim = await this.authRepository.claimRefreshToken(
      sha256Hex(refreshTokenValue),
    );
    if (claim.outcome === 'claimed') {
      return this.tokensService.rotate(claim);
    }
    if (claim.outcome === 'reused') {
      // Réutilisation d'un refresh token déjà consommé — signe probable de
      // vol (ADR-0004) : révoque la session entière, pas seulement la
      // requête en cours.
      await this.authRepository.revokeSession(claim.sessionId);
    }
    throw new UnauthorizedException(
      'Session invalide ou expirée — veuillez vous reconnecter',
    );
  }

  async logout(sessionId: string): Promise<void> {
    await this.authRepository.revokeSession(sessionId);
  }
}
