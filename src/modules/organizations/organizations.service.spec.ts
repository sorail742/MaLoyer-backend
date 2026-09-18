import { NotFoundException } from '@nestjs/common';
import { Organization, OrganizationStatus } from '../../prisma/prisma-client';
import { OrganizationsService } from './organizations.service';
import { IOrganizationsRepository } from './repositories/organizations-repository.interface';

/**
 * Le service injecte le **port**, jamais `PrismaService` (ADR-0003 du kit
 * de démarrage) — ce test le vérifie concrètement : aucune base réelle
 * n'est nécessaire, seule l'interface est mockée.
 */
function buildOrganization(
  overrides: Partial<Organization> = {},
): Organization {
  return {
    id: 'org-1',
    name: 'Immeubles Konimodou',
    status: OrganizationStatus.trialing,
    trialEndsAt: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('OrganizationsService', () => {
  let repository: jest.Mocked<IOrganizationsRepository>;
  let service: OrganizationsService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      archive: jest.fn(),
    };
    service = new OrganizationsService(repository);
  });

  describe('findByIdOrFail', () => {
    it("renvoie l'organisation quand elle existe", async () => {
      const organization = buildOrganization();
      repository.findById.mockResolvedValue(organization);

      await expect(service.findByIdOrFail('org-1')).resolves.toEqual(
        organization,
      );
      expect(repository.findById).toHaveBeenCalledWith('org-1');
    });

    it("lève NotFoundException quand l'organisation n'existe pas", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findByIdOrFail('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('register', () => {
    it('délègue la création au repository avec le nom fourni', async () => {
      const created = buildOrganization({ name: 'Nouvelle organisation' });
      repository.create.mockResolvedValue(created);

      const result = await service.register('Nouvelle organisation');

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Nouvelle organisation',
      });
      expect(result).toEqual(created);
    });
  });
});
