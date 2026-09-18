import { NotFoundException } from '@nestjs/common';
import { Role, User } from '../../prisma/prisma-client';
import { IUsersRepository } from './repositories/users-repository.interface';
import { UsersService } from './users.service';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    organizationId: 'org-1',
    fullName: 'Mariam Diallo',
    email: 'mariam.diallo@example.com',
    phone: null,
    passwordHash: null,
    role: Role.owner,
    isActive: true,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UsersService', () => {
  let repository: jest.Mocked<IUsersRepository>;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
      listByOrganization: jest.fn(),
    };
    service = new UsersService(repository);
  });

  describe('findByIdOrFail', () => {
    it("lève NotFoundException si l'utilisateur n'existe pas", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findByIdOrFail('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("renvoie l'utilisateur trouvé", async () => {
      const user = buildUser();
      repository.findById.mockResolvedValue(user);

      await expect(service.findByIdOrFail('user-1')).resolves.toEqual(user);
    });
  });

  describe('listByOrganization', () => {
    it("délègue la pagination au repository pour l'organisation donnée", async () => {
      const paginated = {
        items: [buildUser()],
        total: 1,
        page: 1,
        limit: 20,
      };
      repository.listByOrganization.mockResolvedValue(paginated);

      const result = await service.listByOrganization('org-1', {
        page: 1,
        limit: 20,
      });

      expect(repository.listByOrganization).toHaveBeenCalledWith('org-1', {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(paginated);
    });
  });
});
