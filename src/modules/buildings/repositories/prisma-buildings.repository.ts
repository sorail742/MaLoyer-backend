import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../../common/http/response.types';
import { Building } from '../../../prisma/prisma-client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateBuildingData,
  IBuildingsRepository,
  UpdateBuildingData,
} from './buildings-repository.interface';

/**
 * Adapter — seule classe du module `buildings` qui importe `PrismaService`.
 * Voir ADR-0003 (pattern repository port/adapter).
 *
 * Toutes les requêtes sur la table `buildings` filtrent par `organizationId`
 * (isolation multi-tenant, ADR-0002) et excluent les enregistrements
 * archivés (`deletedAt: null`).
 */
@Injectable()
export class PrismaBuildingsRepository implements IBuildingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Building>> {
    const [items, total] = await Promise.all([
      this.prisma.building.findMany({
        where: { organizationId, deletedAt: null },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.building.count({
        where: { organizationId, deletedAt: null },
      }),
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async findById(id: string, organizationId: string): Promise<Building | null> {
    return this.prisma.building.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async create(data: CreateBuildingData): Promise<Building> {
    return this.prisma.building.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        address: data.address,
        city: data.city,
        floorsCount: data.floorsCount ?? null,
        photos: data.photos ?? [],
      },
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateBuildingData,
  ): Promise<Building> {
    return this.prisma.building.update({
      where: { id, organizationId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        // `null` efface la valeur, `number` la met à jour, `undefined` l'ignore.
        ...(data.floorsCount === null
          ? { floorsCount: null }
          : data.floorsCount !== undefined
            ? { floorsCount: data.floorsCount }
            : {}),
        ...(data.photos !== undefined && { photos: data.photos }),
      },
    });
  }

  async archive(id: string, organizationId: string): Promise<Building> {
    // Catégorie A (ADR-0006) : jamais un vrai `delete`. La cascade vers les
    // unités et baux sera propagée explicitement dans le service quand ces
    // modules existeront (Phase 2/3).
    return this.prisma.building.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }
}
