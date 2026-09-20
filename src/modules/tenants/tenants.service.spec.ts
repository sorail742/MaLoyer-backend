import { NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../../common/http/response.types';
import { Tenant } from '../../prisma/prisma-client';
import { ITenantsRepository } from './repositories/tenants-repository.interface';
import { TenantsService } from './tenants.service';

type Mocked<T> = { [P in keyof T]: jest.Mock };

describe('TenantsService', () => {
  let service: TenantsService;
  let repository: Mocked<ITenantsRepository>;

  const mockTenant: Tenant = {
    id: 'tnt-1',
    organizationId: 'org-1',
    fullName: 'Jean Dupont',
    phone: null,
    email: null,
    idDocumentRef: null,
    photoRef: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    userId: null,
    isBlacklisted: false,
    blacklistReason: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
  };

  const buildTenant = (overrides?: Partial<Tenant>): Tenant => ({
    ...mockTenant,
    ...overrides,
  });

  const buildPaginated = (items: Tenant[]): PaginatedResult<Tenant> => ({
    items,
    total: items.length,
    page: 1,
    limit: 20,
  });

  beforeEach(() => {
    repository = {
      findAllByOrganization: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      linkUser: jest.fn(),
    };
    service = new TenantsService(repository);
  });

  describe('list — isolation multi-tenant', () => {
    it('reçoit tous les locataires de son organisation', async () => {
      const org1Tenants = [
        buildTenant({ id: 'tnt-1', organizationId: 'org-1' }),
      ];
      repository.findAllByOrganization.mockResolvedValue(
        buildPaginated(org1Tenants),
      );

      const result = await service.list('org-1', { page: 1, limit: 20 });
      expect(repository.findAllByOrganization).toHaveBeenCalledWith('org-1', {
        page: 1,
        limit: 20,
      });
      expect(repository.findAllByOrganization).not.toHaveBeenCalledWith(
        'org-2',
        expect.anything(),
      );
      expect(result.items).toEqual(org1Tenants);
    });
  });

  describe('findByIdOrFail', () => {
    it('lève NotFoundException si locataire inexistant', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        service.findByIdOrFail('inconnu', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('renvoie le locataire trouvé', async () => {
      const tenant = buildTenant();
      repository.findById.mockResolvedValue(tenant);
      await expect(service.findByIdOrFail('tnt-1', 'org-1')).resolves.toEqual(
        tenant,
      );
    });
  });

  describe('create', () => {
    it('crée un locataire avec le bon organizationId', async () => {
      const tenant = buildTenant();
      repository.create.mockResolvedValue(tenant);

      const result = await service.create('org-1', { fullName: 'Jean Dupont' });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' }),
      );
      expect(result).toEqual(tenant);
    });
  });

  describe('update', () => {
    it('lève NotFoundException si locataire inexistant', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        service.update('inconnu', 'org-1', { fullName: 'Nouveau' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('met à jour le locataire', async () => {
      repository.findById.mockResolvedValue(buildTenant());
      repository.update.mockResolvedValue(buildTenant({ fullName: 'Nouveau' }));

      const result = await service.update('tnt-1', 'org-1', {
        fullName: 'Nouveau',
      });
      expect(repository.update).toHaveBeenCalledWith('tnt-1', 'org-1', {
        fullName: 'Nouveau',
      });
      expect(result.fullName).toEqual('Nouveau');
    });
  });

  describe('archive', () => {
    it('lève NotFoundException si locataire inexistant', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.archive('inconnu', 'org-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('archive (soft delete) un locataire existant', async () => {
      const tenant = buildTenant();
      const archived = buildTenant({ deletedAt: new Date() });
      repository.findById.mockResolvedValue(tenant);
      repository.archive.mockResolvedValue(archived);

      const result = await service.archive('tnt-1', 'org-1');
      expect(repository.archive).toHaveBeenCalledWith('tnt-1', 'org-1');
      expect(result.deletedAt).not.toBeNull();
    });
  });

  describe('linkUser', () => {
    it('associe un locataire à un userId', async () => {
      repository.findById.mockResolvedValue(buildTenant());
      repository.linkUser.mockResolvedValue(buildTenant({ userId: 'usr-9' }));

      const result = await service.linkUser('tnt-1', 'org-1', 'usr-9');
      expect(repository.linkUser).toHaveBeenCalledWith(
        'tnt-1',
        'org-1',
        'usr-9',
      );
      expect(result.userId).toEqual('usr-9');
    });
  });
});
