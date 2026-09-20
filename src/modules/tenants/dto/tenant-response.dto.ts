import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tenant } from '../../../prisma/prisma-client';

export class TenantResponseDto {
  @ApiProperty()
  declare id: string;

  @ApiProperty()
  declare organizationId: string;

  @ApiProperty()
  declare fullName: string;

  @ApiPropertyOptional()
  declare phone?: string | null;

  @ApiPropertyOptional()
  declare email?: string | null;

  @ApiPropertyOptional()
  declare idDocumentRef?: string | null;

  @ApiPropertyOptional()
  declare photoRef?: string | null;

  @ApiPropertyOptional()
  declare emergencyContactName?: string | null;

  @ApiPropertyOptional()
  declare emergencyContactPhone?: string | null;

  @ApiPropertyOptional()
  declare userId?: string | null;

  @ApiProperty()
  declare isBlacklisted: boolean;

  @ApiPropertyOptional()
  declare blacklistReason?: string | null;

  @ApiProperty()
  declare createdAt: Date;

  @ApiProperty()
  declare updatedAt: Date;

  private constructor(data: Partial<TenantResponseDto>) {
    Object.assign(this, data);
  }

  static fromEntity(tenant: Tenant): TenantResponseDto {
    return new TenantResponseDto({
      id: tenant.id,
      organizationId: tenant.organizationId,
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
      idDocumentRef: tenant.idDocumentRef,
      photoRef: tenant.photoRef,
      emergencyContactName: tenant.emergencyContactName,
      emergencyContactPhone: tenant.emergencyContactPhone,
      userId: tenant.userId,
      isBlacklisted: tenant.isBlacklisted,
      blacklistReason: tenant.blacklistReason,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
