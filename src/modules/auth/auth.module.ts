import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfig } from '../../config/configuration';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_REPOSITORY } from './repositories/auth-repository.interface';
import { PrismaAuthRepository } from './repositories/prisma-auth.repository';
import { ConsoleSmsSender } from './sms/console-sms-sender.service';
import { SMS_SENDER, SmsSender } from './sms/sms-sender.interface';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokensService } from './tokens.service';

/**
 * `JwtModule.register({})` sans secret par défaut : `TokensService` passe
 * explicitement `secret`/`expiresIn` à chaque `sign()` (voir
 * darmeuble-kit/docs/backend/adr/0004-*.md), la config du module n'a donc
 * pas besoin de le porter aussi.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    JwtStrategy,
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    {
      provide: SMS_SENDER,
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
      ): SmsSender => {
        const provider = configService.get('smsProvider', { infer: true });
        if (provider === 'console') {
          return new ConsoleSmsSender();
        }
        // Échec explicite plutôt qu'un repli silencieux sur la console en
        // production — voir darmeuble-kit/docs/backend/socle-backend.md
        // §0bis (fournisseur SMS non choisi).
        throw new Error(
          `SMS_PROVIDER="${provider}" non implémenté — seul "console" (DEV ONLY) existe pour l'instant.`,
        );
      },
    },
  ],
})
export class AuthModule {}
