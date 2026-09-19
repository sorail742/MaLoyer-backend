import { Building } from '../../../prisma/prisma-client';
import { PaginatedResult } from '../../../common/http/response.types';

export const BUILDINGS_REPOSITORY = Symbol('BUILDINGS_REPOSITORY');

export interface CreateBuildingData {
  organizationId: string;
  name: string;
  address: string;
  city: string;
  floorsCount?: number | undefined;
  photos?: string[] | undefined;
}

export interface UpdateBuildingData {
  name?: string | undefined;
  address?: string | undefined;
  city?: string | undefined;
  floorsCount?: number | null | undefined;
  photos?: string[] | undefined;
}

/**
 * Port — voir ADR-0003 (pattern repository port/adapter).
 * Un service métier injecte `IBuildingsRepository` via le jeton
 * `BUILDINGS_REPOSITORY`, jamais `PrismaService` directement.
 */
export interface IBuildingsRepository {
  /** Tous les immeubles de l'organisation (non archivés). */
  findAllByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Building>>;

  /**
   * Immeubles assignés à un gestionnaire délégué dans l'organisation
   * (ADR-0013, portée intra-organisation du manager).
   */
  findAllByManager(
    organizationId: string,
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Building>>;

  findById(id: string, organizationId: string): Promise<Building | null>;

  create(data: CreateBuildingData): Promise<Building>;

  update(
    id: string,
    organizationId: string,
    data: UpdateBuildingData,
  ): Promise<Building>;

  /** Soft delete catégorie A — jamais de DELETE physique (ADR-0006). */
  archive(id: string, organizationId: string): Promise<Building>;

  /** Assigne un gestionnaire délégué à un immeuble. */
  assignManager(buildingId: string, userId: string): Promise<void>;

  /** Retire un gestionnaire délégué d'un immeuble. */
  removeManager(buildingId: string, userId: string): Promise<void>;

  /** Vérifie qu'un utilisateur est gestionnaire d'un immeuble donné. */
  isManager(buildingId: string, userId: string): Promise<boolean>;
}
