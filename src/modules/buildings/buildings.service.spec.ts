import { NotFoundException } from '@nestjs/common';
import { Building } from '../../prisma/prisma-client';
import { PaginatedResult } from '../../common/http/response.types';
import { IBuildingsRepository } from './repositories/buildings-repository.interface';
import { BuildingsService } from './buildings.service';

// Utilitaire pour simuler l'interface du repo sans s'occuper de PrismaService.
type Mocked<T> = { [P in keyof T]: jest.Mock };

describe('BuildingsService', () => {
  let service: BuildingsService;
  let repository: Mocked<IBuildingsRepository>;

  const mockBuilding: Building = {
    id: 'bld-1',
    organizationId: 'org-1',
    name: 'Résidence Les Manguiers',
    address: 'Avenue de la République',
    city: 'Conakry',
    floorsCount: 5,
    photos: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
  };

  const buildBuilding = (overrides?: Partial<Building>): Building => ({
    ...mockBuilding,
    ...overrides,
  });

  const buildPaginated = (items: Building[]): PaginatedResult<Building> => ({
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
    };
    service = new BuildingsService(repository);
  });

  // ── Isolation multi-tenant ──────────────────────────────────────────────────

  describe('list — isolation multi-tenant', () => {
    it("owner reçoit tous les immeubles de son organisation (pas ceux d'une autre)", async () => {
      const org1Buildings = [
        buildBuilding({ id: 'bld-1', organizationId: 'org-1' }),
      ];
      repository.findAllByOrganization.mockResolvedValue(
        buildPaginated(org1Buildings),
      );

      const result = await service.list('org-1', {
        page: 1,
        limit: 20,
      });

      expect(repository.findAllByOrganization).toHaveBeenCalledWith('org-1', {
        page: 1,
        limit: 20,
      });
      // S'assure qu'on ne passe jamais org-2 au repo quand l'user est org-1
      expect(repository.findAllByOrganization).not.toHaveBeenCalledWith(
        'org-2',
        expect.anything(),
      );
      expect(result.items).toEqual(org1Buildings);
    });
  });

  // ── findByIdOrFail ──────────────────────────────────────────────────────────

  describe('findByIdOrFail', () => {
    it('lève NotFoundException si immeuble inexistant', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findByIdOrFail('inconnu', 'org-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('renvoie le building trouvé pour un owner', async () => {
      const building = buildBuilding();
      repository.findById.mockResolvedValue(building);

      await expect(service.findByIdOrFail('bld-1', 'org-1')).resolves.toEqual(
        building,
      );
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crée un immeuble avec le bon organizationId', async () => {
      const building = buildBuilding();
      repository.create.mockResolvedValue(building);

      const result = await service.create('org-1', {
        name: 'Résidence Les Manguiers',
        address: 'Avenue de la République',
        city: 'Conakry',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' }),
      );
      expect(result).toEqual(building);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('lève NotFoundException si immeuble inexistant', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('inconnu', 'org-1', { name: 'Nouveau nom' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ── archive (soft delete) ───────────────────────────────────────────────────

  describe('archive', () => {
    it('lève NotFoundException si immeuble inexistant', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.archive('inconnu', 'org-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('archive (soft delete) un immeuble existant', async () => {
      const building = buildBuilding();
      const archived = buildBuilding({ deletedAt: new Date() });
      repository.findById.mockResolvedValue(building);
      repository.archive.mockResolvedValue(archived);

      const result = await service.archive('bld-1', 'org-1');

      expect(repository.archive).toHaveBeenCalledWith('bld-1', 'org-1');
      expect(result.deletedAt).not.toBeNull();
    });
  });
});
