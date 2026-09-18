import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/configuration';
import { Role, User } from '../../prisma/prisma-client';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { IAuthRepository } from './repositories/auth-repository.interface';
import { SmsSender } from './sms/sms-sender.interface';
import { TokensService } from './tokens.service';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    organizationId: 'org-1',
    fullName: 'Mariam Diallo',
    email: 'mariam.diallo@example.com',
    phone: '+224620000000',
    passwordHash: null,
    role: Role.owner,
    isActive: true,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService', () => {
  let usersService: jest.Mocked<
    Pick<UsersService, 'findByEmailWithPassword' | 'findByPhone' | 'create'>
  >;
  let organizationsService: jest.Mocked<Pick<OrganizationsService, 'register'>>;
  let tokensService: jest.Mocked<
    Pick<TokensService, 'issueAuthResult' | 'rotate'>
  >;
  let authRepository: jest.Mocked<IAuthRepository>;
  let smsSender: jest.Mocked<SmsSender>;
  let configService: ConfigService<AppConfig, true>;
  let service: AuthService;

  const issuedTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    sessionId: 'session-1',
  };

  beforeEach(() => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
    };
    organizationsService = { register: jest.fn() };
    tokensService = { issueAuthResult: jest.fn(), rotate: jest.fn() };
    authRepository = {
      createSession: jest.fn(),
      createRefreshToken: jest.fn(),
      claimRefreshToken: jest.fn(),
      revokeSession: jest.fn(),
      createOtpCode: jest.fn(),
      findActiveOtpCode: jest.fn(),
      incrementOtpAttempts: jest.fn(),
      consumeOtpCode: jest.fn(),
    };
    smsSender = { send: jest.fn() };
    configService = {
      get: jest.fn((key: keyof AppConfig) => {
        if (key === 'otp') {
          return { ttlSeconds: 300, codeLength: 6, maxAttempts: 5 };
        }
        throw new Error(`Clef de config non mockée dans ce test : ${key}`);
      }),
    } as unknown as ConfigService<AppConfig, true>;

    service = new AuthService(
      usersService as unknown as UsersService,
      organizationsService as unknown as OrganizationsService,
      tokensService as unknown as TokensService,
      configService,
      authRepository,
      smsSender,
    );
  });

  describe('login', () => {
    it('rejette un email qui ne correspond à aucun compte', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'inconnu@example.com', password: 'x' }, null),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(tokensService.issueAuthResult).not.toHaveBeenCalled();
    });

    it('rejette un mot de passe incorrect', async () => {
      const hash = await bcrypt.hash('bon-mot-de-passe', 12);
      usersService.findByEmailWithPassword.mockResolvedValue(
        buildUser({ passwordHash: hash }),
      );

      await expect(
        service.login(
          { email: 'mariam.diallo@example.com', password: 'mauvais' },
          null,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('émet un couple de jetons pour des identifiants valides', async () => {
      const hash = await bcrypt.hash('bon-mot-de-passe', 12);
      usersService.findByEmailWithPassword.mockResolvedValue(
        buildUser({ passwordHash: hash }),
      );
      tokensService.issueAuthResult.mockResolvedValue(issuedTokens);

      const result = await service.login(
        { email: 'mariam.diallo@example.com', password: 'bon-mot-de-passe' },
        'Mozilla/5.0',
      );

      expect(result.tokens).toEqual(issuedTokens);
      expect(tokensService.issueAuthResult).toHaveBeenCalledWith(
        { id: 'user-1', role: Role.owner, organizationId: 'org-1' },
        'Mozilla/5.0',
      );
    });
  });

  describe('refresh', () => {
    it('effectue la rotation quand le token est réclamé avec succès', async () => {
      authRepository.claimRefreshToken.mockResolvedValue({
        outcome: 'claimed',
        sessionId: 'session-1',
        userId: 'user-1',
        role: Role.owner,
        organizationId: 'org-1',
      });
      tokensService.rotate.mockResolvedValue(issuedTokens);

      const result = await service.refresh('un-refresh-token-valide');

      expect(result).toEqual(issuedTokens);
      expect(authRepository.revokeSession).not.toHaveBeenCalled();
    });

    it(
      'révoque la session entière — pas seulement la requête — quand le ' +
        'token a déjà été utilisé (réutilisation détectée, ADR-0004)',
      async () => {
        authRepository.claimRefreshToken.mockResolvedValue({
          outcome: 'reused',
          sessionId: 'session-compromise',
        });

        await expect(
          service.refresh('token-deja-utilise'),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        expect(authRepository.revokeSession).toHaveBeenCalledWith(
          'session-compromise',
        );
        expect(tokensService.rotate).not.toHaveBeenCalled();
      },
    );

    it.each(['session_revoked', 'expired', 'not_found'] as const)(
      'rejette sans révoquer quoi que ce soit pour "%s"',
      async (outcome) => {
        authRepository.claimRefreshToken.mockResolvedValue({ outcome });

        await expect(service.refresh('token')).rejects.toBeInstanceOf(
          UnauthorizedException,
        );
        expect(authRepository.revokeSession).not.toHaveBeenCalled();
      },
    );
  });

  describe('requestOtp', () => {
    it("n'envoie aucun SMS et ne lève aucune erreur pour un numéro inconnu (pas d'énumération de comptes)", async () => {
      usersService.findByPhone.mockResolvedValue(null);

      await expect(
        service.requestOtp('+224699999999'),
      ).resolves.toBeUndefined();
      expect(smsSender.send).not.toHaveBeenCalled();
      expect(authRepository.createOtpCode).not.toHaveBeenCalled();
    });

    it('génère et envoie un code pour un compte tenant actif', async () => {
      usersService.findByPhone.mockResolvedValue(
        buildUser({ role: Role.tenant, phone: '+224620000000' }),
      );

      await service.requestOtp('+224620000000');

      expect(authRepository.createOtpCode).toHaveBeenCalledTimes(1);
      expect(smsSender.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyOtp', () => {
    it('rejette et incrémente les tentatives sur un code incorrect', async () => {
      authRepository.findActiveOtpCode.mockResolvedValue({
        id: 'otp-1',
        codeHash: 'hash-du-bon-code',
        attempts: 0,
      });

      await expect(
        service.verifyOtp({ phone: '+224620000000', code: '000000' }, null),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(authRepository.incrementOtpAttempts).toHaveBeenCalledWith('otp-1');
      expect(authRepository.consumeOtpCode).not.toHaveBeenCalled();
    });

    it("rejette sans révéler d'information quand aucun code actif n'existe", async () => {
      authRepository.findActiveOtpCode.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ phone: '+224620000000', code: '123456' }, null),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
