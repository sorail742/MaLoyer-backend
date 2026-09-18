import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Exempte une route de `JwtAuthGuard` (guard global — voir
 * src/app.module.ts et src/common/guards/jwt-auth.guard.ts). Sécurité par
 * défaut : toute route est protégée tant qu'elle n'est pas marquée
 * `@Public()` explicitement (inscription, connexion, refresh, webhooks
 * Djomy à venir en Phase 3).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
