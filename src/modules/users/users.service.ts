import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../../common/http/response.types';
import { User } from '../../prisma/prisma-client';
import { USERS_REPOSITORY } from './repositories/users-repository.interface';
import type {
  CreateUserData,
  IUsersRepository,
} from './repositories/users-repository.interface';

/**
 * Service métier — injecte le **port**, jamais `PrismaService`. Voir
 * darmeuble-kit/docs/backend/adr/0003-pattern-repository-port-adapter.md.
 * Consommé par `AuthModule` (recherche par email/téléphone au login,
 * création de compte à l'inscription) et par `UsersController` (profil,
 * liste d'équipe).
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findByPhone(phone);
  }

  create(data: CreateUserData): Promise<User> {
    return this.usersRepository.create(data);
  }

  listByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<User>> {
    return this.usersRepository.listByOrganization(organizationId, pagination);
  }
}
