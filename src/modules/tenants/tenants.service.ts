import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../../common/http/response.types';
import { Tenant } from '../../prisma/prisma-client';
import { TENANTS_REPOSITORY } from './repositories/tenants-repository.interface';
import type {
  CreateTenantData,
  ITenantsRepository,
  UpdateTenantData,
} from './repositories/tenants-repository.interface';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(TENANTS_REPOSITORY)
    private readonly tenantsRepository: ITenantsRepository,
  ) {}

  async list(
    organizationId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Tenant>> {
    return this.tenantsRepository.findAllByOrganization(
      organizationId,
      pagination,
    );
  }

  async findByIdOrFail(id: string, organizationId: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findById(id, organizationId);
    if (!tenant) {
      throw new NotFoundException('Locataire introuvable');
    }
    return tenant;
  }

  async create(
    organizationId: string,
    data: Omit<CreateTenantData, 'organizationId'>,
  ): Promise<Tenant> {
    return this.tenantsRepository.create({ ...data, organizationId });
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateTenantData,
  ): Promise<Tenant> {
    const existing = await this.tenantsRepository.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException('Locataire introuvable');
    }
    return this.tenantsRepository.update(id, organizationId, data);
  }

  async archive(id: string, organizationId: string): Promise<Tenant> {
    const existing = await this.tenantsRepository.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException('Locataire introuvable');
    }
    return this.tenantsRepository.archive(id, organizationId);
  }

  async linkUser(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<Tenant> {
    const existing = await this.tenantsRepository.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundException('Locataire introuvable');
    }
    return this.tenantsRepository.linkUser(id, organizationId, userId);
  }
}
