import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../../common/http/response.types';
import { Tenant } from '../../../prisma/prisma-client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateTenantData,
  ITenantsRepository,
  UpdateTenantData,
} from './tenants-repository.interface';

@Injectable()
export class PrismaTenantsRepository implements ITenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByOrganization(
    organizationId: string,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedResult<Tenant>> {
    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { organizationId, deletedAt: null },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({
        where: { organizationId, deletedAt: null },
      }),
    ]);
    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async findById(id: string, organizationId: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async create(data: CreateTenantData): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        organizationId: data.organizationId,
        fullName: data.fullName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        idDocumentRef: data.idDocumentRef ?? null,
        photoRef: data.photoRef ?? null,
        emergencyContactName: data.emergencyContactName ?? null,
        emergencyContactPhone: data.emergencyContactPhone ?? null,
      },
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateTenantData,
  ): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id, organizationId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone === null
          ? { phone: null }
          : data.phone !== undefined
            ? { phone: data.phone }
            : {}),
        ...(data.email === null
          ? { email: null }
          : data.email !== undefined
            ? { email: data.email }
            : {}),
        ...(data.idDocumentRef === null
          ? { idDocumentRef: null }
          : data.idDocumentRef !== undefined
            ? { idDocumentRef: data.idDocumentRef }
            : {}),
        ...(data.photoRef === null
          ? { photoRef: null }
          : data.photoRef !== undefined
            ? { photoRef: data.photoRef }
            : {}),
        ...(data.emergencyContactName === null
          ? { emergencyContactName: null }
          : data.emergencyContactName !== undefined
            ? { emergencyContactName: data.emergencyContactName }
            : {}),
        ...(data.emergencyContactPhone === null
          ? { emergencyContactPhone: null }
          : data.emergencyContactPhone !== undefined
            ? { emergencyContactPhone: data.emergencyContactPhone }
            : {}),
        ...(data.isBlacklisted !== undefined && {
          isBlacklisted: data.isBlacklisted,
        }),
        ...(data.blacklistReason === null
          ? { blacklistReason: null }
          : data.blacklistReason !== undefined
            ? { blacklistReason: data.blacklistReason }
            : {}),
      },
    });
  }

  async archive(id: string, organizationId: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }

  async linkUser(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id, organizationId },
      data: { userId },
    });
  }
}
