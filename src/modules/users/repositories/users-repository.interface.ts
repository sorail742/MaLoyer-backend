import { PaginatedResult } from '../../../common/http/response.types';
import { Role, User } from '../../../prisma/prisma-client';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface CreateUserData {
  organizationId: string | null;
  fullName: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: Role;
}

/**
 * Port — voir
 * darmeuble-kit/docs/backend/adr/0003-pattern-repository-port-adapter.md.
 * Un service métier injecte `IUsersRepository` via le jeton
 * `USERS_REPOSITORY`, jamais `PrismaService` directement.
 */
export interface IUsersRepository {
  findById(id: string): Promise<User | null>;

  /**
   * Seule méthode qui réintroduit `passwordHash`, omis par défaut au niveau
   * `PrismaService` (voir src/prisma/prisma.service.ts) — nécessaire pour
   * vérifier un mot de passe au login, jamais utilisée ailleurs.
   */
  findByEmailWithPassword(email: string): Promise<User | null>;

  findByPhone(phone: string): Promise<User | null>;

  create(data: CreateUserData): Promise<User>;

  // Pas de `deactivate()` ici : aucun endpoint ne l'appelle encore dans ce
  // socle Phase 1 (voir darmeuble-kit/docs/backend/adr/0003-*.md — ne pas
  // construire une méthode sans appelant réel). À ajouter avec son
  // controller quand la gestion d'équipe (module 12, admin) sera
  // implémentée ; suivra le même principe de soft delete que
  // `OrganizationsService.archive` (catégorie A,
  // darmeuble-kit/docs/backend/soft-delete.md).

  listByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<User>>;
}
