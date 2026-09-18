import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global (voir `APP_GUARD` dans src/app.module.ts) — authentifie
 * l'access token JWT via `JwtStrategy` et peuple `request.user` avec
 * `AuthenticatedUser`. Toute route est protégée par défaut ; `@Public()`
 * est la seule échappatoire, jamais un oubli silencieux de guard sur un
 * controller précis — voir src/common/decorators/public.decorator.ts.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
