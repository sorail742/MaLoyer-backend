import { PaginatedResult } from '../../../common/http/response.types';
import { Tenant } from '../../../prisma/prisma-client';

export const TENANTS_REPOSITORY = 'TENANTS_REPOSITORY';

export interface CreateTenantData {
  organizationId: string;
  fullName: string;
  phone?: string;
  email?: string;
  idDocumentRef?: string;
  photoRef?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UpdateTenantData {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  idDocumentRef?: string | null;
  photoRef?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  isBlacklisted?: boolean;
  blacklistReason?: string | null;
}

export interface ITenantsRepository {
  findAllByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Tenant>>;

  findById(id: string, organizationId: string): Promise<Tenant | null>;

  create(data: CreateTenantData): Promise<Tenant>;

  update(
    id: string,
    organizationId: string,
    data: UpdateTenantData,
  ): Promise<Tenant>;

  archive(id: string, organizationId: string): Promise<Tenant>;

  linkUser(id: string, organizationId: string, userId: string): Promise<Tenant>;
}
