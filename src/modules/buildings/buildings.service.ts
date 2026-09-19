import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '../../common/http/response.types';
import { Building } from '../../prisma/prisma-client';
import { BUILDINGS_REPOSITORY } from './repositories/buildings-repository.interface';
import type {
  CreateBuildingData,
  IBuildingsRepository,
  UpdateBuildingData,
} from './repositories/buildings-repository.interface';

/**
 * Service métier — injecte le port `IBuildingsRepository`, jamais
 * `PrismaService`. Voir ADR-0003.
 *
 * Portée du `manager` (ADR-0013) : un gestionnaire délégué ne voit que les
 * immeubles qui lui sont assignés. Un `owner` ou `accountant` voit tous les
 * immeubles de l'organisation.
 */
@Injectable()
export class BuildingsService {
  constructor(
    @Inject(BUILDINGS_REPOSITORY)
    private readonly buildingsRepository: IBuildingsRepository,
  ) {}

  async list(
    organizationId: string,
    role: string,
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Building>> {
    if (role === 'manager') {
      return this.buildingsRepository.findAllByManager(
        organizationId,
        userId,
        pagination,
      );
    }
    return this.buildingsRepository.findAllByOrganization(
      organizationId,
      pagination,
    );
  }

  async findByIdOrFail(
    id: string,
    organizationId: string,
    role: string,
    userId: string,
  ): Promise<Building> {
    const building = await this.buildingsRepository.findById(
      id,
      organizationId,
    );
    if (!building) {
      throw new NotFoundException('Immeuble introuvable');
    }
    // Un manager ne peut accéder qu'aux immeubles qui lui sont assignés.
    if (role === 'manager') {
      const assigned = await this.buildingsRepository.isManager(id, userId);
      if (!assigned) {
        throw new ForbiddenException(
          "Vous n'êtes pas gestionnaire de cet immeuble",
        );
      }
    }
    return building;
  }

  async create(
    organizationId: string,
    data: Omit<CreateBuildingData, 'organizationId'>,
  ): Promise<Building> {
    return this.buildingsRepository.create({ ...data, organizationId });
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateBuildingData,
  ): Promise<Building> {
    // Vérifie que l'immeuble existe et appartient à l'organisation avant de
    // modifier — évite de créer un enregistrement si l'id est inconnu.
    const existing = await this.buildingsRepository.findById(
      id,
      organizationId,
    );
    if (!existing) {
      throw new NotFoundException('Immeuble introuvable');
    }
    return this.buildingsRepository.update(id, organizationId, data);
  }

  async archive(id: string, organizationId: string): Promise<Building> {
    const existing = await this.buildingsRepository.findById(
      id,
      organizationId,
    );
    if (!existing) {
      throw new NotFoundException('Immeuble introuvable');
    }
    return this.buildingsRepository.archive(id, organizationId);
  }

  async assignManager(
    buildingId: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const building = await this.buildingsRepository.findById(
      buildingId,
      organizationId,
    );
    if (!building) {
      throw new NotFoundException('Immeuble introuvable');
    }
    await this.buildingsRepository.assignManager(buildingId, userId);
  }

  async removeManager(
    buildingId: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const building = await this.buildingsRepository.findById(
      buildingId,
      organizationId,
    );
    if (!building) {
      throw new NotFoundException('Immeuble introuvable');
    }
    await this.buildingsRepository.removeManager(buildingId, userId);
  }
}
