import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../common/authenticated-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantScopeGuard } from '../../common/guards/tenant-scope.guard';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { OrganizationsService } from './organizations.service';

/**
 * `JwtAuthGuard` est global (src/app.module.ts) — pas besoin de le
 * redéclarer ici. `TenantScopeGuard` + `RolesGuard` sur toute route
 * tenant-scopée, comme documenté dans
 * darmeuble-kit/docs/backend/architecture.md.
 */
@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(TenantScopeGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Roles('owner', 'manager', 'accountant')
  @Get('me')
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationResponseDto> {
    // `TenantScopeGuard` garantit déjà que `user.organizationId` n'est pas
    // `null` ici (voir sa documentation) — pas besoin d'assertion non-null,
    // juste un contrôle explicite pour que TypeScript le sache aussi.
    if (!user.organizationId) {
      throw new Error(
        'TenantScopeGuard aurait dû rejeter cette requête avant le controller',
      );
    }
    const organization = await this.organizationsService.findByIdOrFail(
      user.organizationId,
    );
    return OrganizationResponseDto.fromEntity(organization);
  }
}
