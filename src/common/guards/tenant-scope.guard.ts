import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../authenticated-user.interface';

/**
 * Garde HTTP pour toute route dont les données appartiennent à une
 * organisation (immeubles, unités, locataires, baux, paiements...) — voir
 * darmeuble-kit/docs/backend/multi-tenant.md et ADR-0002.
 *
 * **Ce que ce guard vérifie** : l'utilisateur authentifié porte bien un
 * `organizationId` (donc n'est pas un `super_admin` non rattaché — cahier
 * des charges §4). C'est une garde de forme, au niveau HTTP : elle évite
 * qu'une route tenant-scopée soit atteinte par un compte qui n'a
 * structurellement pas d'organisation, avant même d'exécuter le moindre
 * repository.
 *
 * **Ce que ce guard ne fait pas** : il ne filtre aucune donnée. L'isolation
 * réelle (une requête pour l'organisation A ne renvoie jamais de données de
 * l'organisation B) est la responsabilité de chaque repository, qui filtre
 * explicitement par `organizationId` — vérifié par la règle ESLint
 * `darmeuble/require-organization-id-filter`, pas par ce guard. Une route
 * réservée au super admin (requêtes transverses) utilise `CheckSuperAdmin`
 * à la place, jamais ce guard.
 */
@Injectable()
export class TenantScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    if (!user.organizationId) {
      throw new ForbiddenException(
        "Cette ressource est rattachée à une organisation ; ce compte n'en a aucune",
      );
    }
    return true;
  }
}
