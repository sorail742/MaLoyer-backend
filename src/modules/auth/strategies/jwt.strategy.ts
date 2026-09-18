import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../../../common/authenticated-user.interface';
import { AppConfig } from '../../../config/configuration';

/**
 * Payload de l'access token (ADR-0004 : `{ sub, sid }` a minima, complété
 * par `role`/`organizationId` — voir
 * darmeuble-kit/docs/backend/multi-tenant.md : "s'il manque un champ,
 * l'ajouter au payload JWT [...], pas réinjecter un repository utilisateur
 * dans un service qui n'en a pas besoin autrement").
 */
export interface JwtPayload {
  sub: string;
  sid: string;
  role: AuthenticatedUser['role'];
  organizationId: string | null;
}

/**
 * Construit `AuthenticatedUser` **une seule fois par requête**, uniquement
 * à partir du payload du JWT déjà vérifié — jamais un rechargement de
 * `User` depuis la base. Voir darmeuble-kit/docs/backend/multi-tenant.md.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt', { infer: true }).accessSecret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      sessionId: payload.sid,
      organizationId: payload.organizationId,
      role: payload.role,
    };
  }
}
