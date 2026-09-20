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
    // Construction dynamique du payload pour éviter la complexité cognitive
    // et les ternaires imbriquées
    const payload = {} as Parameters<
      typeof this.prisma.tenant.update
    >[0]['data'];

    if (data.fullName !== undefined) payload.fullName = data.fullName;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.idDocumentRef !== undefined)
      payload.idDocumentRef = data.idDocumentRef;
    if (data.photoRef !== undefined) payload.photoRef = data.photoRef;
    if (data.emergencyContactName !== undefined)
      payload.emergencyContactName = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined)
      payload.emergencyContactPhone = data.emergencyContactPhone;
    if (data.isBlacklisted !== undefined)
      payload.isBlacklisted = data.isBlacklisted;
    if (data.blacklistReason !== undefined)
      payload.blacklistReason = data.blacklistReason;

    return this.prisma.tenant.update({
      where: { id, organizationId },
      data: payload,
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
