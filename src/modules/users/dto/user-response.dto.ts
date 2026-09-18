import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../../prisma/prisma-client';

/**
 * Vue publique d'un `User` — exclut systématiquement `passwordHash` (déjà
 * omis par défaut côté `PrismaService`, voir
 * src/prisma/prisma.service.ts) et `deletedAt`.
 */
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  organizationId: string | null;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  email: string | null;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiProperty({
    enum: ['super_admin', 'owner', 'manager', 'accountant', 'tenant'],
  })
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  private constructor(props: UserResponseDto) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.fullName = props.fullName;
    this.email = props.email;
    this.phone = props.phone;
    this.role = props.role;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  static fromEntity(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      organizationId: user.organizationId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  }
}
