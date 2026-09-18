import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../../../prisma/prisma-client';

/**
 * Vue publique d'une `Organization` — exclut délibérément `deletedAt`
 * (détail de cycle de vie interne, voir
 * darmeuble-kit/docs/backend/soft-delete.md) et `updatedAt` (pas encore
 * consommé côté frontend).
 */
export class OrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['trialing', 'active', 'suspended', 'cancelled'],
  })
  status: string;

  @ApiPropertyOptional()
  trialEndsAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  private constructor(props: OrganizationResponseDto) {
    this.id = props.id;
    this.name = props.name;
    this.status = props.status;
    this.trialEndsAt = props.trialEndsAt;
    this.createdAt = props.createdAt;
  }

  static fromEntity(organization: Organization): OrganizationResponseDto {
    return new OrganizationResponseDto({
      id: organization.id,
      name: organization.name,
      status: organization.status,
      trialEndsAt: organization.trialEndsAt,
      createdAt: organization.createdAt,
    });
  }
}
