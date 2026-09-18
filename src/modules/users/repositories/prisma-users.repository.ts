import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../../common/http/response.types';
import { User } from '../../../prisma/prisma-client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserData, IUsersRepository } from './users-repository.interface';

/**
 * Adapter — seule classe du module `users` qui importe `PrismaService`.
 * Voir darmeuble-kit/docs/backend/adr/0003-pattern-repository-port-adapter.md.
 */
@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    // Recherche par clé primaire uniquement : utilisée pour le profil de
    // l'utilisateur courant, avec un `id` issu du JWT déjà vérifié — jamais
    // d'un paramètre utilisateur non vérifié. Cas légitime documenté dans
    // darmeuble-kit/docs/backend/multi-tenant.md ("scans techniques
    // (auth...)").
    // eslint-disable-next-line darmeuble/require-organization-id-filter -- lookup par PK sur un id de JWT vérifié, pas un paramètre utilisateur
    return this.prisma.user.findUnique({ where: { id, deletedAt: null } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    // Pas de filtre organisation possible : au login, l'organisation n'est
    // pas encore connue — c'est précisément le cas "scans techniques
    // (auth...)" documenté dans multi-tenant.md. `email` n'est pas déclaré
    // `@unique` dans le schéma (index unique partiel prévu, voir
    // soft-delete.md), d'où `findFirst` plutôt que `findUnique`.
    // eslint-disable-next-line darmeuble/require-organization-id-filter -- login par email, organisation pas encore connue à ce stade
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      omit: { passwordHash: false },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    // Même raisonnement que findByEmailWithPassword : recherche technique
    // d'authentification (OTP locataire), pas une lecture de données
    // métier tenant-scopées.
    // eslint-disable-next-line darmeuble/require-organization-id-filter -- login OTP par téléphone, organisation pas encore connue à ce stade
    return this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    // `?? null` plutôt que de propager `undefined` tel quel : les colonnes
    // Prisma correspondantes sont nullables (`String?`), typées
    // `string | null` côté client généré — `exactOptionalPropertyTypes`
    // (tsconfig.json) distingue "absent" de "undefined explicite", `null`
    // exprime sans ambiguïté "aucune valeur" pour une colonne nullable.
    return this.prisma.user.create({
      data: {
        organizationId: data.organizationId,
        fullName: data.fullName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        passwordHash: data.passwordHash ?? null,
        role: data.role,
      },
    });
  }

  async listByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<User>> {
    // `where` répété inline (pas factorisé dans une variable partagée) :
    // la règle ESLint `darmeuble/require-organization-id-filter` reconnaît
    // un littéral objet directement dans l'appel, pas une variable — voir
    // darmeuble-kit/docs/backend/multi-tenant.md.
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { organizationId, deletedAt: null },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { organizationId, deletedAt: null } }),
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit };
  }
}
